"""Idempotent cooperative training question bank for existing assessments."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Assessment, AssessmentQuestion
from app.seeds import register


QUESTIONS = [
    ("Which principle gives members equal voting power?", ["Voluntary membership", "Democratic member control", "Autonomy", "Education"], ["b"], "Each member has one vote.", "Governance"),
    ("What should a cooperative board do before approving a major expense?", ["Record a resolution and check the budget", "Ask one member informally", "Skip the audit", "Delegate without records"], ["a"], "Documented approval and budget checks support accountability.", "Governance"),
    ("Which record tracks member contributions and withdrawals?", ["Attendance sheet", "Member ledger", "Vehicle log", "Marketing plan"], ["b"], "The member ledger records each member's financial position.", "Finance"),
    ("What is the first step when a conflict of interest arises?", ["Hide it", "Disclose it and recuse where needed", "Vote twice", "Delete minutes"], ["b"], "Disclosure protects the integrity of decisions.", "Governance"),
    ("Which practice reduces loan portfolio risk?", ["Ignore repayments", "Assess capacity and monitor arrears", "Lend only to directors", "Avoid documentation"], ["b"], "Credit assessment and arrears monitoring reduce risk.", "Finance"),
    ("What should meeting minutes include?", ["Only the chair's name", "Decisions, votes, and action owners", "Private passwords", "Unverified rumours"], ["b"], "Clear minutes create an accountable record.", "Operations"),
    ("A cooperative surplus should be allocated according to:", ["One manager's preference", "Approved bylaws and member decision", "A supplier's request", "No written rule"], ["b"], "Bylaws and democratic decisions govern surplus allocation.", "Finance"),
    ("What is a reliable way to improve member participation?", ["Publish notices and accessible agendas", "Cancel elections", "Restrict records", "Ignore feedback"], ["a"], "Advance notice and accessible agendas help members participate.", "Membership"),
]


async def seed(db: AsyncSession) -> None:
    assessments = (await db.execute(select(Assessment))).scalars().all()
    for assessment in assessments:
        existing = (await db.execute(select(AssessmentQuestion.id).where(
            AssessmentQuestion.assessment_id == assessment.id).limit(1))).first()
        if existing:
            continue
        for position, (prompt, choices, correct, explanation, topic) in enumerate(QUESTIONS, 1):
            db.add(AssessmentQuestion(
                id=uuid.uuid4(), assessment_id=assessment.id, position=position,
                type="mcq_single", prompt=prompt,
                options=[{"id": chr(97 + i), "text": choice} for i, choice in enumerate(choices)],
                correct=correct, explanation=explanation, marks=1, topic=topic))
        assessment.total_questions = len(QUESTIONS)


register("assessments", seed)
