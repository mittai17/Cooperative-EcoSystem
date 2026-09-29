"""Signed certificate issuance, eligibility, revocation and public verification."""
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import uuid

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.deps import (
    assert_org_access, require_roles, require_user,
    get_optional_identity, AuthenticatedIdentity, anonymous_actor_uuid,
)
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.certificate import Certificate, CertificateVerification
from app.models.course import CourseEnrollment
from app.models.programme import Batch, Enrollment, Programme, ProgrammeCourse
from app.models.user import User
from app.schemas.certificate import CertificateIssueRequest
from app.services.certificate_service import certificate_digest, certificate_integrity, generate_verification_code
from app.services.notifications import notify
from app.services.skill_engine import upsert_trainee_skill

router = APIRouter()
ISSUER = "NCCT - National Council for Cooperative Training"


def _integrity(cert: Certificate) -> bool:
    return bool(get_settings().certificate_signing_secret) and certificate_integrity(cert)


def _uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, TypeError):
        raise HTTPException(422, "Invalid identifier")


def _utc(value):
    return value if value is None or value.tzinfo else value.replace(tzinfo=timezone.utc)


def _status(cert: Certificate) -> str:
    if cert.revoked_at or cert.status == "revoked":
        return "revoked"
    if cert.expiry_date and _utc(cert.expiry_date) <= datetime.now(timezone.utc):
        return "expired"
    return "valid"


def _serialize(cert: Certificate) -> dict:
    return {
        "id": cert.verification_code, "holder_name": cert.holder_name,
        "programme_title": cert.programme_title, "issuer": cert.issuer,
        "issue_date": cert.issue_date.date().isoformat() if cert.issue_date else None,
        "expiry_date": cert.expiry_date.date().isoformat() if cert.expiry_date else None,
        "status": _status(cert), "grade": cert.grade,
        "skills_certified": cert.skills_certified or [],
        "verification_url": f"/verify-certificate/{cert.verification_code}",
        "revoked_reason": cert.revoked_reason if cert.revoked_at else None,
    }


@router.get("/verify/{verification_code}")
async def verify_certificate(verification_code: str, request: Request, db: AsyncSession = Depends(get_db)):
    cert = (await db.execute(select(Certificate).where(Certificate.verification_code == verification_code))).scalar_one_or_none()
    if cert is None:
        result, integrity, status = "not_found", "failed", "not_found"
    else:
        integrity = "ok" if _integrity(cert) else "failed"
        status = _status(cert) if integrity == "ok" else "integrity_failed"
        result = status
    secret = get_settings().certificate_signing_secret
    ip = request.client.host if request.client else ""
    ip_hash = hmac.new(secret.encode(), ip.encode(), hashlib.sha256).hexdigest() if secret and ip else None
    db.add(CertificateVerification(id=uuid.uuid4(), certificate_id=cert.id if cert else None,
                                   code=verification_code, result=result, ip_hash=ip_hash))
    await db.commit()
    return {"valid": status == "valid", "status": status, "integrity": integrity,
            "certificate": _serialize(cert) if cert and integrity == "ok" else None,
            "message": "Certificate not found or invalid" if cert is None else None}


@router.get("/my")
async def my_certificates(
    trainee_id: Optional[str] = None,
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Return certificates for the authenticated trainee.

    Token wins over explicit trainee_id (security).  When unauthenticated,
    falls back to the anonymous-actor pattern (ALLOW_ANONYMOUS_ACTOR must be
    enabled; in production this returns [] without a valid token).
    """
    from app.deps import resolve_actor_id
    if identity is not None and identity.db_user is not None:
        actor_id = identity.db_user.id
    else:
        # Legacy/test compat: trainee_id param without a token. Returns [] when
        # anonymous-actor is disabled (production default).
        anon_id = anonymous_actor_uuid(trainee_id, raise_if_disabled=False)
        if anon_id is None:
            return {"certificates": []}
        actor_id = anon_id
    certs = (await db.execute(select(Certificate).where(Certificate.trainee_id == actor_id))).scalars().all()
    return {"certificates": [{**_serialize(c), "integrity": "ok" if _integrity(c) else "failed"} for c in certs]}


async def _eligibility(db: AsyncSession, programme: Programme, batch: Batch, trainee: User) -> dict:
    enrolled = (await db.execute(select(Enrollment.id).where(
        Enrollment.trainee_id == trainee.id, Enrollment.batch_id == batch.id,
        Enrollment.status == "active"))).first() is not None
    sessions = (await db.execute(select(AttendanceSession.id).where(
        AttendanceSession.batch_id == batch.id))).scalars().all()
    present = 0
    if sessions:
        present = (await db.execute(select(func.count(AttendanceRecord.id)).where(
            AttendanceRecord.session_id.in_(sessions), AttendanceRecord.trainee_id == trainee.id,
            AttendanceRecord.status == "present"))).scalar_one()
    attendance_pct = round(100 * present / len(sessions)) if sessions else 0
    minimum = batch.min_attendance_pct if batch.min_attendance_pct is not None else 75
    required = (await db.execute(select(ProgrammeCourse.course_id).where(
        ProgrammeCourse.programme_id == programme.id, ProgrammeCourse.is_mandatory.is_(True)))).scalars().all()
    completed = (await db.execute(select(CourseEnrollment.course_id).where(
        CourseEnrollment.trainee_id == trainee.id, CourseEnrollment.course_id.in_(required),
        or_(CourseEnrollment.status == "completed", CourseEnrollment.progress >= 100)))).scalars().all() if required else []
    assessments = (await db.execute(select(Assessment.id).where(
        or_(Assessment.programme_id == programme.id,
            Assessment.course_id.in_(required))))).scalars().all()
    passed = (await db.execute(select(AssessmentAttempt.assessment_id).where(
        AssessmentAttempt.trainee_id == trainee.id, AssessmentAttempt.assessment_id.in_(assessments),
        AssessmentAttempt.passed.is_(True)))).scalars().all() if assessments else []
    existing = (await db.execute(select(Certificate.id).where(
        Certificate.trainee_id == trainee.id, Certificate.programme_id == programme.id,
        Certificate.revoked_at.is_(None)))).first() is not None
    checks = {"enrolled": enrolled, "attendance": attendance_pct >= minimum,
              "courses": set(required) <= set(completed), "assessments": set(assessments) <= set(passed),
              "not_already_issued": not existing}
    return {"trainee_id": str(trainee.id), "trainee_name": trainee.full_name or trainee.email,
            "attendance_pct": attendance_pct, "min_attendance_pct": minimum,
            "mandatory_courses_completed": len(set(required) & set(completed)),
            "mandatory_courses_total": len(required), "assessments_passed": len(set(assessments) & set(passed)),
            "assessments_total": len(assessments), "checks": checks, "eligible": all(checks.values())}


async def _programme_batch(db, programme_id: str, batch_id: str, issuer: User):
    programme = await db.get(Programme, _uuid(programme_id))
    batch = await db.get(Batch, _uuid(batch_id))
    if not programme or not batch or batch.programme_id != programme.id:
        raise HTTPException(404, "Programme or batch not found")
    assert_org_access(issuer, programme.organisation_id)
    return programme, batch


@router.get("/eligibility")
async def eligibility(programme_id: str, batch_id: str,
                      issuer: User = Depends(require_roles("institution", "trainer", "admin")),
                      db: AsyncSession = Depends(get_db)):
    programme, batch = await _programme_batch(db, programme_id, batch_id, issuer)
    trainee_ids = (await db.execute(select(Enrollment.trainee_id).where(
        Enrollment.batch_id == batch.id, Enrollment.status == "active"))).scalars().all()
    trainees = (await db.execute(select(User).where(User.id.in_(trainee_ids)))).scalars().all() if trainee_ids else []
    return {"programme_id": programme_id, "batch_id": batch_id,
            "trainees": [await _eligibility(db, programme, batch, trainee) for trainee in trainees]}


async def _issue(db: AsyncSession, trainee: User, programme: Programme, grade: str) -> Certificate:
    if not get_settings().certificate_signing_secret:
        raise HTTPException(503, "Certificate signing is not configured")
    now = datetime.now(timezone.utc)
    cert = Certificate(id=uuid.uuid4(), trainee_id=trainee.id, programme_id=programme.id,
                       verification_code=generate_verification_code(), issue_date=now, status="valid",
                       grade=grade, holder_name=trainee.full_name or trainee.email,
                       programme_title=programme.title, issuer=ISSUER,
                       expiry_date=now + timedelta(days=365 * 3),
                       skills_certified=[programme.sector] if programme.sector else [])
    cert.content_hash = certificate_digest(cert)
    db.add(cert)
    for skill_name in cert.skills_certified:
        await upsert_trainee_skill(db, trainee_id=trainee.id, skill_name=skill_name, confidence=90,
                                   verified=True, evidence_item={"type": "Certificate", "title": programme.title})
    await notify(db, trainee.id, "certificate_issued", {"code": cert.verification_code, "programme": programme.title})
    return cert


@router.post("/issue")
async def issue_certificate(data: CertificateIssueRequest,
                            force: bool = False,
                            issuer: User = Depends(require_roles("institution", "trainer", "admin")),
                            db: AsyncSession = Depends(get_db)):
    from app.config import get_settings as _gs
    trainee = await db.get(User, _uuid(data.trainee_id))
    programme = await db.get(Programme, _uuid(data.programme_id))
    if not trainee or not programme:
        raise HTTPException(404, "Trainee or programme not found")
    assert_org_access(issuer, programme.organisation_id)
    await db.execute(select(Programme.id).where(Programme.id == programme.id).with_for_update())
    eligible = False
    # In development/test mode, force=true bypasses the eligibility gate so E2E
    # scripts can test the full certificate issuance path without completing all
    # attendance, course and assessment prerequisites.
    if force and _gs().app_env in ("development", "test"):
        eligible = True
    else:
        batches = (await db.execute(select(Batch).join(Enrollment, Enrollment.batch_id == Batch.id).where(
            Batch.programme_id == programme.id, Enrollment.trainee_id == trainee.id,
            Enrollment.status == "active"))).scalars().all()
        for batch in batches:
            if (await _eligibility(db, programme, batch, trainee))["eligible"]:
                eligible = True
                break
    if not eligible:
        raise HTTPException(409, "Trainee is not eligible for certification")
    cert = await _issue(db, trainee, programme, data.grade or "A")
    await db.commit()
    return {"verification_code": cert.verification_code, "status": "issued", "id": str(cert.id)}


class BatchIssueRequest(BaseModel):
    programme_id: str
    batch_id: str
    trainee_ids: list[str] = Field(min_length=1)
    grade: str = "A"


@router.post("/issue-batch")
async def issue_batch(data: BatchIssueRequest,
                      issuer: User = Depends(require_roles("institution", "trainer", "admin")),
                      db: AsyncSession = Depends(get_db)):
    programme, batch = await _programme_batch(db, data.programme_id, data.batch_id, issuer)
    await db.execute(select(Programme.id).where(Programme.id == programme.id).with_for_update())
    issued, rejected = [], []
    for raw_id in dict.fromkeys(data.trainee_ids):
        trainee = await db.get(User, _uuid(raw_id))
        if trainee is None or not (await _eligibility(db, programme, batch, trainee))["eligible"]:
            rejected.append(raw_id)
            continue
        cert = await _issue(db, trainee, programme, data.grade)
        issued.append({"trainee_id": raw_id, "verification_code": cert.verification_code})
    await db.commit()
    return {"issued": issued, "rejected": rejected}


class RevokeRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=1000)


@router.post("/{verification_code}/revoke")
async def revoke_certificate(verification_code: str, data: RevokeRequest,
                             issuer: User = Depends(require_roles("institution", "admin")),
                             db: AsyncSession = Depends(get_db)):
    cert = (await db.execute(select(Certificate).where(Certificate.verification_code == verification_code))).scalar_one_or_none()
    if cert is None:
        raise HTTPException(404, "Certificate not found")
    programme = await db.get(Programme, cert.programme_id)
    assert_org_access(issuer, programme.organisation_id if programme else None)
    if cert.revoked_at:
        raise HTTPException(409, "Certificate already revoked")
    cert.revoked_at, cert.revoked_reason, cert.status = datetime.now(timezone.utc), data.reason, "revoked"
    await db.commit()
    return {"verification_code": verification_code, "status": "revoked"}


@router.get("/issuer/verifications")
async def issuer_verifications(issuer: User = Depends(require_roles("institution", "trainer", "admin")),
                               db: AsyncSession = Depends(get_db)):
    query = select(CertificateVerification.result, func.count(CertificateVerification.id)).join(
        Certificate, Certificate.id == CertificateVerification.certificate_id).join(
        Programme, Programme.id == Certificate.programme_id)
    if issuer.role != "admin":
        if issuer.organisation_id is None:
            raise HTTPException(403, "Organisation required")
        query = query.where(Programme.organisation_id == issuer.organisation_id)
    rows = (await db.execute(query.group_by(CertificateVerification.result))).all()
    return {"counts": {result: count for result, count in rows}}
