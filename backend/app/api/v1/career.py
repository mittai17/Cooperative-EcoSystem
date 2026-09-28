from fastapi import APIRouter, Depends
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from app.services.career_ai import generate_career_response

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    trainee_context: Optional[dict] = None

CAREER_RESPONSES = {
    "job": "Based on your Cooperative Management certification and 92% confidence score, you match well for Cooperative Development Officer roles. Top matches: NCDC (85%), Maharashtra State Cooperative Bank (78%).",
    "learn": "Given your current skill gaps, I recommend: 1) Data Analytics for Cooperatives (6 weeks) - fills your biggest gap, 2) Rural Development Fundamentals (4 weeks) - required for CDO roles.",
    "manager": "To become a Cooperative Manager: Complete Advanced Cooperative Financials (5 wks) → Leadership for Cooperative Board Members (4 wks) → Apply for Junior Manager trainee roles. Timeline: 12-18 months.",
    "match": "Your 65% match on Dairy Cooperative Manager is primarily because Financial Management (gap) and Supply Chain (missing) are required. Complete 2 courses to reach 85%+.",
    "certificate": "Priority: Complete Data Analytics certificate (highest demand gap: 460 unfilled roles). Then pursue Rural Development certificate to unlock CDO applications.",
    "default": "Based on your verified skills and career goals, I see strong potential in the cooperative sector. Your Cooperative Management proficiency (92% confidence) is a key strength. What specific area would you like guidance on?"
}

def get_career_response(message: str) -> str:
    msg_lower = message.lower()
    for key, response in CAREER_RESPONSES.items():
        if key in msg_lower:
            return response
    return CAREER_RESPONSES["default"]

@router.post("/chat")
async def career_chat(req: ChatRequest):
    """Real LLM-backed endpoint (Gemini, via app/services/career_ai.py) when
    GEMINI_API_KEY is configured and reachable; deterministically falls back
    to a keyword-matched canned response otherwise so the endpoint always
    returns 200 with a usable answer."""
    llm_response = await generate_career_response(req.message, req.trainee_context)
    response = llm_response or get_career_response(req.message)
    return {
        "response": response,
        "source": "gemini" if llm_response else "deterministic_fallback",
        "sources": ["skill_passport", "job_market_data", "ncct_programmes"],
        "suggested_actions": [
            {"label": "View Skill Gap", "href": "/skill-gap"},
            {"label": "Browse Courses", "href": "/courses"},
            {"label": "See Job Matches", "href": "/jobs"},
        ]
    }

@router.get("/recommendations")
async def career_recommendations(target_role: str = "Cooperative Development Officer"):
    return {
        "target_role": target_role,
        "current_match": 72,
        "recommendations": [
            {"priority": 1, "type": "course", "title": "Data Analytics for Cooperatives", "reason": "Fills biggest skill gap (Data Analysis missing)", "duration": "6 weeks", "impact": "+15% match"},
            {"priority": 2, "type": "course", "title": "Rural Development Fundamentals", "reason": "Required for CDO role at Intermediate level", "duration": "4 weeks", "impact": "+8% match"},
            {"priority": 3, "type": "assessment", "title": "Cooperative Governance Assessment", "reason": "Verify your governance knowledge for employers", "duration": "2 hours", "impact": "+5% match"},
        ],
        "career_path": [
            {"step": 1, "title": "Current: Trainee", "status": "current"},
            {"step": 2, "title": "Junior Cooperative Officer", "status": "next", "timeline": "3-6 months"},
            {"step": 3, "title": "Cooperative Development Officer", "status": "target", "timeline": "12-18 months"},
            {"step": 4, "title": "Senior CDO / Programme Manager", "status": "future", "timeline": "3-5 years"},
        ]
    }