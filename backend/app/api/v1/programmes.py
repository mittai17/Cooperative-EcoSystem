from typing import Optional
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.programme import Programme, Nomination, Batch, Enrollment, ProgrammeCourse
from app.models.course import Course
from app.models.user import User
from app.schemas.programme import ProgrammeCreate, NominationCreate, ProgrammeCourseCreate
from app.deps import require_roles, org_scope, assert_org_access
from app.services.notifications import notify

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
async def create_programme(data: ProgrammeCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require_roles("institution", "admin"))):
    programme = Programme(id=uuid.uuid4(), organisation_id=org_scope(user), created_by_id=user.id, **data.model_dump())
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
    user: User = Depends(require_roles("institution", "admin")),
):
    try:
        prog_uuid = uuid.UUID(programme_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=404, detail="Programme not found")

    prog_result = await db.execute(select(Programme).where(Programme.id == prog_uuid))
    programme = prog_result.scalar_one_or_none()
    if not programme:
        raise HTTPException(status_code=404, detail="Programme not found")

    assert_org_access(user, programme.organisation_id)

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

    if course.programme_id is not None:
        owner_programme = await db.get(Programme, course.programme_id)
        if owner_programme is None:
            raise HTTPException(status_code=404, detail="Course programme not found")
        assert_org_access(user, owner_programme.organisation_id)

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
    user: User = Depends(require_roles("trainee", "admin")),
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

    trainee_id = user.id
    if data.trainee_id:
        try:
            requested_id = uuid.UUID(data.trainee_id)
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail="trainee_id must be a valid UUID")
        if user.role != "admin" and requested_id != user.id:
            raise HTTPException(status_code=403, detail="Cannot nominate another trainee")
        trainee_id = requested_id

    trainee = await db.get(User, trainee_id)
    if trainee is None or trainee.role != "trainee" or trainee.is_active is False:
        raise HTTPException(status_code=404, detail="Trainee not found")

    existing = (await db.execute(select(Nomination).where(
        Nomination.programme_id == programme.id, Nomination.trainee_id == trainee_id,
        Nomination.status.in_(("pending", "approved", "waitlisted"))
    ))).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="An active nomination already exists")
    nomination = Nomination(
        id=uuid.uuid4(),
        programme_id=programme.id,
        trainee_id=trainee_id,
        status="pending",
        nominated_by_id=user.id,
    )
    db.add(nomination)
    await db.commit()
    await db.refresh(nomination)
    return {"id": str(nomination.id), "status": nomination.status, "message": "Nomination submitted"}


nominate = submit_nomination


@router.get('/nominations/my')
async def my_nominations(user: User = Depends(require_roles('trainee')),
                         db: AsyncSession = Depends(get_db)):
    rows = (await db.execute(select(Nomination, Programme).join(
        Programme, Programme.id == Nomination.programme_id).where(Nomination.trainee_id == user.id)
        .order_by(Nomination.submitted_at.desc()))).all()
    return [{'id': str(n.id), 'programme_id': str(p.id), 'programme_title': p.title,
             'status': n.status, 'batch_id': str(n.batch_id) if n.batch_id else None,
             'decision_note': n.decision_note} for n, p in rows]


@router.post('/nominations/{nomination_id}/withdraw')
async def withdraw_nomination(nomination_id: uuid.UUID, user: User = Depends(require_roles('trainee')),
                              db: AsyncSession = Depends(get_db)):
    nomination = (await db.execute(select(Nomination).where(Nomination.id == nomination_id).with_for_update())).scalar_one_or_none()
    if nomination is None or nomination.trainee_id != user.id:
        raise HTTPException(status_code=404, detail='Nomination not found')
    if nomination.status != 'pending':
        raise HTTPException(status_code=409, detail='Only pending nominations can be withdrawn')
    nomination.status = 'withdrawn'
    await db.commit()
    return {'id': str(nomination.id), 'status': nomination.status}


@router.get('/nominations/list')
async def list_nominations(db: AsyncSession = Depends(get_db),
                           user: User = Depends(require_roles('institution', 'admin', 'ncct_admin')),
                           skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    scope = org_scope(user)
    query = select(Nomination, Programme, User).join(
        Programme, Programme.id == Nomination.programme_id).join(
        User, User.id == Nomination.trainee_id)
    if scope is not None:
        query = query.where(Programme.organisation_id == scope)
    rows = (await db.execute(query.order_by(Nomination.submitted_at.desc()).offset(skip).limit(limit))).all()
    return [{'id': str(n.id), 'programme_id': str(p.id), 'programme_title': p.title,
             'trainee_id': str(t.id), 'trainee_name': t.full_name, 'status': n.status,
             'batch_id': str(n.batch_id) if n.batch_id else None,
             'submitted_at': n.submitted_at.isoformat() if n.submitted_at else None}
            for n, p, t in rows]


class BatchCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    capacity: int = Field(default=30, ge=1)


@router.post('/{programme_id}/batches')
async def create_batch(programme_id: uuid.UUID, data: BatchCreate,
                       user: User = Depends(require_roles('institution', 'admin')),
                       db: AsyncSession = Depends(get_db)):
    programme = await db.get(Programme, programme_id)
    if programme is None:
        raise HTTPException(status_code=404, detail='Programme not found')
    assert_org_access(user, programme.organisation_id)
    batch = Batch(id=uuid.uuid4(), programme_id=programme_id, name=data.name, capacity=data.capacity)
    db.add(batch)
    await db.commit()
    return {'id': str(batch.id), 'programme_id': str(programme_id), 'name': batch.name}


@router.patch('/nominations/{nomination_id}')
async def update_nomination(nomination_id: uuid.UUID,
                            status: str = Query(..., pattern='^(approved|rejected|waitlisted)$'),
                            batch_id: uuid.UUID | None = None,
                            decision_note: str | None = None,
                            user: User = Depends(require_roles('institution', 'admin')),
                            db: AsyncSession = Depends(get_db)):
    nomination = (await db.execute(select(Nomination).where(
        Nomination.id == nomination_id).with_for_update())).scalar_one_or_none()
    if nomination is None:
        raise HTTPException(status_code=404, detail='Nomination not found')
    programme = (await db.execute(select(Programme).where(
        Programme.id == nomination.programme_id).with_for_update())).scalar_one()
    assert_org_access(user, programme.organisation_id)
    if nomination.status != 'pending':
        raise HTTPException(status_code=409, detail='Nomination already decided')
    if status == 'approved':
        if batch_id is None:
            raise HTTPException(status_code=422, detail='batch_id is required for approval')
        batch = (await db.execute(select(Batch).where(Batch.id == batch_id).with_for_update())).scalar_one_or_none()
        if batch is None or batch.programme_id != programme.id:
            raise HTTPException(status_code=404, detail='Batch not found for programme')
        filled = (await db.execute(select(Enrollment).where(
            Enrollment.batch_id == batch.id, Enrollment.status == 'active'))).scalars().all()
        if len(filled) >= batch.capacity or (programme.seats_total and programme.seats_filled >= programme.seats_total):
            raise HTTPException(status_code=409, detail='No seats available')
        duplicate = (await db.execute(select(Enrollment).where(
            Enrollment.batch_id == batch.id, Enrollment.trainee_id == nomination.trainee_id,
            Enrollment.status == 'active'))).scalar_one_or_none()
        if duplicate is not None:
            raise HTTPException(status_code=409, detail='Trainee already enrolled')
        db.add(Enrollment(id=uuid.uuid4(), batch_id=batch.id,
                          trainee_id=nomination.trainee_id, status='active'))
        programme.seats_filled = (programme.seats_filled or 0) + 1
        nomination.batch_id = batch.id
    nomination.status = status
    nomination.decision_note = decision_note
    nomination.reviewed_at = datetime.now(timezone.utc)
    await notify(db, nomination.trainee_id, 'nomination_decided',
                 {'nomination_id': str(nomination.id), 'status': status},
                 title='Nomination update', body=f'Your nomination is {status}.')
    await db.commit()
    return {'id': str(nomination.id), 'status': status,
            'batch_id': str(nomination.batch_id) if nomination.batch_id else None}
