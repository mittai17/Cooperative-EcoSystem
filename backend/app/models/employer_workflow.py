"""Employer recruitment workflow: interviews, offers, talent pool and the
organisation's recruiter team. All rows are written by deterministic,
human-initiated API calls; no LLM output is ever persisted as a decision."""
from sqlalchemy import CheckConstraint, Column, Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid
from datetime import datetime, timezone
from app.database import Base


def _now():
    return datetime.now(timezone.utc)


INTERVIEW_STATUSES = ("scheduled", "completed", "cancelled")
INTERVIEW_DECISIONS = ("proceed", "hold", "reject")
OFFER_STATUSES = ("draft", "sent", "accepted", "declined", "withdrawn", "expired")
TALENT_CATEGORIES = ("saved", "high_potential", "future_hiring", "interviewed", "previously_hired")
TEAM_ROLES = ("employer_admin", "recruiter", "hiring_manager")
EVALUATION_KEYS = ("technical_skills", "communication", "problem_solving", "domain_knowledge", "cooperative_sector_knowledge")
RECOMMENDATIONS = ("strongly_recommend", "recommend", "undecided", "not_recommend")
FEEDBACK_KEYS = ("technical_skills", "communication", "problem_solving", "domain_knowledge", "digital_skills", "work_readiness")
EMPLOYMENT_TYPES = ("full_time", "part_time", "contract", "internship")
NOTIFICATION_DEFAULTS = {"interview_reminders": True, "new_application": True,
                         "candidate_response": True, "job_deadline": True}


class Interview(Base):
    __tablename__ = "interviews"
    __table_args__ = (
        CheckConstraint("status IN ('scheduled','completed','cancelled')", name="ck_interviews_status"),
        CheckConstraint("decision IS NULL OR decision IN ('proceed','hold','reject')", name="ck_interviews_decision"),
        CheckConstraint("overall_rating IS NULL OR (overall_rating BETWEEN 1 AND 5)", name="ck_interviews_rating"),
        CheckConstraint("mode IN ('online','onsite')", name="ck_interviews_mode"),
        Index("ix_interviews_org_scheduled", "organisation_id", "scheduled_at"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=False, server_default="45")
    mode = Column(String(10), nullable=False, server_default="online")
    meeting_link = Column(String(1000), nullable=True)
    interviewer_name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, server_default="scheduled")
    # Human-set only. Never populated by a model or scoring function.
    decision = Column(String(10), nullable=True)
    decided_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    evaluation = Column(JSONB, nullable=True)
    overall_rating = Column(Integer, nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class Offer(Base):
    __tablename__ = "offers"
    __table_args__ = (
        CheckConstraint("status IN ('draft','sent','accepted','declined','withdrawn','expired')", name="ck_offers_status"),
        Index("ix_offers_org_status", "organisation_id", "status"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), nullable=False, server_default="draft")
    # Annual salary in INR, whole rupees.
    salary = Column(Integer, nullable=True)
    employment_type = Column(String(50), nullable=True)
    joining_date = Column(Date, nullable=True)
    location = Column(String(255), nullable=True)
    benefits = Column(Text, nullable=True)
    additional_terms = Column(Text, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    responded_at = Column(DateTime(timezone=True), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class TalentPoolEntry(Base):
    __tablename__ = "talent_pool_entries"
    __table_args__ = (
        UniqueConstraint("organisation_id", "trainee_id", name="uq_talent_pool_org_trainee"),
        CheckConstraint("category IN ('saved','high_potential','future_hiring','interviewed','previously_hired')",
                        name="ck_talent_pool_category"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(30), nullable=False, server_default="saved")
    note = Column(Text, nullable=True)
    added_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class EmployerTeamMember(Base):
    """Team role for an employer-role user inside their organisation. Users
    without a row are recruiters, except the organisation's oldest employer
    account, which is the implicit Employer Admin until one is assigned."""

    __tablename__ = "employer_team_members"
    __table_args__ = (
        CheckConstraint("team_role IN ('employer_admin','recruiter','hiring_manager')", name="ck_team_role"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    team_role = Column(String(30), nullable=False)
    added_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class EmployerFeedbackRatings(Base):
    """Six-criteria post-hire ratings. A 1:1 sidecar to employer_feedbacks so the
    existing feedback model and /jobs/feedback writes stay unchanged."""

    __tablename__ = "employer_feedback_ratings"
    feedback_id = Column(UUID(as_uuid=True), ForeignKey("employer_feedbacks.id", ondelete="CASCADE"), primary_key=True)
    ratings = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_now)


class EmployerOrgProfile(Base):
    """Company fields with no column on organisations (description, departments)."""

    __tablename__ = "employer_org_profiles"
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id", ondelete="CASCADE"), primary_key=True)
    description = Column(Text, nullable=True)
    departments = Column(JSONB, nullable=False, default=list)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class EmployerUserPreferences(Base):
    __tablename__ = "employer_user_preferences"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    notifications = Column(JSONB, nullable=False, default=dict)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)
