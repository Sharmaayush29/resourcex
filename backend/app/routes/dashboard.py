"""
Dashboard Routes: Factory, Buyer, and Matching
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import (
    User, Organization, WasteBatch, BuyerRequirement, Order,
    OrderStatus, WasteCategory, UserRole, WasteVerificationLevel,
)
from app.schemas import (
    FactoryDashboard, BuyerDashboard,
    BuyerRequirementCreate, BuyerRequirementResponse,
    MatchResult, WasteBatchResponse,
)
from app.auth import get_current_user
from typing import List

router = APIRouter(prefix="/api", tags=["Dashboard & Matching"])


# ──────────────────────────────────────────────────────────
# Factory Dashboard
# ──────────────────────────────────────────────────────────

@router.get("/dashboard/factory", response_model=FactoryDashboard)
def factory_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the factory's dashboard statistics."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        return FactoryDashboard(
            total_waste_generated=0, total_waste_available=0, total_waste_sold=0,
            total_revenue=0, active_listings=0, buyer_requests=0,
            pending_orders=0, completed_orders=0,
        )

    batches = db.query(WasteBatch).filter(WasteBatch.organization_id == org.id).all()
    total_generated = sum(b.quantity for b in batches)
    total_available = sum(b.available_quantity for b in batches if b.is_active)

    completed_orders = db.query(Order).filter(
        Order.supplier_org_id == org.id,
        Order.status == OrderStatus.COMPLETED,
    ).all()
    total_sold = sum(o.quantity for o in completed_orders)
    total_revenue = sum(o.total_cost for o in completed_orders)

    active_listings = db.query(func.count(WasteBatch.id)).filter(
        WasteBatch.organization_id == org.id, WasteBatch.is_active == True,
    ).scalar()

    buyer_requests = db.query(func.count(Order.id)).filter(
        Order.supplier_org_id == org.id,
        Order.status == OrderStatus.REQUESTED,
    ).scalar()

    pending_orders = db.query(func.count(Order.id)).filter(
        Order.supplier_org_id == org.id,
        Order.status.notin_([OrderStatus.COMPLETED, OrderStatus.CANCELLED]),
    ).scalar()

    completed_count = db.query(func.count(Order.id)).filter(
        Order.supplier_org_id == org.id,
        Order.status == OrderStatus.COMPLETED,
    ).scalar()

    return FactoryDashboard(
        total_waste_generated=total_generated,
        total_waste_available=total_available,
        total_waste_sold=total_sold,
        total_revenue=total_revenue,
        active_listings=active_listings,
        buyer_requests=buyer_requests,
        pending_orders=pending_orders,
        completed_orders=completed_count,
    )


# ──────────────────────────────────────────────────────────
# Buyer Dashboard
# ──────────────────────────────────────────────────────────

@router.get("/dashboard/buyer", response_model=BuyerDashboard)
def buyer_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the buyer's dashboard statistics."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        return BuyerDashboard(
            active_requirements=0, matching_suppliers=0, pending_requests=0,
            active_orders=0, completed_orders=0, total_spent=0,
        )

    active_reqs = db.query(func.count(BuyerRequirement.id)).filter(
        BuyerRequirement.organization_id == org.id,
        BuyerRequirement.is_active == True,
    ).scalar()

    pending_requests = db.query(func.count(Order.id)).filter(
        Order.buyer_org_id == org.id,
        Order.status == OrderStatus.REQUESTED,
    ).scalar()

    active_orders = db.query(func.count(Order.id)).filter(
        Order.buyer_org_id == org.id,
        Order.status.notin_([OrderStatus.COMPLETED, OrderStatus.CANCELLED]),
    ).scalar()

    completed_orders = db.query(func.count(Order.id)).filter(
        Order.buyer_org_id == org.id,
        Order.status == OrderStatus.COMPLETED,
    ).scalar()

    total_spent = db.query(func.coalesce(func.sum(Order.total_cost), 0)).filter(
        Order.buyer_org_id == org.id,
        Order.status == OrderStatus.COMPLETED,
    ).scalar()

    # Count matching suppliers (simple: count active listings matching any requirement)
    reqs = db.query(BuyerRequirement).filter(
        BuyerRequirement.organization_id == org.id,
        BuyerRequirement.is_active == True,
    ).all()
    matching_count = 0
    for req in reqs:
        matching_count += db.query(func.count(WasteBatch.id)).filter(
            WasteBatch.is_active == True,
            WasteBatch.category == req.category,
            WasteBatch.available_quantity >= req.quantity * 0.5,  # at least 50% of needed
        ).scalar()

    return BuyerDashboard(
        active_requirements=active_reqs,
        matching_suppliers=matching_count,
        pending_requests=pending_requests,
        active_orders=active_orders,
        completed_orders=completed_orders,
        total_spent=total_spent,
    )


# ──────────────────────────────────────────────────────────
# Buyer Requirements
# ──────────────────────────────────────────────────────────

@router.post("/requirements", response_model=BuyerRequirementResponse, status_code=201)
def create_requirement(
    data: BuyerRequirementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a buyer requirement."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        raise HTTPException(status_code=400, detail="Register your organization first.")

    req = BuyerRequirement(
        organization_id=org.id,
        category=data.category,
        material_type=data.material_type,
        quantity=data.quantity,
        unit=data.unit,
        min_purity=data.min_purity,
        max_price_per_unit=data.max_price_per_unit,
        max_distance_km=data.max_distance_km,
        frequency=data.frequency,
        location=data.location,
        notes=data.notes,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/requirements/my", response_model=List[BuyerRequirementResponse])
def list_my_requirements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the current buyer's requirements."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        return []
    return db.query(BuyerRequirement).filter(
        BuyerRequirement.organization_id == org.id
    ).all()


# ──────────────────────────────────────────────────────────
# Matching Engine (FR-11)
# ──────────────────────────────────────────────────────────

@router.get("/match/{requirement_id}", response_model=List[MatchResult])
def find_matches(
    requirement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Find matching waste batches for a buyer requirement using scoring engine."""
    req = db.query(BuyerRequirement).filter(BuyerRequirement.id == requirement_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found.")

    # Get active batches with available quantity
    batches = db.query(WasteBatch).filter(
        WasteBatch.is_active == True,
        WasteBatch.available_quantity > 0,
    ).all()

    # Exclude own organization's waste
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if org:
        batches = [b for b in batches if b.organization_id != org.id]

    results = []
    for batch in batches:
        score, breakdown = _calculate_match_score(req, batch)
        if score > 20:  # minimum threshold
            resp = WasteBatchResponse.model_validate(batch)
            batch_org = db.query(Organization).filter(Organization.id == batch.organization_id).first()
            resp.organization_name = batch_org.company_name if batch_org else None
            results.append(MatchResult(
                waste_batch=resp,
                match_score=round(score, 1),
                score_breakdown=breakdown,
            ))

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results[:20]  # top 20 matches


def _calculate_match_score(req: BuyerRequirement, batch: WasteBatch) -> tuple:
    """
    Calculate compatibility score per FR-11:
    Material compatibility (30%), Quality (20%), Quantity (15%),
    Distance (15%), Price (10%), Supplier reliability (10%)
    """
    breakdown = {}

    # Material compatibility (30%)
    if req.material_type.lower() in batch.material_type.lower() or \
       batch.material_type.lower() in req.material_type.lower():
        breakdown["material"] = 30
    elif req.category == batch.category:
        breakdown["material"] = 15
    else:
        breakdown["material"] = 0

    # Quality / Purity (20%)
    if req.min_purity and batch.purity_percentage:
        if batch.purity_percentage >= req.min_purity:
            breakdown["quality"] = 20
        elif batch.purity_percentage >= req.min_purity * 0.9:
            breakdown["quality"] = 12
        else:
            breakdown["quality"] = 5
    else:
        breakdown["quality"] = 10  # unknown = neutral

    # Quantity (15%)
    if batch.available_quantity >= req.quantity:
        breakdown["quantity"] = 15
    elif batch.available_quantity >= req.quantity * 0.5:
        ratio = batch.available_quantity / req.quantity
        breakdown["quantity"] = round(15 * ratio, 1)
    else:
        breakdown["quantity"] = 3

    # Distance (15%) — simplified: location text matching
    if req.location and batch.location:
        if req.location.lower() == batch.location.lower():
            breakdown["distance"] = 15
        elif req.location.lower().split(",")[0].strip() in batch.location.lower():
            breakdown["distance"] = 10
        else:
            breakdown["distance"] = 5
    else:
        breakdown["distance"] = 8

    # Price (10%)
    if req.max_price_per_unit and batch.price_per_unit:
        if batch.price_per_unit <= req.max_price_per_unit:
            breakdown["price"] = 10
        elif batch.price_per_unit <= req.max_price_per_unit * 1.2:
            breakdown["price"] = 5
        else:
            breakdown["price"] = 2
    else:
        breakdown["price"] = 5

    # Supplier reliability (10%) — based on verification level
    verification_scores = {
        WasteVerificationLevel.SELF_REPORTED: 4,
        WasteVerificationLevel.EVIDENCE_VERIFIED: 7,
        WasteVerificationLevel.THIRD_PARTY_VERIFIED: 10,
    }
    breakdown["reliability"] = verification_scores.get(batch.verification_level, 4)

    total = sum(breakdown.values())
    return total, breakdown
