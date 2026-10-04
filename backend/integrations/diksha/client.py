"""Official Sunbird / DIKSHA API client.

Communicates with public DIKSHA gateway:
- Search: POST /api/content/v1/search
- Content Read: GET /api/content/v1/read/{content_id}
- Course Hierarchy: GET /api/course/v1/hierarchy/{course_id}
"""
from __future__ import annotations

import logging
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx

from .exceptions import DikshaInvalidResponse, DikshaNotFound, DikshaUnavailable

logger = logging.getLogger(__name__)

DIKSHA_BASE_URL = "https://diksha.gov.in"
DIKSHA_SEARCH_URL = f"{DIKSHA_BASE_URL}/api/content/v1/search"
DIKSHA_READ_URL = f"{DIKSHA_BASE_URL}/api/content/v1/read"
DIKSHA_HIERARCHY_URL = f"{DIKSHA_BASE_URL}/api/course/v1/hierarchy"

REQUEST_TIMEOUT_SECONDS = 15.0
CACHE_TTL_SECONDS = 600
MAX_CACHE_ENTRIES = 512

# Allowed official domains for artifacts / streaming
ALLOWED_DOMAINS = {
    "diksha.gov.in",
    "obj.diksha.gov.in",
    "files.odev.oci.diksha.gov.in",
    "ntp-content-production.s3.ap-south-1.amazonaws.com",
    "youtube.com",
    "www.youtube.com",
    "youtu.be",
}

FIELDS_SEARCH = [
    "identifier",
    "name",
    "description",
    "appIcon",
    "posterImage",
    "artifactUrl",
    "downloadUrl",
    "streamingUrl",
    "previewUrl",
    "mimeType",
    "contentType",
    "resourceType",
    "primaryCategory",
    "subject",
    "topic",
    "language",
    "gradeLevel",
    "license",
    "licenseUrl",
    "copyright",
    "creator",
    "owner",
    "organisation",
    "publisher",
    "duration",
    "size",
    "compatibilityLevel",
]

_cache: Dict[str, tuple[float, Any]] = {}


def _get_cache(key: str) -> Optional[Any]:
    entry = _cache.get(key)
    if entry is None:
        return None
    expires_at, val = entry
    if time.monotonic() >= expires_at:
        _cache.pop(key, None)
        return None
    return val


def _set_cache(key: str, val: Any) -> None:
    if len(_cache) >= MAX_CACHE_ENTRIES:
        oldest = next(iter(_cache))
        _cache.pop(oldest, None)
    _cache[key] = (time.monotonic() + CACHE_TTL_SECONDS, val)


def clear_cache() -> None:
    _cache.clear()


def is_allowed_media_url(url: Optional[str]) -> bool:
    if not url or not isinstance(url, str):
        return False
    try:
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        if not hostname:
            return False
        # Match exact domain or *.diksha.gov.in or *.customer-oci.com (DIKSHA OCI CDN)
        if hostname in ALLOWED_DOMAINS:
            return True
        if hostname.endswith(".diksha.gov.in") or hostname.endswith(".customer-oci.com"):
            return True
        return False
    except Exception:
        return False


def _new_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS)


class DikshaClient:
    """Async client interacting with official DIKSHA / Sunbird APIs."""

    def __init__(self, client_factory=_new_client):
        self._client_factory = client_factory

    async def search(
        self,
        query: str,
        subject: Optional[str] = None,
        topic: Optional[str] = None,
        skill: Optional[str] = None,
        language: Optional[str] = None,
        content_type: Optional[str] = None,
        course: Optional[str] = None,
        grade_level: Optional[str] = None,
        organization: Optional[str] = None,
        limit: int = 12,
        offset: int = 0,
    ) -> Dict[str, Any]:
        """Queries the official DIKSHA search API."""
        cache_key = f"search:{query}:{subject}:{topic}:{skill}:{language}:{content_type}:{grade_level}:{organization}:{limit}:{offset}"
        cached = _get_cache(cache_key)
        if cached is not None:
            return cached

        # Build query string including subject/topic/skill if specified
        query_terms = [query]
        if subject:
            query_terms.append(subject)
        if topic:
            query_terms.append(topic)
        if skill:
            query_terms.append(skill)
        full_query = " ".join(t.strip() for t in query_terms if t.strip())

        # Construct filters
        filters: Dict[str, Any] = {}
        if content_type == "video":
            filters["mimeType"] = ["video/mp4", "video/webm", "video/x-youtube"]
            filters["contentType"] = ["Resource"]
        elif content_type in ("document", "pdf"):
            filters["mimeType"] = ["application/pdf"]
            filters["contentType"] = ["Resource"]
        elif content_type == "course":
            filters["contentType"] = ["Course", "Collection"]
        else:
            # Broad search: include Resource, Course, Collection
            filters["contentType"] = ["Resource", "Collection", "Course"]

        if language and language.lower() not in ("all", "all languages"):
            filters["language"] = [language]
        if organization:
            filters["organisation"] = [organization]
        if grade_level:
            filters["gradeLevel"] = [grade_level]

        body = {
            "request": {
                "query": full_query,
                "filters": filters,
                "fields": FIELDS_SEARCH,
                "limit": limit,
                "offset": offset,
            }
        }

        try:
            async with self._client_factory() as client:
                resp = await client.post(DIKSHA_SEARCH_URL, json=body)
        except httpx.HTTPError as exc:
            logger.warning("DIKSHA search request failed: %s", exc)
            raise DikshaUnavailable("Failed to reach DIKSHA upstream server") from exc

        if resp.status_code != 200:
            logger.warning("DIKSHA search HTTP status: %s", resp.status_code)
            raise DikshaUnavailable(f"DIKSHA returned error HTTP {resp.status_code}")

        try:
            data = resp.json()
        except ValueError as exc:
            raise DikshaInvalidResponse("Invalid JSON returned by DIKSHA search") from exc

        params = data.get("params") if isinstance(data, dict) else None
        if isinstance(params, dict) and params.get("status") == "failed":
            raise DikshaUnavailable("DIKSHA reported search status: failed")

        result = data.get("result", {})
        _set_cache(cache_key, result)
        return result

    async def get_content(self, content_id: str) -> Dict[str, Any]:
        """Retrieves content metadata and streaming/artifact links."""
        cache_key = f"content:{content_id}"
        cached = _get_cache(cache_key)
        if cached is not None:
            return cached

        url = f"{DIKSHA_READ_URL}/{content_id}?fields={','.join(FIELDS_SEARCH)}"
        try:
            async with self._client_factory() as client:
                resp = await client.get(url)
        except httpx.HTTPError as exc:
            logger.warning("DIKSHA get_content request failed: %s", exc)
            raise DikshaUnavailable(f"Failed to reach DIKSHA for {content_id}") from exc

        if resp.status_code == 404:
            raise DikshaNotFound(f"DIKSHA content {content_id} not found")
        if resp.status_code != 200:
            raise DikshaUnavailable(f"DIKSHA returned error HTTP {resp.status_code}")

        try:
            data = resp.json()
        except ValueError as exc:
            raise DikshaInvalidResponse("Invalid JSON from DIKSHA content read") from exc

        result = data.get("result", {})
        content = result.get("content", {})
        if not content:
            raise DikshaNotFound(f"DIKSHA content {content_id} missing in result")

        _set_cache(cache_key, content)
        return content

    async def get_course_hierarchy(self, course_id: str) -> Dict[str, Any]:
        """Retrieves the full syllabus / collection hierarchy of a course."""
        cache_key = f"hierarchy:{course_id}"
        cached = _get_cache(cache_key)
        if cached is not None:
            return cached

        url = f"{DIKSHA_HIERARCHY_URL}/{course_id}"
        try:
            async with self._client_factory() as client:
                resp = await client.get(url)
        except httpx.HTTPError as exc:
            logger.warning("DIKSHA get_hierarchy request failed: %s", exc)
            raise DikshaUnavailable(f"Failed to reach DIKSHA hierarchy for {course_id}") from exc

        if resp.status_code == 404:
            raise DikshaNotFound(f"Course hierarchy {course_id} not found")
        if resp.status_code != 200:
            raise DikshaUnavailable(f"DIKSHA hierarchy returned error HTTP {resp.status_code}")

        try:
            data = resp.json()
        except ValueError as exc:
            raise DikshaInvalidResponse("Invalid JSON from DIKSHA hierarchy") from exc

        content = data.get("result", {}).get("content", {})
        _set_cache(cache_key, content)
        return content
