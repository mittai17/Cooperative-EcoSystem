"""Employer dashboard, talent search, and candidate passport views."""
from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import org_scope, require_roles
from app.models.certificate import Certificate
from app.models.job import Application, Job, JobMatch
from app.models.profile import UserProfile
from app.models.skill import Skill, TraineeSkill
from app.models.user import User
from app.services.certificate_service import certificate_integrity
from app.api.v1.jobs import ApplicationEdit, update_application

router = APIRouter()


def _certificate_state(cert: Certificate) -> str:
    if cert.revoked_at:
        return "revoked"
    if cert.expiry_date and cert.expiry_date.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return "expired"
    try:
        return "valid" if certificate_integrity(cert) else "integrity_failed"
    except RuntimeError:
        return "unverified"


@router.get("/overview")
async def employer_overview(db: AsyncSession = Depends(get_db),
                            user: User = Depends(require_roles("employer", "admin"))):
    scope = org_scope(user)
    jobs = select(Job.id).where(Job.source == "employer")
    if scope is not None:
        jobs = jobs.where(Job.organisation_id == scope)
    job_ids = jobs.subquery()
    counts = (await db.execute(select(Application.status, func.count(Application.id))
        .where(Application.job_id.in_(select(job_ids.c.id)))
        .group_by(Application.status))).all()
    funnel = {status: count for status, count in counts}
    open_jobs = (await db.execute(select(func.count(Job.id)).where(
        Job.id.in_(select(job_ids.c.id)), Job.status == "open"))).scalar_one()
    return {"open_jobs": open_jobs, "new_applicants": funnel.get("applied", 0),
            "shortlisted": funnel.get("shortlisted", 0), "hires": funnel.get("hired", 0),
            "funnel": funnel}


@router.get("/candidates")
async def search_candidates(skill: Optional[str] = None, location: Optional[str] = None,
                            min_match: Optional[int] = Query(None, ge=0, le=100),
                            verified_only: bool = False, q: Optional[str] = None,
                            job_id: Optional[uuid.UUID] = None,
                            limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0),
                            db: AsyncSession = Depends(get_db),
                            user: User = Depends(require_roles("employer", "admin"))):
    if job_id is not None:
        job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
        if job is None:
            raise HTTPException(status_code=404, detail="Job not found")
        from app.deps import assert_org_access
        assert_org_access(user, job.organisation_id)
    elif min_match is not None:
        raise HTTPException(status_code=422, detail="job_id is required with min_match")
    query = select(User, UserProfile, JobMatch).join(UserProfile, UserProfile.user_id == User.id)
    if job_id is None:
        query = query.outerjoin(JobMatch, and_(JobMatch.trainee_id == User.id, JobMatch.job_id.is_(None)))
    else:
        query = query.outerjoin(JobMatch, and_(JobMatch.trainee_id == User.id, JobMatch.job_id == job_id))
    query = query.where(User.role == "trainee", User.is_active.is_(True), UserProfile.visible_to_employers.is_(True))
    if q:
        query = query.where(User.full_name.ilike(f"%{q}%"))
    if location:
        query = query.where(or_(UserProfile.state.ilike(f"%{location}%"),
                                UserProfile.district.ilike(f"%{location}%")))
    if skill:
        query = query.where(User.id.in_(select(TraineeSkill.trainee_id)
            .join(Skill, Skill.id == TraineeSkill.skill_id).where(Skill.name.ilike(f"%{skill}%"))))
    if verified_only:
        query = query.where(User.id.in_(select(TraineeSkill.trainee_id)
            .where(TraineeSkill.verified.is_(True))))
    if min_match is not None:
        query = query.where(JobMatch.match_score >= min_match)
    rows = (await db.execute(query.order_by(User.full_name).offset(offset).limit(limit))).all()
    seen = set()
    candidates = []
    for trainee, profile, match in rows:
        if trainee.id in seen:
            continue
        seen.add(trainee.id)
        candidates.append({"id": str(trainee.id), "name": trainee.full_name,
                           "location": ", ".join(v for v in (profile.district, profile.state) if v),
                           "occupation": profile.occupation,
                           "match_score": match.match_score if match else None})
    return {"candidates": candidates}


@router.get("/candidates/{trainee_id}")
async def get_candidate(trainee_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                        user: User = Depends(require_roles("employer", "admin"))):
    row = (await db.execute(select(User, UserProfile).join(UserProfile, UserProfile.user_id == User.id)
                            .where(User.id == trainee_id, User.role == "trainee"))).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Candidate not found")
    trainee, profile = row
    scope = org_scope(user)
    application_query = select(Application.id).join(Job, Job.id == Application.job_id).where(
        Application.applicant_id == trainee_id)
    if scope is not None:
        application_query = application_query.where(Job.organisation_id == scope)
    has_applied = (await db.execute(application_query.limit(1))).scalar_one_or_none() is not None
    if not profile.visible_to_employers and not has_applied:
        raise HTTPException(status_code=403, detail="Candidate is not visible to this employer")
    skills = (await db.execute(select(TraineeSkill, Skill).join(Skill, Skill.id == TraineeSkill.skill_id)
                               .where(TraineeSkill.trainee_id == trainee_id))).all()
    certificates = (await db.execute(select(Certificate).where(Certificate.trainee_id == trainee_id))).scalars().all()
    result = {"id": str(trainee.id), "name": trainee.full_name, "bio": profile.bio,
              "location": ", ".join(v for v in (profile.district, profile.state) if v),
              "occupation": profile.occupation, "education_level": profile.education_level,
              "years_of_experience": profile.years_of_experience,
              "skills": [{"name": skill.name, "level": row.level,
                          "confidence": row.confidence, "verified": row.verified} for row, skill in skills],
              "certificates": [{"id": str(cert.id), "programme_title": cert.programme_title,
                                "verification_code": cert.verification_code,
                                "verification_state": _certificate_state(cert)} for cert in certificates]}
    if has_applied:
        result["email"] = trainee.email
        result["phone"] = profile.phone
    return result


@router.patch("/applications/{application_id}")
async def transition_application(application_id: uuid.UUID, data: ApplicationEdit,
                                 db: AsyncSession = Depends(get_db),
                                 user: User = Depends(require_roles("employer", "admin"))):
    return await update_application(application_id, data, db, user)
