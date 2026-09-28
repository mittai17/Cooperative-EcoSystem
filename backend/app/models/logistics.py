from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base


class LogisticsTask(Base):
    __tablename__ = "logistics_tasks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"), nullable=True)
    # Denormalized programme snapshot (same convention as Certificate) so the
    # checklist renders without joining programmes for every row.
    programme = Column(String(255), nullable=True)
    programme_code = Column(String(10), nullable=True)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"), nullable=True)
    batch_code = Column(String(150), nullable=True)
    category = Column(String(30), nullable=False)
    title = Column(Text, nullable=False)
    due_date = Column(Date, nullable=False)
    owner = Column(String(255), nullable=False)
    done = Column(Boolean, default=False)
    estimated_cost = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class VehicleAllocation(Base):
    __tablename__ = "vehicle_allocations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True)
    batch_id = Column(UUID(as_uuid=True), ForeignKey("batches.id"), nullable=True)
    batch_code = Column(String(150), nullable=True)
    vehicle_no = Column(String(30), nullable=False)
    type = Column(String(30), nullable=False)
    seats = Column(Integer, default=0)
    route = Column(Text, nullable=True)
    pick_up_point = Column(Text, nullable=True)
    departure = Column(String(20), nullable=True)
    driver = Column(String(255), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    status = Column(String(30), default="Awaiting confirmation")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class LogisticsBudget(Base):
    """Single-row-per-institution contingency reserve held back from the
    sanctioned logistics budget. Allocated/spent/committed are always derived
    live from LogisticsTask rows; only the reserve headroom is stored."""

    __tablename__ = "logistics_budgets"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organisation_id = Column(UUID(as_uuid=True), ForeignKey("organisations.id"), nullable=True, unique=True)
    contingency_reserve = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
