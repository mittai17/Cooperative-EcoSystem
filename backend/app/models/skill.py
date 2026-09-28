from sqlalchemy import Column, String, ForeignKey, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base


class Skill(Base):
    __tablename__ = "skills"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    category = Column(String(100), nullable=True)


class TraineeSkill(Base):
    """Aggregated skill-passport entry: one row per (trainee, skill), updated
    incrementally as evidence (course completion, assessment, attendance,
    certificate) arrives."""

    __tablename__ = "trainee_skills"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)
    level = Column(String(50), default="Foundational")
    confidence = Column(Integer, default=50)
    verified = Column(Boolean, default=False)
    evidence = Column(JSONB, default=list)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class SkillGap(Base):
    """Historical record of a skill-gap analysis run, kept for NCCT-level
    aggregation (which roles/skills trainees are being evaluated against)."""

    __tablename__ = "skill_gaps"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    target_role = Column(String(255), nullable=True)
    match_score = Column(Integer, nullable=True)
    gaps = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
