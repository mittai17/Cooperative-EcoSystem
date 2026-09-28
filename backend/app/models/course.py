from sqlalchemy import Column, String, ForeignKey, Integer, Text, Float, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base


class Course(Base):
    __tablename__ = "courses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=True)
    level = Column(String(50), default="Foundation")
    duration_hours = Column(Integer, default=0)
    instructor = Column(String(255), nullable=True)
    rating = Column(Float, default=0.0)
    enrolled_count = Column(Integer, default=0)
    skills = Column(JSONB, default=list)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Module(Base):
    __tablename__ = "modules"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"))
    title = Column(String(255), nullable=True)


class Lesson(Base):
    __tablename__ = "lessons"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"))
    title = Column(String(255), nullable=True)


class CourseEnrollment(Base):
    """Trainee <-> course catalog enrollment (independent of the formal
    Programme/Batch nomination flow, which tracks cohort-based training)."""

    __tablename__ = "course_enrollments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    progress = Column(Integer, default=0)
    status = Column(String(50), default="active")
    enrolled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    last_accessed = Column(DateTime(timezone=True), nullable=True)
