"""DIKSHA public content search (https://diksha.gov.in).

Searches the public content API for playable MP4 video resources and returns
normalised metadata. Only URLs on the DIKSHA object store are kept, so the app
never receives a playable link that points anywhere else.

The subject is folded into the free-text query rather than sent as a strict
filter: strict subject filters were observed to return zero results. Results are
cached in memory for CACHE_TTL_SECONDS per (query, subject, limit, offset).
"""
from __future__ import annotations

import logging
import time
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)

DIKSHA_SEARCH_URL = "https://diksha.gov.in/api/content/v1/search"
ALLOWED_VIDEO_PREFIX = "https://obj.diksha.gov.in/"
REQUEST_TIMEOUT_SECONDS = 15.0
CACHE_TTL_SECONDS = 600
MAX_CACHE_ENTRIES = 256
BYTES_PER_MB = 1024 * 1024

FIELDS = [
    "identifier",
    "name",
    "artifactUrl",
    "language",
    "subject",
    "license",
    "copyright",
    "size",
    "description",
]

_cache: dict[tuple[str, Optional[str], int, int], tuple[float, list[dict[str, Any]]]] = {}


class DikshaUnavailable(Exception):
    """Raised when DIKSHA cannot be reached or returns an unusable response."""


def _new_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=REQUEST_TIMEOUT_SECONDS)


def _build_body(query: str, subject: Optional[str], limit: int, offset: int) -> dict[str, Any]:
    text = f"{query} {subject}" if subject else query
    return {
        "request": {
            "query": text,
            "filters": {"contentType": ["Resource"], "mimeType": ["video/mp4"]},
            "fields": FIELDS,
            "limit": limit,
            "offset": offset,
        }
    }


def _first_text(value: Any) -> Optional[str]:
    if isinstance(value, list):
        for entry in value:
            if isinstance(entry, str) and entry.strip():
                return entry.strip()
        return None
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _joined_text(value: Any) -> Optional[str]:
    if isinstance(value, list):
        parts = [entry.strip() for entry in value if isinstance(entry, str) and entry.strip()]
        return ", ".join(parts) or None
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _text_or_none(value: Any) -> Optional[str]:
    if not isinstance(value, str):
        return None
    return value.strip() or None


def _size_mb(value: Any) -> Optional[float]:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value < 0:
        return None
    return round(value / BYTES_PER_MB, 1)


def normalise_item(raw: Any) -> Optional[dict[str, Any]]:
    """Maps one DIKSHA content item to the app shape. Returns None for items that
    lack an identifier or whose artifactUrl is not on the DIKSHA object store."""
    if not isinstance(raw, dict):
        return None
    identifier = _text_or_none(raw.get("identifier"))
    video_url = raw.get("artifactUrl")
    if identifier is None or not isinstance(video_url, str) or not video_url.startswith(ALLOWED_VIDEO_PREFIX):
        return None
    return {
        "identifier": identifier,
        "title": _text_or_none(raw.get("name")),
        "subject": _first_text(raw.get("subject")),
        "language": _joined_text(raw.get("language")),
        "license": _text_or_none(raw.get("license")),
        "copyright": _text_or_none(raw.get("copyright")),
        "size_mb": _size_mb(raw.get("size")),
        "video_url": video_url,
    }


def _cache_get(key: tuple[str, Optional[str], int, int]) -> Optional[list[dict[str, Any]]]:
    entry = _cache.get(key)
    if entry is None:
        return None
    expires_at, items = entry
    if time.monotonic() >= expires_at:
        _cache.pop(key, None)
        return None
    return [dict(item) for item in items]


def _cache_put(key: tuple[str, Optional[str], int, int], items: list[dict[str, Any]]) -> None:
    if len(_cache) >= MAX_CACHE_ENTRIES:
        oldest = next(iter(_cache))
        _cache.pop(oldest, None)
    _cache[key] = (time.monotonic() + CACHE_TTL_SECONDS, [dict(item) for item in items])


def clear_cache() -> None:
    _cache.clear()


async def search_videos(query: str, subject: Optional[str], limit: int, offset: int) -> list[dict[str, Any]]:
    """Returns normalised, playable video items. Raises DikshaUnavailable on any
    upstream failure; failures are never cached."""
    key = (query, subject, limit, offset)
    cached = _cache_get(key)
    if cached is not None:
        return cached

    body = _build_body(query, subject, limit, offset)
    try:
        async with _new_client() as client:
            response = await client.post(DIKSHA_SEARCH_URL, json=body)
    except httpx.HTTPError as exc:
        logger.warning("DIKSHA search request failed: %s", type(exc).__name__)
        raise DikshaUnavailable("DIKSHA request failed") from exc

    if response.status_code != 200:
        logger.warning("DIKSHA search returned status %s", response.status_code)
        raise DikshaUnavailable(f"DIKSHA returned status {response.status_code}")

    try:
        payload = response.json()
    except ValueError as exc:
        logger.warning("DIKSHA search returned non-JSON body")
        raise DikshaUnavailable("DIKSHA returned invalid JSON") from exc

    params = payload.get("params") if isinstance(payload, dict) else None
    if isinstance(params, dict) and params.get("status") == "failed":
        logger.warning("DIKSHA search reported status failed")
        raise DikshaUnavailable("DIKSHA reported a failed search")

    result = payload.get("result") if isinstance(payload, dict) else None
    if not isinstance(result, dict) or not isinstance(result.get("content", []), list):
        logger.warning("DIKSHA search response missing result.content")
        raise DikshaUnavailable("DIKSHA returned an unexpected response shape")

    items: list[dict[str, Any]] = []
    for raw in result.get("content", []):
        normalised = normalise_item(raw)
        if normalised is not None:
            items.append(normalised)

    _cache_put(key, items)
    return items
