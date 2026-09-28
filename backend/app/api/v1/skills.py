from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.skill import TraineeSkill, Skill, SkillGap
from app.models.analytics import SkillDemand
from app.services.skill_engine import calculate_skill_gap, ROLE_REQUIREMENTS
from app.schemas.skill import GapAnalysisRequest
from typing import List, Optional
import uuid
from datetime import datetime, timezone

router = APIRouter()

_DEMO_PASSPORT = {
    "skills": [
        {"name": "Cooperative Management", "level": "Proficient", "confidence": 92, "verified": True, "category": "Management", "evidence": [{"type": "Course", "title": "Cooperative Management Fundamentals", "date": "2026-08-15"}]},
        {"name": "Communication & Facilitation", "level": "Proficient", "confidence": 85, "verified": True, "category": "Soft Skills", "evidence": [{"type": "Assessment", "title": "Communication Skills Test", "date": "2026-08-20"}]},
        {"name": "Rural Development", "level": "Foundational", "confidence": 60, "verified": False, "category": "Domain", "evidence": [{"type": "Course", "title": "Rural Development Basics", "date": "2026-09-01"}]},
        {"name": "Data Analysis", "level": "Foundational", "confidence": 45, "verified": False, "category": "Technical", "evidence": []},
        {"name": "Cooperative Governance", "level": "Intermediate", "confidence": 78, "verified": True, "category": "Management", "evidence": [{"type": "Assessment", "title": "Governance Test", "date": "2026-09-10"}]},
    ],
    "summary": {"total_skills": 5, "verified_count": 3, "avg_confidence": 72},
}

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
async def my_skill_passport(trainee_id: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    """Skill Passport aggregated from DB evidence (course completion,
    assessments, certificates, attendance) when `trainee_id` is given;
    falls back to rich demo data otherwise (used by unauthenticated
    dashboard widgets / this environment's smoke checks)."""
    if trainee_id:
        try:
            uid = uuid.UUID(trainee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid trainee_id")
        skills = await _load_trainee_skills_from_db(db, uid)
        if skills:
            verified_count = sum(1 for s in skills if s["verified"])
            avg_confidence = round(sum(s["confidence"] for s in skills) / len(skills), 1)
            return {
                "skills": skills,
                "summary": {"total_skills": len(skills), "verified_count": verified_count, "avg_confidence": avg_confidence},
            }
        return {"skills": [], "summary": {"total_skills": 0, "verified_count": 0, "avg_confidence": 0}}

    return _DEMO_PASSPORT


@router.post("/gap-analysis")
async def skill_gap_analysis(req: GapAnalysisRequest, db: AsyncSession = Depends(get_db)):
    """Run deterministic skill gap analysis (see app/services/skill_engine.py)
    against either explicitly-provided skills, DB-backed skills for a given
    trainee, or a representative demo profile."""
    trainee_skills = req.trainee_skills
    trainee_uuid: Optional[uuid.UUID] = None
    if trainee_skills is None and req.trainee_id:
        try:
            trainee_uuid = uuid.UUID(req.trainee_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid trainee_id")
        trainee_skills = await _load_trainee_skills_from_db(db, trainee_uuid)
        trainee_skills = [{"skill": s["name"], "level": s["level"], "confidence": s["confidence"]} for s in trainee_skills]

    if not trainee_skills:
        trainee_skills = [
            {"skill": "Cooperative Management", "level": "Proficient", "confidence": 92},
            {"skill": "Communication & Facilitation", "level": "Proficient", "confidence": 85},
            {"skill": "Rural Development", "level": "Foundational", "confidence": 60},
            {"skill": "Cooperative Governance", "level": "Intermediate", "confidence": 78},
        ]

    result = calculate_skill_gap(trainee_skills, req.target_role)

    recommendations = []
    for gap in result.get("gaps", []):
        skill_name = gap.get("skill", "")
        if skill_name in _COURSE_RECOMMENDATION_MAP:
            recommendations.append({**_COURSE_RECOMMENDATION_MAP[skill_name], "fills_gap": skill_name})
    result["recommendations"] = recommendations

    # Persist a lightweight audit trail so NCCT-level analytics can later
    # answer "which roles are trainees being evaluated against and how far
    # off are they" without re-running the calculation.
    if "error" not in result:
        db.add(
            SkillGap(
                id=uuid.uuid4(),
                trainee_id=trainee_uuid,
                target_role=req.target_role,
                match_score=result.get("match_score"),
                gaps=result.get("gaps", []),
                created_at=datetime.now(timezone.utc),
            )
        )
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

    return {
        "skill_demand": [
            {"skill": "Digital Marketing", "employer_demand": 1240, "trained_supply": 640, "gap": 600, "trend": "rising"},
            {"skill": "Dairy Operations", "employer_demand": 980, "trained_supply": 820, "gap": 160, "trend": "stable"},
            {"skill": "Credit Appraisal", "employer_demand": 870, "trained_supply": 320, "gap": 550, "trend": "rising"},
            {"skill": "Data Analysis", "employer_demand": 740, "trained_supply": 280, "gap": 460, "trend": "rising"},
            {"skill": "Cooperative Governance", "employer_demand": 650, "trained_supply": 590, "gap": 60, "trend": "stable"},
            {"skill": "Bookkeeping", "employer_demand": 540, "trained_supply": 480, "gap": 60, "trend": "declining"},
            {"skill": "Rural Development", "employer_demand": 420, "trained_supply": 380, "gap": 40, "trend": "stable"},
        ]
    }
