from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone
from app.database import Base


class JobDetail(Base):
    """Employer-entered posting fields that have no column on `jobs` (one row per
    employer job, 1:1). education / experience_required / certifications are the
    source of the matcher's education, experience and certification criteria."""

    __tablename__ = "job_details"
    __table_args__ = (
        CheckConstraint("salary_min IS NULL OR salary_min >= 0", name="ck_job_details_salary_min"),
        CheckConstraint("salary_max IS NULL OR salary_max >= 0", name="ck_job_details_salary_max"),
    )
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True)
    department = Column(String(100), nullable=True)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    experience_required = Column(String(100), nullable=True)
    education = Column(String(255), nullable=True)
    responsibilities = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
    languages = Column(String(255), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
