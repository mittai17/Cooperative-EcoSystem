from pydantic import BaseModel
from typing import Optional, List, Dict


class SkillEvidence(BaseModel):
    type: str
    title: str
    date: Optional[str] = None


class SkillPassportEntry(BaseModel):
    name: str
    level: str
    confidence: int
    verified: bool
    category: Optional[str] = None
    evidence: List[SkillEvidence] = []


class SkillPassportResponse(BaseModel):
    skills: List[SkillPassportEntry]
    summary: Dict[str, float]


class GapAnalysisRequest(BaseModel):
    target_role: str
    trainee_id: Optional[str] = None
    trainee_skills: Optional[List[dict]] = None  # explicit override; else loaded from DB


class GapRequirement(BaseModel):
    skill: str
    required_level: str
    weight: float
    current_level: Optional[str] = None
    status: str
    match_pct: int


class GapAnalysisResponse(BaseModel):
    target_role: str
    match_score: int
    met: List[GapRequirement]
    gaps: List[GapRequirement]
    total_requirements: int
    recommendations: List[dict] = []


class SkillDemandEntry(BaseModel):
    skill: str
    employer_demand: int
    trained_supply: int
    gap: int
    trend: str
