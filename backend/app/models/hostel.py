from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, Date
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base


class HostelBlock(Base):
    __tablename__ = "hostel_blocks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    code = Column(String(10), nullable=False)
    name = Column(String(255), nullable=False)
    kind = Column(String(20), nullable=False)
    floors = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class HostelRoom(Base):
    __tablename__ = "hostel_rooms"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    block_id = Column(UUID(as_uuid=True), ForeignKey("hostel_blocks.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(20), nullable=False, unique=True)
    floor = Column(Integer, nullable=False)
    capacity = Column(Integer, default=2)
    status = Column(String(20), default="vacant")
    occupant_trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    # Denormalized occupant snapshot (same convention as Certificate) so the
    # room tile renders without joining users/programmes for every cell.
    occupant_name = Column(String(255), nullable=True)
    occupant_programme = Column(String(255), nullable=True)
    check_in = Column(Date, nullable=True)
    check_out = Column(Date, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class HostelWaitlistEntry(Base):
    __tablename__ = "hostel_waitlist_entries"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name = Column(String(255), nullable=False)
    programme = Column(String(255), nullable=True)
    applied_on = Column(Date, nullable=False)
    preference = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class HostelRequest(Base):
    """A trainee's own request for a hostel stay. Approval flows through the
    existing waitlist/allocate mechanics; `waitlist_entry_id` / `room_id` link
    the request to them. status: pending|waitlisted|allocated|cancelled|rejected."""

    __tablename__ = "hostel_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True, index=True)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id", ondelete="SET NULL"), nullable=True)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    from_date = Column(Date, nullable=True)
    to_date = Column(Date, nullable=True)
    preference = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, server_default="pending")
    waitlist_entry_id = Column(UUID(as_uuid=True), ForeignKey("hostel_waitlist_entries.id", ondelete="SET NULL"), nullable=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("hostel_rooms.id", ondelete="SET NULL"), nullable=True)
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decision_note = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
