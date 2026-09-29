"""Mobile-facing endpoints (apps/mobile). Response shapes match
apps/mobile/src/types/index.ts. Identity comes from the verified Clerk JWT
when a Bearer token is sent; an explicit `trainee_id` query parameter is
still accepted for compatibility (token wins when both are present)."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import uuid

from app.database import get_db
from app.deps import get_optional_identity, resolve_actor_id, AuthenticatedIdentity
from app.models.course import Course, Module
from app.models.mobile import OfflinePackage, OfflineDownload
from app.services.mobile import load_courses_for_mobile, load_jobs_for_mobile, set_module_completion

router = APIRouter()

TRAINEE_ROLES = ("trainee", "admin")


def _uuid_or_404(value: str, what: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError, TypeError):
        raise HTTPException(status_code=404, detail=f"{what} not found")


def _require_actor(identity, trainee_id) -> uuid.UUID:
    actor = resolve_actor_id(identity, trainee_id, allowed_roles=TRAINEE_ROLES if identity else None)
    if actor is None:
        raise HTTPException(status_code=401, detail="Authentication required (Bearer token or trainee_id)")
    return actor


@router.get("/courses")
async def mobile_courses(
    trainee_id: Optional[str] = Query(None),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Catalog in the mobile `Course` shape: modules with `completed` and the
    caller's `progress` (0 when anonymous / not enrolled)."""
    actor = resolve_actor_id(identity, trainee_id)
    courses = await load_courses_for_mobile(db, actor)
    return {"courses": courses, "total": len(courses)}


@router.get("/courses/{course_id}")
async def mobile_course(
    course_id: str,
    trainee_id: Optional[str] = Query(None),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    cid = _uuid_or_404(course_id, "Course")
    actor = resolve_actor_id(identity, trainee_id)
    courses = await load_courses_for_mobile(db, actor, course_ids=[cid])
    if not courses:
        raise HTTPException(status_code=404, detail="Course not found")
    return courses[0]


class ModuleProgressBody(BaseModel):
    completed: bool = True


@router.post("/courses/{course_id}/modules/{module_id}/progress")
async def mobile_module_progress(
    course_id: str,
    module_id: str,
    body: ModuleProgressBody,
    trainee_id: Optional[str] = Query(None),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Mark a lesson/module complete (or not) for the caller and recompute
    the course progress on their enrollment."""
    cid = _uuid_or_404(course_id, "Course")
    mid = _uuid_or_404(module_id, "Module")
    actor = _require_actor(identity, trainee_id)
    module = (await db.execute(select(Module).where(Module.id == mid, Module.course_id == cid))).scalar_one_or_none()
    if module is None:
        raise HTTPException(status_code=404, detail="Module not found in this course")
    result = await set_module_completion(db, actor, mid, body.completed)
    await db.commit()
    return result


@router.get("/jobs")
async def mobile_jobs(
    trainee_id: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=200),
    skip: int = Query(0, ge=0),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Jobs in the mobile `JobMatch` shape with `match_percentage` for the
    caller (latest stored explainable match, else passport skill overlap),
    sorted best match first, plus `applied`."""
    actor = resolve_actor_id(identity, trainee_id)
    jobs = await load_jobs_for_mobile(db, actor, limit=limit, skip=skip)
    return {"jobs": jobs, "total": len(jobs)}


# ---------------------------------------------------------------------------
# Offline packages
# ---------------------------------------------------------------------------
async def _package_payload(db: AsyncSession, pkg: OfflinePackage, actor: Optional[uuid.UUID], downloaded_at) -> dict:
    courses = await load_courses_for_mobile(db, actor, course_ids=[pkg.course_id])
    course = courses[0] if courses else None
    return {
        "course_id": str(pkg.course_id),
        "title": course["title"] if course else None,
        "version": pkg.version,
        "size_kb": pkg.size_kb,
        "lesson_count": len(course["modules"]) if course else 0,
        "downloaded": downloaded_at is not None,
        "downloaded_at": downloaded_at.isoformat() if downloaded_at else None,
        "course": course,
    }


@router.get("/offline/packages")
async def list_offline_packages(
    trainee_id: Optional[str] = Query(None),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Downloadable course packages. `course` is the full mobile Course
    (with modules) the client stores locally; `downloaded` reflects this
    caller's server-side download record."""
    actor = resolve_actor_id(identity, trainee_id)
    pkgs = list((await db.execute(select(OfflinePackage))).scalars().all())
    downloads = {}
    if actor:
        for d in (await db.execute(select(OfflineDownload).where(OfflineDownload.trainee_id == actor))).scalars().all():
            downloads[d.package_id] = d.downloaded_at
    out = [await _package_payload(db, p, actor, downloads.get(p.id)) for p in pkgs]
    out.sort(key=lambda x: x["title"] or "")
    return {"packages": out, "total": len(out)}


@router.post("/offline/packages/{course_id}/download")
async def download_offline_package(
    course_id: str,
    trainee_id: Optional[str] = Query(None),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Record that the caller saved this course offline and return the
    package (creating the package descriptor on first download)."""
    cid = _uuid_or_404(course_id, "Course")
    actor = _require_actor(identity, trainee_id)
    course = (await db.execute(select(Course).where(Course.id == cid))).scalar_one_or_none()
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    pkg = (await db.execute(select(OfflinePackage).where(OfflinePackage.course_id == cid))).scalar_one_or_none()
    if pkg is None:
        n_modules = len((await db.execute(select(Module.id).where(Module.course_id == cid))).all())
        pkg = OfflinePackage(id=uuid.uuid4(), course_id=cid, version=1, size_kb=max(n_modules, 1) * 1800)
        db.add(pkg)
        await db.flush()
    dl = (
        await db.execute(select(OfflineDownload).where(OfflineDownload.trainee_id == actor, OfflineDownload.package_id == pkg.id))
    ).scalar_one_or_none()
    if dl is None:
        dl = OfflineDownload(id=uuid.uuid4(), trainee_id=actor, package_id=pkg.id)
        db.add(dl)
        await db.flush()
    await db.commit()
    await db.refresh(dl)
    return await _package_payload(db, pkg, actor, dl.downloaded_at)


@router.delete("/offline/packages/{course_id}")
async def remove_offline_package(
    course_id: str,
    trainee_id: Optional[str] = Query(None),
    identity: Optional[AuthenticatedIdentity] = Depends(get_optional_identity),
    db: AsyncSession = Depends(get_db),
):
    """Remove the caller's download record for this course (idempotent)."""
    cid = _uuid_or_404(course_id, "Course")
    actor = _require_actor(identity, trainee_id)
    pkg = (await db.execute(select(OfflinePackage).where(OfflinePackage.course_id == cid))).scalar_one_or_none()
    removed = False
    if pkg is not None:
        dl = (
            await db.execute(select(OfflineDownload).where(OfflineDownload.trainee_id == actor, OfflineDownload.package_id == pkg.id))
        ).scalar_one_or_none()
        if dl is not None:
            await db.delete(dl)
            await db.commit()
            removed = True
    return {"course_id": course_id, "removed": removed}
