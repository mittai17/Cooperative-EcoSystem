from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base

class Programme(Base):
    __tablename__ = "programmes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    sector = Column(String(100))
    level = Column(String(50))
    mode = Column(String(50))
    duration_weeks = Column(Integer)
    seats_total = Column(Integer, default=0)
    seats_filled = Column(Integer, default=0)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"))
    start_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    description = Column(Text)
    # Additive, nullable
    eligibility = Column(Text, nullable=True)
    application_deadline = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    venue = Column(String(255), nullable=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Nomination(Base):
    __tablename__ = "nominations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"))
    status = Column(String(50), default="pending")
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    # Additive, nullable. status values: pending|approved|rejected|waitlisted|withdrawn.
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    nominated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # sponsor nominations
    note = Column(Text, nullable=True)
    decision_note = Column(Text, nullable=True)

class Batch(Base):
    __tablename__ = "batches"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"))
    name = Column(String(100))
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True), nullable=True)
    capacity = Column(Integer, default=30)
    # Additive, nullable (joining instructions / attendance eligibility)
    venue = Column(String(255), nullable=True)
    reporting_instructions = Column(Text, nullable=True)
    contact_phone = Column(String(20), nullable=True)
    min_attendance_pct = Column(Integer, nullable=True, server_default="75")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"))
    enrolled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), default="active")


class ProgrammeCourse(Base):
    __tablename__ = "programme_courses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    sequence_order = Column(Integer, default=1)
    is_mandatory = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

