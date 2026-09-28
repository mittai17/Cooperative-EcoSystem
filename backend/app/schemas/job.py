from pydantic import BaseModel, Field
from typing import Optional, List


class JobCreate(BaseModel):
    title: str
    employer_name: str
    location: str
    sector: str = "Cooperative"
    job_type: str = "Full-time"
    salary_range: str = "₹3,00,000 - ₹5,00,000"
    description: str = ""
    skills_required: List[str] = []


class JobResponse(BaseModel):
    id: str
    title: str
    employer: Optional[str] = None
    location: Optional[str] = None


class JobMatchResult(BaseModel):
    job_id: str
    job_title: str
    match_score: int
    matched: List[dict]
    missing: List[dict]
    explanation: str


class ApplicationCreate(BaseModel):
    applicant_id: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    status: str
    message: str


class FeedbackCreate(BaseModel):
    trainee_id: str
    job_id: str
    useful_skills: List[str]
    missing_skills: List[str]
    training_relevance: int = Field(..., ge=1, le=5)
    performance_rating: int = Field(..., ge=1, le=5)
    comments: str = ""
