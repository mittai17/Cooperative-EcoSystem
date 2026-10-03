"""Trainer assessments endpoints (included under /api/v1/trainer).

Scoping: every assessment is reached through `tm.trainer_classes` (batch_courses.trainer_id).
A trainer can only create assessments for a (batch, course) pair they teach, and can only read
or grade assessments whose batch they teach. Trainee email/phone are never returned.
AI-drafted questions are only ever persisted when the trainer submits them through POST/PUT.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Assessment, AssessmentAttempt, AssessmentQuestion, AssessmentResult, Enrollment, ManualGrade, Skill,
    TraineeSkill, User,
)
from app.services import trainer_metrics as tm

log = logging.getLogger(__name__)
router = APIRouter()

DEMO_TRAINER_EMAIL = "s.kumar@vamnicom-demo.example.com"
MANUAL_TYPES = ("short_answer", "practical")
AUTO_TYPES = ("mcq_single", "mcq_multi", "true_false")


async def _trainer(x_demo_user: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    """Same logic as trainer.current_trainer (re-declared to avoid a circular import)."""
    email = (x_demo_user or DEMO_TRAINER_EMAIL).strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or user.role != "trainer" or user.is_active is False:
        raise HTTPException(status_code=403, detail="No trainer account for this demo user")
    return user


def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


def _aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is not None and dt.tzinfo is None:
        return dt.replace(tzinfo=tm.IST)
    return dt


# ----------------------------------------------------------------------------
# Schemas
# ----------------------------------------------------------------------------
class OptionIn(BaseModel):
    id: str = Field(min_length=1, max_length=20)
    text: str = Field(min_length=1, max_length=1000)


class QuestionIn(BaseModel):
    type: Literal["mcq_single", "mcq_multi", "true_false", "short_answer", "practical"]
    prompt: str = Field(min_length=1, max_length=4000)
    options: Optional[list[OptionIn]] = None
    correct: list[str] = Field(default_factory=list)
    explanation: Optional[str] = Field(default=None, max_length=4000)
    marks: int = Field(default=1, ge=1, le=100)

    @model_validator(mode="after")
    def _check(self):
        if self.type in ("mcq_single", "mcq_multi"):
            opts = self.options or []
            if len(opts) < 2:
                raise ValueError("MCQ questions need at least 2 options")
            ids = [o.id for o in opts]
            if len(set(ids)) != len(ids):
                raise ValueError("Option ids must be unique")
            if not self.correct or any(c not in ids for c in self.correct):
                raise ValueError("Correct answer must reference an option")
            if self.type == "mcq_single" and len(self.correct) != 1:
                raise ValueError("Single-choice questions need exactly one correct option")
        elif self.type == "true_false":
            self.options = None
            if len(self.correct) != 1 or self.correct[0].lower() not in ("true", "false"):
                raise ValueError("True/false questions need correct = ['true'] or ['false']")
            self.correct = [self.correct[0].lower()]
        else:
            self.options = None
            if not self.correct or not any(c.strip() for c in self.correct):
                raise ValueError("Provide an expected answer / rubric for this question")
        return self


class AssessmentIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    course_id: uuid.UUID
    module_title: Optional[str] = Field(default=None, max_length=255)
    batch_id: uuid.UUID
    description: Optional[str] = Field(default=None, max_length=4000)
    instructions: Optional[str] = Field(default=None, max_length=4000)
    duration_minutes: int = Field(default=30, ge=1, le=600)
    passing_score: int = Field(default=50, ge=0, le=100)
    scheduled_at: Optional[datetime] = None
    status: Literal["draft", "published"] = "draft"
    questions: list[QuestionIn] = Field(default_factory=list, max_length=200)

    @field_validator("title")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title is required")
        return v

    @model_validator(mode="after")
    def _publish_needs_questions(self):
        if self.status == "published" and not self.questions:
            raise ValueError("Add at least one question before publishing")
        return self


class GradeItem(BaseModel):
    question_id: uuid.UUID
    marks: int = Field(ge=0)
    feedback: Optional[str] = Field(default=None, max_length=4000)


class GradeIn(BaseModel):
    attempt_id: uuid.UUID
    grades: list[GradeItem] = Field(min_length=1)
    overall_feedback: Optional[str] = Field(default=None, max_length=4000)


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
async def _owned_class(db: AsyncSession, trainer: User, batch_id: uuid.UUID, course_id: uuid.UUID):
    for _, b, c in await tm.trainer_classes(db, trainer.id):
        if b.id == batch_id and c.id == course_id:
            return b, c
    raise HTTPException(status_code=403, detail="You do not teach this course to this batch")


async def _owned_assessment(db: AsyncSession, trainer: User, assessment_id: uuid.UUID) -> Assessment:
    a = (await db.execute(select(Assessment).where(Assessment.id == assessment_id))).scalar_one_or_none()
    batch_ids = {b.id for _, b, _ in await tm.trainer_classes(db, trainer.id)}
    if a is None or a.batch_id not in batch_ids:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return a


def _group(a: Assessment, now: datetime) -> str:
    if a.status == "draft":
        return "drafts"
    when = a.scheduled_at or a.due_date
    if when is not None and when < now:
        return "completed"
    if when is not None and when >= now:
        return "upcoming"
    return "published"


async def _roster(db: AsyncSession, batch_id: uuid.UUID) -> list[User]:
    rows = await db.execute(
        select(User).join(Enrollment, Enrollment.trainee_id == User.id)
        .where(Enrollment.batch_id == batch_id).order_by(User.full_name))
    return list(rows.scalars().unique())


async def _latest_attempts(db: AsyncSession, assessment_id: uuid.UUID) -> dict[uuid.UUID, AssessmentAttempt]:
    rows = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.assessment_id == assessment_id,
                                        AssessmentAttempt.submitted_at.is_not(None))
        .order_by(AssessmentAttempt.attempt_no))
    out: dict[uuid.UUID, AssessmentAttempt] = {}
    for at in rows.scalars():
        out[at.trainee_id] = at  # ascending attempt_no -> last wins
    return out


def _result_label(at: AssessmentAttempt) -> str:
    if at.status == "needs_review":
        return "Needs Review"
    return "Passed" if at.passed else "Failed"


async def _replace_questions(db: AsyncSession, assessment: Assessment, questions: list[QuestionIn]) -> None:
    await db.execute(delete(AssessmentQuestion).where(AssessmentQuestion.assessment_id == assessment.id))
    await db.flush()
    for pos, q in enumerate(questions, 1):
        db.add(AssessmentQuestion(
            assessment_id=assessment.id, position=pos, type=q.type, prompt=q.prompt.strip(),
            options=[o.model_dump() for o in q.options] if q.options else None,
            correct=q.correct, explanation=(q.explanation or None), marks=q.marks, topic=assessment.skill_name))
    assessment.total_questions = len(questions)


def _apply(a: Assessment, body: AssessmentIn, course_title: str, trainer: User, create: bool) -> None:
    a.title = body.title
    a.course_id = body.course_id
    a.batch_id = body.batch_id
    a.module_title = (body.module_title or "").strip() or None
    a.description = body.description
    a.instructions = body.instructions
    a.duration_minutes = body.duration_minutes
    a.passing_score = body.passing_score
    a.scheduled_at = _aware(body.scheduled_at)
    a.due_date = a.scheduled_at
    a.status = body.status
    a.skill_name = a.skill_name or course_title
    if create:
        a.created_by = trainer.id


def _auto_correct(q: AssessmentQuestion, answer) -> bool:
    given = answer if isinstance(answer, list) else ([answer] if answer is not None else [])
    norm = lambda xs: sorted(str(x).strip().lower() for x in xs)  # noqa: E731
    return norm(given) == norm(q.correct or [])


# ----------------------------------------------------------------------------
# Endpoints
# ----------------------------------------------------------------------------
@router.get("/assessments/options")
async def assessment_options(db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    """Batch/course pairs this trainer teaches (feeds the create form + filters)."""
    classes = await tm.trainer_classes(db, trainer.id)
    return {"classes": [{"batch_id": str(b.id), "batch": b.name, "course_id": str(c.id), "course": c.title}
                        for _, b, c in classes]}


@router.get("/assessments")
async def list_assessments(
    status: Optional[str] = Query(None), batch_id: Optional[uuid.UUID] = None, course_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer),
):
    classes = await tm.trainer_classes(db, trainer.id)
    batch_name = {b.id: b.name for _, b, _ in classes}
    course_name = {c.id: c.title for _, _, c in classes}
    pairs = {(b.id, c.id) for _, b, c in classes}
    if not pairs:
        return {"counts": {"upcoming": 0, "drafts": 0, "published": 0, "completed": 0}, "assessments": []}
    q = select(Assessment).where(Assessment.batch_id.in_(list(batch_name)))
    if batch_id:
        q = q.where(Assessment.batch_id == batch_id)
    if course_id:
        q = q.where(Assessment.course_id == course_id)
    items = [a for a in (await db.execute(q.order_by(Assessment.scheduled_at.desc().nullslast(), Assessment.created_at.desc()))).scalars()
             if (a.batch_id, a.course_id) in pairs]
    now = datetime.now(timezone.utc)
    ids = [a.id for a in items]
    qcount = dict((await db.execute(select(AssessmentQuestion.assessment_id, func.count())
                                    .where(AssessmentQuestion.assessment_id.in_(ids)).group_by(AssessmentQuestion.assessment_id))).all()) if ids else {}
    attempts: dict[uuid.UUID, list[AssessmentAttempt]] = {}
    if ids:
        for at in (await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.assessment_id.in_(ids),
                                                                     AssessmentAttempt.submitted_at.is_not(None)))).scalars():
            attempts.setdefault(at.assessment_id, []).append(at)
    roster_size: dict[uuid.UUID, int] = {}
    for bid in {a.batch_id for a in items}:
        roster_size[bid] = (await db.execute(select(func.count()).select_from(Enrollment).where(Enrollment.batch_id == bid))).scalar_one()

    out, counts = [], {"upcoming": 0, "drafts": 0, "published": 0, "completed": 0}
    for a in items:
        grp = _group(a, now)
        if grp != "published":
            counts[grp] += 1
        if a.status == "published":
            counts["published"] += 1
        latest: dict[uuid.UUID, AssessmentAttempt] = {}
        for at in sorted(attempts.get(a.id, []), key=lambda x: x.attempt_no):
            latest[at.trainee_id] = at
        out.append({
            "id": str(a.id), "title": a.title, "course": course_name.get(a.course_id), "course_id": str(a.course_id),
            "module": a.module_title, "batch": batch_name.get(a.batch_id), "batch_id": str(a.batch_id),
            "questions": qcount.get(a.id, 0), "duration_minutes": a.duration_minutes, "passing_score": a.passing_score,
            "scheduled_at": _iso(a.scheduled_at), "status": a.status, "group": grp,
            "submitted": len(latest), "total": roster_size.get(a.batch_id, 0),
            "needs_review": sum(1 for x in latest.values() if x.status == "needs_review"),
            "avg_score": tm.avg([x.score for x in latest.values()]),
        })
    if status:
        s = status.lower()
        key = {"draft": "drafts"}.get(s, s)
        if key == "published":
            out = [o for o in out if o["status"] == "published"]
        elif key in counts:
            out = [o for o in out if o["group"] == key]
        else:
            raise HTTPException(status_code=422, detail="Unknown status filter")
    return {"counts": counts, "assessments": out}


async def _save(db, trainer, body: AssessmentIn, a: Optional[Assessment]):
    _, course = await _owned_class(db, trainer, body.batch_id, body.course_id)
    create = a is None
    if create:
        a = Assessment()
    _apply(a, body, course.title, trainer, create)
    if create:
        db.add(a)
    await db.flush()
    await _replace_questions(db, a, body.questions)
    await db.commit()
    return {"id": str(a.id), "status": a.status, "questions": len(body.questions)}


@router.post("/assessments", status_code=201)
async def create_assessment(body: AssessmentIn, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    return await _save(db, trainer, body, None)


@router.put("/assessments/{assessment_id}")
async def update_assessment(assessment_id: uuid.UUID, body: AssessmentIn, db: AsyncSession = Depends(get_db),
                            trainer: User = Depends(_trainer)):
    a = await _owned_assessment(db, trainer, assessment_id)
    if a.status != "draft":
        raise HTTPException(status_code=409, detail="Only draft assessments can be edited")
    return await _save(db, trainer, body, a)


@router.post("/assessments/{assessment_id}/publish")
async def publish_assessment(assessment_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    a = await _owned_assessment(db, trainer, assessment_id)
    n = (await db.execute(select(func.count()).select_from(AssessmentQuestion)
                          .where(AssessmentQuestion.assessment_id == a.id))).scalar_one()
    if n == 0:
        raise HTTPException(status_code=422, detail="Add at least one question before publishing")
    a.status = "published"
    await db.commit()
    return {"id": str(a.id), "status": "published"}


@router.get("/assessments/{assessment_id}")
async def assessment_detail(assessment_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    a = await _owned_assessment(db, trainer, assessment_id)
    classes = await tm.trainer_classes(db, trainer.id)
    batch = next((b for _, b, _ in classes if b.id == a.batch_id), None)
    course = next((c for _, _, c in classes if c.id == a.course_id), None)
    roster = await _roster(db, a.batch_id)
    latest = await _latest_attempts(db, a.id)
    rows = []
    for u in roster:
        at = latest.get(u.id)
        rows.append({
            "trainee_id": str(u.id), "trainee": u.full_name,
            "score": at.score if at else None, "status": _result_label(at) if at else "Pending",
            "attempt_no": at.attempt_no if at else None, "submitted_at": _iso(at.submitted_at) if at else None,
            "attempt_id": str(at.id) if at else None,
        })
    scored = [x for x in latest.values() if x.score is not None and x.status != "needs_review"]
    questions = (await db.execute(select(AssessmentQuestion).where(AssessmentQuestion.assessment_id == a.id)
                                  .order_by(AssessmentQuestion.position))).scalars().all()
    return {
        "assessment": {
            "id": str(a.id), "title": a.title, "course": course.title if course else None, "course_id": str(a.course_id),
            "module": a.module_title, "batch": batch.name if batch else None, "batch_id": str(a.batch_id),
            "description": a.description, "instructions": a.instructions, "duration_minutes": a.duration_minutes,
            "passing_score": a.passing_score, "scheduled_at": _iso(a.scheduled_at), "status": a.status,
            "questions": [{"id": str(q.id), "type": q.type, "prompt": q.prompt, "options": q.options, "correct": q.correct,
                           "explanation": q.explanation, "marks": q.marks} for q in questions],
        },
        "totals": {
            "total_trainees": len(roster), "submitted": len(latest), "pending": len(roster) - len(latest),
            "needs_review": sum(1 for x in latest.values() if x.status == "needs_review"),
            "avg_score": tm.avg([x.score for x in scored]),
            "pass_rate": tm.pct(sum(1 for x in scored if x.passed), len(scored)),
        },
        "rows": rows,
    }


@router.get("/assessments/{assessment_id}/attempts/{attempt_id}")
async def attempt_detail(assessment_id: uuid.UUID, attempt_id: uuid.UUID, db: AsyncSession = Depends(get_db),
                         trainer: User = Depends(_trainer)):
    a = await _owned_assessment(db, trainer, assessment_id)
    at = (await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id,
                                                           AssessmentAttempt.assessment_id == a.id))).scalar_one_or_none()
    if at is None:
        raise HTTPException(status_code=404, detail="Attempt not found")
    trainee = (await db.execute(select(User).where(User.id == at.trainee_id))).scalar_one()
    questions = (await db.execute(select(AssessmentQuestion).where(AssessmentQuestion.assessment_id == a.id)
                                  .order_by(AssessmentQuestion.position))).scalars().all()
    grades = {g.question_id: g for g in (await db.execute(select(ManualGrade).where(ManualGrade.attempt_id == at.id))).scalars()}
    answers = at.answers or {}
    out = []
    for q in questions:
        ans = answers.get(str(q.id))
        auto = q.type in AUTO_TYPES
        g = grades.get(q.id)
        out.append({
            "id": str(q.id), "position": q.position, "type": q.type, "prompt": q.prompt, "options": q.options,
            "trainee_answer": ans, "expected": q.correct, "explanation": q.explanation, "max_marks": q.marks,
            "auto_graded": auto,
            "auto_marks": (q.marks if _auto_correct(q, ans) else 0) if auto else None,
            "manual_grade": {"marks": g.marks, "feedback": g.feedback, "graded_at": _iso(g.graded_at)} if g else None,
        })
    result = (await db.execute(select(AssessmentResult).where(AssessmentResult.assessment_id == a.id,
                                                              AssessmentResult.trainee_id == at.trainee_id))).scalar_one_or_none()
    return {
        "assessment": {"id": str(a.id), "title": a.title, "passing_score": a.passing_score},
        "attempt": {"id": str(at.id), "attempt_no": at.attempt_no, "status": at.status, "score": at.score, "passed": at.passed,
                    "submitted_at": _iso(at.submitted_at), "result": _result_label(at)},
        "trainee": {"id": str(trainee.id), "name": trainee.full_name},
        "overall_feedback": result.feedback if result else None,
        "questions": out,
    }


async def _update_skill_passport(db: AsyncSession, a: Assessment, trainee_id: uuid.UUID, score: int) -> None:
    """Best-effort: never fails the grading request."""
    if not a.skill_name:
        return
    try:
        async with db.begin_nested():
            skill = (await db.execute(select(Skill).where(Skill.name == a.skill_name))).scalar_one_or_none()
            if skill is None:
                return
            ts = (await db.execute(select(TraineeSkill).where(TraineeSkill.trainee_id == trainee_id,
                                                              TraineeSkill.skill_id == skill.id))).scalar_one_or_none()
            if ts is None:
                ts = TraineeSkill(trainee_id=trainee_id, skill_id=skill.id, confidence=score, evidence=[])
                db.add(ts)
            evidence = [e for e in (ts.evidence or []) if not (isinstance(e, dict) and e.get("type") == "assessment"
                                                              and e.get("title") == a.title)]
            evidence.append({"type": "assessment", "title": a.title, "score": score,
                             "date": datetime.now(tm.IST).date().isoformat()})
            ts.evidence = evidence
            cur = ts.confidence if ts.confidence is not None else score
            ts.confidence = max(0, min(100, round(cur + 0.4 * (score - cur))))
            await db.flush()
    except Exception:  # noqa: BLE001 - passport sync must not block grading
        log.exception("skill passport update failed for assessment %s", a.id)


@router.post("/assessments/{assessment_id}/grade")
async def grade_attempt(assessment_id: uuid.UUID, body: GradeIn, db: AsyncSession = Depends(get_db),
                        trainer: User = Depends(_trainer)):
    a = await _owned_assessment(db, trainer, assessment_id)
    at = (await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.id == body.attempt_id,
                                                           AssessmentAttempt.assessment_id == a.id))).scalar_one_or_none()
    if at is None:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if at.submitted_at is None:
        raise HTTPException(status_code=409, detail="Attempt has not been submitted")
    questions = {q.id: q for q in (await db.execute(select(AssessmentQuestion).where(AssessmentQuestion.assessment_id == a.id))).scalars()}
    seen = set()
    for g in body.grades:
        q = questions.get(g.question_id)
        if q is None:
            raise HTTPException(status_code=422, detail="Question does not belong to this assessment")
        if q.type not in MANUAL_TYPES:
            raise HTTPException(status_code=422, detail="Only short-answer/practical questions can be graded manually")
        if g.marks > q.marks:
            raise HTTPException(status_code=422, detail=f"Marks for question {q.position} must be between 0 and {q.marks}")
        if g.question_id in seen:
            raise HTTPException(status_code=422, detail="Duplicate question in grades")
        seen.add(g.question_id)

    existing = {g.question_id: g for g in (await db.execute(select(ManualGrade).where(ManualGrade.attempt_id == at.id))).scalars()}
    now = datetime.now(timezone.utc)
    for g in body.grades:
        row = existing.get(g.question_id)
        if row is None:
            row = ManualGrade(attempt_id=at.id, question_id=g.question_id)
            db.add(row)
            existing[g.question_id] = row
        row.marks, row.feedback, row.graded_by, row.graded_at = g.marks, g.feedback, trainer.id, now

    total = sum(q.marks for q in questions.values())
    earned = sum(q.marks for q in questions.values() if q.type in AUTO_TYPES and _auto_correct(q, (at.answers or {}).get(str(q.id))))
    earned += sum(r.marks for qid, r in existing.items() if qid in questions)
    score = round(100 * earned / total) if total else 0
    all_graded = all(q.id in existing for q in questions.values() if q.type in MANUAL_TYPES)
    at.score = score
    at.passed = score >= (a.passing_score or 0)
    at.status = "submitted" if all_graded else "needs_review"

    if all_graded:
        res = (await db.execute(select(AssessmentResult).where(AssessmentResult.assessment_id == a.id,
                                                               AssessmentResult.trainee_id == at.trainee_id))).scalar_one_or_none()
        if res is None:
            res = AssessmentResult(assessment_id=a.id, trainee_id=at.trainee_id, score=score, passed=at.passed,
                                   submitted_at=at.submitted_at)
            db.add(res)
        res.score, res.passed = score, at.passed
        if body.overall_feedback is not None:
            res.feedback = body.overall_feedback
        await db.flush()
        await _update_skill_passport(db, a, at.trainee_id, score)
    await db.commit()
    return {"attempt_id": str(at.id), "score": score, "passed": at.passed, "status": at.status,
            "result": _result_label(at), "fully_graded": all_graded}
