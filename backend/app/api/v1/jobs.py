from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.job import Job, JobMatch, Application, EmployerFeedback
from app.models.analytics import SkillDemand
from app.models.skill import TraineeSkill, Skill
from app.services.job_matching import match_candidate_to_job
from app.schemas.job import JobCreate, FeedbackCreate
from typing import Optional, List
import uuid
from datetime import datetime, timezone
from app.deps import get_optional_identity, resolve_actor_id, AuthenticatedIdentity, require_roles, assert_org_access, org_scope
from app.models.user import User
from app.models.profile import UserProfile
from app.services.notifications import notify
from pydantic import BaseModel, Field

router = APIRouter()

# Demo jobs data - used as a fallback catalog and to keep the explainable
# `/match` endpoint usable for ids that were never persisted to the DB
# (e.g. the well-known ids referenced by the frontend's mock data / the
# repo's own e2e verification script).
DEMO_JOBS = [
    {"id": "job-dairy-supervisor-anand", "title": "Dairy Procurement Supervisor", "employer": "Amul Dairy Cooperative Union", "location": "Anand, Gujarat", "sector": "Dairy", "type": "Full-time", "salary": "₹4,50,000 - ₹6,00,000", "skills_required": ["Dairy Operations", "Communication", "Leadership"], "openings": 5, "posted_days_ago": 3},
    {"id": "job-cdo-ncdc", "title": "Cooperative Development Officer", "employer": "National Cooperative Development Corporation", "location": "New Delhi", "sector": "Cooperative Management", "type": "Full-time", "salary": "₹5,50,000 - ₹7,00,000", "skills_required": ["Cooperative Management", "Rural Development", "Data Analysis", "Communication"], "openings": 3, "posted_days_ago": 7},
    {"id": "job-credit-officer-pune", "title": "Credit Officer - Cooperative Bank", "employer": "Maharashtra State Cooperative Bank", "location": "Pune, Maharashtra", "sector": "Banking", "type": "Full-time", "salary": "₹3,80,000 - ₹5,20,000", "skills_required": ["Credit Appraisal", "Financial Management", "Data Analysis"], "openings": 8, "posted_days_ago": 2},
    {"id": "job-agri-marketing-jaipur", "title": "Agri-Marketing Specialist", "employer": "Rajasthan Cooperative Marketing Federation", "location": "Jaipur, Rajasthan", "sector": "Agriculture", "type": "Full-time", "salary": "₹3,50,000 - ₹4,80,000", "skills_required": ["Digital Marketing", "Communication", "Rural Development"], "openings": 4, "posted_days_ago": 10},
]

_DEMO_TRAINEE_SKILLS = [
    {"skill": "Cooperative Management", "level": "Proficient", "confidence": 92},
    {"skill": "Communication", "level": "Proficient", "confidence": 85},
    {"skill": "Rural Development", "level": "Foundational", "confidence": 60},
]


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


@router.get("/")
async def list_jobs(db: AsyncSession = Depends(get_db), skip: int = 0, limit: int = 20):
    result = await db.execute(select(Job).offset(skip).limit(limit))
    jobs = result.scalars().all()
    if jobs:
        return {"jobs": [{"id": str(j.id), "title": j.title, "employer": j.employer_name, "location": j.location} for j in jobs], "total": len(jobs)}
    return {"jobs": DEMO_JOBS, "total": len(DEMO_JOBS)}


@router.get("/my-applications")
async def my_applications(
    applicant_id: Optional[str] = None,
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    applicant_uuid = resolve_actor_id(identity, applicant_id)
    if applicant_uuid:
        result = await db.execute(
            select(Application, Job)
            .join(Job, Job.id == Application.job_id, isouter=True)
            .where(Application.applicant_id == applicant_uuid)
        )
        rows = result.all()
        return {
            "applications": [
                {
                    "id": str(app.id),
                    "job_title": job.title if job else None,
                    "employer": job.employer_name if job else None,
                    "applied_at": app.applied_at.date().isoformat() if app.applied_at else None,
                    "status": app.status,
                }
                for app, job in rows
            ]
        }
    return {"applications": [
        {"id": "app1", "job_title": "Dairy Procurement Supervisor", "employer": "Amul Dairy", "applied_at": "2026-09-20", "status": "shortlisted"},
        {"id": "app2", "job_title": "Cooperative Development Officer", "employer": "NCDC", "applied_at": "2026-09-15", "status": "applied"},
    ]}


class JobEdit(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    sector: Optional[str] = Field(None, max_length=100)
    job_type: Optional[str] = Field(None, max_length=50)
    salary_range: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    skills_required: Optional[List[str]] = None
    openings: Optional[int] = Field(None, ge=0)
    deadline: Optional[datetime] = None
    status: Optional[str] = None


class ApplicationEdit(BaseModel):
    status: str
    note: Optional[str] = Field(None, max_length=5000)
    interview_at: Optional[datetime] = None


_TRANSITIONS = {
    "applied": {"shortlisted", "rejected"},
    "shortlisted": {"interview", "offered", "rejected"},
    "interview": {"offered", "rejected"},
    "offered": {"hired", "rejected"},
    "hired": set(), "rejected": set(), "withdrawn": set(), "applied_external": set(),
}


async def _owned_job(db: AsyncSession, job_id: uuid.UUID, user: User) -> Job:
    job = (await db.execute(select(Job).where(Job.id == job_id))).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    assert_org_access(user, job.organisation_id)
    return job


@router.get("/mine")
async def my_jobs(db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("employer", "admin"))):
    scope = org_scope(user)
    query = select(Job).where(Job.source == "employer")
    if scope is not None:
        query = query.where(Job.organisation_id == scope)
    jobs = (await db.execute(query.order_by(Job.posted_at.desc().nullslast()))).scalars().all()
    return {"jobs": [{"id": str(j.id), "title": j.title, "employer": j.employer_name,
                      "location": j.location, "status": j.status, "openings": j.openings,
                      "deadline": j.deadline.isoformat() if j.deadline else None} for j in jobs]}


@router.patch("/{job_id}")
async def update_job(job_id: uuid.UUID, data: JobEdit, db: AsyncSession = Depends(get_db),
                     user: User = Depends(require_roles("employer", "admin"))):
    job = await _owned_job(db, job_id, user)
    if job.source != "employer":
        raise HTTPException(status_code=403, detail="External jobs cannot be edited")
    values = data.model_dump(exclude_unset=True)
    if "status" in values and values["status"] not in {"draft", "open", "closed"}:
        raise HTTPException(status_code=422, detail="Invalid job status")
    for field, value in values.items():
        setattr(job, field, value)
    await db.commit()
    return {"id": str(job.id), "status": job.status}


@router.get("/{job_id}/applications")
async def job_applications(job_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                           user: User = Depends(require_roles("employer", "admin"))):
    job = await _owned_job(db, job_id, user)
    rows = (await db.execute(select(Application, User, JobMatch)
        .join(User, User.id == Application.applicant_id)
        .outerjoin(JobMatch, (JobMatch.job_id == job.id) & (JobMatch.trainee_id == User.id))
        .where(Application.job_id == job.id)
        .order_by(JobMatch.match_score.desc().nullslast(), Application.applied_at.desc()))).all()
    applications = []
    seen = set()
    for app, trainee, match in rows:
        if app.id in seen:
            continue
        seen.add(app.id)
        verified_count = (await db.execute(select(func.count(TraineeSkill.id)).where(
            TraineeSkill.trainee_id == trainee.id, TraineeSkill.verified.is_(True)))).scalar_one()
        applications.append({"id": str(app.id), "trainee_id": str(trainee.id),
            "name": trainee.full_name, "status": app.status, "applied_at": app.applied_at.isoformat() if app.applied_at else None,
            "match_score": match.match_score if match else None,
            "matched_skills": match.matched_skills if match else [],
            "missing_skills": match.missing_skills if match else [], "verified_skill_count": verified_count})
    return {"applications": applications}


@router.patch("/applications/{application_id}")
async def update_application(application_id: uuid.UUID, data: ApplicationEdit,
                             db: AsyncSession = Depends(get_db),
                             user: User = Depends(require_roles("employer", "admin"))):
    row = (await db.execute(select(Application, Job).join(Job, Application.job_id == Job.id)
                            .where(Application.id == application_id).with_for_update())).one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="Application not found")
    app, job = row
    assert_org_access(user, job.organisation_id)
    if data.status != app.status and data.status not in _TRANSITIONS.get(app.status, set()):
        raise HTTPException(status_code=422, detail="Invalid application status transition")
    if data.status == "interview" and data.interview_at is None and app.interview_at is None:
        raise HTTPException(status_code=422, detail="interview_at is required for interview")
    changed = data.status != app.status
    app.status = data.status
    if data.note is not None:
        app.employer_note = data.note
    if data.interview_at is not None:
        app.interview_at = data.interview_at
    app.updated_at = datetime.now(timezone.utc)
    if changed and app.applicant_id:
        await notify(db, app.applicant_id, "application_status",
                     {"application_id": str(app.id), "job_id": str(job.id), "status": app.status},
                     title="Application update", body=f"Your application for {job.title} is now {app.status}.")
    await db.commit()
    return {"id": str(app.id), "status": app.status,
            "interview_at": app.interview_at.isoformat() if app.interview_at else None}


@router.get("/hired")
async def hired_candidates(db: AsyncSession = Depends(get_db),
                           user: User = Depends(require_roles("employer", "admin"))):
    """Trainees hired through one of the caller's job postings, for the
    employer feedback form's "select hired trainee" list. Flags whether
    post-hire feedback has already been logged for that (job, trainee) pair."""
    scope = org_scope(user)
    query = select(Application, Job, User).join(Job, Job.id == Application.job_id).join(
        User, User.id == Application.applicant_id).where(Application.status == "hired")
    if scope is not None:
        query = query.where(Job.organisation_id == scope)
    rows = (await db.execute(query.order_by(Application.updated_at.desc().nullslast()))).all()
    feedback_pairs = set((await db.execute(select(EmployerFeedback.job_id, EmployerFeedback.trainee_id))).all())
    return {"hires": [{
        "application_id": str(app.id), "job_id": str(job.id), "job_title": job.title,
        "trainee_id": str(trainee.id), "trainee_name": trainee.full_name,
        "feedback_submitted": (job.id, trainee.id) in feedback_pairs,
    } for app, job, trainee in rows]}


@router.get("/feedback/mine")
async def my_feedback(limit: int = 20, db: AsyncSession = Depends(get_db),
                      user: User = Depends(require_roles("employer", "admin"))):
    """Feedback the caller's organisation has logged, most recent first."""
    scope = org_scope(user)
    query = select(EmployerFeedback, Job, User).join(Job, Job.id == EmployerFeedback.job_id).join(
        User, User.id == EmployerFeedback.trainee_id)
    if scope is not None:
        query = query.where(Job.organisation_id == scope)
    rows = (await db.execute(query.order_by(EmployerFeedback.created_at.desc()).limit(min(limit, 100)))).all()
    return {"feedback": [{
        "id": str(fb.id), "job_title": job.title, "trainee_name": trainee.full_name,
        "performance_rating": fb.performance_rating, "training_relevance": fb.training_relevance,
        "comments": fb.comments, "created_at": fb.created_at.isoformat() if fb.created_at else None,
    } for fb, job, trainee in rows]}


@router.get("/{job_id}")
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    if _is_uuid(job_id):
        result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
        job = result.scalar_one_or_none()
        if job:
            return {
                "id": str(job.id),
                "title": job.title,
                "employer": job.employer_name,
                "location": job.location,
                "sector": job.sector,
                "type": job.job_type,
                "salary": job.salary_range,
                "description": job.description,
                "skills_required": job.skills_required or [],
            }
    demo = next((j for j in DEMO_JOBS if j["id"] == job_id), None)
    if demo:
        return demo
    raise HTTPException(status_code=404, detail="Job not found")


@router.post("/")
async def create_job(
    data: JobCreate,
    user: User = Depends(require_roles("employer", "admin")),
    db: AsyncSession = Depends(get_db),
):
    scope = org_scope(user)
    if scope is None and user.organisation_id is None:
        raise HTTPException(status_code=422, detail="An organisation is required to post a job")
    job = Job(id=uuid.uuid4(), **data.model_dump(), organisation_id=user.organisation_id,
              created_by_id=user.id, status="open", source="employer", posted_at=datetime.now(timezone.utc))
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return {"id": str(job.id), "title": job.title, "status": "created"}


@router.post("/{job_id}/match")
async def match_job(
    job_id: str,
    trainee_id: Optional[str] = Query(None, description="Local user id to match against; defaults to a demo profile"),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    trainee_uuid = resolve_actor_id(identity, trainee_id)
    """Deterministic, explainable job match (see app/services/job_matching.py):
    matched vs missing required skills plus a percentage score, mirroring
    the style of apps/web/src/lib/job-match.ts (read-only reference)."""
    job_title = "Unknown"
    skills_required: List[str] = []
    db_job_id: Optional[uuid.UUID] = None

    if _is_uuid(job_id):
        result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
        job = result.scalar_one_or_none()
        if job:
            db_job_id = job.id
            job_title = job.title
            skills_required = job.skills_required or []
    if not skills_required:
        demo_job = next((j for j in DEMO_JOBS if j["id"] == job_id), None)
        if demo_job:
            job_title = demo_job["title"]
            skills_required = demo_job["skills_required"]

    job_requirements = [{"skill": s} for s in skills_required]

    trainee_skills = _DEMO_TRAINEE_SKILLS
    if trainee_uuid:
        ts_result = await db.execute(
            select(TraineeSkill, Skill)
            .join(Skill, Skill.id == TraineeSkill.skill_id)
            .where(TraineeSkill.trainee_id == trainee_uuid)
        )
        rows = ts_result.all()
        if rows:
            trainee_skills = [{"skill": s.name, "level": ts.level, "confidence": ts.confidence} for ts, s in rows]

    result = match_candidate_to_job(trainee_skills, job_requirements)
    result["job_id"] = job_id
    result["job_title"] = job_title

    db.add(
        JobMatch(
            id=uuid.uuid4(),
            job_id=db_job_id,
            trainee_id=trainee_uuid,
            match_score=result.get("match_score"),
            matched_skills=result.get("matched", []),
            missing_skills=result.get("missing", []),
            explanation=result.get("explanation"),
            created_at=datetime.now(timezone.utc),
        )
    )
    await db.commit()
    return result


@router.post("/{job_id}/apply")
async def apply_for_job(
    job_id: str,
    applicant_id: Optional[str] = Query(None, description="Local user id of the applicant"),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Submit job application. `job_id` may be a real (persisted) job UUID
    or one of the well-known demo ids; `applicant_id`, if supplied, must be
    a real user id."""
    job_uuid: Optional[uuid.UUID] = None
    if _is_uuid(job_id):
        result = await db.execute(select(Job).where(Job.id == uuid.UUID(job_id)))
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Job not found")
        job_uuid = uuid.UUID(job_id)
    elif not any(j["id"] == job_id for j in DEMO_JOBS):
        raise HTTPException(status_code=404, detail="Job not found")

    # Resolve applicant UUID from verified Clerk identity or fallback explicit id
    applicant_uuid = resolve_actor_id(identity, applicant_id, allowed_roles=("trainee", "admin"))

    if job_uuid is not None and applicant_uuid is not None:
        prior = (
            await db.execute(
                select(Application).where(Application.job_id == job_uuid, Application.applicant_id == applicant_uuid).limit(1)
            )
        ).scalar_one_or_none()
        if prior is not None:
            return {"id": str(prior.id), "status": prior.status, "message": "Already applied to this job"}

    application = Application(
        id=uuid.uuid4(),
        job_id=job_uuid,
        applicant_id=applicant_uuid,
        status="applied",
        applied_at=datetime.now(timezone.utc),
    )
    db.add(application)
    await db.commit()
    return {"id": str(application.id), "status": "applied", "message": "Application submitted successfully"}


@router.post("/feedback")
async def submit_employer_feedback(
    data: FeedbackCreate,
    user: User = Depends(require_roles("employer", "admin")),
    db: AsyncSession = Depends(get_db),
):
    """Closes the loop: post-placement employer feedback both records the
    outcome and feeds real numbers back into the `skill_demand` table so
    the NCCT analytics endpoints reflect actual, observed skill gaps rather
    than only static seed data."""
    if not _is_uuid(data.job_id):
        raise HTTPException(status_code=422, detail="Feedback requires an employer-owned job")
    job = await _owned_job(db, uuid.UUID(data.job_id), user)
    applied = (await db.execute(select(Application.id).where(
        Application.job_id == job.id, Application.applicant_id == uuid.UUID(data.trainee_id)).limit(1))).scalar_one_or_none()
    if applied is None:
        raise HTTPException(status_code=403, detail="Trainee has not applied to this job")

    feedback = EmployerFeedback(
        id=uuid.uuid4(),
        trainee_id=uuid.UUID(data.trainee_id),
        job_id=uuid.UUID(data.job_id) if _is_uuid(data.job_id) else None,
        useful_skills=data.useful_skills,
        missing_skills=data.missing_skills,
        training_relevance=data.training_relevance,
        performance_rating=data.performance_rating,
        comments=data.comments,
        created_at=datetime.now(timezone.utc),
    )
    db.add(feedback)

    async def _bump(skill_name: str, *, demand_delta: int, trained_delta: int, gap_delta: int):
        result = await db.execute(select(SkillDemand).where(SkillDemand.skill_name == skill_name))
        row = result.scalar_one_or_none()
        if row is None:
            row = SkillDemand(
                id=uuid.uuid4(),
                skill_name=skill_name,
                employer_demand_count=max(demand_delta, 0),
                trained_count=max(trained_delta, 0),
                gap_count=max(gap_delta, 0),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(row)
        else:
            row.employer_demand_count = (row.employer_demand_count or 0) + demand_delta
            row.trained_count = (row.trained_count or 0) + trained_delta
            row.gap_count = max((row.gap_count or 0) + gap_delta, 0)
            row.updated_at = datetime.now(timezone.utc)

    for skill_name in data.useful_skills:
        await _bump(skill_name, demand_delta=1, trained_delta=1, gap_delta=0)
    for skill_name in data.missing_skills:
        await _bump(skill_name, demand_delta=1, trained_delta=0, gap_delta=1)

    await db.commit()
    return {"id": str(feedback.id), "status": "submitted", "message": "Feedback recorded. Skill demand intelligence updated."}
