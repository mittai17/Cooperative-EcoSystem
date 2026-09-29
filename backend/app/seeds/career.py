"""Idempotent per-trainee career plans (target role, ladder steps, and
recommendations), derived from each trainee's actual seeded skill passport
and enrolled programme — see app/api/v1/career.py's /recommendations, which
reads straight from CareerPlan/CareerPlanStep/CareerRecommendation.

Deliberately data-driven rather than a fixed template: the target role is
chosen by matching the trainee's real TraineeSkill rows against a small role
catalogue, so two trainees with different skills/programmes get different
plans, not copies of each other.

Scope note: like app/seeds/profiles.py, only trainees at a real (non-"Test
Org …") institution are considered.
"""
import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mobile import CareerPlan, CareerPlanStep, CareerRecommendation
from app.models.programme import Batch, Enrollment, Programme
from app.models.skill import Skill, TraineeSkill
from app.models.user import Organisation, User
from app.seed import bulk_sync
from app.seeds import register

rng = random.Random(20260929)

# (target role, the skills it weighs most) — used only to pick the
# best-matching role per trainee and to name skill-gap recommendations.
ROLE_CATALOG = [
    ("Cooperative Development Officer", ["Cooperative Management", "Communication", "Rural Development", "Data Analysis"]),
    ("Dairy Cooperative Manager", ["Dairy Operations", "Financial Management", "Leadership", "Quality Assurance"]),
    ("Credit Officer - Cooperative Bank", ["Credit Appraisal", "Financial Management", "Data Analysis", "Digital Credit Appraisal"]),
    ("Agri-Marketing Specialist", ["Digital Marketing", "Communication", "Rural Development", "Supply Chain Logistics"]),
    ("Cooperative Governance & Compliance Officer", ["Cooperative Governance", "Audit & Compliance", "Risk Management"]),
    ("Fisheries Cooperative Manager", ["Fisheries Management", "Cooperative Management", "Cold Chain Management"]),
    ("FPO Business Development Officer", ["FPO Governance", "Digital Marketing", "E-NAM Trading"]),
    ("Handloom Enterprise Manager", ["Handloom Design & Weaving", "Digital Marketing", "Rural Development"]),
    ("Rural Credit & SHG Coordinator", ["Micro-Credit & SHG Linkage", "Rural Development", "Communication"]),
    ("Agri-Tech & Data Analyst", ["AgriTech", "Data Analysis", "Python Programming", "GIS & Remote Sensing"]),
]

# Skill -> a real course title from app/seed.py's catalogue, for recommendation text.
COURSE_FOR_SKILL = {
    "Cooperative Management": "Cooperative Management Fundamentals",
    "Cooperative Governance": "Cooperative Governance & Audit",
    "Communication": "Leadership & Communication Skills",
    "Leadership": "Leadership & Communication Skills",
    "Rural Development": "Rural Development Fundamentals",
    "Data Analysis": "Data Analytics for Cooperatives",
    "Python Programming": "Python for Data Science",
    "Dairy Operations": "Dairy Cooperative Operations",
    "Financial Management": "Financial Management for Cooperatives",
    "Credit Appraisal": "Cooperative Credit Operations",
    "Digital Credit Appraisal": "PACS Computerisation & Digital Ledgers",
    "Digital Marketing": "Cooperative Marketing & Branding",
    "Quality Assurance": "Supply Chain & Quality Management",
    "Supply Chain Logistics": "Supply Chain & Quality Management",
    "AgriTech": "AgriTech Fundamentals",
    "GIS & Remote Sensing": "AgriTech Fundamentals",
    "Organic Farming": "Organic Farming Certification",
    "Cold Chain Management": "Cold Chain Logistics Management",
    "Audit & Compliance": "Cooperative Governance & Audit",
    "Risk Management": "Cooperative Governance & Audit",
    "Handloom Design & Weaving": "Handloom Design and Weaving Techniques",
    "Fisheries Management": "Fisheries Cooperative Management",
    "FPO Governance": "Farmer Producer Organisation Formation & Governance",
    "Warehouse Management": "Warehouse & Post-Harvest Management",
    "E-NAM Trading": "E-NAM Digital Trading Platform",
    "Micro-Credit & SHG Linkage": "Micro-Credit & SHG Linkage Programme",
}


def _best_role(skill_names: set) -> tuple:
    best_role, best_req, best_overlap = ROLE_CATALOG[0][0], ROLE_CATALOG[0][1], -1
    for role, req in ROLE_CATALOG:
        overlap = len(skill_names & set(req))
        if overlap > best_overlap:
            best_role, best_req, best_overlap = role, req, overlap
    return best_role, best_req


async def seed(db: AsyncSession) -> None:
    trainee_rows = (await db.execute(
        select(User.id, User.full_name, Organisation.name)
        .join(Organisation, Organisation.id == User.organisation_id)
        .where(User.role == "trainee", Organisation.type == "institution",
               ~Organisation.name.like("Test Org%"))
        .order_by(User.email)
    )).all()
    if not trainee_rows:
        return

    existing_plan_trainees = set((await db.execute(select(CareerPlan.trainee_id))).scalars().all())
    trainee_ids = [row[0] for row in trainee_rows]

    skill_rows = (await db.execute(
        select(TraineeSkill.trainee_id, Skill.name, TraineeSkill.confidence, TraineeSkill.verified)
        .join(Skill, Skill.id == TraineeSkill.skill_id)
        .where(TraineeSkill.trainee_id.in_(trainee_ids))
    )).all()
    skills_by_trainee: dict = {}
    for trainee_id, name, confidence, verified in skill_rows:
        skills_by_trainee.setdefault(trainee_id, []).append((name, confidence or 50, verified))

    enroll_rows = (await db.execute(
        select(Enrollment.trainee_id, Programme.title)
        .join(Batch, Batch.id == Enrollment.batch_id)
        .join(Programme, Programme.id == Batch.programme_id)
        .where(Enrollment.trainee_id.in_(trainee_ids))
    )).all()
    programme_by_trainee = dict(enroll_rows)

    plan_rows, plan_meta = [], {}
    for trainee_id, _full_name, _org_name in trainee_rows:
        if trainee_id in existing_plan_trainees:
            continue
        if rng.random() < 0.10:
            # ~10% of real trainees have not set a career goal yet.
            continue
        my_skills = skills_by_trainee.get(trainee_id, [])
        have_names = {name for name, _c, _v in my_skills}
        target_role, req_skills = _best_role(have_names)
        if my_skills:
            avg_conf = sum(c for _n, c, _v in my_skills) / len(my_skills)
            verified_bonus = 8 * sum(1 for _n, _c, v in my_skills if v)
        else:
            avg_conf, verified_bonus = 35, 0
        current_match = max(30, min(95, round(avg_conf * 0.6 + verified_bonus)))
        plan_rows.append(dict(trainee_id=trainee_id, target_role=target_role, current_match=current_match))
        plan_meta[trainee_id] = (target_role, req_skills, have_names, programme_by_trainee.get(trainee_id))

    if not plan_rows:
        return
    plan_ids = await bulk_sync(db, CareerPlan, "trainee_id", plan_rows)

    step_rows, rec_rows = [], []
    for trainee_id, (target_role, req_skills, have_names, programme_title) in plan_meta.items():
        plan_id = plan_ids[trainee_id]
        current_label = f"Current: {programme_title} Trainee" if programme_title else "Current: Registered Trainee"
        step_rows += [
            dict(plan_id=plan_id, step=1, title=current_label, status="current", timeline="Enrolled"),
            dict(plan_id=plan_id, step=2, title="Field-level cooperative role", status="next", timeline="3-6 months"),
            dict(plan_id=plan_id, step=3, title=target_role, status="future", timeline="12-18 months"),
            dict(plan_id=plan_id, step=4, title=f"Senior {target_role}", status="future", timeline="3-5 years"),
        ]
        missing = [s for s in req_skills if s not in have_names]
        rng.shuffle(missing)
        priority = 1
        for skill in missing[:2]:
            course_title = COURSE_FOR_SKILL.get(skill, f"{skill} Fundamentals")
            rec_rows.append(dict(
                plan_id=plan_id, priority=priority, type="course", title=course_title,
                reason=f"Closes the {skill} gap required for {target_role}.",
                duration=f"{rng.choice([3, 4, 5, 6, 8])} weeks",
                impact=f"+{rng.choice([5, 8, 10, 12, 15])}% match",
            ))
            priority += 1
        verify_skill = next((s for s in req_skills if s in have_names), req_skills[0])
        if priority <= 3:
            rec_rows.append(dict(
                plan_id=plan_id, priority=priority, type="assessment", title=f"{verify_skill} Assessment",
                reason=f"Verify your {verify_skill} knowledge for {target_role} employers.",
                duration="2 hours", impact=f"+{rng.choice([3, 5, 7])}% match",
            ))

    if step_rows:
        await bulk_sync(db, CareerPlanStep, ("plan_id", "step"), step_rows)
    if rec_rows:
        await bulk_sync(db, CareerRecommendation, ("plan_id", "priority"), rec_rows)
    await db.flush()


register("career", seed)
