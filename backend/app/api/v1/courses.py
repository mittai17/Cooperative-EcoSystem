from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, timezone
import uuid
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.course import Course, CourseEnrollment, Module, Lesson
from app.models.content import ContentTranslation, LessonProgress, MediaAsset, SUPPORTED_LANGS
from app.services.translations import resolve_translations
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
async def list_courses(
    has_content: bool = False,
    lang: str = "en",
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Course).where(Course.is_active == True)
    if has_content:
        stmt = stmt.where(Course.id.in_(
            select(Module.course_id).join(Lesson, Lesson.module_id == Module.id)
            .where(Lesson.content.is_not(None))
        ))
    result = await db.execute(stmt)
    courses = result.scalars().all()
    if courses:
        overlays, _ = await resolve_translations(db, "course", courses, lang)
        data = [{**_serialize(c), **{k: v for k, v in overlays.get(c.id, {}).items() if k in ("title", "description")}} for c in courses]
        return {"courses": data, "total": len(data)}
    if has_content:
        return {"courses": [], "total": 0}
    return {"courses": _DEMO_COURSES, "total": len(_DEMO_COURSES)}


async def _content_rows(db: AsyncSession, course_id: str):
    if not _is_uuid(course_id):
        raise HTTPException(status_code=404, detail="Course not found")
    course = (await db.execute(select(Course).where(Course.id == uuid.UUID(course_id)))).scalar_one_or_none()
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    modules = list((await db.execute(select(Module).where(Module.course_id == course.id).order_by(Module.position.nulls_last(), Module.id))).scalars().all())
    lessons = list((await db.execute(select(Lesson).where(Lesson.module_id.in_([m.id for m in modules])).order_by(Lesson.position.nulls_last(), Lesson.id))).scalars().all()) if modules else []
    return course, modules, lessons


@router.get("/{course_id}/content")
async def course_content(course_id: str, lang: str = "en", db: AsyncSession = Depends(get_db)):
    if lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=422, detail="Unsupported language")
    course, modules, lessons = await _content_rows(db, course_id)
    course_overlay, course_status = await resolve_translations(db, "course", [course], lang)
    module_overlay, module_status = await resolve_translations(db, "module", modules, lang)
    lesson_overlay, lesson_status = await resolve_translations(db, "lesson", lessons, lang)
    entities = [("course", course.id)] + [("module", m.id) for m in modules] + [("lesson", l.id) for l in lessons]
    available = (await db.execute(select(ContentTranslation.lang).where(
        ContentTranslation.entity_type.in_(["course", "module", "lesson"]),
        ContentTranslation.entity_id.in_([eid for _, eid in entities]),
    ).distinct())).scalars().all()
    by_module = {m.id: [] for m in modules}
    for lesson in lessons:
        fields = lesson_overlay.get(lesson.id, {})
        by_module[lesson.module_id].append({
            "id": str(lesson.id), "title": fields.get("title", lesson.title),
            "position": lesson.position, "lesson_type": lesson.lesson_type,
            "duration_min": lesson.duration_min, "blocks": fields.get("blocks", lesson.content or []),
            "content_version": lesson.content_version,
            "lang_served": lang if fields else "en", "translation_status": lesson_status.get(lesson.id),
        })
    course_fields = course_overlay.get(course.id, {})
    return {
        "id": str(course.id), "title": course_fields.get("title", course.title),
        "description": course_fields.get("description", course.description),
        "lang_requested": lang, "lang_served": lang if course_fields else "en",
        "translation_status": course_status.get(course.id),
        "langs_available": sorted(set(["en", *available])),
        "content_version": max((l.content_version or 1 for l in lessons), default=1),
        "modules": [{
            "id": str(m.id), "title": module_overlay.get(m.id, {}).get("title", m.title),
            "position": m.position, "duration_minutes": m.duration_minutes,
            "summary": module_overlay.get(m.id, {}).get("summary", m.summary),
            "lang_served": lang if module_overlay.get(m.id) else "en",
            "translation_status": module_status.get(m.id), "lessons": by_module[m.id],
        } for m in modules],
    }


@router.get("/{course_id}/manifest")
async def course_manifest(course_id: str, lang: str = "en", db: AsyncSession = Depends(get_db)):
    if lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=422, detail="Unsupported language")
    course, _, lessons = await _content_rows(db, course_id)
    assets = list((await db.execute(select(MediaAsset).where(
        MediaAsset.lesson_id.in_([l.id for l in lessons]),
        MediaAsset.downloadable == True,
    ))).scalars().all()) if lessons else []
    assets = [a for a in assets if a.lang in (None, "en", lang)]
    return {"course_id": str(course.id), "lang": lang,
            "content_version": max((l.content_version or 1 for l in lessons), default=1),
            "assets": [{"id": str(a.id), "lesson_id": str(a.lesson_id), "url": a.url,
                        "size": a.size, "sha256": a.sha256, "mime": a.mime, "kind": a.kind,
                        "lang": a.lang} for a in assets]}


class ProgressInput(BaseModel):
    status: str
    position_sec: Optional[int] = Field(default=None, ge=0)
    score: Optional[int] = Field(default=None, ge=0, le=100)
    client_id: Optional[str] = None
    occurred_at: Optional[datetime] = None


@router.post("/lessons/{lesson_id}/progress")
async def update_lesson_progress(
    lesson_id: uuid.UUID, payload: ProgressInput,
    trainee_id: Optional[str] = Query(None),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    trainee_uuid = resolve_actor_id(identity, trainee_id, allowed_roles=("trainee", "admin"))
    if trainee_uuid is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    if payload.status not in ("not_started", "in_progress", "completed"):
        raise HTTPException(status_code=422, detail="Invalid progress status")
    lesson = (await db.execute(select(Lesson).where(Lesson.id == lesson_id))).scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    module = (await db.execute(select(Module).where(Module.id == lesson.module_id))).scalar_one()
    now = datetime.now(timezone.utc)
    progress = (await db.execute(select(LessonProgress).where(
        LessonProgress.lesson_id == lesson_id, LessonProgress.trainee_id == trainee_uuid,
    ))).scalar_one_or_none()
    if progress is None:
        progress = LessonProgress(trainee_id=trainee_uuid, lesson_id=lesson_id)
        db.add(progress)
    # Completion is monotonic, even when an older offline event arrives later.
    if progress.status != "completed":
        progress.status = payload.status
        if payload.status == "completed":
            progress.completed_at = now
    if payload.position_sec is not None:
        progress.position_sec = max(progress.position_sec or 0, payload.position_sec)
    if payload.score is not None:
        progress.score = max(progress.score or 0, payload.score)
    progress.updated_at = now
    await db.flush()
    lesson_ids = list((await db.execute(select(Lesson.id).join(Module, Lesson.module_id == Module.id)
        .where(Module.course_id == module.course_id, Lesson.content.is_not(None)))).scalars().all())
    completed = (await db.execute(select(func.count()).select_from(LessonProgress).where(
        LessonProgress.trainee_id == trainee_uuid,
        LessonProgress.lesson_id.in_(lesson_ids), LessonProgress.status == "completed",
    ))).scalar_one() if lesson_ids else 0
    percentage = round(100 * completed / len(lesson_ids)) if lesson_ids else 0
    enrollment = (await db.execute(select(CourseEnrollment).where(
        CourseEnrollment.trainee_id == trainee_uuid, CourseEnrollment.course_id == module.course_id,
    ))).scalar_one_or_none()
    if enrollment is None:
        enrollment = CourseEnrollment(trainee_id=trainee_uuid, course_id=module.course_id,
                                      progress=percentage, status="active", enrolled_at=now)
        db.add(enrollment)
    else:
        enrollment.progress = percentage
    enrollment.last_accessed = now
    await db.commit()
    return {"lesson_id": str(lesson_id), "status": progress.status,
            "position_sec": progress.position_sec, "score": progress.score,
            "course_id": str(module.course_id), "course_progress": percentage}


@router.get("/{course_id}/progress")
async def get_course_progress(
    course_id: str, trainee_id: Optional[str] = Query(None),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    trainee_uuid = resolve_actor_id(identity, trainee_id, allowed_roles=("trainee", "admin"))
    if trainee_uuid is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    course, _, lessons = await _content_rows(db, course_id)
    ids = [l.id for l in lessons if l.content is not None]
    rows = list((await db.execute(select(LessonProgress).where(
        LessonProgress.trainee_id == trainee_uuid, LessonProgress.lesson_id.in_(ids)
    ))).scalars().all()) if ids else []
    by_id = {row.lesson_id: row for row in rows}
    completed = sum(1 for row in rows if row.status == "completed")
    return {"course_id": str(course.id), "progress": round(100 * completed / len(ids)) if ids else 0,
            "lessons": [{"lesson_id": str(lid), "status": by_id[lid].status if lid in by_id else "not_started",
                         "position_sec": by_id[lid].position_sec if lid in by_id else None,
                         "score": by_id[lid].score if lid in by_id else None} for lid in ids]}


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
            existing = None
            if trainee_uuid is not None:
                existing = (
                    await db.execute(
                        select(CourseEnrollment).where(
                            CourseEnrollment.trainee_id == trainee_uuid,
                            CourseEnrollment.course_id == course.id,
                        ).limit(1)
                    )
                ).scalar_one_or_none()
            if existing is not None:
                # Idempotent: re-enrolling returns the existing enrollment.
                return {"status": "enrolled", "course_id": course_id, "enrollment_id": str(existing.id)}
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


class ImportDikshaCourseRequest(BaseModel):
    diksha_identifier: str
    category: Optional[str] = "Cooperative Management"
    level: Optional[str] = "Foundation"
    skills: list[str] = Field(default_factory=list)


class AddResourceToCourseRequest(BaseModel):
    module_title: str = "Core Lessons"
    diksha_resource_id: str


@router.post("/import-diksha")
async def import_diksha_course(
    data: ImportDikshaCourseRequest,
    db: AsyncSession = Depends(get_db),
):
    """Imports a DIKSHA course/collection into a native CoopSetu Course with modules and lessons."""
    from integrations.diksha import diksha_service, DikshaNotFound, DikshaUnavailable

    # Check if already imported
    existing = (
        await db.execute(
            select(Course).where(
                Course.source == "DIKSHA",
                Course.external_id == data.diksha_identifier,
            )
        )
    ).scalar_one_or_none()

    if existing is not None:
        return {"status": "already_exists", "course_id": str(existing.id), "title": existing.title}

    # Fetch details or hierarchy
    try:
        hierarchy = await diksha_service.get_course_hierarchy(data.diksha_identifier)
        course_title = hierarchy.title
        course_desc = hierarchy.description
        modules_data = hierarchy.modules
    except (DikshaNotFound, DikshaUnavailable):
        # Fallback to single resource details
        try:
            res = await diksha_service.get_resource_details(data.diksha_identifier)
            course_title = res.title
            course_desc = res.description
            modules_data = []
        except Exception as exc:
            raise HTTPException(status_code=404, detail=f"DIKSHA resource {data.diksha_identifier} could not be resolved: {exc}")

    new_course = Course(
        id=uuid.uuid4(),
        title=course_title,
        category=data.category or "Cooperative Education",
        level=data.level or "Foundation",
        duration_hours=20,
        instructor="NCCT / DIKSHA National Learning",
        rating=4.9,
        enrolled_count=0,
        skills=data.skills or ["Cooperative Operations", "Digital Skills"],
        description=course_desc or "Curated national cooperative learning pathway from DIKSHA.",
        is_active=True,
        source="DIKSHA",
        external_id=data.diksha_identifier,
        external_url=f"https://diksha.gov.in/play/content/{data.diksha_identifier}",
        synced_at=datetime.now(timezone.utc),
    )
    db.add(new_course)
    await db.flush()

    # Add modules & lessons
    if modules_data:
        for idx, mod in enumerate(modules_data[:8], start=1):
            new_mod = Module(
                id=uuid.uuid4(),
                course_id=new_course.id,
                title=mod.name,
                position=idx,
                duration_minutes=mod.duration or 30,
                summary=mod.description or f"Module {idx} for {course_title}",
                source="DIKSHA",
                external_id=mod.identifier,
            )
            db.add(new_mod)
            await db.flush()

            # Add lessons
            for l_idx, lesson_node in enumerate(mod.children[:5], start=1):
                new_lesson = Lesson(
                    id=uuid.uuid4(),
                    module_id=new_mod.id,
                    title=lesson_node.name,
                    position=l_idx,
                    lesson_type="video" if "video" in (lesson_node.mime_type or "") else "document" if "pdf" in (lesson_node.mime_type or "") else "mixed",
                    duration_min=15,
                    source="DIKSHA",
                    external_id=lesson_node.identifier,
                    external_url=lesson_node.artifact_url,
                )
                db.add(new_lesson)
    else:
        # Single module course
        new_mod = Module(
            id=uuid.uuid4(),
            course_id=new_course.id,
            title="Module 1: Core Content",
            position=1,
            duration_minutes=45,
            summary=course_desc or "Primary instruction module",
            source="DIKSHA",
            external_id=data.diksha_identifier,
        )
        db.add(new_mod)
        await db.flush()

        new_lesson = Lesson(
            id=uuid.uuid4(),
            module_id=new_mod.id,
            title=course_title,
            position=1,
            lesson_type="video",
            duration_min=30,
            source="DIKSHA",
            external_id=data.diksha_identifier,
        )
        db.add(new_lesson)

    await db.commit()
    return {
        "status": "imported",
        "course_id": str(new_course.id),
        "title": new_course.title,
        "modules_count": len(modules_data) if modules_data else 1,
    }


@router.post("/{course_id}/add-resource")
async def add_resource_to_course(
    course_id: str,
    data: AddResourceToCourseRequest,
    db: AsyncSession = Depends(get_db),
):
    """Adds an approved DIKSHA learning resource into a course module."""
    if not _is_uuid(course_id):
        raise HTTPException(status_code=404, detail="Course not found")

    course = (await db.execute(select(Course).where(Course.id == uuid.UUID(course_id)))).scalar_one_or_none()
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    from integrations.diksha import diksha_service
    res = await diksha_service.get_resource_details(data.diksha_resource_id)

    # Find or create module
    mod = (
        await db.execute(
            select(Module)
            .where(Module.course_id == course.id, Module.title == data.module_title)
            .limit(1)
        )
    ).scalar_one_or_none()

    if mod is None:
        mod = Module(
            id=uuid.uuid4(),
            course_id=course.id,
            title=data.module_title,
            position=1,
            source="DIKSHA",
        )
        db.add(mod)
        await db.flush()

    new_lesson = Lesson(
        id=uuid.uuid4(),
        module_id=mod.id,
        title=res.title,
        lesson_type="video" if res.content_type == "video" else "document" if res.content_type == "document" else "mixed",
        duration_min=(res.duration // 60) if res.duration else 15,
        source="DIKSHA",
        external_id=res.external_id,
        external_url=res.artifact_url or res.player_url,
    )
    db.add(new_lesson)
    await db.commit()

    return {
        "status": "added",
        "course_id": str(course.id),
        "module_id": str(mod.id),
        "lesson_id": str(new_lesson.id),
        "lesson_title": new_lesson.title,
        "license_status": res.license_status,
        "attribution": res.attribution,
    }
