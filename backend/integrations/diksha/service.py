"""High-level DIKSHA and educational content integration service."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .client import DikshaClient
from .exceptions import DikshaNotFound, DikshaUnavailable
from .mapper import normalize_course_hierarchy, normalize_diksha_item
from .models import (
    DikshaHierarchyResponse,
    DikshaSearchFilters,
    DikshaSearchResponse,
    LearningResourceModel,
)

logger = logging.getLogger(__name__)


class DikshaService:
    def __init__(self, client: Optional[DikshaClient] = None):
        self.client = client or DikshaClient()

    async def search_learning_content(
        self,
        filters: DikshaSearchFilters,
    ) -> DikshaSearchResponse:
        """Searches educational content from DIKSHA with rich multi-facet filtering."""
        raw_result = await self.client.search(
            query=filters.query,
            subject=filters.subject,
            topic=filters.topic,
            skill=filters.skill,
            language=filters.language,
            content_type=filters.content_type,
            course=filters.course,
            grade_level=filters.grade_level,
            organization=filters.organization,
            limit=filters.limit,
            offset=filters.offset,
        )

        content_list = raw_result.get("content", [])
        total_count = raw_result.get("count", len(content_list))

        items: List[LearningResourceModel] = []
        if isinstance(content_list, list):
            for raw in content_list:
                norm = normalize_diksha_item(raw)
                if norm is not None:
                    items.append(norm)

        has_more = (filters.offset + len(items)) < total_count and len(items) >= filters.limit

        return DikshaSearchResponse(
            items=items,
            total_count=total_count,
            limit=filters.limit,
            offset=filters.offset,
            has_more=has_more,
        )

    async def get_resource_details(self, content_id: str) -> LearningResourceModel:
        """Fetches and normalizes a single DIKSHA content item."""
        raw_content = await self.client.get_content(content_id)
        norm = normalize_diksha_item(raw_content)
        if norm is None:
            raise DikshaNotFound(f"Resource {content_id} could not be normalized")
        return norm

    async def get_course_hierarchy(self, course_id: str) -> DikshaHierarchyResponse:
        """Fetches and maps a multi-module DIKSHA course hierarchy."""
        raw_hierarchy = await self.client.get_course_hierarchy(course_id)
        return normalize_course_hierarchy(raw_hierarchy)


# Global singleton instance
diksha_service = DikshaService()
