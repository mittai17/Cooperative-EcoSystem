from pydantic import BaseModel
from typing import Optional, List


class CertificateIssueRequest(BaseModel):
    trainee_id: str
    programme_id: str
    grade: Optional[str] = "A"


class CertificateIssueResponse(BaseModel):
    verification_code: str
    status: str
    id: str


class CertificatePublic(BaseModel):
    """Shape matches the frontend's /verify-certificate/[id] page
    (apps/web/src/lib/mock-data/certificates.ts), read-only reference."""

    id: str
    holder_name: Optional[str] = None
    programme_title: Optional[str] = None
    issuer: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    status: Optional[str] = None
    grade: Optional[str] = None
    skills_certified: List[str] = []
    verification_url: Optional[str] = None


class CertificateVerifyResponse(BaseModel):
    valid: bool
    certificate: Optional[CertificatePublic] = None
    message: Optional[str] = None
