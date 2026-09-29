from fastapi import APIRouter, Depends, HTTPException, Query
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone
from app.services.career_ai import generate_career_response
from app.deps import require_roles
from app.models.user import User
from app.models.mobile import CareerPlan, CareerPlanStep, CareerRecommendation, CareerChatMessage
from app.models.skill import Skill, TraineeSkill

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    lang: str = "en"
    trainee_context: Optional[dict] = None
    # Optional explicit identity (compat); the verified Clerk token wins.
    trainee_id: Optional[str] = None

# Stable keys the mobile app maps to navigation targets.
SUGGESTED_ACTIONS = [
    {"label": "View Skill Gap", "href": "/skill-gap", "actionKey": "view_skill_gap"},
    {"label": "Browse Courses", "href": "/courses", "actionKey": "browse_courses"},
    {"label": "See Job Matches", "href": "/jobs", "actionKey": "see_job_matches"},
]

def get_career_response(message: str, context: dict, lang: str) -> str:
    skills = context.get('skills', [])
    target = context.get('target_role') or 'a cooperative-sector role'
    known = ', '.join(skill['name'] for skill in skills if skill.get('verified')) or 'no verified skills yet'
    if lang == 'hi':
        return f"आपका लक्ष्य {target} है। सत्यापित कौशल: {known}। अगले कदम के लिए संबंधित पाठ्यक्रम और नौकरियाँ देखें।"
    if lang == 'mr':
        return f"तुमचे ध्येय {target} आहे. प्रमाणित कौशल्ये: {known}. पुढील टप्प्यासाठी अभ्यासक्रम आणि नोकऱ्या पाहा."
    if lang == 'gu':
        return f"તમારું લક્ષ્ય {target} છે. ચકાસાયેલ કૌશલ્યો: {known}. આગળ માટે સંબંધિત અભ્યાસક્રમો અને નોકરીઓ જુઓ."
    if lang == 'ta':
        return f"உங்கள் இலக்கு {target}. சரிபார்க்கப்பட்ட திறன்கள்: {known}. அடுத்த படிக்கு பாடங்களையும் வேலைகளையும் பாருங்கள்."
    return f"Your target is {target}. Verified skills: {known}. Explore related courses and jobs for your next step."


async def _trainee_context(db: AsyncSession, trainee_uuid: uuid.UUID) -> dict:
    """Structured, DB-derived grounding for the LLM (skill passport + plan)."""
    rows = (
        await db.execute(
            select(Skill.name, TraineeSkill.level, TraineeSkill.confidence, TraineeSkill.verified)
            .join(TraineeSkill, TraineeSkill.skill_id == Skill.id)
            .where(TraineeSkill.trainee_id == trainee_uuid)
        )
    ).all()
    ctx: dict = {"skills": [{"name": n, "level": l, "confidence": c, "verified": v} for n, l, c, v in rows]}
    plan = (await db.execute(select(CareerPlan).where(CareerPlan.trainee_id == trainee_uuid))).scalar_one_or_none()
    if plan:
        ctx["target_role"] = plan.target_role
        ctx["current_match"] = plan.current_match
    return ctx


def _chat_message_dict(m: CareerChatMessage) -> dict:
    out = {
        "id": str(m.id),
        "sender": m.sender,
        "text": m.text,
        "timestamp": m.created_at.isoformat() if m.created_at else None,
    }
    if m.suggested_actions:
        out["suggested_actions"] = [{"label": a["label"], "actionKey": a["actionKey"]} for a in m.suggested_actions]
    return out


@router.post('/chat')
async def career_chat(req: ChatRequest, user: User = Depends(require_roles('trainee', 'admin')),
                      db: AsyncSession = Depends(get_db)):
    if req.lang not in ('en', 'hi', 'mr', 'gu', 'ta'):
        raise HTTPException(status_code=422, detail='Unsupported language')
    if req.trainee_id and req.trainee_id != str(user.id):
        raise HTTPException(status_code=403, detail='Cannot access another trainee')
    context = await _trainee_context(db, user.id)
    context["reply_language"] = req.lang
    llm_response = await generate_career_response(req.message, context)
    response = llm_response or get_career_response(req.message, context, req.lang)
    conversation_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    db.add(CareerChatMessage(id=uuid.uuid4(), trainee_id=user.id, sender='user', text=req.message,
                             conversation_id=conversation_id, lang=req.lang, created_at=now))
    ai = CareerChatMessage(id=uuid.uuid4(), trainee_id=user.id, sender='ai', text=response,
                           suggested_actions=SUGGESTED_ACTIONS, conversation_id=conversation_id,
                           lang=req.lang, created_at=datetime.now(timezone.utc))
    db.add(ai)
    await db.commit()
    return {'response': response, 'source': 'gemini' if llm_response else 'deterministic_fallback',
            'sources': ['skill_passport', 'career_plan'], 'suggested_actions': SUGGESTED_ACTIONS,
            'message': _chat_message_dict(ai)}


@router.get('/chat/history')
async def career_chat_history(limit: int = Query(50, ge=1, le=200),
                              user: User = Depends(require_roles('trainee', 'admin')),
                              db: AsyncSession = Depends(get_db)):
    rows = list((await db.execute(select(CareerChatMessage).where(CareerChatMessage.trainee_id == user.id)
                  .order_by(CareerChatMessage.created_at.desc(), CareerChatMessage.id.desc()).limit(limit))).scalars().all())
    rows.reverse()
    return {'messages': [_chat_message_dict(row) for row in rows]}


@router.get('/recommendations')
async def career_recommendations(user: User = Depends(require_roles('trainee', 'admin')),
                                 db: AsyncSession = Depends(get_db)):
    plan = (await db.execute(select(CareerPlan).where(CareerPlan.trainee_id == user.id))).scalar_one_or_none()
    if plan is None:
        return {'target_role': user.career_target_role, 'current_match': None,
                'recommendations': [], 'career_path': []}
    recs = (await db.execute(select(CareerRecommendation).where(CareerRecommendation.plan_id == plan.id)
                             .order_by(CareerRecommendation.priority))).scalars().all()
    steps = (await db.execute(select(CareerPlanStep).where(CareerPlanStep.plan_id == plan.id)
                              .order_by(CareerPlanStep.step))).scalars().all()
    return {'target_role': plan.target_role, 'current_match': plan.current_match,
            'recommendations': [{'priority': r.priority, 'type': r.type, 'title': r.title,
                                 'reason': r.reason or '', 'duration': r.duration or '', 'impact': r.impact or ''}
                                for r in recs],
            'career_path': [{k: v for k, v in {'step': st.step, 'title': st.title,
                            'status': st.status, 'timeline': st.timeline}.items() if v is not None}
                            for st in steps]}
