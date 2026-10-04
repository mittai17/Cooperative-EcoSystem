"""Employer dashboard, talent search, candidate passport and application views."""
from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import assert_org_access, org_scope, require_roles
from app.models.assessment import Assessment, AssessmentAttempt
from app.models.certificate import Certificate
from app.models.job import Application, Job, JobMatch
from app.models.profile import UserProfile
from app.models.skill import Skill, TraineeSkill
from app.models.user import User
from app.services.certificate_service import certificate_integrity
from app.services.employer_matching import DEFAULT_LEVEL, LEVEL_PROFICIENCY, CandidateFacts, JobFacts, score_candidate
from app.api.v1.employer_jobs import (
    _criteria_facts, _employer_job, _load_detail, _load_requirements, candidate_summary, load_candidate_facts,
)
from app.api.v1.jobs import ApplicationEdit, _TRANSITIONS, update_application

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


def _iso(value: Optional[datetime]) -> Optional[str]:
    return value.isoformat() if value else None


def _certificate_json(cert: Certificate) -> dict:
    return {"id": str(cert.id), "programme_title": cert.programme_title, "issuer": cert.issuer,
            "issue_date": _iso(cert.issue_date), "verification_code": cert.verification_code,
            "verification_state": _certificate_state(cert), "skills_certified": cert.skills_certified or []}


def _passport_skill(ts: TraineeSkill, skill: Skill) -> dict:
    return {"name": skill.name, "category": skill.category, "level": ts.level or DEFAULT_LEVEL,
            "proficiency": LEVEL_PROFICIENCY.get(ts.level or DEFAULT_LEVEL, LEVEL_PROFICIENCY[DEFAULT_LEVEL]),
            "confidence": ts.confidence, "verified": bool(ts.verified), "evidence": ts.evidence or [],
            "last_updated": _iso(ts.updated_at)}


def _ai_summary(name: str, facts: CandidateFacts) -> dict:
    """Templated summary built only from stored profile facts (no LLM)."""
    verified = sorted(s.name for s in facts.skills if s.verified)
    parts = [f"{len(facts.skills)} recorded skill(s)"]
    if verified:
        parts.append(f"{len(verified)} verified ({', '.join(verified[:3])})")
    parts.append(f"{sum(1 for c in facts.certificates if c.valid)} valid certificate(s)")
    if facts.years_of_experience is not None:
        parts.append(f"{facts.years_of_experience} year(s) of experience")
    if facts.education_level:
        parts.append(f"education recorded as {facts.education_level}")
    return {"text": f"{name}: " + ", ".join(parts) + ".", "generated_at": datetime.now(timezone.utc).isoformat()}


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
    rows = (await db.execute(query.order_by(User.full_name, User.id).offset(offset).limit(limit))).all()
    seen = set()
    page = []
    for trainee, profile, match in rows:
        if trainee.id in seen:
            continue
        seen.add(trainee.id)
        page.append((trainee, profile, match))
    facts = await load_candidate_facts(db, {trainee.id: profile for trainee, profile, _ in page})
    candidates = [candidate_summary(trainee, profile, facts[trainee.id],
                                    match.match_score if match else None)
                  for trainee, profile, match in page]
    return {"candidates": candidates}


@router.get("/candidates/{trainee_id}")
async def get_candidate(trainee_id: uuid.UUID,
                        job_id: Optional[uuid.UUID] = Query(None, description="Include the match breakdown for this job"),
                        db: AsyncSession = Depends(get_db),
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
    job = await _employer_job(db, job_id, user) if job_id is not None else None

    skill_rows = (await db.execute(select(TraineeSkill, Skill).join(Skill, Skill.id == TraineeSkill.skill_id)
                                   .where(TraineeSkill.trainee_id == trainee_id).order_by(Skill.name))).all()
    certificates = (await db.execute(select(Certificate).where(Certificate.trainee_id == trainee_id)
                                     .order_by(Certificate.issue_date.desc().nullslast()))).scalars().all()
    attempts = (await db.execute(select(AssessmentAttempt, Assessment)
                                 .join(Assessment, Assessment.id == AssessmentAttempt.assessment_id)
                                 .where(AssessmentAttempt.trainee_id == trainee_id,
                                        AssessmentAttempt.status == "submitted")
                                 .order_by(AssessmentAttempt.submitted_at.desc().nullslast()))).all()
    app_query = (select(Application, Job).join(Job, Job.id == Application.job_id)
                 .where(Application.applicant_id == trainee_id))
    if scope is not None:
        app_query = app_query.where(Job.organisation_id == scope)
    app_rows = (await db.execute(app_query.order_by(Application.applied_at.desc().nullslast()))).all()

    facts = (await load_candidate_facts(db, {trainee.id: profile}))[trainee.id]
    result = {
        "id": str(trainee.id), "name": trainee.full_name, "bio": profile.bio,
        "location": ", ".join(v for v in (profile.district, profile.state) if v),
        "occupation": profile.occupation, "education_level": profile.education_level,
        "years_of_experience": profile.years_of_experience, "photo_url": profile.photo_url,
        "availability": None, "languages": None,
        "skills": [_passport_skill(ts, skill) for ts, skill in skill_rows],
        "certificates": [_certificate_json(cert) for cert in certificates],
        "assessments": [{"id": str(a.id), "title": assessment.title, "score": a.score,
                         "max_score": 100, "date": _iso(a.submitted_at), "passed": a.passed}
                        for a, assessment in attempts],
        # No source data exists yet for these: returned as null, shown as "Not available".
        "training": None, "projects": None, "experience": None,
        "applications": [{"id": str(app.id), "job_id": str(j.id), "job_title": j.title, "status": app.status,
                          "applied_at": _iso(app.applied_at), "match_score": None} for app, j in app_rows],
        "ai_summary": _ai_summary(trainee.full_name, facts),
        "match": None,
    }
    if job is not None:
        requirements = await _load_requirements(db, job.id)
        detail = await _load_detail(db, job.id)
        match = score_candidate(JobFacts(location=job.location), _criteria_facts(requirements, detail), facts)
        result["match"] = {"job_id": str(job.id), "job_title": job.title, **match}
    if has_applied:
        result["email"] = trainee.email
        result["phone"] = profile.phone
    return result


# ---------------------------------------------------------------- applications

async def _latest_matches(db: AsyncSession, pairs: list[tuple[uuid.UUID, uuid.UUID]]) -> dict:
    """Latest stored JobMatch per (job_id, trainee_id)."""
    if not pairs:
        return {}
    job_ids = list({job_id for job_id, _ in pairs})
    trainee_ids = list({trainee_id for _, trainee_id in pairs})
    rows = (await db.execute(select(JobMatch).where(JobMatch.job_id.in_(job_ids),
                                                    JobMatch.trainee_id.in_(trainee_ids))
                             .order_by(JobMatch.created_at.asc().nullsfirst()))).scalars().all()
    wanted = set(pairs)
    latest: dict = {}
    for row in rows:
        key = (row.job_id, row.trainee_id)
        if key in wanted:
            latest[key] = row  # ascending order: the last row seen is the most recent
    return latest


def _stored_skill_items(items: Optional[list]) -> list[dict]:
    """Stored match items are the scorer's shape; the applications UI reads {skill, status}."""
    out = []
    for item in items or []:
        if isinstance(item, dict):
            name = item.get("name") or item.get("skill")
            out.append({"skill": name, "status": item.get("status"), "confidence": item.get("confidence")})
        elif isinstance(item, str):
            out.append({"skill": item, "status": "missing"})
    return out


def _application_json(app: Application, job: Job, applicant: Optional[User], profile: Optional[UserProfile],
                      stored: Optional[JobMatch], verified_count: int) -> dict:
    return {
        "id": str(app.id), "trainee_id": str(app.applicant_id) if app.applicant_id else None,
        "name": applicant.full_name if applicant else None,
        "job_id": str(job.id), "job_title": job.title, "status": app.status,
        "applied_at": _iso(app.applied_at), "updated_at": _iso(app.updated_at),
        "interview_at": _iso(app.interview_at),
        "match_score": stored.match_score if stored else None,
        "photo_url": profile.photo_url if profile else None,
        "role": profile.occupation if profile else None,
        "location": ", ".join(v for v in (profile.district, profile.state) if v) if profile else None,
        "education_level": profile.education_level if profile else None,
        "matched_skills": _stored_skill_items(stored.matched_skills if stored else []),
        "missing_skills": _stored_skill_items(stored.missing_skills if stored else []),
        "verified_skill_count": verified_count,
    }


@router.get("/applications")
async def list_applications(job_id: Optional[uuid.UUID] = None,
                            status: Optional[str] = Query(None, max_length=50),
                            limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0),
                            db: AsyncSession = Depends(get_db),
                            user: User = Depends(require_roles("employer", "admin"))):
    if job_id is not None:
        await _employer_job(db, job_id, user)  # 404 for unknown, 403 for another organisation
    filters = [Job.source == "employer"]
    scope = org_scope(user)
    if scope is not None:
        filters.append(Job.organisation_id == scope)
    if job_id is not None:
        filters.append(Application.job_id == job_id)
    if status:
        filters.append(Application.status == status)
    base = (select(Application, Job, User, UserProfile)
            .join(Job, Job.id == Application.job_id)
            .outerjoin(User, User.id == Application.applicant_id)
            .outerjoin(UserProfile, UserProfile.user_id == Application.applicant_id)
            .where(and_(*filters)))
    total = (await db.execute(select(func.count()).select_from(
        select(Application.id).join(Job, Job.id == Application.job_id).where(and_(*filters)).subquery()))).scalar_one()
    rows = (await db.execute(base.order_by(Application.applied_at.desc().nullslast(), Application.id)
                             .offset(offset).limit(limit))).all()
    pairs = [(app.job_id, app.applicant_id) for app, _, _, _ in rows if app.applicant_id]
    matches = await _latest_matches(db, pairs)
    trainee_ids = list({app.applicant_id for app, _, _, _ in rows if app.applicant_id})
    verified = dict((await db.execute(select(TraineeSkill.trainee_id, func.count(TraineeSkill.id))
                                      .where(TraineeSkill.trainee_id.in_(trainee_ids),
                                             TraineeSkill.verified.is_(True))
                                      .group_by(TraineeSkill.trainee_id))).all()) if trainee_ids else {}
    return {"applications": [
        _application_json(app, job, applicant, profile, matches.get((app.job_id, app.applicant_id)),
                          verified.get(app.applicant_id, 0))
        for app, job, applicant, profile in rows],
        "total": total, "limit": limit, "offset": offset}


@router.get("/applications/{application_id}")
async def get_application(application_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                          user: User = Depends(require_roles("employer", "admin"))):
    row = (await db.execute(select(Application, Job, User, UserProfile)
                            .join(Job, Job.id == Application.job_id)
                            .outerjoin(User, User.id == Application.applicant_id)
                            .outerjoin(UserProfile, UserProfile.user_id == Application.applicant_id)
                            .where(Application.id == application_id, Job.source == "employer"))).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    app, job, applicant, profile = row
    assert_org_access(user, job.organisation_id)
    stored = None
    skills: list[dict] = []
    certificates: list[dict] = []
    verified_count = 0
    if applicant is not None:
        stored = (await _latest_matches(db, [(job.id, applicant.id)])).get((job.id, applicant.id))
        skill_rows = (await db.execute(select(TraineeSkill, Skill)
                                       .join(Skill, Skill.id == TraineeSkill.skill_id)
                                       .where(TraineeSkill.trainee_id == applicant.id).order_by(Skill.name))).all()
        skills = [_passport_skill(ts, skill) for ts, skill in skill_rows]
        verified_count = sum(1 for ts, _ in skill_rows if ts.verified)
        cert_rows = (await db.execute(select(Certificate).where(Certificate.trainee_id == applicant.id)
                                      .order_by(Certificate.issue_date.desc().nullslast()))).scalars().all()
        certificates = [_certificate_json(cert) for cert in cert_rows]
    base = _application_json(app, job, applicant, profile, stored, verified_count)
    return {
        **base,
        "job": {"id": str(job.id), "title": job.title, "location": job.location, "status": job.status},
        "employer_note": app.employer_note,
        # No history table exists yet, so no events are returned.
        "history": [],
        # The application-level interview time is shown as interview_at; per-interview records
        # come from the interviews module once it is merged.
        "interviews": [],
        "certificates": certificates,
        "skills": skills,
        "allowed_transitions": sorted(_TRANSITIONS.get(app.status, set())),
    }


@router.patch("/applications/{application_id}")
async def transition_application(application_id: uuid.UUID, data: ApplicationEdit,
                                 db: AsyncSession = Depends(get_db),
                                 user: User = Depends(require_roles("employer", "admin"))):
    return await update_application(application_id, data, db, user)


@router.patch("/applications/{application_id}/status")
async def update_application_status(application_id: uuid.UUID, data: ApplicationEdit,
                                    db: AsyncSession = Depends(get_db),
                                    user: User = Depends(require_roles("employer", "admin"))):
    return await update_application(application_id, data, db, user)
