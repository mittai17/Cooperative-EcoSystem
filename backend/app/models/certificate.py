from sqlalchemy import Column, String, ForeignKey, DateTime, Text
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
    # Integrity + revocation (additive, nullable). content_hash is an HMAC-SHA256
    # over the canonical snapshot fields, recomputed on verify.
    content_hash = Column(String(64), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class CertificateVerification(Base):
    """Audit log of public verification lookups. `ip_hash` is a salted hash
    (never the raw IP). result: valid|revoked|expired|integrity_failed|not_found."""

    __tablename__ = "certificate_verifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    certificate_id = Column(UUID(as_uuid=True), ForeignKey("certificates.id", ondelete="SET NULL"), nullable=True)
    code = Column(String(255), nullable=False, index=True)
    result = Column(String(20), nullable=True)
    ip_hash = Column(String(64), nullable=True)
    verified_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
