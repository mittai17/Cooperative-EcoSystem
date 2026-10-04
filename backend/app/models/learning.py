"""Learning resources, progress tracking, and event telemetry models."""
from __future__ import annotations

from datetime import datetime, timezone
import uuid

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class LearningResource(Base):
    """Normalized educational resource stored in CoopSetu."""

    __tablename__ = "learning_resources"
    __table_args__ = (
        UniqueConstraint("source", "external_id", name="uq_learning_resources_source_external_id"),
        Index("ix_learning_resources_source_type", "source", "content_type"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = Column(String(255), nullable=False)
    source = Column(String(30), nullable=False, server_default="DIKSHA")  # DIKSHA | YOUTUBE | COOPSETU | OTHER
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String(1000), nullable=True)
    language = Column(String(50), nullable=True)
    content_type = Column(String(50), nullable=False, server_default="video")  # video | document | course | interactive
    duration = Column(Integer, nullable=True)  # seconds
    author = Column(String(255), nullable=True)
    organization = Column(String(255), nullable=True)
    license = Column(String(255), nullable=True)
    license_url = Column(String(1000), nullable=True)
    attribution = Column(Text, nullable=True)
    license_status = Column(
        String(50), nullable=False, server_default="ALLOWED_WITH_ATTRIBUTION"
    )  # ALLOWED | ALLOWED_WITH_ATTRIBUTION | NON_COMMERCIAL_ONLY | RESTRICTED | UNKNOWN
    embedding_allowed = Column(Boolean, nullable=False, server_default="true")
    commercial_use_allowed = Column(Boolean, nullable=False, server_default="false")
    modification_allowed = Column(Boolean, nullable=False, server_default="false")
    source_url = Column(String(1000), nullable=True)
    player_url = Column(String(1000), nullable=True)
    extra_metadata = Column("metadata", JSONB, nullable=False, server_default="{}")
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class LearningProgress(Base):
    """User learning progress tracking per resource and optional course."""

    __tablename__ = "learning_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "content_id", name="uq_learning_progress_user_content"),
        Index("ix_learning_progress_user", "user_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    content_id = Column(String(255), nullable=False)
    source = Column(String(30), nullable=False, server_default="DIKSHA")
    started_at = Column(DateTime(timezone=True), default=_now)
    last_accessed_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
    last_position = Column(Integer, nullable=False, server_default="0")
    completion_percentage = Column(Integer, nullable=False, server_default="0")
    time_spent_seconds = Column(Integer, nullable=False, server_default="0")
    completed = Column(Boolean, nullable=False, server_default="false")
    completed_at = Column(DateTime(timezone=True), nullable=True)
    attempt_count = Column(Integer, nullable=False, server_default="1")
    extra_metadata = Column("metadata", JSONB, nullable=False, server_default="{}")


class LearningEvent(Base):
    """Learning event tracking audit log."""

    __tablename__ = "learning_events"
    __table_args__ = (
        Index("ix_learning_events_user_type", "user_id", "event_type"),
        Index("ix_learning_events_timestamp", "timestamp"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_id = Column(String(255), nullable=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(50), nullable=False)  # CONTENT_OPENED, CONTENT_STARTED, etc.
    timestamp = Column(DateTime(timezone=True), default=_now)
    extra_metadata = Column("metadata", JSONB, nullable=False, server_default="{}")
