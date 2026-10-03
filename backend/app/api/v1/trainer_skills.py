"""Trainer skills endpoints (included under /api/v1/trainer).

Skill progress is read from TraineeSkill (the Skill Passport); trainer
evaluations are stored as SkillEvaluation rows AND written back into the
passport so the trainee's Skill Passport updates. Observations are always
trainer-entered text - nothing is generated.
"""
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Skill, SkillEvaluation, TraineeSkill, User
from app.services import trainer_metrics as tm

router = APIRouter()

DEMO_TRAINER_EMAIL = "s.kumar@vamnicom-demo.example.com"

DIMENSIONS = {
    "technical_knowledge": "Technical Knowledge",
    "practical_application": "Practical Application",
    "communication": "Communication",
    "problem_solving": "Problem Solving",
    "teamwork": "Teamwork",
    "digital_skills": "Digital Skills",
}
DIMENSION_HINTS = {
    "technical_knowledge": "Understanding of concepts, rules and domain theory",
    "practical_application": "Applying learning to real cooperative tasks",
    "communication": "Clarity when speaking, writing and listening",
    "problem_solving": "Analysing issues and reaching workable solutions",
    "teamwork": "Collaboration and contribution in group work",
    "digital_skills": "Comfort with digital tools and systems",
}


async def _trainer(x_demo_user: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    email = (x_demo_user or DEMO_TRAINER_EMAIL).strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or user.role != "trainer" or user.is_active is False:
        raise HTTPException(status_code=403, detail="No trainer account for this demo user")
    return user


def _level(conf: int) -> str:
    return "Advanced" if conf >= 85 else "Intermediate" if conf >= 65 else "Foundational"


def _parse(s) -> Optional[datetime]:
    if not s:
        return None
    try:
        d = datetime.fromisoformat(str(s).replace("Z", "+00:00"))
        return d if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _trend(evidence_rows: list[tuple[datetime, int]]) -> dict:
    """Trend from trainer-evaluation evidence (rating*20): last 30 days vs before.
    null when either window has no data."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    recent = [r for d, r in evidence_rows if d >= cutoff]
    older = [r for d, r in evidence_rows if d < cutoff]
    if not recent or not older:
        return {"direction": None, "delta": None}
    delta = round(sum(recent) / len(recent) - sum(older) / len(older))
    return {"direction": "up" if delta > 2 else "down" if delta < -2 else "flat", "delta": delta}


async def _roster(db: AsyncSession, trainer: User, batch_id: Optional[uuid.UUID]):
    classes = await tm.trainer_classes(db, trainer.id)
    allowed = {b.id for _, b, _ in classes}
    if batch_id is not None and batch_id not in allowed:
        raise HTTPException(status_code=404, detail="Batch not found")
    stats = await tm.compute_stats(db, trainer.id, [batch_id] if batch_id else None)
    return classes, stats


@router.get("/skills/evaluation-dimensions")
async def evaluation_dimensions(trainer: User = Depends(_trainer)):
    return {"dimensions": [{"key": k, "label": v, "hint": DIMENSION_HINTS[k]} for k, v in DIMENSIONS.items()],
            "rating_scale": {"min": 1, "max": 5}}


@router.get("/skills")
async def skills_overview(batch_id: Optional[uuid.UUID] = Query(None), db: AsyncSession = Depends(get_db),
                          trainer: User = Depends(_trainer)):
    classes, stats = await _roster(db, trainer, batch_id)
    batches = sorted({(str(b.id), b.name) for _, b, _ in classes}, key=lambda x: x[1])
    if not stats:
        return {"batches": [{"id": i, "name": n} for i, n in batches], "skills": [], "trainee_count": 0}
    rows = (await db.execute(
        select(TraineeSkill, Skill).join(Skill, Skill.id == TraineeSkill.skill_id)
        .where(TraineeSkill.trainee_id.in_(list(stats))))).all()
    per_skill: dict[uuid.UUID, dict] = {}
    for ts, sk in rows:
        s = stats[ts.trainee_id]
        ev = [e for e in (ts.evidence or []) if isinstance(e, dict)]
        d = per_skill.setdefault(sk.id, {"skill": sk, "trainees": [], "evidence": 0, "tev": []})
        d["evidence"] += len(ev)
        for e in ev:
            when, rating = _parse(e.get("date")), e.get("rating")
            if e.get("type") == "trainer_evaluation" and when and isinstance(rating, (int, float)):
                d["tev"].append((when, int(rating) * 20))
        d["trainees"].append({
            "trainee_id": str(ts.trainee_id), "name": s.trainee.full_name, "batch": s.batch_name,
            "batch_id": str(s.batch_id), "proficiency": ts.confidence or 0, "level": ts.level,
            "verified": bool(ts.verified), "evidence_count": len(ev),
        })
    out = []
    for d in per_skill.values():
        t = sorted(d["trainees"], key=lambda x: x["proficiency"])
        avg = round(sum(x["proficiency"] for x in t) / len(t))
        out.append({
            "skill_id": str(d["skill"].id), "name": d["skill"].name, "category": d["skill"].category,
            "average": avg, "level": _level(avg), "trainee_count": len(t), "evidence_count": d["evidence"],
            "below_threshold": sum(1 for x in t if x["proficiency"] < 60), "trend": _trend(d["tev"]), "trainees": t,
        })
    out.sort(key=lambda x: x["average"])
    return {"batches": [{"id": i, "name": n} for i, n in batches], "skills": out, "trainee_count": len(stats)}


class EvalItem(BaseModel):
    dimension: str
    rating: int = Field(ge=1, le=5)
    observation: Optional[str] = Field(None, max_length=2000)


class EvaluateIn(BaseModel):
    trainee_id: uuid.UUID
    batch_id: uuid.UUID
    evaluations: list[EvalItem] = Field(min_length=1, max_length=len(DIMENSIONS))


@router.post("/skills/evaluate")
async def evaluate(body: EvaluateIn, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    _, stats = await _roster(db, trainer, body.batch_id)
    stat = stats.get(body.trainee_id)
    if stat is None or stat.batch_id != body.batch_id:
        raise HTTPException(status_code=404, detail="Trainee not found in this batch")
    seen = set()
    for e in body.evaluations:
        if e.dimension not in DIMENSIONS:
            raise HTTPException(status_code=422, detail=f"Unknown dimension '{e.dimension}'")
        if e.dimension in seen:
            raise HTTPException(status_code=422, detail=f"Duplicate dimension '{e.dimension}'")
        seen.add(e.dimension)

    now = datetime.now(timezone.utc)
    updated = []
    for e in body.evaluations:
        obs = (e.observation or "").strip() or None
        db.add(SkillEvaluation(trainee_id=body.trainee_id, batch_id=body.batch_id, trainer_id=trainer.id,
                               dimension=e.dimension, rating=e.rating, observation=obs, created_at=now))
        name = DIMENSIONS[e.dimension]
        skill = (await db.execute(select(Skill).where(Skill.name == name))).scalar_one_or_none()
        if skill is None:
            skill = Skill(name=name, category="Trainer Evaluation")
            db.add(skill)
            await db.flush()
        ts = (await db.execute(select(TraineeSkill).where(
            TraineeSkill.trainee_id == body.trainee_id, TraineeSkill.skill_id == skill.id))).scalar_one_or_none()
        target = e.rating * 20
        entry = {"type": "trainer_evaluation", "dimension": e.dimension, "rating": e.rating, "observation": obs,
                 "trainer": trainer.full_name, "date": now.isoformat()}
        if ts is None:
            ts = TraineeSkill(trainee_id=body.trainee_id, skill_id=skill.id, confidence=target, level=_level(target),
                              verified=True, evidence=[entry])
            db.add(ts)
            before = None
            after = target
        else:
            before = ts.confidence or 0
            after = max(0, min(100, round(before * 0.6 + target * 0.4)))
            ts.confidence = after
            ts.level = _level(after)
            ts.verified = True
            ts.evidence = [*(ts.evidence or []), entry]
        updated.append({"dimension": e.dimension, "skill": name, "rating": e.rating, "before": before, "after": after})
    await db.commit()
    return {"ok": True, "message": "Skill Passport updated", "trainee_id": str(body.trainee_id), "updated": updated}


@router.get("/skills/trainee/{trainee_id}")
async def trainee_evaluations(trainee_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    _, stats = await _roster(db, trainer, None)
    stat = stats.get(trainee_id)
    if stat is None:
        raise HTTPException(status_code=404, detail="Trainee not found")
    evals = (await db.execute(select(SkillEvaluation).where(SkillEvaluation.trainee_id == trainee_id)
                              .order_by(SkillEvaluation.created_at.desc()))).scalars().all()
    skills = (await db.execute(select(TraineeSkill, Skill).join(Skill, Skill.id == TraineeSkill.skill_id)
                               .where(TraineeSkill.trainee_id == trainee_id))).all()
    by_dim = defaultdict(list)
    for ev in evals:
        by_dim[ev.dimension].append(ev.rating)
    return {
        "trainee": {"id": str(stat.trainee.id), "name": stat.trainee.full_name, "batch": stat.batch_name, "batch_id": str(stat.batch_id)},
        "skills": sorted([{"name": sk.name, "proficiency": ts.confidence or 0, "level": ts.level, "verified": bool(ts.verified),
                           "evidence_count": len([e for e in (ts.evidence or []) if isinstance(e, dict)])} for ts, sk in skills],
                         key=lambda x: x["name"]),
        "dimension_averages": {k: round(sum(v) / len(v), 1) for k, v in by_dim.items()},
        "evaluations": [{"id": str(ev.id), "dimension": ev.dimension, "label": DIMENSIONS.get(ev.dimension, ev.dimension),
                         "rating": ev.rating, "observation": ev.observation,
                         "trainer_id": str(ev.trainer_id) if ev.trainer_id else None,
                         "date": ev.created_at.isoformat() if ev.created_at else None} for ev in evals],
    }
