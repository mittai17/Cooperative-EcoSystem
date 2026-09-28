from pydantic import BaseModel
from typing import Optional, List


class CourseResponse(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    level: Optional[str] = None
    duration_hours: Optional[int] = None
    instructor: Optional[str] = None
    rating: Optional[float] = None
    enrolled: Optional[int] = None
    skills: List[str] = []


class EnrollmentResponse(BaseModel):
    status: str
    course_id: str
    enrollment_id: Optional[str] = None


class EnrolledCourseResponse(BaseModel):
    id: str
    title: str
    progress: int
    last_accessed: Optional[str] = None
