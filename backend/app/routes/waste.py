"""
Waste Routes: CRUD, Evidence, Search, Inventory, Waste Passport
"""
import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models import (
    User, Organization, WasteBatch, WasteEvidence, WasteCategory,
    WasteVerificationLevel, EvidenceType, VerificationStatus
)
from app.schemas import (
    WasteBatchCreate, WasteBatchResponse, WasteBatchUpdate,
    WasteEvidenceResponse, WasteSearchParams,
)
from app.auth import get_current_user
from app.config import UPLOAD_DIR
from app.security import (
    validate_and_save_upload,
    ALLOWED_DOC_EXTENSIONS,
    ALLOWED_IMG_EXTENSIONS,
    MAX_FILE_SIZE_BYTES,
)

router = APIRouter(prefix="/api/waste", tags=["Waste"])

# ── Counters for Waste ID generation ──
_category_codes = {
    WasteCategory.TEXTILE: "TX",
    WasteCategory.PLASTIC: "PL",
    WasteCategory.METAL: "MT",
    WasteCategory.PACKAGING: "PK",
    WasteCategory.OTHER: "OT",
}


def _generate_waste_id(db: Session, category: WasteCategory) -> str:
    """Generate a unique Waste ID like RSX-TX-2026-00124 for ReSourceX."""
    code = _category_codes.get(category, "OT")
    year = datetime.now(timezone.utc).year
    count = db.query(func.count(WasteBatch.id)).filter(
        WasteBatch.category == category,
    ).scalar() or 0
    seq = count + 1
    return f"RSX-{code}-{year}-{seq:05d}"


@router.post("/", response_model=WasteBatchResponse, status_code=201)
def create_waste_batch(
    data: WasteBatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new waste batch (Waste Passport)."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        raise HTTPException(status_code=400, detail="Register your organization first.")

    waste_id = _generate_waste_id(db, data.category)

    batch = WasteBatch(
        waste_id=waste_id,
        organization_id=org.id,
        category=data.category,
        material_type=data.material_type,
        sub_type=data.sub_type,
        description=data.description,
        quantity=data.quantity,
        unit=data.unit,
        available_quantity=data.quantity,
        purity_percentage=data.purity_percentage,
        quality_grade=data.quality_grade,
        quality_notes=data.quality_notes,
        location=data.location,
        latitude=data.latitude,
        longitude=data.longitude,
        available_from=data.available_from,
        frequency=data.frequency,
        price_per_unit=data.price_per_unit,
        currency=data.currency,
        negotiable=data.negotiable,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    response = WasteBatchResponse.model_validate(batch)
    response.organization_name = org.company_name
    response.evidence_count = 0
    return response


@router.get("/", response_model=List[WasteBatchResponse])
def list_waste_batches(
    category: Optional[WasteCategory] = None,
    material_type: Optional[str] = None,
    location: Optional[str] = None,
    min_quantity: Optional[float] = None,
    max_price: Optional[float] = None,
    min_purity: Optional[float] = None,
    verified_only: bool = False,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Search and list waste batches with filters."""
    query = db.query(WasteBatch).filter(WasteBatch.is_active == True)

    if category:
        query = query.filter(WasteBatch.category == category)
    if material_type:
        query = query.filter(WasteBatch.material_type.ilike(f"%{material_type}%"))
    if location:
        query = query.filter(WasteBatch.location.ilike(f"%{location}%"))
    if min_quantity:
        query = query.filter(WasteBatch.available_quantity >= min_quantity)
    if max_price:
        query = query.filter(WasteBatch.price_per_unit <= max_price)
    if min_purity:
        query = query.filter(WasteBatch.purity_percentage >= min_purity)
    if verified_only:
        query = query.filter(WasteBatch.listing_verified == True)

    total = query.count()
    batches = query.offset((page - 1) * per_page).limit(per_page).all()

    results = []
    for batch in batches:
        resp = WasteBatchResponse.model_validate(batch)
        org = db.query(Organization).filter(Organization.id == batch.organization_id).first()
        resp.organization_name = org.company_name if org else None
        resp.evidence_count = db.query(func.count(WasteEvidence.id)).filter(
            WasteEvidence.waste_batch_id == batch.id
        ).scalar()
        results.append(resp)

    return results


@router.get("/my", response_model=List[WasteBatchResponse])
def list_my_waste(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all waste batches for the current user's organization."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        return []

    batches = db.query(WasteBatch).filter(WasteBatch.organization_id == org.id).all()
    results = []
    for batch in batches:
        resp = WasteBatchResponse.model_validate(batch)
        resp.organization_name = org.company_name
        resp.evidence_count = db.query(func.count(WasteEvidence.id)).filter(
            WasteEvidence.waste_batch_id == batch.id
        ).scalar()
        results.append(resp)
    return results


@router.get("/inventory")
def get_inventory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get waste inventory summary for the current factory."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    if not org:
        return {"items": [], "total_quantity": 0}

    batches = db.query(WasteBatch).filter(
        WasteBatch.organization_id == org.id,
        WasteBatch.is_active == True,
    ).all()

    # Group by category
    inventory = {}
    for batch in batches:
        key = batch.material_type
        if key not in inventory:
            inventory[key] = {
                "material_type": batch.material_type,
                "category": batch.category.value,
                "total_quantity": 0,
                "available_quantity": 0,
                "unit": batch.unit,
                "batch_count": 0,
            }
        inventory[key]["total_quantity"] += batch.quantity
        inventory[key]["available_quantity"] += batch.available_quantity
        inventory[key]["batch_count"] += 1

    items = list(inventory.values())
    total = sum(i["available_quantity"] for i in items)
    return {"items": items, "total_quantity": total}


@router.get("/verify/{passport_id}")
def verify_passport(passport_id: str, db: Session = Depends(get_db)):
    """Public verification lookup for any Waste/Resource Passport ID on ReSourceX."""
    clean_id = passport_id.strip()
    batch = db.query(WasteBatch).filter(
        func.lower(WasteBatch.waste_id) == func.lower(clean_id)
    ).first()
    if not batch:
        batch = db.query(WasteBatch).filter(WasteBatch.id == clean_id).first()

    if not batch:
        return {
            "verified": False,
            "status": "NOT_FOUND",
            "passport_id": clean_id,
            "message": f"No registered byproduct batch found with Passport ID '{clean_id}' on ReSourceX."
        }

    org = db.query(Organization).filter(Organization.id == batch.organization_id).first()
    evidence_count = db.query(func.count(WasteEvidence.id)).filter(
        WasteEvidence.waste_batch_id == batch.id
    ).scalar() or 0

    return {
        "verified": True,
        "status": "AUTHENTIC",
        "passport_id": batch.waste_id,
        "batch_id": batch.id,
        "platform": "ReSourceX Secondary Material Exchange",
        "listing_verified": bool(batch.listing_verified),
        "verification_level": batch.verification_level,
        "material_type": batch.material_type,
        "sub_type": batch.sub_type,
        "category": batch.category,
        "available_quantity": batch.available_quantity,
        "quantity": batch.quantity,
        "unit": batch.unit,
        "purity_percentage": batch.purity_percentage,
        "price_per_unit": batch.price_per_unit,
        "location": batch.location,
        "organization_name": org.company_name if org else "Registered Enterprise",
        "org_verification_status": org.verification_status if org else "pending",
        "manufacturer_agreement_signed": bool(org.integrity_agreement_signed) if org else False,
        "evidence_count": evidence_count,
        "created_at": batch.created_at,
        "is_active": batch.is_active,
    }


@router.get("/{batch_id}", response_model=WasteBatchResponse)
def get_waste_batch(
    batch_id: str,
    db: Session = Depends(get_db),
):
    """Get a single waste batch (Waste Passport) by ID."""
    batch = db.query(WasteBatch).filter(
        (WasteBatch.id == batch_id) | (WasteBatch.waste_id == batch_id)
    ).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Waste batch not found.")

    resp = WasteBatchResponse.model_validate(batch)
    org = db.query(Organization).filter(Organization.id == batch.organization_id).first()
    resp.organization_name = org.company_name if org else None
    resp.evidence_count = db.query(func.count(WasteEvidence.id)).filter(
        WasteEvidence.waste_batch_id == batch.id
    ).scalar()
    return resp


@router.put("/{batch_id}", response_model=WasteBatchResponse)
def update_waste_batch(
    batch_id: str,
    data: WasteBatchUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a waste batch."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    batch = db.query(WasteBatch).filter(
        WasteBatch.id == batch_id,
        WasteBatch.organization_id == org.id if org else None,
    ).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Waste batch not found.")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(batch, key, value)
    db.commit()
    db.refresh(batch)

    resp = WasteBatchResponse.model_validate(batch)
    resp.organization_name = org.company_name if org else None
    return resp


# ── Evidence Upload ──

@router.post("/{batch_id}/evidence", response_model=WasteEvidenceResponse)
async def upload_evidence(
    batch_id: str,
    evidence_type: EvidenceType = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload evidence for a waste batch."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    batch = db.query(WasteBatch).filter(
        WasteBatch.id == batch_id,
        WasteBatch.organization_id == org.id if org else None,
    ).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Waste batch not found.")

    evidence_dir = os.path.join(UPLOAD_DIR, "evidence", batch_id)
    os.makedirs(evidence_dir, exist_ok=True)

    safe_filename, _ = await validate_and_save_upload(
        file=file,
        target_dir=evidence_dir,
        allowed_extensions=ALLOWED_DOC_EXTENSIONS,
        max_size=MAX_FILE_SIZE_BYTES,
    )

    evidence = WasteEvidence(
        waste_batch_id=batch_id,
        evidence_type=evidence_type,
        file_path=f"/uploads/evidence/{batch_id}/{safe_filename}",
        file_name=file.filename or safe_filename,
        description=description,
    )
    db.add(evidence)

    # Update verification level if evidence is uploaded
    if batch.verification_level == WasteVerificationLevel.SELF_REPORTED:
        batch.verification_level = WasteVerificationLevel.EVIDENCE_VERIFIED

    db.commit()
    db.refresh(evidence)
    return evidence


@router.get("/{batch_id}/evidence", response_model=List[WasteEvidenceResponse])
def list_evidence(
    batch_id: str,
    db: Session = Depends(get_db),
):
    """List all evidence for a waste batch."""
    evidence_list = db.query(WasteEvidence).filter(
        WasteEvidence.waste_batch_id == batch_id
    ).all()
    return evidence_list


# ── Image Upload ──

@router.post("/{batch_id}/images")
async def upload_images(
    batch_id: str,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload images for a waste batch with signature and size verification."""
    org = db.query(Organization).filter(Organization.owner_id == current_user.id).first()
    batch = db.query(WasteBatch).filter(
        WasteBatch.id == batch_id,
        WasteBatch.organization_id == org.id if org else None,
    ).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Waste batch not found.")

    img_dir = os.path.join(UPLOAD_DIR, "images", batch_id)
    os.makedirs(img_dir, exist_ok=True)

    saved_paths = []
    for file in files:
        safe_filename, _ = await validate_and_save_upload(
            file=file,
            target_dir=img_dir,
            allowed_extensions=ALLOWED_IMG_EXTENSIONS,
            max_size=MAX_FILE_SIZE_BYTES,
        )
        saved_paths.append(f"/uploads/images/{batch_id}/{safe_filename}")

    existing = batch.images or []
    batch.images = existing + saved_paths
    db.commit()

    return {"message": f"Uploaded {len(saved_paths)} image(s).", "files": saved_paths}
