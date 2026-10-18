"""
Pydantic schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
from app.models import (
    UserRole, AccountStatus, VerificationStatus, WasteCategory,
    WasteVerificationLevel, OrderStatus, ReportReason, ReportStatus,
    BlockReason, EvidenceType, NotificationType,
)


# ──────────────────────────────────────────────────────────
# Auth
# ──────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.FACTORY


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: str
    role: UserRole


# ──────────────────────────────────────────────────────────
# User
# ──────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    email: str
    phone: Optional[str] = None
    full_name: str
    role: UserRole
    account_status: AccountStatus
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


# ──────────────────────────────────────────────────────────
# Organization
# ──────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=200)
    business_type: str
    address: str
    city: str
    state: str
    pincode: Optional[str] = None
    country: str = "India"
    contact_person: str
    website: Optional[str] = None
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    description: Optional[str] = None


class OrganizationResponse(BaseModel):
    id: str
    owner_id: str
    company_name: str
    business_type: str
    address: str
    city: str
    state: str
    pincode: Optional[str] = None
    country: str
    contact_person: str
    website: Optional[str] = None
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    passport_id: Optional[str] = None
    description: Optional[str] = None
    verification_status: VerificationStatus
    verification_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    documents: Optional[List[str]] = None
    integrity_agreement_signed: Optional[bool] = False
    integrity_agreement_data: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AgreementSignRequest(BaseModel):
    signatory_name: str = Field(..., min_length=2, max_length=150)
    signatory_designation: str = Field(..., min_length=2, max_length=100)
    accept_verified_product_obligation: bool
    accept_anti_fraud_penalties: bool
    accept_legal_jurisdiction: bool


class OrganizationUpdate(BaseModel):
    company_name: Optional[str] = None
    business_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    contact_person: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None


# ──────────────────────────────────────────────────────────
# Waste Batch
# ──────────────────────────────────────────────────────────

class WasteBatchCreate(BaseModel):
    category: WasteCategory
    material_type: str = Field(..., min_length=2)
    sub_type: Optional[str] = None
    description: Optional[str] = None
    quantity: float = Field(..., gt=0)
    unit: str = "kg"
    purity_percentage: Optional[float] = Field(None, ge=0, le=100)
    quality_grade: Optional[str] = None
    quality_notes: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    available_from: Optional[datetime] = None
    frequency: Optional[str] = None
    price_per_unit: Optional[float] = Field(None, ge=0)
    currency: str = "INR"
    negotiable: bool = True


class WasteBatchResponse(BaseModel):
    id: str
    waste_id: str
    organization_id: str
    category: WasteCategory
    material_type: str
    sub_type: Optional[str] = None
    description: Optional[str] = None
    quantity: float
    unit: str
    available_quantity: float
    purity_percentage: Optional[float] = None
    quality_grade: Optional[str] = None
    quality_notes: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    available_from: Optional[datetime] = None
    frequency: Optional[str] = None
    price_per_unit: Optional[float] = None
    currency: str
    negotiable: bool
    verification_level: WasteVerificationLevel
    listing_verified: bool
    images: Optional[List[str]] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Enriched fields (populated by API)
    organization_name: Optional[str] = None
    evidence_count: Optional[int] = None

    class Config:
        from_attributes = True


class WasteBatchUpdate(BaseModel):
    description: Optional[str] = None
    available_quantity: Optional[float] = None
    purity_percentage: Optional[float] = None
    quality_grade: Optional[str] = None
    quality_notes: Optional[str] = None
    price_per_unit: Optional[float] = None
    negotiable: Optional[bool] = None
    frequency: Optional[str] = None
    is_active: Optional[bool] = None


# ──────────────────────────────────────────────────────────
# Waste Evidence
# ──────────────────────────────────────────────────────────

class WasteEvidenceResponse(BaseModel):
    id: str
    waste_batch_id: str
    evidence_type: EvidenceType
    file_path: str
    file_name: str
    description: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────
# Buyer Requirement
# ──────────────────────────────────────────────────────────

class BuyerRequirementCreate(BaseModel):
    category: WasteCategory
    material_type: str
    quantity: float = Field(..., gt=0)
    unit: str = "kg"
    min_purity: Optional[float] = None
    max_price_per_unit: Optional[float] = None
    max_distance_km: Optional[float] = None
    frequency: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class BuyerRequirementResponse(BaseModel):
    id: str
    organization_id: str
    category: WasteCategory
    material_type: str
    quantity: float
    unit: str
    min_purity: Optional[float] = None
    max_price_per_unit: Optional[float] = None
    max_distance_km: Optional[float] = None
    frequency: Optional[str] = None
    location: Optional[str] = None
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────
# Order
# ──────────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    waste_batch_id: str
    quantity: float = Field(..., gt=0)
    notes: Optional[str] = None
    delivery_location: Optional[str] = None


class OrderResponse(BaseModel):
    id: str
    order_number: str
    waste_batch_id: str
    buyer_org_id: str
    supplier_org_id: str
    quantity: float
    unit: str
    price_per_unit: float
    total_material_cost: float
    transportation_cost: Optional[float] = 0
    total_cost: float
    status: OrderStatus
    admin_verified: Optional[bool] = False
    admin_verified_at: Optional[datetime] = None
    admin_verified_by: Optional[str] = None
    admin_verification_notes: Optional[str] = None
    notes: Optional[str] = None
    buyer_notes: Optional[str] = None
    supplier_notes: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    # Enriched
    buyer_org_name: Optional[str] = None
    supplier_org_name: Optional[str] = None
    material_type: Optional[str] = None

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    notes: Optional[str] = None


class OrderAdminVerifyRequest(BaseModel):
    verified: bool = True
    notes: Optional[str] = None


class VerificationCheckItem(BaseModel):
    name: str
    passed: bool
    details: str


class OrderVerificationResult(BaseModel):
    order_id: str
    order_number: str
    is_verified: bool
    verification_status: str  # "VERIFIED_AUTHENTIC", "PENDING_SUPPLIER_ACCEPTANCE", "CANCELLED", "UNDER_REVIEW"
    verification_badge: str
    verification_hash: str
    verification_timestamp: datetime
    order_status: OrderStatus
    material_type: str
    category: str
    quantity: float
    unit: str
    price_per_unit: float
    total_cost: float
    batch_verification_level: str
    batch_passport_hash: Optional[str] = None
    supplier_org_name: str
    supplier_verified: bool
    supplier_location: Optional[str] = None
    buyer_org_name: str
    buyer_verified: bool
    buyer_location: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    carbon_offset_kg: float
    landfill_diverted_kg: float
    checks: List[VerificationCheckItem]
    audit_notes: Optional[str] = None


# ──────────────────────────────────────────────────────────
# Review
# ──────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    order_id: str
    reviewee_id: str
    quality_accuracy: int = Field(..., ge=1, le=5)
    quantity_accuracy: int = Field(..., ge=1, le=5)
    delivery_rating: int = Field(..., ge=1, le=5)
    communication_rating: int = Field(..., ge=1, le=5)
    payment_reliability: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: str
    order_id: str
    reviewer_id: str
    reviewee_id: str
    quality_accuracy: int
    quantity_accuracy: int
    delivery_rating: int
    communication_rating: int
    payment_reliability: Optional[int] = None
    overall_rating: float
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────
# Report
# ──────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    reported_id: str
    reason: ReportReason
    description: str = Field(..., min_length=10)


class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    reported_id: str
    reason: ReportReason
    description: str
    evidence_files: Optional[List[str]] = None
    status: ReportStatus
    admin_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────
# Admin
# ──────────────────────────────────────────────────────────

class AdminVerifyOrg(BaseModel):
    status: VerificationStatus
    notes: Optional[str] = None


class AdminBlockUser(BaseModel):
    reason: BlockReason
    duration_days: Optional[int] = None  # None = permanent
    notes: Optional[str] = None


class AdminVerifyListing(BaseModel):
    verified: bool
    notes: Optional[str] = None


class AdminReportAction(BaseModel):
    action: str  # investigate, warn, suspend, block, close
    notes: Optional[str] = None


# ──────────────────────────────────────────────────────────
# Notification
# ──────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    type: NotificationType
    title: str
    message: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────
# Audit Log
# ──────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: str
    admin_id: str
    action: str
    target_type: str
    target_id: str
    reason: Optional[str] = None
    details: Optional[Any] = None
    created_at: datetime
    admin_name: Optional[str] = None

    class Config:
        from_attributes = True


# ──────────────────────────────────────────────────────────
# Dashboard
# ──────────────────────────────────────────────────────────

class FactoryDashboard(BaseModel):
    total_waste_generated: float
    total_waste_available: float
    total_waste_sold: float
    total_revenue: float
    active_listings: int
    buyer_requests: int
    pending_orders: int
    completed_orders: int


class BuyerDashboard(BaseModel):
    active_requirements: int
    matching_suppliers: int
    pending_requests: int
    active_orders: int
    completed_orders: int
    total_spent: float


class AdminDashboard(BaseModel):
    total_users: int
    verified_companies: int
    pending_verification: int
    blocked_users: int
    suspended_users: int
    active_listings: int
    pending_listings: int
    active_orders: int
    completed_orders: int
    open_reports: int
    total_transaction_value: float


# ──────────────────────────────────────────────────────────
# Search / Match
# ──────────────────────────────────────────────────────────

class WasteSearchParams(BaseModel):
    category: Optional[WasteCategory] = None
    material_type: Optional[str] = None
    min_quantity: Optional[float] = None
    max_quantity: Optional[float] = None
    location: Optional[str] = None
    min_purity: Optional[float] = None
    max_price: Optional[float] = None
    verified_only: Optional[bool] = False
    page: int = 1
    per_page: int = 20


class MatchResult(BaseModel):
    waste_batch: WasteBatchResponse
    match_score: float
    score_breakdown: dict
