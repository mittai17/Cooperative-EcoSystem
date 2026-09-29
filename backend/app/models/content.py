"""Learning-content tables: generic translations, per-lesson progress, media
assets and the external (Moodle/YouTube) course catalogue. All additive."""
from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid
from datetime import datetime, timezone
from app.database import Base

SUPPORTED_LANGS = ("en", "hi", "mr", "gu", "ta")


def _now():
    return datetime.now(timezone.utc)


class ContentTranslation(Base):
    """Generic per-entity translation overlay. `fields` holds only the
    translated attributes (e.g. {"title": ..., "blocks": [...]}); anything
    missing falls back to the English base row. entity_type: course|module|
    lesson|assessment_question|programme|... status: draft|reviewed."""

    __tablename__ = "content_translations"
    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", "lang", name="uq_content_translation"),
        CheckConstraint("lang in ('en','hi','mr','gu','ta')", name="ck_content_translations_lang"),
        CheckConstraint("status in ('draft','reviewed')", name="ck_content_translations_status"),
        Index("ix_content_translations_entity", "entity_type", "entity_id"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_type = Column(String(30), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    lang = Column(String(5), nullable=False)
    fields = Column(JSONB, nullable=False, server_default="{}")
    status = Column(String(20), nullable=False, server_default="draft")
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class LessonProgress(Base):
    """status: not_started|in_progress|completed. Conflict rule: completed never
    un-completes; position/score use the latest client timestamp."""

    __tablename__ = "lesson_progress"
    __table_args__ = (UniqueConstraint("trainee_id", "lesson_id", name="uq_lesson_progress_trainee_lesson"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(20), nullable=False, server_default="in_progress")
    position_sec = Column(Integer, nullable=True)
    score = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class MediaAsset(Base):
    """A media file or external media reference attached to a lesson. The
    source of the offline manifest. provider: native|youtube|bhashini_tts|
    moodle. `downloadable` is false for streaming-only providers (YouTube)."""

    __tablename__ = "media_assets"
    __table_args__ = (UniqueConstraint("lesson_id", "provider", "external_id", name="uq_media_asset_lesson_provider_ext"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id = Column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True, index=True)
    kind = Column(String(20), nullable=False, server_default="video")  # video|audio|image|document
    provider = Column(String(20), nullable=False, server_default="native")
    external_id = Column(String(255), nullable=True)
    lang = Column(String(5), nullable=True)
    url = Column(String(1000), nullable=False)
    downloadable = Column(Boolean, nullable=False, server_default="true")
    sha256 = Column(String(64), nullable=True)
    size = Column(BigInteger, nullable=True)  # bytes
    mime = Column(String(100), nullable=True)
    duration_sec = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class ExternalCourse(Base):
    """Catalogue entry discovered on an external platform (Moodle, YouTube
    playlist...). `course_id` links it to the native course once imported."""

    __tablename__ = "external_courses"
    __table_args__ = (UniqueConstraint("source", "external_id", name="uq_external_courses_source_external_id"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(30), nullable=False)
    external_id = Column(String(255), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String(1000), nullable=True)
    provider_name = Column(String(255), nullable=True)
    thumbnail_url = Column(String(1000), nullable=True)
    language = Column(String(10), nullable=True)
    duration_min = Column(Integer, nullable=True)
    rating = Column(Float, nullable=True)
    skills = Column(JSONB, nullable=True)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    fetched_at = Column(DateTime(timezone=True), nullable=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
