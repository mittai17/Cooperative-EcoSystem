"""Platform-wide admin settings as a key/value table. One row per settings
section (general, appearance, notifications, security); `value` holds that
section's fields as JSONB so new fields need no migration."""
from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from datetime import datetime, timezone
from app.database import Base


class PlatformSetting(Base):
    __tablename__ = "platform_settings"
    key = Column(String(100), primary_key=True)
    value = Column(JSONB, nullable=False, server_default="{}")
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
