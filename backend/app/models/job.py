from sqlalchemy import Column, String, ForeignKey, Text, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base

class Job(Base):
    __tablename__ = "jobs"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    employer_name = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    sector = Column(String(100), default="Cooperative")
    job_type = Column(String(50), default="Full-time")
    salary_range = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    skills_required = Column(JSONB, nullable=True)

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

