"""Face attendance data. Only embeddings are stored, never images. Consent is
versioned and revocable (DPDP Act 2023)."""
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid
from datetime import datetime, timezone
from app.database import Base
from app.models.coltypes import Vector

FACE_EMBEDDING_DIM = 128  # OpenCV SFace embeddings


def _now():
    return datetime.now(timezone.utc)


class FaceTemplate(Base):
    """One template per user. On revoke the embedding is NULLed (and
    `revoked_at` set) so the consent audit trail survives the biometric data."""

    __tablename__ = "face_templates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    embedding = Column(Vector(FACE_EMBEDDING_DIM), nullable=True)
    model_version = Column(String(50), nullable=True)
    enrolled_at = Column(DateTime(timezone=True), nullable=True)
    enrolled_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    self_enrolled = Column(Boolean, nullable=False, server_default="false")
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    consent_version = Column(String(20), nullable=True)
    consent_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class FaceEvent(Base):
    """Audit log of face operations (no images). event_type: consent|enroll|
    verify|identify|challenge|revoke. outcome: matched|rejected|no_face|
    liveness_failed|error|ok."""

    __tablename__ = "face_events"
    __table_args__ = (Index("ix_face_events_user_created", "user_id", "created_at"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id", ondelete="SET NULL"), nullable=True, index=True)
    event_type = Column(String(20), nullable=False)
    outcome = Column(String(20), nullable=True)
    score = Column(Float, nullable=True)
    liveness = Column(Boolean, nullable=True)
    details = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
