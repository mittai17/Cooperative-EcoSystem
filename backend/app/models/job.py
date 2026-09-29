from sqlalchemy import Column, String, ForeignKey, Text, Integer, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (UniqueConstraint("source", "external_id", name="uq_jobs_source_external_id"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    employer_name = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    sector = Column(String(100), default="Cooperative")
    job_type = Column(String(50), default="Full-time")
    salary_range = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    skills_required = Column(JSONB, nullable=True)
    # Added for the mobile app (additive, nullable).
    openings = Column(Integer, nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)
    # Ownership / lifecycle. status: draft|open|closed.
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True, index=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), nullable=False, server_default="open")
    deadline = Column(DateTime(timezone=True), nullable=True)
    # External listings. source: employer|adzuna|jooble|remotive|themuse.
    source = Column(String(20), nullable=False, server_default="employer")
    external_id = Column(String(255), nullable=True)
    apply_url = Column(String(1000), nullable=True)
    fetched_at = Column(DateTime(timezone=True), nullable=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    dedupe_key = Column(String(255), nullable=True, index=True)

class JobMatch(Base):
    """Persisted, explainable match result between a candidate and a job so
    it can be audited later (e.g. by NCCT analytics or the employer)."""

    __tablename__ = "job_matches"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=True)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    match_score = Column(Integer, nullable=True)
    matched_skills = Column(JSONB, nullable=True)
    missing_skills = Column(JSONB, nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Application(Base):
    __tablename__ = "applications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=True)
    applicant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(String(50), default="applied")
    applied_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    # status flow: applied|applied_external|shortlisted|interview|offered|hired|rejected|withdrawn
    employer_note = Column(Text, nullable=True)
    interview_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), nullable=True)

class EmployerFeedback(Base):
    __tablename__ = "employer_feedbacks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=True)
    useful_skills = Column(JSONB, nullable=True)
    missing_skills = Column(JSONB, nullable=True)
    training_relevance = Column(Integer, nullable=True)
    performance_rating = Column(Integer, nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

