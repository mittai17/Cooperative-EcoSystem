"""Certificate identifiers and canonical HMAC integrity checks."""
import hashlib
import hmac
import json
import secrets
import string
from datetime import datetime, timezone

from app.config import get_settings


def generate_verification_code() -> str:
    suffix = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(12))
    return f"CST-{datetime.now(timezone.utc).year}-{suffix}"


def _iso(value):
    if value is None:
        return None
    return value.astimezone(timezone.utc).isoformat() if value.tzinfo else value.replace(tzinfo=timezone.utc).isoformat()


def canonical_certificate(cert) -> bytes:
    fields = {
        "id": str(cert.id), "trainee_id": str(cert.trainee_id), "programme_id": str(cert.programme_id),
        "verification_code": cert.verification_code, "holder_name": cert.holder_name,
        "programme_title": cert.programme_title, "issuer": cert.issuer,
        "issue_date": _iso(cert.issue_date), "expiry_date": _iso(cert.expiry_date),
        "grade": cert.grade, "skills_certified": cert.skills_certified or [],
    }
    return json.dumps(fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def certificate_digest(cert) -> str:
    secret = get_settings().certificate_signing_secret
    if not secret:
        raise RuntimeError("CERTIFICATE_SIGNING_SECRET is required for certificate issuance and verification")
    return hmac.new(secret.encode(), canonical_certificate(cert), hashlib.sha256).hexdigest()


def certificate_integrity(cert) -> bool:
    return bool(cert.content_hash and hmac.compare_digest(cert.content_hash, certificate_digest(cert)))
