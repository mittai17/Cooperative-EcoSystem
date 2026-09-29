from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Boolean, Float, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base

class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_name = Column(String(255), nullable=True)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"), nullable=True)
    qr_token = Column(String(255), nullable=False)
    valid_minutes = Column(Integer, default=30)
    # Additive, nullable. Sessions with opens_at/closes_at enforce the window;
    # legacy rows (NULL) keep the valid_minutes-from-created_at behaviour.
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    timetable_slot_id = Column(UUID(as_uuid=True), ForeignKey("timetable_slots.id", ondelete="SET NULL"), nullable=True)
    opens_at = Column(DateTime(timezone=True), nullable=True)
    closes_at = Column(DateTime(timezone=True), nullable=True)
    allowed_methods = Column(JSONB, nullable=True)  # e.g. ["qr","nfc","face"]
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    room = Column(String(100), nullable=True)
    qr_secret = Column(String(64), nullable=True)  # per-session HMAC key for rotating QR tokens
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (UniqueConstraint("session_id", "trainee_id", name="uq_attendance_session_trainee"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id"))
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    marked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    method = Column(String(50), default="qr")
    status = Column(String(50), default="present")
    # Additive, nullable
    confidence = Column(Float, nullable=True)          # face match score
    client_id = Column(String(64), nullable=True)      # offline-outbox idempotency key
    offline = Column(Boolean, nullable=False, server_default="false")
    needs_review = Column(Boolean, nullable=False, server_default="false")
    captured_at = Column(DateTime(timezone=True), nullable=True)  # device time of an offline scan
    override_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    override_reason = Column(Text, nullable=True)



class AttendanceRecordDedupArchive(Base):
    """Rows removed from attendance_records when the (session_id, trainee_id)
    unique constraint was introduced (earliest mark kept). Kept so nothing is
    lost; the migration downgrade restores them."""

    __tablename__ = "attendance_records_dedup_archive"
    id = Column(UUID(as_uuid=True), primary_key=True)
    session_id = Column(UUID(as_uuid=True), nullable=True)
    trainee_id = Column(UUID(as_uuid=True), nullable=True)
    marked_at = Column(DateTime(timezone=True), nullable=True)
    method = Column(String(50), nullable=True)
    status = Column(String(50), nullable=True)
    archived_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
