from pydantic import BaseModel, Field
from typing import Optional


class ProgrammeCreate(BaseModel):
    title: str
    sector: str
    level: str = "Foundation"
    mode: str = "In-person"
    duration_weeks: int = Field(4, gt=0)
    seats_total: int = Field(30, ge=0)
    description: str = ""


class ProgrammeResponse(BaseModel):
    id: str
    title: str
    sector: Optional[str] = None
    level: Optional[str] = None
    mode: Optional[str] = None
    duration_weeks: Optional[int] = None
    seats_total: Optional[int] = None
    seats_filled: Optional[int] = None


class NominationCreate(BaseModel):
    programme_id: str
    trainee_id: Optional[str] = None


class NominationResponse(BaseModel):
    id: str
    status: str
    submitted_at: Optional[str] = None


class ProgrammeCourseCreate(BaseModel):
    course_id: str
    sequence_order: int = 1
    is_mandatory: bool = True

