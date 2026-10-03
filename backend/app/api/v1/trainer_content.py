"""Trainer learning-content endpoints (included under /api/v1/trainer).

Content = Lesson rows under Modules of the trainer's courses, plus MediaAsset
rows for attached files/links. Extra metadata the schema has no column for
(published state, visibility, language, description, kind) lives in one
`{"type": "trainer_meta", ...}` block inside Lesson.content (existing JSONB), so
no new tables are needed. Binary upload is not supported (no media storage in
this backend): items carry an http(s) URL.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Course, Lesson, MediaAsset, Module, User
from app.services import trainer_metrics as tm

router = APIRouter()

DEMO_TRAINER_EMAIL = "s.kumar@vamnicom-demo.example.com"
META = "trainer_meta"
KIND_LABEL = {"video": "Video", "pdf": "PDF", "presentation": "Presentation", "link": "Link", "quiz": "Quiz",
              "lesson": "Lesson", "audio": "Audio"}


async def _trainer(x_demo_user: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)) -> User:
    email = (x_demo_user or DEMO_TRAINER_EMAIL).strip().lower()
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user is None or user.role != "trainer" or user.is_active is False:
        raise HTTPException(status_code=403, detail="No trainer account for this demo user")
    return user


def _meta(lesson: Lesson) -> dict:
    if isinstance(lesson.content, list):
        for b in lesson.content:
            if isinstance(b, dict) and b.get("type") == META:
                return b
    return {}


def _kind(lesson: Lesson, assets: list[MediaAsset], meta: dict) -> str:
    if meta.get("kind") in KIND_LABEL:
        return meta["kind"]
    if lesson.lesson_type == "quiz":
        return "quiz"
    for a in assets:
        if a.kind == "video":
            return "video"
        if a.kind == "audio":
            return "audio"
        if a.kind == "document":
            m = (a.mime or a.url or "").lower()
            return "presentation" if ("presentation" in m or m.endswith((".ppt", ".pptx"))) else "pdf"
    if lesson.lesson_type == "video":
        return "video"
    return "lesson"


def _duration(lesson: Lesson, assets: list[MediaAsset]) -> Optional[int]:
    if lesson.duration_min:
        return lesson.duration_min
    secs = [a.duration_sec for a in assets if a.duration_sec]
    return max(1, round(max(secs) / 60)) if secs else None


async def _my_courses(db: AsyncSession, trainer: User) -> dict[uuid.UUID, Course]:
    return {c.id: c for _, _, c in await tm.trainer_classes(db, trainer.id)}


async def _own_lesson(db: AsyncSession, trainer: User, lesson_id: uuid.UUID) -> tuple[Lesson, Module, Course]:
    row = (await db.execute(select(Lesson, Module).join(Module, Module.id == Lesson.module_id)
                            .where(Lesson.id == lesson_id))).first()
    courses = await _my_courses(db, trainer)
    if row is None or row[1].course_id not in courses:
        raise HTTPException(status_code=404, detail="Content not found")
    return row[0], row[1], courses[row[1].course_id]


@router.get("/content")
async def list_content(course_id: Optional[uuid.UUID] = Query(None), db: AsyncSession = Depends(get_db),
                       trainer: User = Depends(_trainer)):
    courses = await _my_courses(db, trainer)
    if course_id is not None and course_id not in courses:
        raise HTTPException(status_code=404, detail="Course not found")
    target = [course_id] if course_id else list(courses)
    base = {"courses": sorted([{"id": str(c.id), "title": c.title} for c in courses.values()], key=lambda c: c["title"]),
            "modules": [], "items": [], "summary": {"total": 0, "published": 0, "draft": 0, "videos": 0}}
    if not target:
        return base
    modules = (await db.execute(select(Module).where(Module.course_id.in_(target))
                                .order_by(Module.position, Module.title))).scalars().all()
    base["modules"] = [{"id": str(m.id), "title": m.title, "course_id": str(m.course_id)} for m in modules]
    if not modules:
        return base
    mod_by_id = {m.id: m for m in modules}
    lessons = (await db.execute(select(Lesson).where(Lesson.module_id.in_(list(mod_by_id)))
                                .order_by(Lesson.position, Lesson.title))).scalars().all()
    assets_by_lesson: dict[uuid.UUID, list[MediaAsset]] = {}
    if lessons:
        for a in (await db.execute(select(MediaAsset).where(MediaAsset.lesson_id.in_([l.id for l in lessons])))).scalars():
            assets_by_lesson.setdefault(a.lesson_id, []).append(a)
    counters: dict[uuid.UUID, int] = {}
    items = []
    for m in modules:
        for l in (x for x in lessons if x.module_id == m.id):
            counters[m.course_id] = counters.get(m.course_id, 0) + 1
            meta, assets = _meta(l), assets_by_lesson.get(l.id, [])
            kind = _kind(l, assets, meta)
            url = meta.get("url") or (assets[0].url if assets else None) or l.external_url
            items.append({
                "id": str(l.id), "number": counters[m.course_id], "title": l.title or "Untitled",
                "course_id": str(m.course_id), "course": courses[m.course_id].title,
                "module_id": str(m.id), "module": m.title, "kind": kind, "type_label": KIND_LABEL[kind],
                "duration_min": _duration(l, assets), "published": meta.get("published", True) is not False,
                "language": meta.get("language") or (assets[0].lang if assets and assets[0].lang else "en"),
                "visibility": meta.get("visibility") or "batch", "description": meta.get("description"),
                "url": url, "created_at": meta.get("created_at"),
            })
    base["items"] = items
    base["summary"] = {"total": len(items), "published": sum(i["published"] for i in items),
                       "draft": sum(not i["published"] for i in items), "videos": sum(i["kind"] == "video" for i in items)}
    return base


class ContentIn(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    course_id: uuid.UUID
    module_id: Optional[uuid.UUID] = None
    module_title: Optional[str] = Field(None, max_length=255)
    language: str = Field("en", pattern="^(en|hi|mr)$")
    visibility: str = Field("batch", pattern="^(batch|private)$")
    kind: str = Field(pattern="^(video|pdf|presentation|link)$")
    url: str = Field(min_length=1, max_length=1000)
    duration_min: Optional[int] = Field(None, ge=1, le=1000)
    publish: bool = False


@router.post("/content")
async def create_content(body: ContentIn, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    courses = await _my_courses(db, trainer)
    if body.course_id not in courses:
        raise HTTPException(status_code=404, detail="Course not found")
    url = body.url.strip()
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.netloc:
        raise HTTPException(status_code=422, detail="URL must start with http:// or https://")

    if body.module_id:
        module = await db.get(Module, body.module_id)
        if module is None or module.course_id != body.course_id:
            raise HTTPException(status_code=404, detail="Module not found in this course")
    else:
        title = (body.module_title or "").strip() or "Trainer resources"
        module = (await db.execute(select(Module).where(Module.course_id == body.course_id, Module.title == title))).scalars().first()
        if module is None:
            top = (await db.execute(select(func.max(Module.position)).where(Module.course_id == body.course_id))).scalar() or 0
            module = Module(course_id=body.course_id, title=title, position=top + 1)
            db.add(module)
            await db.flush()
    pos = ((await db.execute(select(func.max(Lesson.position)).where(Lesson.module_id == module.id))).scalar() or 0) + 1
    now = datetime.now(timezone.utc)
    meta = {"type": META, "kind": body.kind, "description": (body.description or "").strip() or None,
            "language": body.language, "visibility": body.visibility, "published": body.publish, "url": url,
            "uploaded_by": str(trainer.id), "created_at": now.isoformat()}
    lesson = Lesson(module_id=module.id, title=body.title.strip(), position=pos,
                    lesson_type="video" if body.kind == "video" else "text", duration_min=body.duration_min,
                    content=[meta], external_url=url if body.kind == "link" else None)
    db.add(lesson)
    await db.flush()
    if body.kind != "link":
        host = p.netloc.lower()
        yt = "youtube.com" in host or "youtu.be" in host
        mime = {"pdf": "application/pdf",
                "presentation": "application/vnd.openxmlformats-officedocument.presentationml.presentation"}.get(body.kind)
        db.add(MediaAsset(lesson_id=lesson.id, kind="video" if body.kind == "video" else "document",
                          provider="youtube" if yt else "native", lang=body.language, url=url,
                          downloadable=not yt, mime=mime, duration_sec=body.duration_min * 60 if body.duration_min else None))
    await db.commit()
    return {"id": str(lesson.id), "published": body.publish, "module_id": str(module.id)}


@router.post("/content/{lesson_id}/publish")
async def publish_content(lesson_id: uuid.UUID, db: AsyncSession = Depends(get_db), trainer: User = Depends(_trainer)):
    lesson, _, _ = await _own_lesson(db, trainer, lesson_id)
    blocks = [dict(b) if isinstance(b, dict) else b for b in (lesson.content if isinstance(lesson.content, list) else [])]
    meta = next((b for b in blocks if isinstance(b, dict) and b.get("type") == META), None)
    if meta is None:
        meta = {"type": META}
        blocks.append(meta)
    meta["published"] = True
    lesson.content = blocks
    lesson.content_version = (lesson.content_version or 1) + 1
    await db.commit()
    return {"id": str(lesson.id), "published": True}
