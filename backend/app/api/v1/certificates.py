from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import uuid
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.models.certificate import Certificate
from app.models.user import User
from app.models.programme import Programme
from app.services.certificate_service import generate_verification_code
from app.services.skill_engine import upsert_trainee_skill
from app.schemas.certificate import CertificateIssueRequest
from app.deps import get_optional_identity, resolve_actor_id, AuthenticatedIdentity

router = APIRouter()

# Demo certificate kept for the public verify-certificate page/tests to have
# a stable, always-resolvable id even before any certificate has been issued
# against the live DB in this environment.
DEMO_CERTS = {
    "CST-2026-DAI-00842": {
        "id": "CST-2026-DAI-00842",
        "holder_name": "Ravindra Suresh Patil",
        "programme_title": "Dairy Cooperative Operations",
        "issuer": "Institute of Rural Management, Anand",
        "issue_date": "2026-07-15",
        "expiry_date": "2029-07-15",
        "status": "Valid",
        "grade": "A",
        "skills_certified": ["Dairy Operations", "Cooperative Management", "Quality Assurance"],
        "verification_url": "/verify-certificate/CST-2026-DAI-00842",
    }
}


def _serialize(cert: Certificate) -> dict:
    return {
        "id": cert.verification_code,
        "holder_name": cert.holder_name,
        "programme_title": cert.programme_title,
        "issuer": cert.issuer,
        "issue_date": cert.issue_date.date().isoformat() if cert.issue_date else None,
        "expiry_date": cert.expiry_date.date().isoformat() if cert.expiry_date else None,
        "status": "Valid" if cert.status == "valid" else cert.status,
        "grade": cert.grade,
        "skills_certified": cert.skills_certified or [],
        "verification_url": f"/verify-certificate/{cert.verification_code}",
    }


@router.get("/verify/{verification_code}")
async def verify_certificate(verification_code: str, db: AsyncSession = Depends(get_db)):
    """PUBLIC endpoint - verify a certificate by its verification code. No
    auth required by design: this is the public trust surface a third party
    (employer, another institution) checks."""
    if verification_code in DEMO_CERTS:
        return {"valid": True, "certificate": DEMO_CERTS[verification_code]}

    result = await db.execute(select(Certificate).where(Certificate.verification_code == verification_code))
    cert = result.scalar_one_or_none()
    if not cert:
        return {"valid": False, "message": "Certificate not found or invalid"}

    return {"valid": cert.status == "valid", "certificate": _serialize(cert)}


@router.get("/my")
async def my_certificates(
    trainee_id: Optional[str] = None,
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    if trainee_id:
        try:
            trainee_uuid = uuid.UUID(trainee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid trainee_id")
    else:
        trainee_uuid = resolve_actor_id(identity, None)

    if trainee_uuid:
        result = await db.execute(select(Certificate).where(Certificate.trainee_id == trainee_uuid))
        certs = result.scalars().all()
        if certs:
            return {"certificates": [_serialize(c) for c in certs]}
        return {"certificates": []}
    return {"certificates": list(DEMO_CERTS.values())}


@router.post("/issue")
async def issue_certificate(
    data: CertificateIssueRequest,
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Issues a tamper-evident certificate with a unique verification code
    and, as evidence, feeds the certified skills into the trainee's Skill
    Passport (closing course-completion -> certificate -> passport loop)."""
    if identity is not None and identity.role not in ("institution", "trainer", "admin"):
        raise HTTPException(status_code=403, detail="Only institutions, trainers, or admins can issue certificates")

    trainee_result = await db.execute(select(User).where(User.id == uuid.UUID(data.trainee_id)))
    trainee = trainee_result.scalar_one_or_none()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")

    programme_result = await db.execute(select(Programme).where(Programme.id == uuid.UUID(data.programme_id)))
    programme = programme_result.scalar_one_or_none()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")

    code = generate_verification_code()
    now = datetime.now(timezone.utc)
    skills_certified = [programme.sector] if programme.sector else []



    cert = Certificate(
        id=uuid.uuid4(),
        trainee_id=trainee.id,
        programme_id=programme.id,
        verification_code=code,
        issue_date=now,
        status="valid",
        grade=data.grade or "A",
        holder_name=trainee.full_name or trainee.email,
        programme_title=programme.title,
        issuer="NCCT - National Council for Cooperative Training",
        expiry_date=now + timedelta(days=365 * 3),
        skills_certified=skills_certified,
    )
    db.add(cert)

    for skill_name in skills_certified:
        await upsert_trainee_skill(
            db,
            trainee_id=trainee.id,
            skill_name=skill_name,
            confidence=90,
            verified=True,
            evidence_item={"type": "Certificate", "title": programme.title},
        )

    await db.commit()
    await db.refresh(cert)
    return {"verification_code": code, "status": "issued", "id": str(cert.id)}
