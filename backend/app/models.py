"""
SQLAlchemy Models for Waste2Raw Platform
Covers: Users, Organizations, Waste, Orders, Reviews, Reports, Admin, Audit
"""
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, Enum as SAEnum, JSON, Table
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ──────────────────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    FACTORY = "factory"
    BUYER = "buyer"
    RECYCLER = "recycler"
    LOGISTICS = "logistics"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"
    VERIFICATION_ADMIN = "verification_admin"
    MODERATION_ADMIN = "moderation_admin"
    SUPPORT_ADMIN = "support_admin"


class AccountStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BLOCKED = "blocked"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    REJECTED = "rejected"


class WasteCategory(str, enum.Enum):
    TEXTILE = "textile"
    PLASTIC = "plastic"
    METAL = "metal"
    PACKAGING = "packaging"
    OTHER = "other"


class WasteVerificationLevel(str, enum.Enum):
    SELF_REPORTED = "self_reported"
    EVIDENCE_VERIFIED = "evidence_verified"
    THIRD_PARTY_VERIFIED = "third_party_verified"


class OrderStatus(str, enum.Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    VERIFICATION = "verification"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class ReportReason(str, enum.Enum):
    FAKE_COMPANY = "fake_company"
    FAKE_WASTE = "fake_waste"
    INCORRECT_QUANTITY = "incorrect_quantity"
    INCORRECT_QUALITY = "incorrect_quality"
    FRAUD = "fraud"
    NON_DELIVERY = "non_delivery"
    MISLEADING_INFO = "misleading_info"
    OTHER = "other"


class ReportStatus(str, enum.Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    WARNED = "warned"
    RESOLVED = "resolved"
    CLOSED = "closed"


class BlockReason(str, enum.Enum):
    FRAUD = "fraud"
    FAKE_DOCUMENTS = "fake_documents"
    FAKE_WASTE = "fake_waste"
    REPEATED_COMPLAINTS = "repeated_complaints"
    PAYMENT_ISSUES = "payment_issues"
    POLICY_VIOLATION = "policy_violation"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    OTHER = "other"


class EvidenceType(str, enum.Enum):
    PHOTO = "photo"
    WEIGHING_RECORD = "weighing_record"
    PRODUCTION_RECORD = "production_record"
    PURCHASE_RECORD = "purchase_record"
    SCRAP_SALE_RECORD = "scrap_sale_record"
    QUALITY_REPORT = "quality_report"
    OTHER = "other"


class NotificationType(str, enum.Enum):
    REGISTRATION = "registration"
    VERIFICATION_RESULT = "verification_result"
    NEW_BUYER_REQUEST = "new_buyer_request"
    MATCH_FOUND = "match_found"
    OFFER_RECEIVED = "offer_received"
    ORDER_ACCEPTED = "order_accepted"
    SHIPMENT_DISPATCHED = "shipment_dispatched"
    DELIVERY_COMPLETED = "delivery_completed"
    REPORT_SUBMITTED = "report_submitted"
    ACCOUNT_SUSPENDED = "account_suspended"
    ACCOUNT_BLOCKED = "account_blocked"
    ACCOUNT_UNBLOCKED = "account_unblocked"


def generate_uuid():
    return str(uuid.uuid4())


# ──────────────────────────────────────────────────────────
# User
# ──────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.FACTORY)
    account_status = Column(SAEnum(AccountStatus), nullable=False, default=AccountStatus.PENDING)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="owner", uselist=False, foreign_keys="Organization.owner_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    reviews_given = relationship("Review", foreign_keys="Review.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("Review", foreign_keys="Review.reviewee_id", back_populates="reviewee")
    reports_filed = relationship("Report", foreign_keys="Report.reporter_id", back_populates="reporter")
    reports_against = relationship("Report", foreign_keys="Report.reported_id", back_populates="reported_user")


# ──────────────────────────────────────────────────────────
# Organization
# ──────────────────────────────────────────────────────────

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    company_name = Column(String, nullable=False)
    business_type = Column(String, nullable=False)  # manufacturer, recycler, trader, etc.
    address = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    pincode = Column(String, nullable=True)
    country = Column(String, nullable=False, default="India")
    contact_person = Column(String, nullable=False)
    website = Column(String, nullable=True)
    registration_number = Column(String, nullable=True)
    tax_id = Column(String, nullable=True)  # GST or equivalent
    passport_id = Column(String, unique=True, nullable=True, index=True)  # e.g. RSX-FAC-2026-0001
    description = Column(Text, nullable=True)
    verification_status = Column(SAEnum(VerificationStatus), nullable=False, default=VerificationStatus.PENDING)
    verification_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by = Column(String, ForeignKey("users.id"), nullable=True)
    documents = Column(JSON, nullable=True)  # list of uploaded document paths
    integrity_agreement_signed = Column(Boolean, default=False)
    integrity_agreement_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = relationship("User", back_populates="organization", foreign_keys=[owner_id])
    waste_batches = relationship("WasteBatch", back_populates="organization", cascade="all, delete-orphan")
    buyer_requirements = relationship("BuyerRequirement", back_populates="organization", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────
# Waste Batch (Waste Passport)
# ──────────────────────────────────────────────────────────

class WasteBatch(Base):
    __tablename__ = "waste_batches"

    id = Column(String, primary_key=True, default=generate_uuid)
    waste_id = Column(String, unique=True, nullable=False, index=True)  # e.g. W2R-TX-2026-00124
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)

    # Material info
    category = Column(SAEnum(WasteCategory), nullable=False)
    material_type = Column(String, nullable=False)  # e.g. "Cotton Textile Waste"
    sub_type = Column(String, nullable=True)  # e.g. "Fabric cutting waste"
    description = Column(Text, nullable=True)

    # Quantity
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False, default="kg")
    available_quantity = Column(Float, nullable=False)

    # Quality
    purity_percentage = Column(Float, nullable=True)
    quality_grade = Column(String, nullable=True)
    quality_notes = Column(Text, nullable=True)

    # Location
    location = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Availability
    available_from = Column(DateTime, nullable=True)
    frequency = Column(String, nullable=True)  # one-time, weekly, monthly

    # Pricing
    price_per_unit = Column(Float, nullable=True)
    currency = Column(String, nullable=False, default="INR")
    negotiable = Column(Boolean, default=True)

    # Verification
    verification_level = Column(SAEnum(WasteVerificationLevel), nullable=False, default=WasteVerificationLevel.SELF_REPORTED)
    listing_verified = Column(Boolean, default=False)
    listing_verified_by = Column(String, ForeignKey("users.id"), nullable=True)
    listing_verified_at = Column(DateTime, nullable=True)

    # Images
    images = Column(JSON, nullable=True)  # list of image paths

    # Status
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="waste_batches")
    evidence = relationship("WasteEvidence", back_populates="waste_batch", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="waste_batch")


# ──────────────────────────────────────────────────────────
# Waste Evidence
# ──────────────────────────────────────────────────────────

class WasteEvidence(Base):
    __tablename__ = "waste_evidence"

    id = Column(String, primary_key=True, default=generate_uuid)
    waste_batch_id = Column(String, ForeignKey("waste_batches.id"), nullable=False)
    evidence_type = Column(SAEnum(EvidenceType), nullable=False)
    file_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    waste_batch = relationship("WasteBatch", back_populates="evidence")


# ──────────────────────────────────────────────────────────
# Buyer Requirement
# ──────────────────────────────────────────────────────────

class BuyerRequirement(Base):
    __tablename__ = "buyer_requirements"

    id = Column(String, primary_key=True, default=generate_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    category = Column(SAEnum(WasteCategory), nullable=False)
    material_type = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False, default="kg")
    min_purity = Column(Float, nullable=True)
    max_price_per_unit = Column(Float, nullable=True)
    max_distance_km = Column(Float, nullable=True)
    frequency = Column(String, nullable=True)
    location = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    organization = relationship("Organization", back_populates="buyer_requirements")


# ──────────────────────────────────────────────────────────
# Order
# ──────────────────────────────────────────────────────────

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_number = Column(String, unique=True, nullable=False, index=True)
    waste_batch_id = Column(String, ForeignKey("waste_batches.id"), nullable=False)
    buyer_org_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    supplier_org_id = Column(String, ForeignKey("organizations.id"), nullable=False)

    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False, default="kg")
    price_per_unit = Column(Float, nullable=False)
    total_material_cost = Column(Float, nullable=False)
    transportation_cost = Column(Float, nullable=True, default=0)
    total_cost = Column(Float, nullable=False)

    status = Column(SAEnum(OrderStatus), nullable=False, default=OrderStatus.REQUESTED)
    admin_verified = Column(Boolean, default=False)
    admin_verified_at = Column(DateTime, nullable=True)
    admin_verified_by = Column(String, nullable=True)
    admin_verification_notes = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    buyer_notes = Column(Text, nullable=True)
    supplier_notes = Column(Text, nullable=True)

    pickup_location = Column(String, nullable=True)
    delivery_location = Column(String, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    waste_batch = relationship("WasteBatch", back_populates="orders")
    buyer_org = relationship("Organization", foreign_keys=[buyer_org_id])
    supplier_org = relationship("Organization", foreign_keys=[supplier_org_id])
    reviews = relationship("Review", back_populates="order")


# ──────────────────────────────────────────────────────────
# Review
# ──────────────────────────────────────────────────────────

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    reviewer_id = Column(String, ForeignKey("users.id"), nullable=False)
    reviewee_id = Column(String, ForeignKey("users.id"), nullable=False)

    quality_accuracy = Column(Integer, nullable=False)  # 1-5
    quantity_accuracy = Column(Integer, nullable=False)
    delivery_rating = Column(Integer, nullable=False)
    communication_rating = Column(Integer, nullable=False)
    payment_reliability = Column(Integer, nullable=True)  # only for buyer reviews
    overall_rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    order = relationship("Order", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewee = relationship("User", foreign_keys=[reviewee_id], back_populates="reviews_received")


# ──────────────────────────────────────────────────────────
# Report
# ──────────────────────────────────────────────────────────

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    reported_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(SAEnum(ReportReason), nullable=False)
    description = Column(Text, nullable=False)
    evidence_files = Column(JSON, nullable=True)
    status = Column(SAEnum(ReportStatus), nullable=False, default=ReportStatus.OPEN)
    admin_notes = Column(Text, nullable=True)
    resolved_by = Column(String, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="reports_filed")
    reported_user = relationship("User", foreign_keys=[reported_id], back_populates="reports_against")


# ──────────────────────────────────────────────────────────
# Notification
# ──────────────────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(SAEnum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="notifications")


# ──────────────────────────────────────────────────────────
# Audit Log
# ──────────────────────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    admin_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=False)  # user, organization, waste_batch, order, report
    target_id = Column(String, nullable=False)
    reason = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    admin = relationship("User")
