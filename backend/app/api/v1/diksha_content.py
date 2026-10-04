"""DIKSHA public video search and educational content integration for the app.

Mounted at /content/diksha.
Available to trainee, trainer and admin roles.
"""
from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict

from app.deps import require_roles
from app.models.user import User
from app.services import diksha_content as svc
from integrations.diksha import (
    DikshaHierarchyResponse,
    DikshaNotFound,
    DikshaSearchFilters,
    DikshaUnavailable,
    LearningResourceModel,
    diksha_service,
)

router = APIRouter()

_CONTENT_ROLES = require_roles("trainee", "trainer", "admin")

Subject = Literal[
    "Science", "Mathematics", "English", "Hindi", "Social Science", "Physics",
    "Chemistry", "Biology", "Computer Science", "Economics", "Accountancy",
]
MIN_QUERY_CHARS = 2
MAX_QUERY_CHARS = 100
DEFAULT_LIMIT = 12
MAX_LIMIT = 24
MAX_OFFSET = 500


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


class VideoItem(_Strict):
    identifier: str
    title: Optional[str]
    subject: Optional[str]
    language: Optional[str]
    license: Optional[str]
    copyright: Optional[str]
    size_mb: Optional[float]
    video_url: str


class VideoSearchResponse(_Strict):
    items: list[VideoItem]
    limit: int
    offset: int


@router.get("/search", response_model=VideoSearchResponse)
async def search_content(
    q: str = Query(..., max_length=MAX_QUERY_CHARS, description="Search text, 2-100 characters after trimming"),
    subject: Optional[Subject] = Query(None, description="One of the supported subjects"),
    limit: int = Query(DEFAULT_LIMIT, ge=1, le=MAX_LIMIT),
    offset: int = Query(0, ge=0, le=MAX_OFFSET),
    user: User = Depends(_CONTENT_ROLES),
):
    query = q.strip()
    if len(query) < MIN_QUERY_CHARS:
        raise HTTPException(
            status_code=422,
            detail=f"q must be at least {MIN_QUERY_CHARS} characters after trimming",
        )
    try:
        items = await svc.search_videos(query, subject, limit, offset)
    except svc.DikshaUnavailable:
        raise HTTPException(status_code=502, detail="DIKSHA content is unavailable right now; try again later")
    return {
        "items": [VideoItem(**item) for item in items],
        "limit": limit,
        "offset": offset,
    }


@router.get("/discover")
async def discover_content(
    q: str = Query(..., min_length=2, max_length=150, description="Free text search"),
    subject: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    skill: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None, description="video | document | course | interactive"),
    grade_level: Optional[str] = Query(None),
    organization: Optional[str] = Query(None),
    limit: int = Query(12, ge=1, le=50),
    offset: int = Query(0, ge=0, le=1000),
    user: User = Depends(_CONTENT_ROLES),
):
    """Broad discovery across videos, PDFs, and courses with rich facet filters."""
    filters = DikshaSearchFilters(
        query=q.strip(),
        subject=subject,
        topic=topic,
        skill=skill,
        language=language,
        content_type=content_type,
        grade_level=grade_level,
        organization=organization,
        limit=limit,
        offset=offset,
    )
    try:
        return await diksha_service.search_learning_content(filters)
    except DikshaUnavailable:
        raise HTTPException(status_code=502, detail="DIKSHA content is unavailable right now; try again later")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/read/{content_id}", response_model=LearningResourceModel)
async def read_content(
    content_id: str,
    user: User = Depends(_CONTENT_ROLES),
):
    """Retrieves full normalized metadata, streaming links, and licensing terms for a resource."""
    try:
        return await diksha_service.get_resource_details(content_id)
    except DikshaNotFound:
        raise HTTPException(status_code=404, detail=f"Content {content_id} not found on DIKSHA")
    except DikshaUnavailable:
        raise HTTPException(status_code=502, detail="DIKSHA service is currently unavailable")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/hierarchy/{course_id}", response_model=DikshaHierarchyResponse)
async def get_hierarchy(
    course_id: str,
    user: User = Depends(_CONTENT_ROLES),
):
    """Retrieves collection/course hierarchy with modules and lessons."""
    try:
        return await diksha_service.get_course_hierarchy(course_id)
    except DikshaNotFound:
        raise HTTPException(status_code=404, detail=f"Course {course_id} hierarchy not found")
    except DikshaUnavailable:
        raise HTTPException(status_code=502, detail="DIKSHA service is currently unavailable")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
