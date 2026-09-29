"""In-app notifications and push tokens."""
from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid
from datetime import datetime, timezone
from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Notification(Base):
    """kind examples: nomination_decision|timetable_change|hostel_allocation|
    certificate_issued|application_status|... `push_status` is the outbox state
    for remote push: NULL (no token / not applicable) | queued | sent | failed."""

    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_user_created", "user_id", "created_at"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String(50), nullable=False)
    title = Column(String(255), nullable=True)
    body = Column(Text, nullable=True)
    payload = Column(JSONB, nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    push_status = Column(String(20), nullable=True)
    push_sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class PushToken(Base):
    """A device push token. provider: expo|fcm. One row per token."""

    __tablename__ = "push_tokens"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(512), nullable=False, unique=True)
    provider = Column(String(10), nullable=False, server_default="expo")
    platform = Column(String(10), nullable=True)  # android|ios|web
    last_seen_at = Column(DateTime(timezone=True), default=_now)
    created_at = Column(DateTime(timezone=True), default=_now)
