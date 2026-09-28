from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base


class TimetableSlot(Base):
    """A single weekly-recurring class slot on an institution's timetable.

    Denormalized `title`/`trainer_name` snapshot fields (same convention as
    Certificate) so the grid renders without joining programme/batch/user
    for every cell, while the FK columns keep the row traceable to real
    programme/batch/trainer records.
    """

    __tablename__ = "timetable_slots"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"), nullable=True)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"), nullable=True)
    trainer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    day_of_week = Column(String(20), nullable=False)
    time_slot = Column(String(20), nullable=False)
    title = Column(String(255), nullable=False)
    room = Column(String(100), nullable=True)
    trainer_name = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
