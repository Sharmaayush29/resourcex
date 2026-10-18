"""
Admin Routes: Verification, Blocking, Suspension, Reports, Audit Logs, Dashboard, Data Exports
"""
import csv
import io
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config import SECRET_KEY, ALGORITHM
from app.database import get_db
from app.models import (
    User, Organization, WasteBatch, Order, Report, AuditLog, Notification,
    UserRole, AccountStatus, VerificationStatus, OrderStatus,
    ReportStatus, NotificationType,
)
from app.schemas import (
    UserResponse, OrganizationResponse,
    AdminVerifyOrg, AdminBlockUser, AdminVerifyListing, AdminReportAction,
    AuditLogResponse, ReportResponse, AdminDashboard, WasteBatchResponse,
)
from app.auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def _log_action(db: Session, admin_id: str, action: str, target_type: str,
                target_id: str, reason: str = None, details: dict = None):
    """Create an immutable audit log entry."""
    log = AuditLog(
        admin_id=admin_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        reason=reason,
        details=details,
    )
    db.add(log)


def _notify(db: Session, user_id: str, ntype: NotificationType, title: str, message: str):
    """Create an in-app notification."""
    notif = Notification(
        user_id=user_id,
        type=ntype,
        title=title,
        message=message,
    )
    db.add(notif)


# ──────────────────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=AdminDashboard)
def admin_dashboard(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get the admin dashboard statistics."""
    return AdminDashboard(
        total_users=db.query(func.count(User.id)).scalar(),
        verified_companies=db.query(func.count(Organization.id)).filter(
            Organization.verification_status == VerificationStatus.VERIFIED
        ).scalar(),
        pending_verification=db.query(func.count(Organization.id)).filter(
            Organization.verification_status == VerificationStatus.PENDING
        ).scalar(),
        blocked_users=db.query(func.count(User.id)).filter(
            User.account_status == AccountStatus.BLOCKED
        ).scalar(),
        suspended_users=db.query(func.count(User.id)).filter(
            User.account_status == AccountStatus.SUSPENDED
        ).scalar(),
        active_listings=db.query(func.count(WasteBatch.id)).filter(
            WasteBatch.is_active == True
        ).scalar(),
        pending_listings=db.query(func.count(WasteBatch.id)).filter(
            WasteBatch.listing_verified == False
        ).scalar(),
        active_orders=db.query(func.count(Order.id)).filter(
            Order.status.notin_([OrderStatus.COMPLETED, OrderStatus.CANCELLED])
        ).scalar(),
        completed_orders=db.query(func.count(Order.id)).filter(
            Order.status == OrderStatus.COMPLETED
        ).scalar(),
        open_reports=db.query(func.count(Report.id)).filter(
            Report.status == ReportStatus.OPEN
        ).scalar(),
        total_transaction_value=db.query(func.coalesce(func.sum(Order.total_cost), 0)).filter(
            Order.status == OrderStatus.COMPLETED
        ).scalar(),
    )


# ──────────────────────────────────────────────────────────
# User Management
# ──────────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserResponse])
def list_users(
    status: Optional[AccountStatus] = None,
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all users with filters."""
    query = db.query(User)
    if status:
        query = query.filter(User.account_status == status)
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    return query.offset((page - 1) * per_page).limit(per_page).all()


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Get a user's details."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


# ──────────────────────────────────────────────────────────
# Organization Verification (FR-04, FR-19)
# ──────────────────────────────────────────────────────────

@router.get("/organizations", response_model=List[OrganizationResponse])
def list_organizations(
    status: Optional[VerificationStatus] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List organizations, optionally filtered by verification status."""
    query = db.query(Organization)
    if status:
        query = query.filter(Organization.verification_status == status)
    return query.offset((page - 1) * per_page).limit(per_page).all()


@router.put("/organizations/{org_id}/verify", response_model=OrganizationResponse)
def verify_organization(
    org_id: str,
    data: AdminVerifyOrg,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Approve or reject an organization's verification."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found.")

    if data.status == VerificationStatus.REJECTED and not data.notes:
        raise HTTPException(status_code=400, detail="Reason required when rejecting.")

    org.verification_status = data.status
    org.verification_notes = data.notes
    org.verified_by = admin.id
    if data.status == VerificationStatus.VERIFIED:
        org.verified_at = datetime.now(timezone.utc)

    _log_action(db, admin.id, f"verify_org_{data.status.value}", "organization", org_id,
                reason=data.notes)

    _notify(db, org.owner_id, NotificationType.VERIFICATION_RESULT,
            f"Verification {data.status.value}",
            f"Your organization '{org.company_name}' has been {data.status.value}." +
            (f" Notes: {data.notes}" if data.notes else ""))

    db.commit()
    db.refresh(org)
    return org


# ──────────────────────────────────────────────────────────
# User Blocking / Suspension (FR-20, FR-21, FR-22, FR-23)
# ──────────────────────────────────────────────────────────

@router.post("/users/{user_id}/block")
def block_user(
    user_id: str,
    data: AdminBlockUser,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Block or temporarily suspend a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot block or suspend your own account.")

    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin accounts cannot be blocked.")

    # Prevent blocking other admins (unless super admin)
    admin_roles = {UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.VERIFICATION_ADMIN,
                   UserRole.MODERATION_ADMIN, UserRole.SUPPORT_ADMIN}
    if user.role in admin_roles and admin.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Only Super Admin can block other admins.")

    if data.duration_days:
        user.account_status = AccountStatus.SUSPENDED
        action = "suspended"
        ntype = NotificationType.ACCOUNT_SUSPENDED
        msg = f"Your account has been suspended for {data.duration_days} day(s). Reason: {data.reason.value}"
    else:
        user.account_status = AccountStatus.BLOCKED
        action = "blocked"
        ntype = NotificationType.ACCOUNT_BLOCKED
        msg = f"Your account has been permanently blocked. Reason: {data.reason.value}"

    _log_action(db, admin.id, action, "user", user_id,
                reason=data.reason.value,
                details={"duration_days": data.duration_days, "notes": data.notes})

    _notify(db, user_id, ntype, f"Account {action.title()}", msg)

    db.commit()
    return {"message": f"User {action} successfully.", "user_id": user_id, "status": user.account_status.value}


@router.post("/users/{user_id}/unblock")
def unblock_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Unblock or unsuspend a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if user.account_status not in (AccountStatus.BLOCKED, AccountStatus.SUSPENDED):
        raise HTTPException(status_code=400, detail="User is not blocked or suspended.")

    user.account_status = AccountStatus.ACTIVE
    _log_action(db, admin.id, "unblocked", "user", user_id, reason="Account restored by admin.")
    _notify(db, user_id, NotificationType.ACCOUNT_UNBLOCKED,
            "Account Restored", "Your account has been restored.")

    db.commit()
    return {"message": "User unblocked successfully.", "user_id": user_id}


# ──────────────────────────────────────────────────────────
# Listing Verification (FR-19)
# ──────────────────────────────────────────────────────────

@router.get("/listings", response_model=List[WasteBatchResponse])
def list_all_listings(
    verified: Optional[bool] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all waste listings for admin review."""
    query = db.query(WasteBatch)
    if verified is not None:
        query = query.filter(WasteBatch.listing_verified == verified)
    batches = query.offset((page - 1) * per_page).limit(per_page).all()

    results = []
    for batch in batches:
        resp = WasteBatchResponse.model_validate(batch)
        org = db.query(Organization).filter(Organization.id == batch.organization_id).first()
        resp.organization_name = org.company_name if org else None
        results.append(resp)
    return results


@router.put("/listings/{batch_id}/verify", response_model=WasteBatchResponse)
def verify_listing(
    batch_id: str,
    data: AdminVerifyListing,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Verify or reject a waste listing."""
    batch = db.query(WasteBatch).filter(WasteBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Listing not found.")

    batch.listing_verified = data.verified
    batch.listing_verified_by = admin.id
    batch.listing_verified_at = datetime.now(timezone.utc)

    action = "verified" if data.verified else "rejected"
    _log_action(db, admin.id, f"listing_{action}", "waste_batch", batch_id,
                reason=data.notes)

    db.commit()
    db.refresh(batch)

    resp = WasteBatchResponse.model_validate(batch)
    org = db.query(Organization).filter(Organization.id == batch.organization_id).first()
    resp.organization_name = org.company_name if org else None
    return resp


# ──────────────────────────────────────────────────────────
# Report Management (FR-24)
# ──────────────────────────────────────────────────────────

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(
    status: Optional[ReportStatus] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all reports."""
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    return query.order_by(Report.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()


@router.put("/reports/{report_id}")
def handle_report(
    report_id: str,
    data: AdminReportAction,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Take action on a report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    action_map = {
        "investigate": ReportStatus.INVESTIGATING,
        "warn": ReportStatus.WARNED,
        "close": ReportStatus.CLOSED,
        "resolve": ReportStatus.RESOLVED,
    }

    if data.action in action_map:
        report.status = action_map[data.action]
    report.admin_notes = data.notes
    report.resolved_by = admin.id
    report.resolved_at = datetime.now(timezone.utc)

    _log_action(db, admin.id, f"report_{data.action}", "report", report_id,
                reason=data.notes)

    db.commit()
    return {"message": f"Report {data.action} action applied.", "report_id": report_id}


# ──────────────────────────────────────────────────────────
# Audit Logs (FR-25)
# ──────────────────────────────────────────────────────────

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List audit logs (immutable, read-only)."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))
    if target_type:
        query = query.filter(AuditLog.target_type == target_type)

    logs = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()

    results = []
    for log in logs:
        resp = AuditLogResponse.model_validate(log)
        admin_user = db.query(User).filter(User.id == log.admin_id).first()
        resp.admin_name = admin_user.full_name if admin_user else None
        results.append(resp)

    return results


# ──────────────────────────────────────────────────────────
# Enterprise Data Exports & Google Sheets / Drive Sync
# ──────────────────────────────────────────────────────────

def _verify_admin_access(request: Request, token_param: Optional[str], db: Session) -> User:
    auth_header = request.headers.get("Authorization")
    raw_token = None
    if auth_header and auth_header.startswith("Bearer "):
        raw_token = auth_header.split(" ", 1)[1]
    elif token_param:
        raw_token = token_param

    if not raw_token:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    try:
        payload = jwt.decode(raw_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload.")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    admin_roles = {
        UserRole.ADMIN, UserRole.SUPER_ADMIN,
        UserRole.VERIFICATION_ADMIN, UserRole.MODERATION_ADMIN,
        UserRole.SUPPORT_ADMIN,
    }
    if user.role not in admin_roles:
        raise HTTPException(status_code=403, detail="Admin access required.")

    return user


def _make_csv_response(rows: List[List[str]], filename: str) -> Response:
    output = io.StringIO()
    # Write UTF-8 BOM so Excel and Google Sheets parse UTF-8 immediately
    output.write('\ufeff')
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    for row in rows:
        writer.writerow(row)
    csv_bytes = output.getvalue().encode('utf-8')
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        }
    )


@router.get("/export/overview")
def export_overview(
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Returns summarized business intelligence metrics and sales by company."""
    admin = _verify_admin_access(request, token, db)

    completed_orders = db.query(Order).filter(Order.status == OrderStatus.COMPLETED).all()
    all_orders = db.query(Order).all()
    all_orgs = db.query(Organization).all()
    all_batches = db.query(WasteBatch).all()

    total_sales_value = sum(o.total_cost for o in completed_orders)
    total_sales_volume = sum(o.quantity for o in completed_orders)

    company_stats = {}
    for org in all_orgs:
        owner = db.query(User).filter(User.id == org.owner_id).first()
        company_stats[org.id] = {
            "id": org.id,
            "company_name": org.company_name,
            "business_type": org.business_type,
            "city": org.city,
            "state": org.state,
            "country": org.country,
            "tax_id": org.tax_id or "—",
            "contact_person": org.contact_person,
            "owner_email": owner.email if owner else "—",
            "owner_phone": owner.phone if owner else "—",
            "verification_status": org.verification_status.value if hasattr(org.verification_status, 'value') else str(org.verification_status),
            "total_sales_inr": 0.0,
            "total_purchases_inr": 0.0,
            "orders_sold_count": 0,
            "orders_bought_count": 0,
            "volume_sold_kg": 0.0,
            "volume_bought_kg": 0.0,
        }

    for o in all_orders:
        if o.status == OrderStatus.COMPLETED:
            if o.supplier_org_id in company_stats:
                company_stats[o.supplier_org_id]["total_sales_inr"] += o.total_cost
                company_stats[o.supplier_org_id]["orders_sold_count"] += 1
                company_stats[o.supplier_org_id]["volume_sold_kg"] += o.quantity
            if o.buyer_org_id in company_stats:
                company_stats[o.buyer_org_id]["total_purchases_inr"] += o.total_cost
                company_stats[o.buyer_org_id]["orders_bought_count"] += 1
                company_stats[o.buyer_org_id]["volume_bought_kg"] += o.quantity

    companies_list = sorted(company_stats.values(), key=lambda x: x["total_sales_inr"], reverse=True)

    return {
        "database_info": {
            "engine": "SQLite 3",
            "file": "waste2raw.db",
            "path": "backend/waste2raw.db",
            "orm": "SQLAlchemy Declarative",
            "tables": [
                "users", "organizations", "waste_batches", "waste_evidence",
                "buyer_requirements", "orders", "reviews", "reports",
                "audit_logs", "notifications"
            ],
        },
        "metrics": {
            "total_sales_value": round(total_sales_value, 2),
            "total_sales_volume_kg": round(total_sales_volume, 2),
            "completed_orders_count": len(completed_orders),
            "total_orders_count": len(all_orders),
            "total_companies_count": len(all_orgs),
            "total_listings_count": len(all_batches),
        },
        "companies": companies_list,
    }


@router.get("/export/csv/sales-by-company")
def export_sales_by_company_csv(
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Download Company Sales Summary CSV (Google Sheets & Excel Ready)."""
    admin = _verify_admin_access(request, token, db)

    all_orgs = db.query(Organization).all()
    all_orders = db.query(Order).filter(Order.status == OrderStatus.COMPLETED).all()

    company_stats = {}
    for org in all_orgs:
        owner = db.query(User).filter(User.id == org.owner_id).first()
        company_stats[org.id] = {
            "name": org.company_name,
            "type": org.business_type,
            "sales_inr": 0.0,
            "orders_sold": 0,
            "volume_sold": 0.0,
            "purchases_inr": 0.0,
            "orders_bought": 0,
            "city": org.city,
            "state": org.state,
            "tax_id": org.tax_id or "—",
            "status": org.verification_status.value if hasattr(org.verification_status, 'value') else str(org.verification_status),
            "contact": org.contact_person,
            "email": owner.email if owner else "—",
            "phone": owner.phone if owner else "—",
        }

    for o in all_orders:
        if o.supplier_org_id in company_stats:
            company_stats[o.supplier_org_id]["sales_inr"] += o.total_cost
            company_stats[o.supplier_org_id]["orders_sold"] += 1
            company_stats[o.supplier_org_id]["volume_sold"] += o.quantity
        if o.buyer_org_id in company_stats:
            company_stats[o.buyer_org_id]["purchases_inr"] += o.total_cost
            company_stats[o.buyer_org_id]["orders_bought"] += 1

    sorted_companies = sorted(company_stats.values(), key=lambda x: x["sales_inr"], reverse=True)

    header = [
        "Company Name", "Business Type", "Total Sales (INR)", "Orders Sold",
        "Volume Sold (kg)", "Total Purchases (INR)", "Orders Bought",
        "City", "State", "GST / Tax ID", "Verification Status",
        "Contact Person", "Email", "Phone"
    ]
    rows = [header]
    for c in sorted_companies:
        rows.append([
            c["name"],
            c["type"],
            f"{c['sales_inr']:.2f}",
            str(c["orders_sold"]),
            f"{c['volume_sold']:.2f}",
            f"{c['purchases_inr']:.2f}",
            str(c["orders_bought"]),
            c["city"],
            c["state"],
            c["tax_id"],
            c["status"],
            c["contact"],
            c["email"],
            c["phone"],
        ])

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    return _make_csv_response(rows, f"resourcex_company_sales_{timestamp}.csv")


@router.get("/export/csv/orders")
def export_orders_csv(
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Download All Orders & Transactions CSV with full sales detail."""
    admin = _verify_admin_access(request, token, db)

    orders = db.query(Order).order_by(Order.created_at.desc()).all()

    header = [
        "Order Number", "Date Created", "Date Completed", "Status",
        "Seller Company", "Seller GST", "Buyer Company", "Buyer GST",
        "Material Category", "Material Type", "Quantity", "Unit",
        "Price Per Unit (INR)", "Material Cost (INR)", "Transport Cost (INR)",
        "Total Sale Amount (INR)", "Pickup Location", "Delivery Location"
    ]
    rows = [header]
    for o in orders:
        seller = db.query(Organization).filter(Organization.id == o.supplier_org_id).first()
        buyer = db.query(Organization).filter(Organization.id == o.buyer_org_id).first()
        batch = db.query(WasteBatch).filter(WasteBatch.id == o.waste_batch_id).first()

        rows.append([
            o.order_number,
            o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "—",
            o.completed_at.strftime("%Y-%m-%d %H:%M") if o.completed_at else "—",
            o.status.value if hasattr(o.status, 'value') else str(o.status),
            seller.company_name if seller else "Unknown",
            seller.tax_id or "—" if seller else "—",
            buyer.company_name if buyer else "Unknown",
            buyer.tax_id or "—" if buyer else "—",
            batch.category.value if batch and hasattr(batch.category, 'value') else (batch.category if batch else "—"),
            batch.material_type if batch else "—",
            str(o.quantity),
            o.unit or "kg",
            f"{o.price_per_unit:.2f}" if o.price_per_unit else "0.00",
            f"{o.total_material_cost:.2f}" if o.total_material_cost else "0.00",
            f"{o.transportation_cost:.2f}" if o.transportation_cost else "0.00",
            f"{o.total_cost:.2f}" if o.total_cost else "0.00",
            o.pickup_location or "—",
            o.delivery_location or "—",
        ])

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    return _make_csv_response(rows, f"resourcex_orders_ledger_{timestamp}.csv")


@router.get("/export/csv/companies")
def export_companies_csv(
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Download Company Directory CSV."""
    admin = _verify_admin_access(request, token, db)

    orgs = db.query(Organization).order_by(Organization.company_name.asc()).all()

    header = [
        "Company Name", "Business Type", "Verification Status", "City", "State",
        "Country", "Pincode", "Address", "Contact Person", "GST / Tax ID",
        "Website", "Owner Email", "Owner Phone", "Registered Date"
    ]
    rows = [header]
    for org in orgs:
        owner = db.query(User).filter(User.id == org.owner_id).first()
        rows.append([
            org.company_name,
            org.business_type,
            org.verification_status.value if hasattr(org.verification_status, 'value') else str(org.verification_status),
            org.city,
            org.state,
            org.country,
            org.pincode or "—",
            (org.address or "").replace("\n", " "),
            org.contact_person,
            org.tax_id or "—",
            org.website or "—",
            owner.email if owner else "—",
            owner.phone if owner else "—",
            org.created_at.strftime("%Y-%m-%d") if org.created_at else "—",
        ])

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    return _make_csv_response(rows, f"resourcex_companies_directory_{timestamp}.csv")


@router.get("/export/csv/master")
def export_master_csv(
    request: Request,
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Download Master Enterprise Dataset CSV combining orders, companies, and listings."""
    admin = _verify_admin_access(request, token, db)

    orders = db.query(Order).order_by(Order.created_at.desc()).all()

    header = [
        "Record Type", "ID / Order #", "Date", "Status", "Seller Company",
        "Buyer Company", "Material / Product", "Category", "Quantity", "Unit",
        "Rate (INR)", "Total Sale (INR)", "City", "State", "Seller GST"
    ]
    rows = [header]

    for o in orders:
        seller = db.query(Organization).filter(Organization.id == o.supplier_org_id).first()
        buyer = db.query(Organization).filter(Organization.id == o.buyer_org_id).first()
        batch = db.query(WasteBatch).filter(WasteBatch.id == o.waste_batch_id).first()
        rows.append([
            "ORDER",
            o.order_number,
            o.created_at.strftime("%Y-%m-%d") if o.created_at else "—",
            o.status.value if hasattr(o.status, 'value') else str(o.status),
            seller.company_name if seller else "Unknown",
            buyer.company_name if buyer else "Unknown",
            batch.material_type if batch else "—",
            batch.category.value if batch and hasattr(batch.category, 'value') else "—",
            str(o.quantity),
            o.unit or "kg",
            f"{o.price_per_unit:.2f}" if o.price_per_unit else "0.00",
            f"{o.total_cost:.2f}" if o.total_cost else "0.00",
            seller.city if seller else "—",
            seller.state if seller else "—",
            seller.tax_id or "—" if seller else "—",
        ])

    batches = db.query(WasteBatch).all()
    for b in batches:
        org = db.query(Organization).filter(Organization.id == b.organization_id).first()
        rows.append([
            "LISTING",
            b.waste_id,
            b.created_at.strftime("%Y-%m-%d") if b.created_at else "—",
            "VERIFIED" if b.listing_verified else "PENDING_VERIFICATION",
            org.company_name if org else "Unknown",
            "—",
            b.material_type,
            b.category.value if hasattr(b.category, 'value') else str(b.category),
            str(b.quantity),
            b.unit or "kg",
            f"{b.price_per_unit:.2f}" if b.price_per_unit else "0.00",
            f"{(b.quantity * (b.price_per_unit or 0)):.2f}",
            org.city if org else "—",
            org.state if org else "—",
            org.tax_id or "—" if org else "—",
        ])

    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    return _make_csv_response(rows, f"resourcex_master_dataset_{timestamp}.csv")
