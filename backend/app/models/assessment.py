from sqlalchemy import Column, String, ForeignKey, Integer, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
from app.database import Base


class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=True)
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"), nullable=True)
    skill_name = Column(String(255), nullable=True)  # primary skill this assessment certifies
    total_questions = Column(Integer, default=25)
    duration_minutes = Column(Integer, default=45)
    passing_score = Column(Integer, default=60)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class AssessmentResult(Base):
    __tablename__ = "assessment_results"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("assessments.id"))
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    score = Column(Integer, nullable=False)
    passed = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    feedback = Column(Text, nullable=True)
