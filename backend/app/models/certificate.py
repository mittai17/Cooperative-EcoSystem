from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.database import Base


class Certificate(Base):
    __tablename__ = "certificates"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trainee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    programme_id = Column(UUID(as_uuid=True), ForeignKey("programmes.id"))
    verification_code = Column(String(255), unique=True)
    issue_date = Column(DateTime(timezone=True))
    status = Column(String(50))
    grade = Column(String(50))
    # Denormalized snapshot fields so /verify-certificate/[id] can render a
    # complete public record without joining trainee/programme by FK (and so
    # a certificate's public content is stable even if the trainee record or
    # programme title later changes).
    holder_name = Column(String(255), nullable=True)
    programme_title = Column(String(255), nullable=True)
    issuer = Column(String(255), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    skills_certified = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
