from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.models.course import Course, CourseEnrollment
from app.models.programme import Programme, ProgrammeCourse
from app.deps import get_optional_identity, resolve_actor_id, AuthenticatedIdentity

router = APIRouter()

# Fallback catalog used only if the `courses` table hasn't been seeded yet
# (keeps /docs and local dev usable before `python -m app.seed` is run).
_DEMO_COURSES = [
    {"id": "crs-coop-mgmt", "title": "Cooperative Management Fundamentals", "category": "Management", "level": "Foundation", "duration_hours": 40, "instructor": "Dr. Ramesh Kulkarni", "rating": 4.8, "enrolled": 1240, "skills": ["Cooperative Management", "Cooperative Governance"]},
    {"id": "crs-data-analytics", "title": "Data Analytics for Cooperatives", "category": "Technology", "level": "Intermediate", "duration_hours": 48, "instructor": "Prof. Sunita Agarwal", "rating": 4.6, "enrolled": 640, "skills": ["Data Analysis", "Digital Tools"]},
    {"id": "crs-rural-dev", "title": "Rural Development Fundamentals", "category": "Rural", "level": "Foundation", "duration_hours": 32, "instructor": "Dr. Mohan Rao", "rating": 4.7, "enrolled": 820, "skills": ["Rural Development"]},
    {"id": "crs-dairy-ops", "title": "Dairy Cooperative Operations", "category": "Dairy", "level": "Intermediate", "duration_hours": 60, "instructor": "Er. Vijay Patil", "rating": 4.9, "enrolled": 980, "skills": ["Dairy Operations", "Quality Assurance"]},
]


def _serialize(course: Course) -> dict:
    return {
        "id": str(course.id),
        "title": course.title,
        "category": course.category,
        "level": course.level,
        "duration_hours": course.duration_hours,
        "instructor": course.instructor,
        "rating": course.rating,
        "enrolled": course.enrolled_count,
        "skills": course.skills or [],
    }


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


@router.get("/")
async def list_courses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Course).where(Course.is_active == True))
    courses = result.scalars().all()
    if courses:
        return {"courses": [_serialize(c) for c in courses], "total": len(courses)}
    return {"courses": _DEMO_COURSES, "total": len(_DEMO_COURSES)}


@router.get("/{course_id}")
async def get_course(course_id: str, db: AsyncSession = Depends(get_db)):
    if _is_uuid(course_id):
        result = await db.execute(select(Course).where(Course.id == uuid.UUID(course_id)))
        course = result.scalar_one_or_none()
        if course:
            return _serialize(course)
    demo = next((c for c in _DEMO_COURSES if c["id"] == course_id), None)
    if demo:
        return demo
    raise HTTPException(status_code=404, detail="Course not found")


@router.get("/{course_id}/programmes")
async def get_course_programmes(course_id: str, db: AsyncSession = Depends(get_db)):
    if not _is_uuid(course_id):
        raise HTTPException(status_code=404, detail="Course not found")

    course_uuid = uuid.UUID(course_id)
    course_result = await db.execute(select(Course).where(Course.id == course_uuid))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    result = await db.execute(
        select(Programme)
        .join(ProgrammeCourse, ProgrammeCourse.programme_id == Programme.id)
        .where(ProgrammeCourse.course_id == course_uuid)
    )
    programmes = list(result.scalars().all())

    if course.programme_id:
        direct_result = await db.execute(select(Programme).where(Programme.id == course.programme_id))
        direct_prog = direct_result.scalar_one_or_none()
        if direct_prog and all(p.id != direct_prog.id for p in programmes):
            programmes.append(direct_prog)

    return [
        {
            "id": str(p.id),
            "programme_id": str(p.id),
            "title": p.title,
            "sector": p.sector,
            "level": p.level,
            "mode": p.mode,
            "duration_weeks": p.duration_weeks,
            "seats_total": p.seats_total,
            "seats_filled": p.seats_filled,
        }
        for p in programmes
    ]



@router.post("/{course_id}/enroll")
async def enroll(
    course_id: str,
    trainee_id: Optional[str] = Query(None, description="Local user id of the trainee enrolling"),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    trainee_uuid = resolve_actor_id(identity, trainee_id, allowed_roles=("trainee", "admin"))

    course_uuid: Optional[uuid.UUID] = None
    if _is_uuid(course_id):
        result = await db.execute(select(Course).where(Course.id == uuid.UUID(course_id)))
        course = result.scalar_one_or_none()
        if course:
            course_uuid = course.id
            course.enrolled_count = (course.enrolled_count or 0) + 1

    if course_uuid is not None:
        enrollment = CourseEnrollment(
            id=uuid.uuid4(),
            trainee_id=trainee_uuid,
            course_id=course_uuid,
            progress=0,
            status="active",
            enrolled_at=datetime.now(timezone.utc),
        )
        db.add(enrollment)
        await db.commit()
        return {"status": "enrolled", "course_id": course_id, "enrollment_id": str(enrollment.id)}

    # Demo-catalog course id (pre-seed fallback): acknowledge without a DB row.
    return {"status": "enrolled", "course_id": course_id}


@router.get("/my/enrolled")
async def my_courses(
    trainee_id: Optional[str] = Query(None, description="Local user id of the trainee"),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    trainee_uuid = resolve_actor_id(identity, trainee_id)
    if trainee_uuid:
        result = await db.execute(
            select(CourseEnrollment, Course)
            .join(Course, Course.id == CourseEnrollment.course_id)
            .where(CourseEnrollment.trainee_id == trainee_uuid)
        )
        rows = result.all()
        if rows:
            return {
                "courses": [
                    {
                        "id": str(course.id),
                        "title": course.title,
                        "progress": enrollment.progress,
                        "last_accessed": str(enrollment.last_accessed) if enrollment.last_accessed else None,
                    }
                    for enrollment, course in rows
                ]
            }
        return {"courses": []}

    return {
        "courses": [
            {"id": "crs-coop-mgmt", "title": "Cooperative Management Fundamentals", "progress": 78, "last_accessed": "2026-09-26"},
            {"id": "crs-rural-dev", "title": "Rural Development Fundamentals", "progress": 45, "last_accessed": "2026-09-24"},
        ]
    }
