"""Employer job lifecycle, job requirements and deterministic matching (mounted at /employer).

Jobs move draft -> open (publish) -> paused (pause) -> open (publish resumes a paused job),
and any non-closed job can be closed. Closed is terminal. Every route is restricted to
employer/admin and scoped to the caller's organisation.

Posting fields follow FE-1's JobInput. Fields with no column on `jobs` are stored in
`job_details`. Education, experience and certification criteria for matching are derived
from those posting fields, so the skills requirement set only holds skills.
"""
from __future__ import annotations

import re
import uuid
from datetime import date, datetime, time, timedelta, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import assert_org_access, org_scope, require_roles
from app.models.certificate import Certificate
from app.models.job import Application, Job, JobMatch
from app.models.job_detail import JobDetail
from app.models.job_requirement import JobRequirement
from app.models.profile import UserProfile
from app.models.skill import Skill, TraineeSkill
from app.models.user import User
from app.services.certificate_service import certificate_integrity
from app.services.employer_matching import (
    DEFAULT_LEVEL, EDUCATION_LEVELS, LEVEL_PROFICIENCY, CandidateFacts, CertificateFact, JobFacts,
    RequirementFact, SkillFact, education_rank, score_candidate,
)

router = APIRouter()

JOB_STATUSES = ("draft", "open", "paused", "closed")
EMPLOYMENT_TYPES = ("Full-time", "Part-time", "Contract", "Internship")
MIN_PUBLISH_DESCRIPTION = 40
MAX_REQUIREMENTS = 60
CANDIDATE_POOL_CAP = 1000

_EMPLOYER = require_roles("employer", "admin")

EmploymentType = Literal["Full-time", "Part-time", "Contract", "Internship"]


# ---------------------------------------------------------------- schemas

class _JobFields(BaseModel):
    """Posting fields shared by create and update (FE-1 JobInput)."""
    model_config = ConfigDict(extra="forbid")
    sector: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    employment_type: Optional[EmploymentType] = None
    salary_min: Optional[int] = Field(None, ge=0, le=100_000_000)
    salary_max: Optional[int] = Field(None, ge=0, le=100_000_000)
    experience_required: Optional[str] = Field(None, max_length=100)
    education: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=10000)
    responsibilities: Optional[str] = Field(None, max_length=10000)
    certifications: Optional[str] = Field(None, max_length=10000)
    languages: Optional[str] = Field(None, max_length=255)
    deadline: Optional[datetime] = None
    openings: Optional[int] = Field(None, ge=1, le=100_000)


class JobDraftIn(_JobFields):
    title: str = Field(..., min_length=1, max_length=255)
    status: Optional[Literal["draft"]] = None


class JobPatchIn(_JobFields):
    # `status` is not accepted here: transitions go through publish/pause/close.
    title: Optional[str] = Field(None, min_length=1, max_length=255)


EDUCATION_CHOICES = Literal["SSC", "HSC", "Diploma", "Graduate", "Postgraduate"]
LEVEL_CHOICES = Literal["Foundational", "Intermediate", "Proficient", "Expert"]


class RequirementIn(BaseModel):
    """One skill requirement. Accepts FE-1's shape (skill_id may be null)."""
    model_config = ConfigDict(extra="forbid")
    skill_id: Optional[uuid.UUID] = None
    skill_name: str = Field(..., min_length=1, max_length=255)
    requirement_type: Literal["required", "preferred"] = "required"
    min_proficiency: Optional[int] = Field(None, ge=0, le=100)
    min_level: Optional[LEVEL_CHOICES] = None
    weight: int = Field(1, ge=1, le=10)

    @model_validator(mode="after")
    def _one_proficiency_form(self):
        if not self.skill_name.strip():
            raise ValueError("skill_name cannot be blank")
        if self.min_proficiency is not None and self.min_level is not None:
            raise ValueError("Provide min_proficiency or min_level, not both")
        return self


class RequirementsPut(BaseModel):
    model_config = ConfigDict(extra="forbid")
    requirements: list[RequirementIn] = Field(..., max_length=MAX_REQUIREMENTS)


# ---------------------------------------------------------------- helpers

DETAIL_FIELDS = ("department", "salary_min", "salary_max", "experience_required", "education",
                 "responsibilities", "certifications", "languages")
JOB_FIELDS = ("sector", "location", "description", "openings", "deadline")


def _norm_key(value: str) -> str:
    return " ".join(value.split()).casefold()


def _salary_label(low: Optional[int], high: Optional[int]) -> Optional[str]:
    if low is None and high is None:
        return None
    if low is not None and high is not None:
        return f"₹{low} - ₹{high}"
    return f"₹{low if low is not None else high}"


def _check_salary_order(low: Optional[int], high: Optional[int]) -> None:
    if low is not None and high is not None and low > high:
        raise HTTPException(status_code=422, detail="salary_max must be at least salary_min")


async def _employer_job(db: AsyncSession, job_id: uuid.UUID, user: User) -> Job:
    """Load an employer-sourced job and enforce organisation ownership (403 cross-org)."""
    job = (await db.execute(select(Job).where(Job.id == job_id, Job.source == "employer"))).scalar_one_or_none()
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    assert_org_access(user, job.organisation_id)
    return job


def _scoped_jobs(user: User):
    query = select(Job).where(Job.source == "employer")
    scope = org_scope(user)
    if scope is not None:
        query = query.where(Job.organisation_id == scope)
    return query


async def _load_details(db: AsyncSession, job_ids: list[uuid.UUID]) -> dict[uuid.UUID, JobDetail]:
    if not job_ids:
        return {}
    rows = (await db.execute(select(JobDetail).where(JobDetail.job_id.in_(job_ids)))).scalars().all()
    return {row.job_id: row for row in rows}


async def _load_detail(db: AsyncSession, job_id: uuid.UUID) -> Optional[JobDetail]:
    return (await db.execute(select(JobDetail).where(JobDetail.job_id == job_id))).scalar_one_or_none()


async def _status_counts(db: AsyncSession, job_ids: list[uuid.UUID]) -> dict[uuid.UUID, dict[str, int]]:
    """Application counts per job and per application status."""
    counts: dict[uuid.UUID, dict[str, int]] = {job_id: {} for job_id in job_ids}
    if not job_ids:
        return counts
    rows = (await db.execute(select(Application.job_id, Application.status, func.count(Application.id))
                             .where(Application.job_id.in_(job_ids))
                             .group_by(Application.job_id, Application.status))).all()
    for job_id, status, count in rows:
        counts[job_id][status or "applied"] = count
    return counts


def _job_json(job: Job, detail: Optional[JobDetail], counts: Optional[dict[str, int]] = None) -> dict:
    counts = counts or {}
    return {
        "id": str(job.id), "title": job.title, "status": job.status,
        "company_name": job.employer_name,
        "sector": job.sector, "department": detail.department if detail else None,
        "location": job.location, "employment_type": job.job_type,
        "salary_range": job.salary_range,
        "salary_min": detail.salary_min if detail else None,
        "salary_max": detail.salary_max if detail else None,
        "experience_required": detail.experience_required if detail else None,
        "education": detail.education if detail else None,
        "description": job.description,
        "responsibilities": detail.responsibilities if detail else None,
        "certifications": detail.certifications if detail else None,
        "languages": detail.languages if detail else None,
        "openings": job.openings,
        "deadline": job.deadline.isoformat() if job.deadline else None,
        "posted_at": job.posted_at.isoformat() if job.posted_at else None,
        "applications_count": sum(counts.values()),
        "shortlisted_count": counts.get("shortlisted", 0),
        "interview_count": counts.get("interview", 0),
        "match_rate": None,
    }


def _requirement_json(req: JobRequirement) -> dict:
    return {
        "id": str(req.id), "skill_id": str(req.skill_id) if req.skill_id else None,
        "skill_name": req.skill_name, "requirement_type": req.requirement_type,
        "min_proficiency": req.min_proficiency, "weight": req.weight,
    }


async def _load_requirements(db: AsyncSession, job_id: uuid.UUID) -> list[JobRequirement]:
    return list((await db.execute(select(JobRequirement).where(JobRequirement.job_id == job_id)
                                  .order_by(JobRequirement.created_at, JobRequirement.id))).scalars().all())


def _criteria_facts(requirements: list[JobRequirement], detail: Optional[JobDetail]) -> list[RequirementFact]:
    """Matcher criteria: skill rows, plus education / experience / certifications from the posting fields."""
    facts = [RequirementFact(kind="skill", skill_name=r.skill_name, requirement_type=r.requirement_type,
                             min_proficiency=r.min_proficiency, weight=r.weight)
             for r in requirements if r.kind == "skill" and r.skill_name]
    if detail is None:
        return facts
    rank = education_rank(detail.education)
    if rank is not None:
        facts.append(RequirementFact(kind="education", min_education=EDUCATION_LEVELS[rank]))
    experience = (detail.experience_required or "").strip()
    if experience:
        digits = re.search(r"\d+", experience)
        if digits:
            facts.append(RequirementFact(kind="experience", min_years=int(digits.group())))
        elif "fresher" in experience.casefold():
            facts.append(RequirementFact(kind="experience", min_years=0))
    for item in re.split(r"[\n,;]+", detail.certifications or ""):
        if item.strip():
            facts.append(RequirementFact(kind="certification", certification_name=item.strip()))
    return facts


def _certificate_valid(cert: Certificate) -> bool:
    if cert.revoked_at is not None:
        return False
    if cert.expiry_date and cert.expiry_date.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return False
    try:
        return certificate_integrity(cert)
    except RuntimeError:
        # Signing secret unavailable: fail closed, the certificate is not counted.
        return False


async def load_candidate_facts(db: AsyncSession, profiles: dict[uuid.UUID, UserProfile]) -> dict[uuid.UUID, CandidateFacts]:
    """Build pure scorer inputs for a set of trainees using three bulk queries."""
    ids = list(profiles)
    if not ids:
        return {}
    skill_rows = (await db.execute(select(TraineeSkill, Skill).join(Skill, Skill.id == TraineeSkill.skill_id)
                                   .where(TraineeSkill.trainee_id.in_(ids)))).all()
    cert_rows = (await db.execute(select(Certificate).where(Certificate.trainee_id.in_(ids)))).scalars().all()
    skills_by: dict[uuid.UUID, list[SkillFact]] = {tid: [] for tid in ids}
    for trainee_skill, skill in skill_rows:
        skills_by[trainee_skill.trainee_id].append(SkillFact(
            name=skill.name, level=trainee_skill.level, verified=bool(trainee_skill.verified),
            confidence=trainee_skill.confidence))
    certs_by: dict[uuid.UUID, list[CertificateFact]] = {tid: [] for tid in ids}
    for cert in cert_rows:
        titles = tuple(s for s in (cert.skills_certified or []) if isinstance(s, str))
        certs_by[cert.trainee_id].append(CertificateFact(
            title=cert.programme_title, skills_certified=titles, valid=_certificate_valid(cert)))
    return {
        tid: CandidateFacts(
            skills=tuple(skills_by[tid]), education_level=profile.education_level,
            years_of_experience=profile.years_of_experience, certificates=tuple(certs_by[tid]),
            district=profile.district, state=profile.state)
        for tid, profile in profiles.items()
    }


async def _applicant_ids_for_job(db: AsyncSession, job_id: uuid.UUID) -> set[uuid.UUID]:
    rows = (await db.execute(select(Application.applicant_id).where(
        Application.job_id == job_id, Application.applicant_id.is_not(None)))).scalars().all()
    return set(rows)


def _publish_problems(job: Job, detail: Optional[JobDetail], requirements: list[JobRequirement]) -> list[str]:
    problems: list[str] = []
    if not (job.title or "").strip():
        problems.append("Title is required.")
    if not (job.sector or "").strip():
        problems.append("Sector is required.")
    if detail is None or not (detail.department or "").strip():
        problems.append("Department is required.")
    if not (job.location or "").strip() or len(job.location.strip()) < 2:
        problems.append("Location is required.")
    if detail is None or not (detail.experience_required or "").strip():
        problems.append("Experience required is required.")
    if len((job.description or "").strip()) < MIN_PUBLISH_DESCRIPTION:
        problems.append(f"Description must be at least {MIN_PUBLISH_DESCRIPTION} characters.")
    if job.openings is None or job.openings < 1:
        problems.append("Number of openings must be at least 1.")
    if job.deadline is None:
        problems.append("Application deadline is required.")
    elif job.deadline.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        problems.append("Application deadline must be in the future.")
    if detail is not None and detail.salary_min is not None and detail.salary_max is not None \
            and detail.salary_min > detail.salary_max:
        problems.append("Maximum salary must be at least the minimum.")
    if not any(r.requirement_type == "required" for r in requirements):
        problems.append("Add at least one required skill before publishing.")
    return problems


def _raise_for_status(job: Job, allowed: tuple[str, ...], action: str) -> None:
    if job.status not in allowed:
        raise HTTPException(status_code=409, detail=f"Cannot {action} a job whose status is '{job.status}'")


# ---------------------------------------------------------------- jobs CRUD

@router.get("/jobs")
async def list_employer_jobs(
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None, max_length=100),
    sector: Optional[str] = Query(None, max_length=100),
    location: Optional[str] = Query(None, max_length=255),
    employment_type: Optional[EmploymentType] = Query(None),
    posted_within_days: Optional[int] = Query(None, ge=1, le=365),
    posted_from: Optional[date] = None,
    posted_to: Optional[date] = None,
    q: Optional[str] = Query(None, max_length=255),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_EMPLOYER),
):
    if status is not None and status not in JOB_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {', '.join(JOB_STATUSES)}")
    if posted_from and posted_to and posted_from > posted_to:
        raise HTTPException(status_code=422, detail="posted_from must be on or before posted_to")
    filters = []
    if status:
        filters.append(Job.status == status)
    if department:
        filters.append(Job.id.in_(select(JobDetail.job_id).where(JobDetail.department.ilike(f"%{department}%"))))
    if sector:
        filters.append(Job.sector.ilike(f"%{sector}%"))
    if location:
        filters.append(Job.location.ilike(f"%{location}%"))
    if employment_type:
        filters.append(Job.job_type == employment_type)
    if posted_within_days:
        filters.append(Job.posted_at >= datetime.now(timezone.utc) - timedelta(days=posted_within_days))
    if posted_from:
        filters.append(Job.posted_at >= datetime.combine(posted_from, time.min, tzinfo=timezone.utc))
    if posted_to:
        filters.append(Job.posted_at < datetime.combine(posted_to, time.min, tzinfo=timezone.utc) + timedelta(days=1))
    if q:
        filters.append(Job.title.ilike(f"%{q}%"))
    base = _scoped_jobs(user).where(and_(*filters)) if filters else _scoped_jobs(user)
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    jobs = (await db.execute(base.order_by(Job.posted_at.desc().nullslast(), Job.title, Job.id)
                             .offset(offset).limit(limit))).scalars().all()
    job_ids = [j.id for j in jobs]
    details = await _load_details(db, job_ids)
    counts = await _status_counts(db, job_ids)
    return {"jobs": [_job_json(j, details.get(j.id), counts.get(j.id)) for j in jobs],
            "total": total, "limit": limit, "offset": offset}


@router.post("/jobs", status_code=201)
async def create_job_draft(data: JobDraftIn, db: AsyncSession = Depends(get_db),
                           user: User = Depends(_EMPLOYER)):
    org_scope(user)  # 403 for non-global users that have no organisation
    if user.organisation_id is None:
        raise HTTPException(status_code=422, detail="An organisation is required to create a job")
    _check_salary_order(data.salary_min, data.salary_max)
    values = data.model_dump(exclude_unset=True)
    job = Job(id=uuid.uuid4(), title=values["title"],
              **{f: values.get(f) for f in JOB_FIELDS},
              job_type=values.get("employment_type") or "Full-time",
              salary_range=_salary_label(data.salary_min, data.salary_max),
              organisation_id=user.organisation_id, created_by_id=user.id,
              status="draft", source="employer", posted_at=None)
    detail = JobDetail(job_id=job.id, **{f: values.get(f) for f in DETAIL_FIELDS})
    db.add(job)
    db.add(detail)
    await db.commit()
    await db.refresh(job)
    return _job_json(job, detail, {})


@router.get("/jobs/{job_id}")
async def get_employer_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                           user: User = Depends(_EMPLOYER)):
    job = await _employer_job(db, job_id, user)
    detail = await _load_detail(db, job.id)
    requirements = await _load_requirements(db, job.id)
    counts = (await _status_counts(db, [job.id]))[job.id]
    return {**_job_json(job, detail, counts),
            "pipeline": {k: counts.get(k, 0) for k in ("applied", "shortlisted", "interview", "offered", "hired")},
            "requirements": [_requirement_json(r) for r in requirements]}


@router.patch("/jobs/{job_id}")
async def update_employer_job(job_id: uuid.UUID, data: JobPatchIn, db: AsyncSession = Depends(get_db),
                              user: User = Depends(_EMPLOYER)):
    job = await _employer_job(db, job_id, user)
    _raise_for_status(job, ("draft", "open", "paused"), "edit")
    values = data.model_dump(exclude_unset=True)
    if "title" in values and values["title"] is None:
        raise HTTPException(status_code=422, detail="Title cannot be empty")
    detail = await _load_detail(db, job.id)
    if detail is None:
        detail = JobDetail(job_id=job.id)
        db.add(detail)
    effective_min = values.get("salary_min", detail.salary_min)
    effective_max = values.get("salary_max", detail.salary_max)
    _check_salary_order(effective_min, effective_max)
    if "title" in values:
        job.title = values["title"]
    if "employment_type" in values:
        job.job_type = values["employment_type"] or "Full-time"
    for field in JOB_FIELDS:
        if field in values:
            setattr(job, field, values[field])
    for field in DETAIL_FIELDS:
        if field in values:
            setattr(detail, field, values[field])
    if "salary_min" in values or "salary_max" in values:
        job.salary_range = _salary_label(effective_min, effective_max)
    await db.commit()
    await db.refresh(job)
    counts = (await _status_counts(db, [job.id]))[job.id]
    return _job_json(job, detail, counts)


@router.post("/jobs/{job_id}/publish")
async def publish_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                      user: User = Depends(_EMPLOYER)):
    """Publishes a draft, or resumes a paused job. Both go to open after the same validation."""
    job = await _employer_job(db, job_id, user)
    _raise_for_status(job, ("draft", "paused"), "publish")
    problems = _publish_problems(job, await _load_detail(db, job.id), await _load_requirements(db, job.id))
    if problems:
        raise HTTPException(status_code=422, detail={"message": "Job is not ready to publish", "problems": problems})
    job.status = "open"
    if job.posted_at is None:
        job.posted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(job)
    return _job_json(job, await _load_detail(db, job.id), (await _status_counts(db, [job.id]))[job.id])


@router.post("/jobs/{job_id}/pause")
async def pause_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                    user: User = Depends(_EMPLOYER)):
    job = await _employer_job(db, job_id, user)
    _raise_for_status(job, ("open",), "pause")
    job.status = "paused"
    await db.commit()
    await db.refresh(job)
    return _job_json(job, await _load_detail(db, job.id), (await _status_counts(db, [job.id]))[job.id])


@router.post("/jobs/{job_id}/close")
async def close_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                    user: User = Depends(_EMPLOYER)):
    job = await _employer_job(db, job_id, user)
    _raise_for_status(job, ("draft", "open", "paused"), "close")
    job.status = "closed"
    await db.commit()
    await db.refresh(job)
    return _job_json(job, await _load_detail(db, job.id), (await _status_counts(db, [job.id]))[job.id])


# ---------------------------------------------------------------- requirements

@router.get("/jobs/{job_id}/requirements")
async def get_job_requirements(job_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                               user: User = Depends(_EMPLOYER)):
    job = await _employer_job(db, job_id, user)
    rows = await _load_requirements(db, job.id)
    return {"job_id": str(job.id), "requirements": [_requirement_json(r) for r in rows]}


@router.put("/jobs/{job_id}/requirements")
async def replace_job_requirements(job_id: uuid.UUID, data: RequirementsPut,
                                   db: AsyncSession = Depends(get_db),
                                   user: User = Depends(_EMPLOYER)):
    """Replaces the job's skill requirements. Education, experience and certifications are set on the posting."""
    job = await _employer_job(db, job_id, user)
    _raise_for_status(job, ("draft", "open", "paused"), "edit requirements of")
    seen: set[str] = set()
    for item in data.requirements:
        key = _norm_key(item.skill_name)
        if key in seen:
            raise HTTPException(status_code=422, detail=f"Duplicate skill requirement: {item.skill_name}")
        seen.add(key)

    skill_ids: dict[str, uuid.UUID] = {}
    lowered = [i.skill_name.strip().lower() for i in data.requirements]
    if lowered:
        found = (await db.execute(select(Skill).where(func.lower(Skill.name).in_(lowered)))).scalars().all()
        skill_ids = {_norm_key(s.name): s.id for s in found}
    requested_ids = {i.skill_id for i in data.requirements if i.skill_id is not None}
    if requested_ids:
        known = set((await db.execute(select(Skill.id).where(Skill.id.in_(list(requested_ids))))).scalars().all())
        if requested_ids - known:
            raise HTTPException(status_code=422, detail="Unknown skill_id")

    await db.execute(JobRequirement.__table__.delete().where(JobRequirement.job_id == job.id))
    rows: list[JobRequirement] = []
    for item in data.requirements:
        min_prof = item.min_proficiency if item.min_proficiency is not None else (
            LEVEL_PROFICIENCY[item.min_level] if item.min_level else None)
        rows.append(JobRequirement(
            id=uuid.uuid4(), job_id=job.id, kind="skill",
            skill_id=item.skill_id or skill_ids.get(_norm_key(item.skill_name)),
            skill_name=item.skill_name.strip(), requirement_type=item.requirement_type,
            min_proficiency=min_prof, weight=item.weight))
    db.add_all(rows)
    # Keep the legacy skills_required list (read by the trainee-facing matcher) in sync.
    job.skills_required = [r.skill_name for r in rows if r.requirement_type == "required"]
    await db.commit()
    return {"job_id": str(job.id), "requirements": [_requirement_json(r) for r in rows]}


# ---------------------------------------------------------------- matching

def candidate_summary(trainee: User, profile: UserProfile, facts: CandidateFacts,
                      score: Optional[int] = None) -> dict:
    """Shared candidate card used by the search list and the match list (CandidateSummary in FE-2)."""
    skills = sorted(facts.skills, key=lambda s: (_norm_key(s.name), s.name))
    return {
        "id": str(trainee.id), "name": trainee.full_name,
        "location": ", ".join(v for v in (profile.district, profile.state) if v),
        "occupation": profile.occupation, "match_score": score,
        "photo_url": profile.photo_url, "education_level": profile.education_level,
        "years_of_experience": profile.years_of_experience,
        # Not captured on the profile yet: returned as null so the UI shows "Not available".
        "availability": None, "languages": None,
        "certificate_count": sum(1 for cert in facts.certificates if cert.valid),
        "skills": [{"name": s.name, "level": s.level or DEFAULT_LEVEL, "verified": s.verified} for s in skills],
    }


def _match_item(trainee: User, profile: UserProfile, facts: CandidateFacts, result: dict, applied: bool) -> dict:
    return {
        "candidate": candidate_summary(trainee, profile, facts, result["score"]),
        "score": result["score"], "applied": applied,
        "breakdown": result["breakdown"], "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"], "explanation": result["explanation"],
        "recommended_action": result["recommended_action"],
    }


def _explanation_text(result: dict) -> str:
    return " ".join(item["text"] for item in result["explanation"])


@router.get("/jobs/{job_id}/matches")
async def job_matches(job_id: uuid.UUID,
                      min_score: Optional[int] = Query(None, ge=0, le=100),
                      limit: int = Query(50, ge=1, le=200),
                      offset: int = Query(0, ge=0),
                      db: AsyncSession = Depends(get_db),
                      user: User = Depends(_EMPLOYER)):
    job = await _employer_job(db, job_id, user)
    detail = await _load_detail(db, job.id)
    requirements = await _load_requirements(db, job.id)
    applicants = await _applicant_ids_for_job(db, job.id)
    visible = UserProfile.visible_to_employers.is_(True)
    pool_filter = or_(visible, User.id.in_(list(applicants))) if applicants else visible
    pool = (await db.execute(select(User, UserProfile)
                             .join(UserProfile, UserProfile.user_id == User.id)
                             .where(User.role == "trainee", User.is_active.is_(True), pool_filter)
                             .order_by(User.id).limit(CANDIDATE_POOL_CAP + 1))).all()
    truncated = len(pool) > CANDIDATE_POOL_CAP
    pool = pool[:CANDIDATE_POOL_CAP]
    facts = await load_candidate_facts(db, {trainee.id: profile for trainee, profile in pool})
    job_facts = JobFacts(location=job.location)
    criteria = _criteria_facts(requirements, detail)
    scored = [(trainee, profile, facts[trainee.id], score_candidate(job_facts, criteria, facts[trainee.id]))
              for trainee, profile in pool]

    if scored:
        # Persist the latest score per (job, candidate) to the existing job_matches table.
        existing = {m.trainee_id: m for m in (await db.execute(select(JobMatch).where(
            JobMatch.job_id == job.id, JobMatch.trainee_id.in_([t.id for t, _, _, _ in scored])))).scalars().all()}
        now = datetime.now(timezone.utc)
        for trainee, _, _, result in scored:
            row = existing.get(trainee.id)
            if row is None:
                row = JobMatch(id=uuid.uuid4(), job_id=job.id, trainee_id=trainee.id, created_at=now)
                db.add(row)
            row.match_score = result["score"]
            row.matched_skills = result["matched_skills"]
            row.missing_skills = result["missing_skills"]
            row.explanation = _explanation_text(result)
        await db.commit()

    ranked = sorted(scored, key=lambda item: (-item[3]["score"], item[0].full_name or "", str(item[0].id)))
    if min_score is not None:
        ranked = [item for item in ranked if item[3]["score"] >= min_score]
    page = ranked[offset:offset + limit]
    return {
        "job": {"id": str(job.id), "title": job.title,
                "required_skills": [r.skill_name for r in requirements if r.requirement_type == "required"]},
        "matches": [_match_item(t, p, f, r, t.id in applicants) for t, p, f, r in page],
        "total": len(ranked), "limit": limit, "offset": offset,
        "pool_size": len(pool), "pool_truncated": truncated,
    }
