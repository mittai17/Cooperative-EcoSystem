"""Pydantic models for DIKSHA discovery, search, normalization, and player delivery."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

from .licensing import LicenseStatus

SourceType = Literal["DIKSHA", "YOUTUBE", "COOPSETU", "OTHER"]
ContentType = Literal["video", "document", "course", "interactive", "resource"]


class DikshaSearchFilters(BaseModel):
    query: str
    subject: Optional[str] = None
    topic: Optional[str] = None
    skill: Optional[str] = None
    language: Optional[str] = None
    content_type: Optional[str] = None
    course: Optional[str] = None
    grade_level: Optional[str] = None
    organization: Optional[str] = None
    limit: int = Field(default=12, ge=1, le=50)
    offset: int = Field(default=0, ge=0, le=1000)


class LearningResourceModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[str] = None
    external_id: str
    source: SourceType = "DIKSHA"
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    language: Optional[str] = None
    content_type: str = "video"
    duration: Optional[int] = None  # seconds
    duration_formatted: Optional[str] = None
    author: Optional[str] = None
    organization: Optional[str] = None
    license: Optional[str] = None
    license_url: Optional[str] = None
    attribution: Optional[str] = None
    license_status: LicenseStatus = LicenseStatus.ALLOWED_WITH_ATTRIBUTION
    embedding_allowed: bool = True
    commercial_use_allowed: bool = False
    modification_allowed: bool = False
    source_url: Optional[str] = None
    player_url: Optional[str] = None
    streaming_url: Optional[str] = None
    artifact_url: Optional[str] = None
    mime_type: Optional[str] = None
    size_mb: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DikshaSearchResponse(BaseModel):
    items: List[LearningResourceModel]
    total_count: int
    limit: int
    offset: int
    has_more: bool


class CourseHierarchyNode(BaseModel):
    identifier: str
    name: str
    description: Optional[str] = None
    content_type: str
    mime_type: Optional[str] = None
    artifact_url: Optional[str] = None
    duration: Optional[int] = None
    children: List[CourseHierarchyNode] = Field(default_factory=list)


class DikshaHierarchyResponse(BaseModel):
    identifier: str
    title: str
    description: Optional[str] = None
    modules: List[CourseHierarchyNode] = Field(default_factory=list)
    total_resources: int = 0
