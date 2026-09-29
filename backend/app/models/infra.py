"""Cross-cutting platform tables: integration quota usage, AI response cache,
synthesized speech cache and offline-sync idempotency receipts."""
from sqlalchemy import BigInteger, Column, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid
from datetime import datetime, timezone
from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class IntegrationUsage(Base):
    """Per-integration, per-day call counters (quota guard / admin status)."""

    __tablename__ = "integration_usage"
    __table_args__ = (UniqueConstraint("integration", "day", name="uq_integration_usage_day"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    integration = Column(String(30), nullable=False)
    day = Column(Date, nullable=False)
    calls = Column(Integer, nullable=False, server_default="0")
    errors = Column(Integer, nullable=False, server_default="0")
    last_error = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class AiCache(Base):
    """Cache of deterministic AI results (translations, TTS text, summaries).
    `cache_key` is a hash of (kind, model, lang, input)."""

    __tablename__ = "ai_cache"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cache_key = Column(String(128), nullable=False, unique=True)
    kind = Column(String(30), nullable=False)
    model = Column(String(100), nullable=True)
    lang = Column(String(5), nullable=True)
    response = Column(JSONB, nullable=True)
    hits = Column(Integer, nullable=False, server_default="0")
    created_at = Column(DateTime(timezone=True), default=_now)
    expires_at = Column(DateTime(timezone=True), nullable=True)


class TtsAudio(Base):
    """Synthesized speech for a text+language+voice (Bhashini TTS)."""

    __tablename__ = "tts_audio"
    __table_args__ = (UniqueConstraint("text_hash", "lang", "voice", name="uq_tts_audio_text_lang_voice"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text_hash = Column(String(64), nullable=False)
    lang = Column(String(5), nullable=False)
    voice = Column(String(50), nullable=False, server_default="default")
    provider = Column(String(30), nullable=False, server_default="bhashini_tts")
    media_asset_id = Column(UUID(as_uuid=True), ForeignKey("media_assets.id", ondelete="SET NULL"), nullable=True)
    url = Column(String(1000), nullable=True)
    mime = Column(String(100), nullable=True)
    size = Column(BigInteger, nullable=True)
    duration_sec = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class SyncReceipt(Base):
    """Idempotency record for one offline-outbox item. status: applied|
    duplicate|conflict|rejected. `response` stores the original result so a
    replay returns the same answer."""

    __tablename__ = "sync_receipts"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(String(64), nullable=False, unique=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    reason = Column(Text, nullable=True)
    response = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
