from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
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
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("attendance_sessions.id"))
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    marked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    method = Column(String(50), default="qr")
    status = Column(String(50), default="present")

