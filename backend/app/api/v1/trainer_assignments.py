"""Trainer assignments endpoints (included under /api/v1/trainer).

Scoped through `tm.trainer_classes`: assignments can only be created for a batch (and
course) the trainer teaches and only read/graded when their batch is the trainer's.
Trainee email/phone are never returned.
"""
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Assignment, AssignmentSubmission, Enrollment, User
from app.services import trainer_metrics as tm

router = APIRouter()
DEMO_TRAINER_EMAIL = "s.kumar@vamnicom-demo.example.com"


async def _trainer(x_demo_user: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    """Same logic as trainer.current_trainer (re-declared to avoid a circular import)."""
    email = (x_demo_user or DEMO_TRAINER_EMAIL).strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or user.role != "trainer" or user.is_active is False:
        raise HTTPException(status_code=403, detail="No trainer account for this demo user")
    return user


def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


class ResourceIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    url: str = Field(min_length=1, max_length=1000, pattern=r"^https?://")


class AssignmentIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=8000)
    batch_id: uuid.UUID
    course_id: uuid.UUID
    deadline: Optional[datetime] = None
    max_marks: int = Field(default=100, ge=1, le=1000)
    resources: list[ResourceIn] = Field(default_factory=list, max_length=20)
    status: Literal["draft", "published"] = "published"


class AssignmentGradeIn(BaseModel):
    submission_id: uuid.UUID
    marks: int = Field(ge=0)
    feedback: Optional[str] = Field(default=None, max_length=4000)


async def _owned(db: AsyncSession, trainer: User, assignment_id: uuid.UUID) -> Assignment:
    a = (await db.execute(select(Assignment).where(Assignment.id == assignment_id))).scalar_one_or_none()
    batch_ids = {b.id for _, b, _ in await tm.trainer_classes(db, trainer.id)}
    if a is None or a.batch_id not in batch_ids:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return a


@router.get("/assignments/options")
async def assignment_options(db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    classes = await tm.trainer_classes(db, trainer.id)
    return {"classes": [{"batch_id": str(b.id), "batch": b.name, "course_id": str(c.id), "course": c.title}
                        for _, b, c in classes]}


@router.get("/assignments")
async def list_assignments(db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    classes = await tm.trainer_classes(db, trainer.id)
    batch_name = {b.id: b.name for _, b, _ in classes}
    course_name = {c.id: c.title for _, _, c in classes}
    if not batch_name:
        return {"assignments": []}
    items = (await db.execute(select(Assignment).where(Assignment.batch_id.in_(list(batch_name)))
                              .order_by(Assignment.deadline.desc().nullslast(), Assignment.created_at.desc()))).scalars().all()
    roster = {}
    for bid in batch_name:
        roster[bid] = (await db.execute(select(func.count()).select_from(Enrollment).where(Enrollment.batch_id == bid))).scalar_one()
    subs: dict[uuid.UUID, list[AssignmentSubmission]] = {}
    if items:
        for s in (await db.execute(select(AssignmentSubmission).where(
                AssignmentSubmission.assignment_id.in_([a.id for a in items])))).scalars():
            subs.setdefault(s.assignment_id, []).append(s)
    now = datetime.now(timezone.utc)
    out = []
    for a in items:
        ss = subs.get(a.id, [])
        graded = sum(1 for s in ss if s.status == "graded")
        out.append({
            "id": str(a.id), "title": a.title, "description": a.description, "batch": batch_name.get(a.batch_id),
            "batch_id": str(a.batch_id), "course": course_name.get(a.course_id), "course_id": str(a.course_id) if a.course_id else None,
            "deadline": _iso(a.deadline), "overdue": bool(a.deadline and a.deadline < now), "max_marks": a.max_marks,
            "status": a.status, "assigned": roster.get(a.batch_id, 0), "submitted": len(ss),
            "pending": max(0, roster.get(a.batch_id, 0) - len(ss)), "graded": graded, "to_grade": len(ss) - graded,
        })
    return {"assignments": out}


@router.post("/assignments", status_code=201)
async def create_assignment(body: AssignmentIn, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    if not any(b.id == body.batch_id and c.id == body.course_id for _, b, c in await tm.trainer_classes(db, trainer.id)):
        raise HTTPException(status_code=403, detail="You do not teach this course to this batch")
    title = body.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="Title is required")
    deadline = body.deadline
    if deadline is not None and deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=tm.IST)
    a = Assignment(batch_id=body.batch_id, course_id=body.course_id, title=title, description=body.description,
                   deadline=deadline, max_marks=body.max_marks, resources=[r.model_dump() for r in body.resources],
                   status=body.status, created_by=trainer.id)
    db.add(a)
    await db.commit()
    return {"id": str(a.id), "status": a.status}


@router.get("/assignments/{assignment_id}")
async def assignment_detail(assignment_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    a = await _owned(db, trainer, assignment_id)
    classes = await tm.trainer_classes(db, trainer.id)
    batch = next((b for _, b, _ in classes if b.id == a.batch_id), None)
    course = next((c for _, _, c in classes if c.id == a.course_id), None)
    roster = (await db.execute(select(User).join(Enrollment, Enrollment.trainee_id == User.id)
                               .where(Enrollment.batch_id == a.batch_id).order_by(User.full_name))).scalars().unique().all()
    subs = {s.trainee_id: s for s in (await db.execute(select(AssignmentSubmission).where(
        AssignmentSubmission.assignment_id == a.id))).scalars()}
    rows = []
    for u in roster:
        s = subs.get(u.id)
        rows.append({
            "trainee_id": str(u.id), "trainee": u.full_name, "submission_id": str(s.id) if s else None,
            "status": s.status if s else "pending", "submitted_at": _iso(s.submitted_at) if s else None,
            "content": s.content if s else None, "file_url": s.file_url if s else None,
            "marks": s.marks if s else None, "feedback": s.feedback if s else None,
        })
    graded = [s for s in subs.values() if s.marks is not None]
    return {
        "assignment": {"id": str(a.id), "title": a.title, "description": a.description, "batch": batch.name if batch else None,
                       "course": course.title if course else None, "deadline": _iso(a.deadline), "max_marks": a.max_marks,
                       "resources": a.resources or [], "status": a.status},
        "totals": {"assigned": len(roster), "submitted": len(subs), "pending": len(roster) - len(subs),
                   "graded": len(graded), "to_grade": len(subs) - len(graded),
                   "avg_marks": tm.avg([s.marks for s in graded])},
        "rows": rows,
    }


@router.post("/assignments/{assignment_id}/grade")
async def grade_submission(assignment_id: uuid.UUID, body: AssignmentGradeIn, db: AsyncSession = Depends(get_db),
                           trainer: User = Depends(_trainer)):
    a = await _owned(db, trainer, assignment_id)
    s = (await db.execute(select(AssignmentSubmission).where(AssignmentSubmission.id == body.submission_id,
                                                             AssignmentSubmission.assignment_id == a.id))).scalar_one_or_none()
    if s is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    if body.marks > a.max_marks:
        raise HTTPException(status_code=422, detail=f"Marks must be between 0 and {a.max_marks}")
    s.marks, s.feedback, s.status = body.marks, body.feedback, "graded"
    s.graded_by, s.graded_at = trainer.id, datetime.now(timezone.utc)
    await db.commit()
    return {"submission_id": str(s.id), "marks": s.marks, "status": s.status}
