"""Mobile-facing serializers and helpers.

The DB shape differs from what apps/mobile/src/types/index.ts expects (course
modules with per-trainee completion, job cards with match percentages,
profile header fields ...). Everything that adapts DB rows to those exact
shapes lives here so the routers stay thin.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, Module, ModuleProgress, CourseEnrollment
from app.models.job import Job, JobMatch, Application
from app.models.programme import Programme, Batch, Enrollment, Nomination
from app.models.skill import Skill, TraineeSkill
from app.models.user import User, Organisation

IST = timezone(timedelta(hours=5, minutes=30))

ATTENDANCE_METHOD_LABELS = {
    "qr": "QR Code Scan",
    "biometric_qr": "Biometric / QR",
    "manual": "Manual Entry",
    "offline_sync_qr": "QR Code Scan (synced)",
}


def initials(name: Optional[str]) -> str:
    """First + last word initial ("Ravindra Suresh Patil" -> "RP")."""
    parts = [p for p in (name or "").split() if p and p[0].isalpha()]
    if not parts:
        return "?"
    pick = parts if len(parts) == 1 else [parts[0], parts[-1]]
    return "".join(p[0] for p in pick).upper()


async def build_trainee_profile(db: AsyncSession, user: User) -> dict:
    """The `trainee` object the mobile Home/Profile screens render
    (mirrors the fields of the former MOCK_TRAINEE)."""
    org_name = None
    if user.organisation_id:
        org = (await db.execute(select(Organisation).where(Organisation.id == user.organisation_id))).scalar_one_or_none()
        org_name = org.name if org else None

    programme_title = None
    row = (
        await db.execute(
            select(Programme.title)
            .join(Batch, Batch.programme_id == Programme.id)
            .join(Enrollment, Enrollment.batch_id == Batch.id)
            .where(Enrollment.trainee_id == user.id)
            .order_by(Enrollment.enrolled_at.desc())
            .limit(1)
        )
    ).first()
    if row:
        programme_title = row[0]
    else:
        row = (
            await db.execute(
                select(Programme.title)
                .join(Nomination, Nomination.programme_id == Programme.id)
                .where(Nomination.trainee_id == user.id)
                .order_by(Nomination.submitted_at.desc())
                .limit(1)
            )
        ).first()
        programme_title = row[0] if row else None

    return {
        "id": str(user.id),
        "name": user.full_name or user.email,
        "email": user.email,
        "role": (user.role or "trainee").replace("_", " ").title(),
        "enrolled_institution": org_name,
        "programme": programme_title,
        "avatar_initials": initials(user.full_name or user.email),
    }


# ---------------------------------------------------------------------------
# Courses
# ---------------------------------------------------------------------------
def _module_duration(minutes: Optional[int]) -> str:
    return f"{minutes} min" if minutes else ""


def serialize_module(m: Module, completed: bool) -> dict:
    out = {
        "id": str(m.id),
        "title": m.title or "",
        "duration": _module_duration(m.duration_minutes),
        "completed": completed,
    }
    if m.video_url:
        out["video_url"] = m.video_url
    if m.summary:
        out["summary"] = m.summary
    return out


async def load_courses_for_mobile(
    db: AsyncSession,
    trainee_id: Optional[uuid.UUID],
    course_ids: Optional[List[uuid.UUID]] = None,
    with_modules: bool = True,
) -> List[dict]:
    """Courses in the mobile `Course` shape (with modules + per-trainee
    completion/progress). Uses a fixed number of queries regardless of the
    number of courses."""
    q = select(Course).where(Course.is_active == True)  # noqa: E712
    if course_ids is not None:
        q = select(Course).where(Course.id.in_(course_ids))
    courses = list((await db.execute(q)).scalars().all())
    if not courses:
        return []
    ids = [c.id for c in courses]

    modules_by_course: Dict[uuid.UUID, List[Module]] = {}
    if with_modules:
        mods = (
            await db.execute(
                select(Module).where(Module.course_id.in_(ids)).order_by(Module.position.asc().nulls_last(), Module.title.asc())
            )
        ).scalars().all()
        for m in mods:
            modules_by_course.setdefault(m.course_id, []).append(m)

    done: set = set()
    progress: Dict[uuid.UUID, int] = {}
    if trainee_id is not None:
        done = {
            r[0]
            for r in (
                await db.execute(select(ModuleProgress.module_id).where(ModuleProgress.trainee_id == trainee_id))
            ).all()
        }
        for cid, prog in (
            await db.execute(
                select(CourseEnrollment.course_id, func.max(CourseEnrollment.progress))
                .where(CourseEnrollment.trainee_id == trainee_id, CourseEnrollment.course_id.in_(ids))
                .group_by(CourseEnrollment.course_id)
            )
        ).all():
            progress[cid] = prog or 0

    out = []
    for c in courses:
        item = {
            "id": str(c.id),
            "title": c.title,
            "category": c.category or "",
            "level": c.level or "",
            "duration_hours": c.duration_hours or 0,
            "instructor": c.instructor or "",
            "rating": c.rating,
            "enrolled": c.enrolled_count or 0,
            "skills": c.skills or [],
            "progress": progress.get(c.id, 0),
            "enrolled_by_me": c.id in progress,
        }
        if with_modules:
            item["modules"] = [serialize_module(m, m.id in done) for m in modules_by_course.get(c.id, [])]
        out.append(item)
    # Enrolled first, then most popular, then title (deterministic).
    out.sort(key=lambda x: (not x["enrolled_by_me"], -x["enrolled"], x["title"]))
    return out


async def set_module_completion(
    db: AsyncSession, trainee_id: uuid.UUID, module_id: uuid.UUID, completed: bool
) -> Optional[dict]:
    """Mark a module (un)done for a trainee and recompute the course progress
    on their enrollment (created if missing). Returns None for an unknown
    module. Idempotent."""
    module = (await db.execute(select(Module).where(Module.id == module_id))).scalar_one_or_none()
    if module is None:
        return None
    existing = (
        await db.execute(
            select(ModuleProgress).where(
                ModuleProgress.trainee_id == trainee_id, ModuleProgress.module_id == module_id
            )
        )
    ).scalar_one_or_none()
    if completed and existing is None:
        db.add(ModuleProgress(id=uuid.uuid4(), trainee_id=trainee_id, module_id=module_id,
                              completed_at=datetime.now(timezone.utc)))
    elif not completed and existing is not None:
        await db.delete(existing)
    await db.flush()

    total = (await db.execute(select(func.count()).select_from(Module).where(Module.course_id == module.course_id))).scalar() or 0
    finished = (
        await db.execute(
            select(func.count())
            .select_from(ModuleProgress)
            .join(Module, Module.id == ModuleProgress.module_id)
            .where(ModuleProgress.trainee_id == trainee_id, Module.course_id == module.course_id)
        )
    ).scalar() or 0
    pct = round(finished / total * 100) if total else 0

    enrollment = (
        await db.execute(
            select(CourseEnrollment)
            .where(CourseEnrollment.trainee_id == trainee_id, CourseEnrollment.course_id == module.course_id)
            .order_by(CourseEnrollment.enrolled_at.asc())
            .limit(1)
        )
    ).scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if enrollment is None:
        enrollment = CourseEnrollment(id=uuid.uuid4(), trainee_id=trainee_id, course_id=module.course_id,
                                      progress=pct, status="active", enrolled_at=now, last_accessed=now)
        db.add(enrollment)
    else:
        enrollment.progress = pct
        enrollment.last_accessed = now
    enrollment.status = "completed" if pct >= 100 else "active"
    await db.flush()
    return {"course_id": str(module.course_id), "module_id": str(module_id), "completed": completed,
            "course_progress": pct}


# ---------------------------------------------------------------------------
# Jobs
# ---------------------------------------------------------------------------
def _norm(v: str) -> str:
    return v.strip().lower()


def skill_overlap_percent(required: List[str], owned: List[str]) -> Optional[int]:
    """Same rule the mobile client used: share of required skills that the
    passport holds (substring match either way). None if nothing required."""
    if not required:
        return None
    own = [_norm(o) for o in owned]
    hit = [r for r in required if any(_norm(r) in o or o in _norm(r) for o in own)]
    return round(len(hit) / len(required) * 100)


async def load_jobs_for_mobile(
    db: AsyncSession, trainee_id: Optional[uuid.UUID], limit: int = 50, skip: int = 0
) -> List[dict]:
    jobs = list((await db.execute(select(Job).order_by(Job.title.asc()).offset(skip).limit(limit))).scalars().all())
    if not jobs:
        return []
    ids = [j.id for j in jobs]
    owned: List[str] = []
    stored: Dict[uuid.UUID, int] = {}
    applied: set = set()
    if trainee_id is not None:
        owned = [
            r[0]
            for r in (
                await db.execute(
                    select(Skill.name).join(TraineeSkill, TraineeSkill.skill_id == Skill.id).where(TraineeSkill.trainee_id == trainee_id)
                )
            ).all()
        ]
        for jid, score in (
            await db.execute(
                select(JobMatch.job_id, JobMatch.match_score)
                .where(JobMatch.trainee_id == trainee_id, JobMatch.job_id.in_(ids))
                .order_by(JobMatch.created_at.asc())
            )
        ).all():
            if score is not None:
                stored[jid] = score  # ascending order -> latest wins
        applied = {
            r[0]
            for r in (
                await db.execute(select(Application.job_id).where(Application.applicant_id == trainee_id, Application.job_id.in_(ids)))
            ).all()
        }

    now = datetime.now(timezone.utc)
    out = []
    for j in jobs:
        skills = j.skills_required if isinstance(j.skills_required, list) else []
        item = {
            "id": str(j.id),
            "title": j.title,
            "employer": j.employer_name or "",
            "location": j.location or "",
            "sector": j.sector or "",
            "type": j.job_type or "",
            "salary": j.salary_range or "",
            "skills_required": skills,
            "applied": j.id in applied,
        }
        if j.openings is not None:
            item["openings"] = j.openings
        if j.posted_at is not None:
            item["posted_days_ago"] = max(0, (now - j.posted_at).days)
        if trainee_id is not None:
            pct = stored.get(j.id)
            if pct is None:
                pct = skill_overlap_percent(skills, owned)
            if pct is not None:
                item["match_percentage"] = pct
        out.append(item)
    out.sort(key=lambda x: -(x.get("match_percentage") if x.get("match_percentage") is not None else -1))
    return out
