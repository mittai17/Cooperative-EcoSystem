from pydantic import BaseModel
from typing import Optional, List


class AssessmentSummary(BaseModel):
    id: str
    title: str
    course: Optional[str] = None
    status: str
    duration_minutes: Optional[int] = None
    due_date: Optional[str] = None
    completed_at: Optional[str] = None
    score: Optional[int] = None


class AssessmentDetail(BaseModel):
    id: str
    title: str
    questions: int
    duration_minutes: int
    status: str = "upcoming"


class AssessmentSubmitResponse(BaseModel):
    assessment_id: str
    score: int
    passed: bool
    feedback: str
    skill_updated: Optional[str] = None
