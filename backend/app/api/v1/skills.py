from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.deps import require_user
from app.models.user import User
from app.models.skill import TraineeSkill, Skill, SkillGap
from app.models.analytics import SkillDemand
from app.services.skill_engine import calculate_skill_gap, ROLE_REQUIREMENTS
from app.schemas.skill import GapAnalysisRequest
from typing import List, Optional
import uuid
from datetime import datetime, timezone

router = APIRouter()

_COURSE_RECOMMENDATION_MAP = {
    "Data Analysis": {"title": "Data Analytics for Cooperatives", "duration": "6 weeks"},
    "Rural Development": {"title": "Rural Development Fundamentals", "duration": "4 weeks"},
    "Financial Management": {"title": "Advanced Cooperative Financials", "duration": "5 weeks"},
    "Supply Chain Logistics": {"title": "Agri-Supply Chain Fundamentals", "duration": "6 weeks"},
    "Credit Appraisal": {"title": "Credit Appraisal & Risk Management", "duration": "8 weeks"},
    "Communication": {"title": "Communication & Facilitation Skills", "duration": "3 weeks"},
    "Leadership": {"title": "Leadership for Cooperative Board Members", "duration": "4 weeks"},
    "Dairy Operations": {"title": "Dairy Cooperative Operations", "duration": "12 weeks"},
}


@router.get("/roles")
async def list_roles():
    """List all career roles available for gap analysis"""
    return {"roles": list(ROLE_REQUIREMENTS.keys())}


async def _load_trainee_skills_from_db(db: AsyncSession, trainee_id: uuid.UUID) -> List[dict]:
    result = await db.execute(
        select(TraineeSkill, Skill)
        .join(Skill, Skill.id == TraineeSkill.skill_id)
        .where(TraineeSkill.trainee_id == trainee_id)
    )
    rows = result.all()
    return [
        {
            "name": skill.name,
            "level": ts.level,
            "confidence": ts.confidence,
            "verified": ts.verified,
            "category": skill.category,
            "evidence": ts.evidence or [],
        }
        for ts, skill in rows
    ]


@router.get("/my-passport")
async def my_skill_passport(user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    skills = await _load_trainee_skills_from_db(db, user.id)
    return {"skills": skills, "summary": {
        "total_skills": len(skills),
        "verified_count": sum(bool(s["verified"]) for s in skills),
        "avg_confidence": round(sum(s["confidence"] or 0 for s in skills) / len(skills), 1) if skills else 0,
    }}


@router.post("/gap-analysis")
async def skill_gap_analysis(req: GapAnalysisRequest, user: User = Depends(require_user), db: AsyncSession = Depends(get_db)):
    """Use only the caller's persisted evidence; client skill overrides are rejected."""
    if req.trainee_id and req.trainee_id != str(user.id):
        raise HTTPException(status_code=403, detail="Skill analysis is limited to your own profile")
    if req.trainee_skills is not None:
        raise HTTPException(status_code=422, detail="Skills are read from your verified profile")
    skills = await _load_trainee_skills_from_db(db, user.id)
    result = calculate_skill_gap([
        {"skill": s["name"], "level": s["level"], "confidence": s["confidence"]}
        for s in skills
    ], req.target_role)
    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])
    result["recommendations"] = [
        {**_COURSE_RECOMMENDATION_MAP[g["skill"]], "fills_gap": g["skill"]}
        for g in result.get("gaps", []) if g.get("skill") in _COURSE_RECOMMENDATION_MAP
    ]
    db.add(SkillGap(id=uuid.uuid4(), trainee_id=user.id, target_role=req.target_role,
                    match_score=result.get("match_score"), gaps=result.get("gaps", []),
                    created_at=datetime.now(timezone.utc)))
    await db.commit()
    return result


@router.get("/demand")
async def skill_demand(db: AsyncSession = Depends(get_db)):
    """Return skill demand intelligence data, aggregated from the
    `skill_demand` table (populated via seeding and updated as employer
    feedback comes in - see POST /api/v1/jobs/feedback)."""
    result = await db.execute(select(SkillDemand))
    rows = result.scalars().all()
    if rows:
        def trend(gap: int, demand: int) -> str:
            if demand == 0:
                return "stable"
            ratio = gap / demand
            if ratio > 0.4:
                return "rising"
            if ratio < 0.15:
                return "declining"
            return "stable"

        return {
            "skill_demand": [
                {
                    "skill": r.skill_name,
                    "employer_demand": r.employer_demand_count,
                    "trained_supply": r.trained_count,
                    "gap": r.gap_count,
                    "trend": trend(r.gap_count or 0, r.employer_demand_count or 0),
                }
                for r in rows
            ]
        }

    return {"skill_demand": []}
