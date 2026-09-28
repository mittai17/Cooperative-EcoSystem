from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base
class SkillDemand(Base):
    __tablename__ = "skill_demand"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skill_name = Column(String(255))
    employer_demand_count = Column(Integer)
    trained_count = Column(Integer)
    gap_count = Column(Integer)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
