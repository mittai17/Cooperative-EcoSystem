from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base

# `clerk_user_id` is NOT NULL + unique, but a trainee/trainer created by an
# institution-admin or platform admin (POST /api/v1/users) doesn't have a
# Clerk account yet. Such rows get a `pending:<random>` sentinel here instead
# of a real Clerk id; /api/v1/auth.py matches these by email on that person's
# first real sign-in and swaps in the real clerk_user_id in place, rather than
# creating a second, colliding identity row.
PENDING_CLERK_PREFIX = "pending:"


def is_pending_clerk_link(clerk_user_id: str | None) -> bool:
    return bool(clerk_user_id and clerk_user_id.startswith(PENDING_CLERK_PREFIX))


class Organisation(Base):
    __tablename__ = "organisations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(50))
    state = Column(String(100))
    is_active = Column(Boolean, default=True)
    # Profile extensions (additive, nullable)
    address = Column(String(500), nullable=True)
    district = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    accreditation_number = Column(String(100), nullable=True)
    logo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_user_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    role = Column(String(50), default="trainee")
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    # Additive, nullable: UI language (en|hi|mr|gu|ta) and chosen career goal.
    preferred_language = Column(String(5), nullable=True, server_default="en")
    career_target_role = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
