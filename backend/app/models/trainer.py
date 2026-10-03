"""Trainer-workspace tables.

Reuses the existing Batch / Enrollment / AttendanceSession / Assessment /
TraineeSkill models; only the pieces the trainer workflow was missing live here:
the trainer<->batch<->course teaching assignment, assignments + submissions,
announcements, direct messages, structured skill evaluations and manual grades.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class BatchCourse(Base):
    """A trainer teaching one course to one batch (the root of every trainer
    permission check: a trainer may only touch rows reachable from here)."""

    __tablename__ = "batch_courses"
    __table_args__ = (UniqueConstraint("batch_id", "course_id", name="uq_batch_course"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    room = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class Assignment(Base):
    """status: draft|published. resources: [{"title","url"}]."""

    __tablename__ = "assignments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)
    max_marks = Column(Integer, nullable=False, server_default="100")
    resources = Column(JSONB, nullable=True)
    status = Column(String(20), nullable=False, server_default="published")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class AssignmentSubmission(Base):
    """status: submitted|late|graded."""

    __tablename__ = "assignment_submissions"
    __table_args__ = (UniqueConstraint("assignment_id", "trainee_id", name="uq_assignment_submission"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False, index=True)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=True)
    file_url = Column(String(1000), nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=_now)
    status = Column(String(20), nullable=False, server_default="submitted")
    marks = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    graded_at = Column(DateTime(timezone=True), nullable=True)


class Announcement(Base):
    """audience_type: batch|course|trainees. trainee_ids is set for `trainees`."""

    __tablename__ = "announcements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    audience_type = Column(String(20), nullable=False, server_default="batch")
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="CASCADE"), nullable=True, index=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    trainee_ids = Column(JSONB, nullable=True)
    status = Column(String(20), nullable=False, server_default="sent")
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class DirectMessage(Base):
    __tablename__ = "direct_messages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class SkillEvaluation(Base):
    """Structured trainer evaluation. dimension is one of: technical_knowledge,
    practical_application, communication, problem_solving, teamwork,
    digital_skills. `observation` is always written by the trainer."""

    __tablename__ = "skill_evaluations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    dimension = Column(String(40), nullable=False)
    rating = Column(Integer, nullable=False)
    observation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class ManualGrade(Base):
    """Trainer marks for one subjective question of one attempt."""

    __tablename__ = "assessment_manual_grades"
    __table_args__ = (UniqueConstraint("attempt_id", "question_id", name="uq_manual_grade_attempt_question"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(UUID(as_uuid=True), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(UUID(as_uuid=True), ForeignKey("assessment_questions.id", ondelete="CASCADE"), nullable=False)
    marks = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=True)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    graded_at = Column(DateTime(timezone=True), default=_now)
