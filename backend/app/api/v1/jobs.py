from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.job import Job, JobMatch, Application, EmployerFeedback
from app.models.analytics import SkillDemand
from app.models.skill import TraineeSkill, Skill
from app.services.job_matching import match_candidate_to_job
from app.schemas.job import JobCreate, FeedbackCreate
from typing import Optional, List
import uuid
from datetime import datetime, timezone
from app.deps import get_optional_identity, resolve_actor_id, AuthenticatedIdentity

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
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    if identity is not None and identity.role not in ("employer", "admin"):
        raise HTTPException(status_code=403, detail="Only employers or admins can post job listings")
    job = Job(id=uuid.uuid4(), **data.model_dump())
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
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Closes the loop: post-placement employer feedback both records the
    outcome and feeds real numbers back into the `skill_demand` table so
    the NCCT analytics endpoints reflect actual, observed skill gaps rather
    than only static seed data."""
    if identity is not None and identity.role not in ("employer", "admin"):
        raise HTTPException(status_code=403, detail="Only employers or admins can submit feedback")

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
