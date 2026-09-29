"""Timed assessments graded only from the server question bank."""
from datetime import datetime, timedelta, timezone
import random
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import require_roles, require_user
from app.models.assessment import Assessment, AssessmentAttempt, AssessmentQuestion, AssessmentResult
from app.models.programme import Programme
from app.models.user import User
from app.services.skill_engine import level_for_score, upsert_trainee_skill

router = APIRouter()


def _uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, TypeError):
        raise HTTPException(404, "Assessment or attempt not found")


def _utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def _question(q: AssessmentQuestion) -> dict:
    return {"id": str(q.id), "position": q.position, "type": q.type,
            "prompt": q.prompt, "options": q.options or [], "marks": q.marks, "topic": q.topic}


async def _attempt(db: AsyncSession, attempt_id: str, user: User) -> AssessmentAttempt:
    attempt = await db.get(AssessmentAttempt, _uuid(attempt_id))
    if attempt is None or attempt.trainee_id != user.id:
        raise HTTPException(404, "Attempt not found")
    return attempt


@router.get("/")
async def list_assessments(db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Assessment).order_by(Assessment.created_at.desc()))).scalars().all()
    return {"assessments": [{"id": str(a.id), "title": a.title, "skill": a.skill_name,
                              "due_date": a.due_date.isoformat() if a.due_date else None,
                              "duration_minutes": a.duration_minutes, "status": "upcoming"} for a in rows]}


@router.get("/my")
async def my_assessments(user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    assessments = (await db.execute(select(Assessment).order_by(Assessment.created_at.desc()))).scalars().all()
    attempts = (await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.trainee_id == user.id))).scalars().all()
    result = []
    for assessment in assessments:
        own = [a for a in attempts if a.assessment_id == assessment.id]
        open_attempt = next((a for a in own if a.status == "in_progress" and a.expires_at and _utc(a.expires_at) > datetime.now(timezone.utc)), None)
        scores = [a.score for a in own if a.score is not None]
        result.append({"id": str(assessment.id), "title": assessment.title, "duration_minutes": assessment.duration_minutes,
                       "passing_score": assessment.passing_score, "due_date": assessment.due_date.isoformat() if assessment.due_date else None,
                       "status": "in_progress" if open_attempt else "completed" if scores else "upcoming",
                       "open_attempt_id": str(open_attempt.id) if open_attempt else None,
                       "best_score": max(scores) if scores else None,
                       "attempts_left": max(0, (assessment.max_attempts or 3) - len(own))})
    return {"assessments": result}


@router.get("/results/mine")
async def my_assessment_results(limit: int = 20, actor: User = Depends(require_roles("trainer", "institution", "admin")),
                                db: AsyncSession = Depends(get_db)):
    """Read-only rollup for the trainer/institution dashboard: average score
    and most recent submissions across assessments tied to a programme in the
    caller's organisation (assessments with no programme_id are platform-wide
    and only visible to admin)."""
    prog_query = select(Programme.id)
    if actor.role != "admin":
        prog_query = prog_query.where(Programme.organisation_id == actor.organisation_id)
    programme_ids = set((await db.execute(prog_query)).scalars().all())
    assessment_query = select(Assessment.id)
    if actor.role != "admin":
        assessment_query = assessment_query.where(Assessment.programme_id.in_(programme_ids))
    assessment_ids = set((await db.execute(assessment_query)).scalars().all())
    if not assessment_ids:
        return {"average_score": None, "total_submissions": 0, "recent": []}
    all_scores = (await db.execute(select(AssessmentResult.score).where(
        AssessmentResult.assessment_id.in_(assessment_ids)))).scalars().all()
    rows = (await db.execute(
        select(AssessmentResult, Assessment, User)
        .join(Assessment, Assessment.id == AssessmentResult.assessment_id)
        .join(User, User.id == AssessmentResult.trainee_id)
        .where(AssessmentResult.assessment_id.in_(assessment_ids))
        .order_by(AssessmentResult.submitted_at.desc())
        .limit(min(limit, 100))
    )).all()
    return {
        "average_score": round(sum(all_scores) / len(all_scores), 1) if all_scores else None,
        "total_submissions": len(all_scores),
        "recent": [{
            "trainee_name": trainee.full_name, "assessment_title": assessment.title,
            "score": result.score, "passed": result.passed,
            "submitted_at": result.submitted_at.isoformat() if result.submitted_at else None,
        } for result, assessment, trainee in rows],
    }


@router.get("/{assessment_id}")
async def get_assessment(assessment_id: str, db: AsyncSession = Depends(get_db)):
    assessment = await db.get(Assessment, _uuid(assessment_id))
    if not assessment:
        raise HTTPException(404, "Assessment not found")
    count = len((await db.execute(select(AssessmentQuestion.id).where(AssessmentQuestion.assessment_id == assessment.id))).all())
    return {"id": str(assessment.id), "title": assessment.title, "questions": count,
            "duration_minutes": assessment.duration_minutes, "passing_score": assessment.passing_score,
            "max_attempts": assessment.max_attempts, "due_date": assessment.due_date.isoformat() if assessment.due_date else None}


@router.post("/{assessment_id}/attempts")
async def start_attempt(assessment_id: str, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    assessment = await db.get(Assessment, _uuid(assessment_id))
    if assessment is None:
        raise HTTPException(404, "Assessment not found")
    now = datetime.now(timezone.utc)
    if assessment.due_date and _utc(assessment.due_date) < now:
        raise HTTPException(409, "Assessment deadline has passed")
    await db.execute(select(Assessment.id).where(Assessment.id == assessment.id).with_for_update())
    previous = (await db.execute(select(AssessmentAttempt).where(
        AssessmentAttempt.assessment_id == assessment.id, AssessmentAttempt.trainee_id == user.id
    ).order_by(AssessmentAttempt.attempt_no))).scalars().all()
    for attempt in previous:
        if attempt.status == "in_progress":
            if attempt.expires_at and _utc(attempt.expires_at) > now:
                raise HTTPException(409, "An attempt is already open")
            attempt.status = "expired"
    if len(previous) >= (assessment.max_attempts or 3):
        await db.commit()
        raise HTTPException(409, "Attempt limit reached")
    questions = (await db.execute(select(AssessmentQuestion).where(
        AssessmentQuestion.assessment_id == assessment.id).order_by(AssessmentQuestion.position))).scalars().all()
    if not questions:
        raise HTTPException(409, "Assessment has no question bank")
    if assessment.shuffle:
        random.SystemRandom().shuffle(questions)
    attempt = AssessmentAttempt(id=uuid.uuid4(), assessment_id=assessment.id, trainee_id=user.id,
                                attempt_no=len(previous) + 1, started_at=now,
                                expires_at=now + timedelta(minutes=assessment.duration_minutes or 45),
                                question_order=[str(q.id) for q in questions], answers={}, status="in_progress")
    db.add(attempt)
    await db.commit()
    return {"attempt_id": str(attempt.id), "assessment_id": str(assessment.id),
            "expires_at": attempt.expires_at.isoformat(), "server_time": now.isoformat(),
            "questions": [_question(q) for q in questions]}


@router.get("/attempts/{attempt_id}")
async def get_attempt(attempt_id: str, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    """Resume an in-progress attempt: same shape as starting one, plus the
    answers saved so far, so a trainee who navigated away can pick up where
    they left off instead of losing the attempt."""
    attempt = await _attempt(db, attempt_id, user)
    if attempt.status != "in_progress":
        raise HTTPException(409, "Attempt is not in progress")
    if not attempt.expires_at or _utc(attempt.expires_at) <= datetime.now(timezone.utc):
        raise HTTPException(410, "Attempt has expired")
    questions_by_id = {str(q.id): q for q in (await db.execute(select(AssessmentQuestion).where(
        AssessmentQuestion.assessment_id == attempt.assessment_id))).scalars().all()}
    ordered = [questions_by_id[qid] for qid in (attempt.question_order or []) if qid in questions_by_id]
    return {"attempt_id": str(attempt.id), "assessment_id": str(attempt.assessment_id),
            "expires_at": attempt.expires_at.isoformat(), "server_time": datetime.now(timezone.utc).isoformat(),
            "answers": attempt.answers or {}, "questions": [_question(q) for q in ordered]}


class AnswerUpdate(BaseModel):
    question_id: str
    answer: list[str | bool]


@router.put("/attempts/{attempt_id}/answers")
async def save_answer(attempt_id: str, data: AnswerUpdate, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    attempt = await _attempt(db, attempt_id, user)
    if attempt.status != "in_progress" or not attempt.expires_at or _utc(attempt.expires_at) <= datetime.now(timezone.utc):
        raise HTTPException(409, "Attempt is closed")
    if data.question_id not in (attempt.question_order or []):
        raise HTTPException(422, "Question is not in this attempt")
    answers = dict(attempt.answers or {})
    answers[data.question_id] = data.answer
    attempt.answers = answers
    await db.commit()
    return {"saved": True, "question_id": data.question_id}


@router.post("/attempts/{attempt_id}/submit")
async def submit_attempt(attempt_id: str, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    attempt = await _attempt(db, attempt_id, user)
    await db.execute(select(AssessmentAttempt.id).where(AssessmentAttempt.id == attempt.id).with_for_update())
    await db.refresh(attempt)
    now = datetime.now(timezone.utc)
    if attempt.status != "in_progress":
        raise HTTPException(409, "Attempt is closed")
    if not attempt.expires_at or _utc(attempt.expires_at) <= now:
        attempt.status = "expired"
        await db.commit()
        raise HTTPException(409, "Attempt expired")
    assessment = await db.get(Assessment, attempt.assessment_id)
    questions = (await db.execute(select(AssessmentQuestion).where(AssessmentQuestion.assessment_id == attempt.assessment_id))).scalars().all()
    answers = attempt.answers or {}
    earned = possible = 0
    breakdown: dict[str, dict] = {}
    review = []
    for q in questions:
        marks = max(0, q.marks or 0)
        possible += marks
        given = answers.get(str(q.id), [])
        correct = isinstance(given, list) and set(map(str, given)) == set(map(str, q.correct or []))
        if correct:
            earned += marks
        part = breakdown.setdefault(q.topic or "General", {"earned": 0, "possible": 0})
        part["possible"] += marks
        part["earned"] += marks if correct else 0
        item = {"question_id": str(q.id), "answer": given, "correctly_answered": correct}
        if assessment.show_answers == "after_submit":
            item.update(correct=q.correct, explanation=q.explanation)
        review.append(item)
    score = round(100 * earned / possible) if possible else 0
    passed = score >= (assessment.passing_score or 60)
    attempt.status, attempt.submitted_at, attempt.score, attempt.passed = "submitted", now, score, passed
    db.add(AssessmentResult(id=uuid.uuid4(), assessment_id=assessment.id, trainee_id=user.id,
                            score=score, passed=passed, submitted_at=now))
    if passed and assessment.skill_name:
        await upsert_trainee_skill(db, trainee_id=user.id, skill_name=assessment.skill_name,
                                   confidence=score, level=level_for_score(score), verified=True,
                                   evidence_item={"type": "Assessment", "title": assessment.title}, category="Management")
    await db.commit()
    return {"attempt_id": str(attempt.id), "assessment_id": str(assessment.id), "score": score,
            "passed": passed, "skill_updated": assessment.skill_name if passed else None,
            "topic_breakdown": breakdown, "review": review}


@router.post("/{assessment_id}/submit", status_code=410)
async def legacy_submit_removed(assessment_id: str):
    raise HTTPException(410, "Start a timed attempt and submit its saved answers")
