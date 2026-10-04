"""DIKSHA public video search for the app (mounted at /content/diksha).

Read-only proxy over the DIKSHA public content API. Available to trainee,
trainer and admin roles. No database writes and no organisation scope: the
content is public. Upstream failures map to 502 with a short message.
"""
from __future__ import annotations

from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict

from app.deps import require_roles
from app.models.user import User
from app.services import diksha_content as svc

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
