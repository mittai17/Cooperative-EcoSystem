from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, Boolean, Text, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base


class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=True)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"), nullable=True)
    skill_name = Column(String(255), nullable=True)  # primary skill this assessment certifies
    total_questions = Column(Integer, default=25)
    duration_minutes = Column(Integer, default=45)
    passing_score = Column(Integer, default=60)
    due_date = Column(DateTime(timezone=True), nullable=True)
    # Attempt policy (additive). show_answers: after_submit|never.
    max_attempts = Column(Integer, nullable=False, server_default="3")
    shuffle = Column(Boolean, nullable=False, server_default="false")
    show_answers = Column(String(20), nullable=False, server_default="after_submit")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AssessmentResult(Base):
    __tablename__ = "assessment_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"))
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    score = Column(Integer, nullable=False)
    passed = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    feedback = Column(Text, nullable=True)


class AssessmentQuestion(Base):
    """Server-side question bank. `correct` is never sent to clients before an
    attempt is submitted (and only then per `assessments.show_answers`).
    type: mcq_single|mcq_multi|true_false. options: [{"id":"a","text":"..."}].
    correct: list of option ids (["a"]) or [true]/[false] for true_false."""

    __tablename__ = "assessment_questions"
    __table_args__ = (UniqueConstraint("assessment_id", "position", name="uq_assessment_question_position"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False)
    type = Column(String(20), nullable=False, server_default="mcq_single")
    prompt = Column(Text, nullable=False)
    options = Column(JSONB, nullable=True)
    correct = Column(JSONB, nullable=False)
    explanation = Column(Text, nullable=True)
    marks = Column(Integer, nullable=False, server_default="1")
    topic = Column(String(100), nullable=True)


class AssessmentAttempt(Base):
    """One timed attempt. status: in_progress|submitted|expired.
    `question_order` holds the (possibly shuffled) list of question ids served."""

    __tablename__ = "assessment_attempts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    attempt_no = Column(Integer, nullable=False, server_default="1")
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    question_order = Column(JSONB, nullable=True)
    answers = Column(JSONB, nullable=True)
    score = Column(Integer, nullable=True)
    passed = Column(Boolean, nullable=True)
    status = Column(String(20), nullable=False, server_default="in_progress")

    __table_args__ = (
        Index("ix_assessment_attempts_trainee_assessment", "trainee_id", "assessment_id"),
        UniqueConstraint("assessment_id", "trainee_id", "attempt_no", name="uq_assessment_attempt_no"),
    )
