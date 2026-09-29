from sqlalchemy import Column, String, DateTime, ForeignKey, Time, Date, Text, UniqueConstraint
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
    # Structured times (backfilled from the legacy `time_slot` string). Local
    # wall-clock time of the institution (IST); `time_slot` stays for the web grid.
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class TimetableException(Base):
    """A one-off change to a recurring slot on a specific date.
    status: cancelled|moved. For `moved`, new_room/new_start_time/new_end_time
    override the slot's values that day."""

    __tablename__ = "timetable_exceptions"
    __table_args__ = (UniqueConstraint("slot_id", "date", name="uq_timetable_exception_slot_date"),)
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slot_id = Column(UUID(as_uuid=True), ForeignKey("timetable_slots.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    new_room = Column(String(100), nullable=True)
    new_start_time = Column(Time, nullable=True)
    new_end_time = Column(Time, nullable=True)
    note = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
