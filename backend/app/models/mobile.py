"""Tables that back the mobile app: career plan/recommendations/chat history
and offline course packages. All additive; nothing here alters existing
tables."""
from sqlalchemy import Column, String, ForeignKey, Integer, Text, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class CareerPlan(Base):
    """One career plan per trainee: the target role and current readiness."""

    __tablename__ = "career_plans"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    target_role = Column(String(255), nullable=False)
    current_match = Column(Integer, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class CareerPlanStep(Base):
    __tablename__ = "career_plan_steps"
    __table_args__ = (UniqueConstraint("plan_id", "step", name="uq_career_plan_step"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("career_plans.id", ondelete="CASCADE"), nullable=False)
    step = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False, default="future")  # completed|current|next|target|future
    timeline = Column(String(100), nullable=True)


class CareerRecommendation(Base):
    __tablename__ = "career_recommendations"
    __table_args__ = (UniqueConstraint("plan_id", "priority", name="uq_career_recommendation_priority"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("career_plans.id", ondelete="CASCADE"), nullable=False)
    priority = Column(Integer, nullable=False)
    type = Column(String(20), nullable=False)  # course|assessment
    title = Column(String(255), nullable=False)
    reason = Column(Text, nullable=True)
    duration = Column(String(50), nullable=True)
    impact = Column(String(50), nullable=True)


class CareerChatMessage(Base):
    __tablename__ = "career_chat_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    sender = Column(String(10), nullable=False)  # user|ai
    text = Column(Text, nullable=False)
    suggested_actions = Column(JSONB, nullable=True)
    # Additive: group messages into conversations and record the reply language.
    conversation_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    lang = Column(String(5), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class OfflinePackage(Base):
    """Downloadable snapshot descriptor of a course for offline use. The
    lesson content itself is served from the course's modules; this row
    carries the versioning/size metadata the client uses to decide whether
    a local copy is stale."""

    __tablename__ = "offline_packages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, unique=True)
    version = Column(Integer, nullable=False, default=1)
    size_kb = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=_now)


class OfflineDownload(Base):
    __tablename__ = "offline_downloads"
    __table_args__ = (UniqueConstraint("trainee_id", "package_id", name="uq_offline_download"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    package_id = Column(UUID(as_uuid=True), ForeignKey("offline_packages.id", ondelete="CASCADE"), nullable=False)
    downloaded_at = Column(DateTime(timezone=True), default=_now)
