from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base


class JobRequirement(Base):
    """One structured criterion of an employer job, used by the deterministic
    matcher (app/services/employer_matching.py).

    kind: skill|education|experience|certification.
    - skill: skill_name (+ optional skill_id), requirement_type required|preferred,
      min_proficiency 0-100 (nullable), weight 1-10.
    - education: min_education (Graduate, Diploma, ...). Required only.
    - experience: min_years. Required only.
    - certification: certification_name. Required only.
    Only one row per non-skill kind is allowed per job (enforced in the API).
    """

    __tablename__ = "job_requirements"
    __table_args__ = (
        CheckConstraint("kind IN ('skill','education','experience','certification')",
                        name="ck_job_requirements_kind"),
        CheckConstraint("requirement_type IN ('required','preferred')",
                        name="ck_job_requirements_type"),
        CheckConstraint("min_proficiency IS NULL OR (min_proficiency >= 0 AND min_proficiency <= 100)",
                        name="ck_job_requirements_min_proficiency"),
        CheckConstraint("weight >= 1 AND weight <= 10", name="ck_job_requirements_weight"),
        CheckConstraint("min_years IS NULL OR min_years >= 0", name="ck_job_requirements_min_years"),
        Index("ix_job_requirements_job_id", "job_id"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    kind = Column(String(20), nullable=False, server_default="skill")
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id", ondelete="SET NULL"), nullable=True)
    skill_name = Column(String(255), nullable=True)
    requirement_type = Column(String(20), nullable=False, server_default="required")
    min_proficiency = Column(Integer, nullable=True)
    weight = Column(Integer, nullable=False, server_default="1")
    min_education = Column(String(100), nullable=True)
    min_years = Column(Integer, nullable=True)
    certification_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
