"""
Order Routes: Create, Update Status, List
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from app.database import get_db
from app.models import User, Organization, WasteBatch, Order, OrderStatus, VerificationStatus
from app.schemas import OrderCreate, OrderResponse, OrderStatusUpdate, OrderAdminVerifyRequest
from app.auth import get_current_user

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _generate_order_number(db: Session) -> str:
    count = db.query(func.count(Order.id)).scalar() or 0
    return f"ORD-{datetime.now(timezone.utc).year}-{count + 1:06d}"


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new order (buyer requests material)."""
    buyer_org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not buyer_org:
        raise HTTPException(status_code=400, detail="Register your organization first.")

    batch = db.query(WasteBatch).filter(WasteBatch.id == data.waste_batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Waste batch not found.")
    if not batch.is_active:
        raise HTTPException(status_code=400, detail="This waste batch is no longer available.")
    if data.quantity > batch.available_quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Requested quantity ({data.quantity}) exceeds available ({batch.available_quantity}).",
        )

    # Can't buy your own waste
    if batch.organization_id == buyer_org.id:
        raise HTTPException(status_code=400, detail="Cannot purchase your own waste listing.")

    price = batch.price_per_unit or 0
    total_material = price * data.quantity

    order = Order(
        order_number=_generate_order_number(db),
        waste_batch_id=batch.id,
        buyer_org_id=buyer_org.id,
        supplier_org_id=batch.organization_id,
        quantity=data.quantity,
        unit=batch.unit,
        price_per_unit=price,
        total_material_cost=total_material,
        transportation_cost=0,
        total_cost=total_material,
        status=OrderStatus.REQUESTED,
        buyer_notes=data.notes,
        pickup_location=batch.location,
        delivery_location=data.delivery_location,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return _enrich_order(order, db)


@router.get("/my", response_model=List[OrderResponse])
def list_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all orders for the current user (as buyer or supplier)."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        return []

    orders = db.query(Order).filter(
        or_(Order.buyer_org_id == org.id, Order.supplier_org_id == org.id)
    ).order_by(Order.created_at.desc()).all()

    return [_enrich_order(o, db) for o in orders]


@router.get("/dispatch", response_model=List[OrderResponse])
def list_dispatch_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all orders that require shipping/logistics or are currently in transit."""
    orders = db.query(Order).filter(
        Order.status.in_([
            OrderStatus.ACCEPTED, OrderStatus.CONFIRMED,
            OrderStatus.SHIPPED, OrderStatus.DELIVERED
        ])
    ).order_by(Order.created_at.desc()).all()
    return [_enrich_order(o, db) for o in orders]


@router.get("/verify/{identifier}")
def verify_order_passport(identifier: str, db: Session = Depends(get_db)):
    """
    Public lookup to verify an Order Passport & check if it is verified by admin.
    Checks:
    1. Is the order verified by admin?
    2. Admin verification date, officer name & assay audit notes.
    3. Material, quantity, pickup/delivery status, seller factory passport.
    """
    clean_id = identifier.strip().upper()
    order = db.query(Order).filter(
        or_(
            func.upper(Order.order_number) == clean_id,
            Order.id == identifier.strip()
        )
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail=f"No transaction found with Order ID '{identifier}'.")

    batch = db.query(WasteBatch).filter(WasteBatch.id == order.waste_batch_id).first()
    seller = db.query(Organization).filter(Organization.id == order.supplier_org_id).first()
    buyer = db.query(Organization).filter(Organization.id == order.buyer_org_id).first()

    is_admin_verified = bool(getattr(order, "admin_verified", False))

    return {
        "passport_type": "ORDER_PASSPORT",
        "order_number": order.order_number,
        "order_id": order.id,
        "is_admin_verified": is_admin_verified,
        "admin_verification_badge": "OFFICIALLY ADMIN VERIFIED" if is_admin_verified else "PENDING ADMIN AUDIT",
        "admin_verified_at": order.admin_verified_at.isoformat() if getattr(order, "admin_verified_at", None) else None,
        "admin_verified_by": getattr(order, "admin_verified_by", None) or ("Super Admin" if is_admin_verified else None),
        "admin_verification_notes": getattr(order, "admin_verification_notes", None) or (
            "Independent chemical assay, weighbridge tare slip, and supplier warranty certified by ReSourceX governance."
            if is_admin_verified else
            "Order is in regular workflow. Platform admin physical inspection & escrow audit pending."
        ),
        "order_status": order.status.value if hasattr(order.status, 'value') else str(order.status),
        "material_type": batch.material_type if batch else "Industrial Secondary Material",
        "material_category": batch.category.value if batch and hasattr(batch.category, 'value') else "industrial",
        "quantity": order.quantity,
        "unit": order.unit or "kg",
        "price_per_unit": order.price_per_unit,
        "total_cost": order.total_cost,
        "seller": {
            "company_name": seller.company_name if seller else "Verified Seller",
            "passport_id": getattr(seller, "passport_id", None) or "RSX-FAC-GENUINE",
            "is_verified_factory": (seller.verification_status == VerificationStatus.VERIFIED) if seller else False,
            "contact_person": seller.contact_person if seller else "—",
            "city": seller.city if seller else "—",
            "state": seller.state if seller else "—",
        },
        "buyer": {
            "company_name": buyer.company_name if buyer else "Enterprise Buyer",
            "city": buyer.city if buyer else "—",
            "state": buyer.state if buyer else "—",
        },
        "pickup_location": order.pickup_location,
        "delivery_location": order.delivery_location,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "completed_at": order.completed_at.isoformat() if order.completed_at else None,
    }


@router.post("/{order_id}/admin-verify", response_model=OrderResponse)
def admin_verify_order(
    order_id: str,
    data: Optional[OrderAdminVerifyRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin endpoint to audit and officially verify an order consignment."""
    if current_user.role not in ("admin", "super_admin", "verification_admin"):
        raise HTTPException(status_code=403, detail="Only ReSourceX administrators can verify orders.")

    order = db.query(Order).filter((Order.id == order_id) | (Order.order_number == order_id)).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    verified = data.verified if data else True
    notes = data.notes if data and data.notes else "Quality assay and weighbridge net tare slip certified by ReSourceX admin."

    order.admin_verified = verified
    order.admin_verified_at = datetime.now(timezone.utc) if verified else None
    order.admin_verified_by = current_user.full_name or current_user.email
    order.admin_verification_notes = notes

    db.commit()
    db.refresh(order)
    return _enrich_order(order, db)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single order by ID."""
    order = db.query(Order).filter(
        (Order.id == order_id) | (Order.order_number == order_id)
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return _enrich_order(order, db)


@router.put("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update order status (accept, ship, deliver, complete, cancel)."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    is_party = org and (org.id == order.buyer_org_id or org.id == order.supplier_org_id)
    is_logistics_or_admin = current_user.role in ("logistics", "admin", "super_admin")

    if not is_party and not is_logistics_or_admin:
        raise HTTPException(status_code=403, detail="You are not an authorized party or logistics carrier for this order.")

    # Update inventory on completion
    if data.status == OrderStatus.COMPLETED and order.status != OrderStatus.COMPLETED:
        batch = db.query(WasteBatch).filter(WasteBatch.id == order.waste_batch_id).first()
        if batch:
            batch.available_quantity = max(0, batch.available_quantity - order.quantity)
            if batch.available_quantity <= 0:
                batch.is_active = False
        order.completed_at = datetime.now(timezone.utc)

    # Restore inventory on cancellation
    if data.status == OrderStatus.CANCELLED and order.status in (
        OrderStatus.ACCEPTED, OrderStatus.CONFIRMED
    ):
        batch = db.query(WasteBatch).filter(WasteBatch.id == order.waste_batch_id).first()
        if batch:
            batch.available_quantity += order.quantity
            batch.is_active = True

    order.status = data.status
    if data.notes:
        if org and org.id == order.buyer_org_id:
            order.buyer_notes = data.notes
        else:
            order.supplier_notes = data.notes

    db.commit()
    db.refresh(order)
    return _enrich_order(order, db)


def _enrich_order(order: Order, db: Session) -> OrderResponse:
    """Add org names and material type to order response."""
    resp = OrderResponse.model_validate(order)
    buyer_org = db.query(Organization).filter(Organization.id == order.buyer_org_id).first()
    supplier_org = db.query(Organization).filter(Organization.id == order.supplier_org_id).first()
    batch = db.query(WasteBatch).filter(WasteBatch.id == order.waste_batch_id).first()
    resp.buyer_org_name = buyer_org.company_name if buyer_org else None
    resp.supplier_org_name = supplier_org.company_name if supplier_org else None
    resp.material_type = batch.material_type if batch else None
    resp.admin_verified = bool(getattr(order, "admin_verified", False))
    resp.admin_verified_at = getattr(order, "admin_verified_at", None)
    resp.admin_verified_by = getattr(order, "admin_verified_by", None)
    resp.admin_verification_notes = getattr(order, "admin_verification_notes", None)
    return resp
