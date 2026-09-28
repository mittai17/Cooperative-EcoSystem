from typing import Optional
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.programme import Programme, Nomination, Batch, Enrollment, ProgrammeCourse
from app.models.course import Course
from app.models.user import User
from app.schemas.programme import ProgrammeCreate, NominationCreate, ProgrammeCourseCreate
from app.deps import get_optional_identity, resolve_actor_id, AuthenticatedIdentity

router = APIRouter()


@router.get("/")
async def list_programmes(db: AsyncSession = Depends(get_db), skip: int = 0, limit: int = 20):
    result = await db.execute(select(Programme).where(Programme.is_active == True).offset(skip).limit(limit))
    programmes = result.scalars().all()
    return [
        {
            "id": str(p.id),
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


@router.post("/")
async def create_programme(data: ProgrammeCreate, db: AsyncSession = Depends(get_db)):
    programme = Programme(id=uuid.uuid4(), **data.model_dump())
    db.add(programme)
    await db.commit()
    await db.refresh(programme)
    return {"id": str(programme.id), "title": programme.title, "status": "created"}


@router.get("/{programme_id}")
async def get_programme(programme_id: str, db: AsyncSession = Depends(get_db)):
    try:
        prog_uuid = uuid.UUID(programme_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Programme not found")

    result = await db.execute(select(Programme).where(Programme.id == prog_uuid))
    programme = result.scalar_one_or_none()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")
    return {
        "id": str(programme.id),
        "title": programme.title,
        "sector": programme.sector,
        "level": programme.level,
        "mode": programme.mode,
        "duration_weeks": programme.duration_weeks,
        "seats_total": programme.seats_total,
        "seats_filled": programme.seats_filled,
    }


@router.get("/{programme_id}/courses")
async def get_programme_courses(programme_id: str, db: AsyncSession = Depends(get_db)):
    try:
        prog_uuid = uuid.UUID(programme_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Programme not found")

    prog_result = await db.execute(select(Programme).where(Programme.id == prog_uuid))
    programme = prog_result.scalar_one_or_none()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")

    result = await db.execute(
        select(ProgrammeCourse, Course)
        .join(Course, Course.id == ProgrammeCourse.course_id)
        .where(ProgrammeCourse.programme_id == prog_uuid)
        .order_by(ProgrammeCourse.sequence_order.asc(), ProgrammeCourse.created_at.asc())
    )
    rows = result.all()

    linked_course_ids = {course.id for _, course in rows}
    direct_result = await db.execute(
        select(Course).where(Course.programme_id == prog_uuid)
    )
    direct_courses = direct_result.scalars().all()

    courses = [
        {
            "id": str(course.id),
            "course_id": str(course.id),
            "title": course.title,
            "category": course.category,
            "level": course.level,
            "duration_hours": course.duration_hours,
            "instructor": course.instructor,
            "rating": course.rating,
            "enrolled_count": course.enrolled_count,
            "skills": course.skills or [],
            "description": course.description,
            "sequence_order": pc.sequence_order,
            "is_mandatory": pc.is_mandatory,
        }
        for pc, course in rows
    ]

    for dc in direct_courses:
        if dc.id not in linked_course_ids:
            courses.append({
                "id": str(dc.id),
                "course_id": str(dc.id),
                "title": dc.title,
                "category": dc.category,
                "level": dc.level,
                "duration_hours": dc.duration_hours,
                "instructor": dc.instructor,
                "rating": dc.rating,
                "enrolled_count": dc.enrolled_count,
                "skills": dc.skills or [],
                "description": dc.description,
                "sequence_order": 999,
                "is_mandatory": True,
            })

    return courses


@router.post("/{programme_id}/courses")
async def link_course_to_programme(
    programme_id: str,
    data: Optional[ProgrammeCourseCreate] = Body(None),
    course_id: Optional[str] = Query(None),
    sequence_order: Optional[int] = Query(None),
    is_mandatory: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    try:
        prog_uuid = uuid.UUID(programme_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Programme not found")

    prog_result = await db.execute(select(Programme).where(Programme.id == prog_uuid))
    programme = prog_result.scalar_one_or_none()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")

    resolved_course_id = data.course_id if data and data.course_id else course_id
    if not resolved_course_id:
        raise HTTPException(status_code=422, detail="course_id is required")

    try:
        course_uuid = uuid.UUID(str(resolved_course_id))
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Course not found")

    course_result = await db.execute(select(Course).where(Course.id == course_uuid))
    course = course_result.scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    resolved_seq = sequence_order if sequence_order is not None else (data.sequence_order if data else 1)
    if resolved_seq is None:
        resolved_seq = 1

    resolved_mandatory = is_mandatory if is_mandatory is not None else (data.is_mandatory if data else True)
    if resolved_mandatory is None:
        resolved_mandatory = True

    existing_result = await db.execute(
        select(ProgrammeCourse).where(
            ProgrammeCourse.programme_id == prog_uuid,
            ProgrammeCourse.course_id == course_uuid,
        )
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        existing.sequence_order = resolved_seq
        existing.is_mandatory = resolved_mandatory
        if course.programme_id is None:
            course.programme_id = prog_uuid
        await db.commit()
        await db.refresh(existing)
        return {
            "id": str(existing.id),
            "programme_id": str(programme.id),
            "course_id": str(course.id),
            "sequence_order": existing.sequence_order,
            "is_mandatory": existing.is_mandatory,
            "status": "updated",
        }

    link = ProgrammeCourse(
        id=uuid.uuid4(),
        programme_id=prog_uuid,
        course_id=course_uuid,
        sequence_order=resolved_seq,
        is_mandatory=resolved_mandatory,
    )
    db.add(link)
    if course.programme_id is None:
        course.programme_id = prog_uuid
    await db.commit()
    await db.refresh(link)
    return {
        "id": str(link.id),
        "programme_id": str(programme.id),
        "course_id": str(course.id),
        "sequence_order": link.sequence_order,
        "is_mandatory": link.is_mandatory,
        "status": "linked",
    }



@router.post("/nominations")
async def submit_nomination(
    data: NominationCreate,
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    try:
        prog_uuid = uuid.UUID(data.programme_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Programme not found")

    prog_result = await db.execute(select(Programme).where(Programme.id == prog_uuid))
    programme = prog_result.scalar_one_or_none()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")

    trainee_id = resolve_actor_id(
        identity,
        str(data.trainee_id) if data.trainee_id else None,
        allowed_roles=("trainee", "admin"),
    )
    if trainee_id is None:
        raise HTTPException(status_code=422, detail="trainee_id must be a valid UUID")

    user_result = await db.execute(select(User).where(User.id == trainee_id))
    if user_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Trainee not found")

    nomination = Nomination(
        id=uuid.uuid4(),
        programme_id=programme.id,
        trainee_id=trainee_id,
        status="pending",
    )
    db.add(nomination)
    await db.commit()
    await db.refresh(nomination)
    return {"id": str(nomination.id), "status": nomination.status, "message": "Nomination submitted"}


nominate = submit_nomination


@router.get("/nominations/list")
async def list_nominations(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Nomination).limit(50))
    nominations = result.scalars().all()
    return [{"id": str(n.id), "status": n.status, "submitted_at": str(n.submitted_at)} for n in nominations]


@router.patch("/nominations/{nomination_id}")
async def update_nomination(
    nomination_id: str,
    status: str = Query(..., pattern="^(pending|approved|rejected)$"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Nomination).where(Nomination.id == uuid.UUID(nomination_id)))
    nomination = result.scalar_one_or_none()
    if not nomination:
        raise HTTPException(status_code=404, detail="Nomination not found")

    previous_status = nomination.status
    nomination.status = status
    nomination.reviewed_at = datetime.now(timezone.utc)

    # Reserve a seat on first approval so programme capacity stays accurate.
    if status == "approved" and previous_status != "approved":
        prog_result = await db.execute(select(Programme).where(Programme.id == nomination.programme_id))
        programme = prog_result.scalar_one_or_none()
        if programme is not None:
            programme.seats_filled = (programme.seats_filled or 0) + 1

    await db.commit()
    return {"id": nomination_id, "status": status}
