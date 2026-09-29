from sqlalchemy import Column, String, ForeignKey, Integer, Text, Float, Boolean, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base


class Course(Base):
    __tablename__ = "courses"
    __table_args__ = (UniqueConstraint("source", "external_id", name="uq_courses_source_external_id"),)
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
    # Origin of the record (native|moodle|youtube|...) with a natural key for sync.
    source = Column(String(30), nullable=False, server_default="native")
    external_id = Column(String(255), nullable=True)
    external_url = Column(String(1000), nullable=True)
    synced_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Module(Base):
    __tablename__ = "modules"
    __table_args__ = (UniqueConstraint("source", "external_id", name="uq_modules_source_external_id"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"))
    title = Column(String(255), nullable=True)
    # Added for the mobile app (additive, nullable): display order, length in
    # minutes, short summary and an optional video url.
    position = Column(Integer, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    summary = Column(Text, nullable=True)
    video_url = Column(String(500), nullable=True)
    source = Column(String(30), nullable=False, server_default="native")
    external_id = Column(String(255), nullable=True)
    external_url = Column(String(1000), nullable=True)
    synced_at = Column(DateTime(timezone=True), nullable=True)


class Lesson(Base):
    __tablename__ = "lessons"
    __table_args__ = (UniqueConstraint("source", "external_id", name="uq_lessons_source_external_id"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id"))
    title = Column(String(255), nullable=True)
    # Interactive content. `content` is a list of typed blocks (English base;
    # other languages via content_translations). lesson_type: text|video|audio|
    # flashcards|quiz|scenario|mixed. content_version bumps on every edit and
    # drives the offline "update available" check.
    position = Column(Integer, nullable=True)
    lesson_type = Column(String(30), nullable=False, server_default="text")
    duration_min = Column(Integer, nullable=True)
    content = Column(JSONB, nullable=True)
    content_version = Column(Integer, nullable=False, server_default="1")
    source = Column(String(30), nullable=False, server_default="native")
    external_id = Column(String(255), nullable=True)
    external_url = Column(String(1000), nullable=True)
    synced_at = Column(DateTime(timezone=True), nullable=True)


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


class ModuleProgress(Base):
    """Per-trainee completion of a course module (one row per trainee+module)."""

    __tablename__ = "module_progress"
    __table_args__ = (UniqueConstraint("trainee_id", "module_id", name="uq_module_progress_trainee_module"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    module_id = Column(UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False)
    completed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
