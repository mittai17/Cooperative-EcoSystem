from typing import List, Dict, Optional
from datetime import datetime, timezone
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill import Skill, TraineeSkill

ROLE_REQUIREMENTS = {
    "Cooperative Development Officer": [
        {"skill": "Cooperative Management", "required_level": "Proficient", "weight": 1.0},
        {"skill": "Communication", "required_level": "Intermediate", "weight": 0.8},
        {"skill": "Rural Development", "required_level": "Intermediate", "weight": 0.9},
        {"skill": "Data Analysis", "required_level": "Intermediate", "weight": 0.7},
    ],
    "Dairy Cooperative Manager": [
        {"skill": "Dairy Operations", "required_level": "Advanced", "weight": 1.0},
        {"skill": "Financial Management", "required_level": "Intermediate", "weight": 0.9},
        {"skill": "Leadership", "required_level": "Intermediate", "weight": 0.8},
    ]
}

LEVEL_SCORES = {"Foundational": 1, "Intermediate": 2, "Proficient": 3, "Expert": 4}

def calculate_skill_gap(trainee_skills: List[Dict], target_role: str) -> Dict:
    requirements = ROLE_REQUIREMENTS.get(target_role, [])
    if not requirements:
        return {"error": "Role not found", "match_score": 0, "gaps": [], "met": []}
    
    skill_map = {s["skill"]: s for s in trainee_skills}
    gaps = []
    met = []
    total_weight = sum(r["weight"] for r in requirements)
    weighted_score = 0
    
    for req in requirements:
        skill_name = req["skill"]
        required_score = LEVEL_SCORES.get(req["required_level"], 2)
        trainee_entry = skill_map.get(skill_name)
        
        if not trainee_entry:
            gaps.append({**req, "current_level": None, "status": "missing", "match_pct": 0})
        else:
            current_score = LEVEL_SCORES.get(trainee_entry.get("level", "Foundational"), 1)
            match_pct = min(100, int((current_score / required_score) * 100))
            weighted_score += (match_pct / 100) * req["weight"]
            if current_score >= required_score:
                met.append({**req, "current_level": trainee_entry["level"], "status": "met", "match_pct": 100})
            else:
                gaps.append({**req, "current_level": trainee_entry["level"], "status": "gap", "match_pct": match_pct})
        
    overall_match = int((weighted_score / total_weight) * 100) if total_weight > 0 else 0
    return {"target_role": target_role, "match_score": overall_match, "met": met, "gaps": gaps, "total_requirements": len(requirements)}


def level_for_score(score: int) -> str:
    """Deterministic score -> proficiency-level mapping used whenever a
    piece of evidence (assessment, course completion, certificate) needs to
    contribute a skill level to the Skill Passport."""
    if score >= 90:
        return "Expert"
    if score >= 75:
        return "Proficient"
    if score >= 60:
        return "Intermediate"
    return "Foundational"


async def upsert_trainee_skill(
    db: AsyncSession,
    trainee_id: uuid.UUID,
    skill_name: str,
    confidence: int,
    level: Optional[str] = None,
    verified: bool = True,
    evidence_item: Optional[Dict] = None,
    category: Optional[str] = None,
) -> TraineeSkill:
    """Deterministic Skill Passport aggregation: upserts a (trainee, skill)
    row, taking the MAX of existing vs. new confidence (evidence only ever
    strengthens a passport entry, never silently regresses it) and appending
    the new evidence item to the JSONB evidence trail.

    This is the single write path used by course completion, assessment
    submission, attendance-eligibility and certificate issuance so the
    Skill Passport always reflects the union of everything a trainee has
    actually done.
    """
    level = level or level_for_score(confidence)

    skill_result = await db.execute(select(Skill).where(Skill.name == skill_name))
    skill = skill_result.scalar_one_or_none()
    if skill is None:
        skill = Skill(id=uuid.uuid4(), name=skill_name, category=category)
        db.add(skill)
        await db.flush()

    ts_result = await db.execute(
        select(TraineeSkill).where(
            TraineeSkill.trainee_id == trainee_id,
            TraineeSkill.skill_id == skill.id,
        )
    )
    trainee_skill = ts_result.scalar_one_or_none()
    evidence_entry = evidence_item or {"type": "Evidence", "title": skill_name}
    evidence_entry.setdefault("date", datetime.now(timezone.utc).date().isoformat())

    if trainee_skill is None:
        trainee_skill = TraineeSkill(
            id=uuid.uuid4(),
            trainee_id=trainee_id,
            skill_id=skill.id,
            level=level,
            confidence=confidence,
            verified=verified,
            evidence=[evidence_entry],
        )
        db.add(trainee_skill)
    else:
        if confidence > (trainee_skill.confidence or 0):
            trainee_skill.confidence = confidence
            trainee_skill.level = level
        trainee_skill.verified = trainee_skill.verified or verified
        trainee_skill.evidence = [*(trainee_skill.evidence or []), evidence_entry]

    await db.flush()
    return trainee_skill
