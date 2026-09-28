from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.models.assessment import Assessment, AssessmentResult
from app.services.skill_engine import upsert_trainee_skill, level_for_score
from app.deps import get_optional_identity, resolve_actor_id, AuthenticatedIdentity

router = APIRouter()

_DEMO_ASSESSMENTS = [
    {"id": "a1", "title": "Governance & Bylaws Proficiency Test", "course": "Cooperative Management Fundamentals", "due_date": "2026-10-05", "status": "upcoming", "duration_minutes": 45},
    {"id": "a2", "title": "Meeting Facilitation Simulation", "course": "Leadership for Cooperative Board Members", "due_date": "2026-10-12", "status": "upcoming", "duration_minutes": 60},
    {"id": "a3", "title": "Cooperative Principles Quiz", "course": "Cooperative Management Fundamentals", "completed_at": "2026-09-15", "score": 87, "status": "completed"},
]


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


@router.get("/")
async def list_assessments(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Assessment))
    assessments = result.scalars().all()
    if assessments:
        return {
            "assessments": [
                {
                    "id": str(a.id),
                    "title": a.title,
                    "skill": a.skill_name,
                    "due_date": str(a.due_date) if a.due_date else None,
                    "duration_minutes": a.duration_minutes,
                    "status": "upcoming",
                }
                for a in assessments
            ]
        }
    return {"assessments": _DEMO_ASSESSMENTS}


@router.get("/{assessment_id}")
async def get_assessment(assessment_id: str, db: AsyncSession = Depends(get_db)):
    if _is_uuid(assessment_id):
        result = await db.execute(select(Assessment).where(Assessment.id == uuid.UUID(assessment_id)))
        a = result.scalar_one_or_none()
        if a:
            return {
                "id": str(a.id),
                "title": a.title,
                "questions": a.total_questions,
                "duration_minutes": a.duration_minutes,
                "status": "upcoming",
            }
    demo = next((a for a in _DEMO_ASSESSMENTS if a["id"] == assessment_id), None)
    if demo:
        return {"id": assessment_id, "title": demo["title"], "questions": 25, "duration_minutes": demo["duration_minutes"], "status": "upcoming"}
    raise HTTPException(status_code=404, detail="Assessment not found")


@router.post("/{assessment_id}/submit")
async def submit_assessment(
    assessment_id: str,
    score: int = Query(75, ge=0, le=100),
    trainee_id: Optional[str] = Query(None, description="Local user id of the trainee submitting"),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Auto-grades an assessment submission and, on success, feeds the
    result into the trainee's Skill Passport (core end-to-end flow step)."""
    passing_score = 60
    skill_name = "Cooperative Governance"
    db_assessment_id: Optional[uuid.UUID] = None
    title = "Assessment"

    if _is_uuid(assessment_id):
        result = await db.execute(select(Assessment).where(Assessment.id == uuid.UUID(assessment_id)))
        a = result.scalar_one_or_none()
        if a:
            db_assessment_id = a.id
            passing_score = a.passing_score or 60
            skill_name = a.skill_name or skill_name
            title = a.title
    else:
        demo = next((x for x in _DEMO_ASSESSMENTS if x["id"] == assessment_id), None)
        if demo:
            title = demo["title"]

    passed = score >= passing_score
    feedback = "Well done on cooperative principles!" if passed else "Review the material and retry; you're close."

    trainee_uuid = resolve_actor_id(identity, trainee_id, allowed_roles=("trainee", "admin"))
    if trainee_uuid is not None:
        result_row = AssessmentResult(
            id=uuid.uuid4(),
            assessment_id=db_assessment_id,
            trainee_id=trainee_uuid,
            score=score,
            passed=passed,
            submitted_at=datetime.now(timezone.utc),
            feedback=feedback,
        )
        db.add(result_row)
        if passed:
            await upsert_trainee_skill(
                db,
                trainee_id=trainee_uuid,
                skill_name=skill_name,
                confidence=score,
                level=level_for_score(score),
                verified=True,
                evidence_item={"type": "Assessment", "title": title},
                category="Management",
            )
        await db.commit()

    return {
        "assessment_id": assessment_id,
        "score": score,
        "passed": passed,
        "feedback": feedback,
        "skill_updated": skill_name if passed else None,
    }
