"""User profile (1:1 with users). No government ID / Aadhaar fields by design."""
from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid
from datetime import datetime, timezone
from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class UserProfile(Base):
    __tablename__ = "user_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    address = Column(String(500), nullable=True)
    education_level = Column(String(100), nullable=True)
    occupation = Column(String(150), nullable=True)
    designation = Column(String(150), nullable=True)
    cooperative_society = Column(String(255), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    photo_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    visible_to_employers = Column(Boolean, nullable=False, server_default="false")
    # Trainer extras
    qualification = Column(String(255), nullable=True)
    expertise = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
