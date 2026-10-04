"""Normalizes raw DIKSHA responses into canonical CoopSetu models."""
from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

from .licensing import evaluate_license
from .models import CourseHierarchyNode, DikshaHierarchyResponse, LearningResourceModel

BYTES_PER_MB = 1024 * 1024


def _first_text(val: Any) -> Optional[str]:
    if isinstance(val, list):
        for item in val:
            if isinstance(item, str) and item.strip():
                return item.strip()
        return None
    if isinstance(val, str) and val.strip():
        return val.strip()
    return None


def _joined_text(val: Any) -> Optional[str]:
    if isinstance(val, list):
        items = [i.strip() for i in val if isinstance(i, str) and i.strip()]
        return ", ".join(items) or None
    if isinstance(val, str) and val.strip():
        return val.strip()
    return None


def _format_duration(duration_seconds: Optional[int]) -> Optional[str]:
    if not duration_seconds or duration_seconds <= 0:
        return None
    mins = duration_seconds // 60
    hours = mins // 60
    rem_mins = mins % 60
    if hours > 0:
        return f"{hours}h {rem_mins}m"
    return f"{mins}m"


def _detect_content_type(mime_type: Optional[str], content_type_str: Optional[str]) -> str:
    m = (mime_type or "").lower()
    c = (content_type_str or "").lower()

    if "video" in m or "mp4" in m or "webm" in m or "youtube" in m:
        return "video"
    if "pdf" in m or "document" in m or "epub" in m:
        return "document"
    if "course" in c or "collection" in c or "textbook" in c:
        return "course"
    if "ecml" in m or "html" in m or "interactive" in c:
        return "interactive"
    return "resource"


def _clean_player_url(identifier: str, artifact_url: Optional[str], streaming_url: Optional[str]) -> Optional[str]:
    """Generates the appropriate player link or stream URL."""
    if streaming_url and streaming_url.strip():
        return streaming_url.strip()
    if artifact_url and artifact_url.strip():
        return artifact_url.strip()
    return f"https://diksha.gov.in/play/content/{identifier}"


def normalize_diksha_item(raw: Dict[str, Any]) -> Optional[LearningResourceModel]:
    """Maps a raw DIKSHA content dictionary to LearningResourceModel."""
    if not isinstance(raw, dict):
        return None

    identifier = _first_text(raw.get("identifier"))
    if not identifier:
        return None

    title = _first_text(raw.get("name")) or "Untitled Resource"
    description = _first_text(raw.get("description"))

    mime_type = _first_text(raw.get("mimeType"))
    raw_content_type = _first_text(raw.get("contentType"))
    content_type = _detect_content_type(mime_type, raw_content_type)

    artifact_url = _first_text(raw.get("artifactUrl") or raw.get("downloadUrl"))
    streaming_url = _first_text(raw.get("streamingUrl"))

    # If it's a YouTube resource, artifactUrl or streamingUrl might be YouTube
    if mime_type == "video/x-youtube" and not artifact_url:
        artifact_url = _first_text(raw.get("previewUrl"))

    # Licensing evaluation
    lic_eval = evaluate_license(
        raw_license=raw.get("license"),
        raw_copyright=raw.get("copyright"),
        raw_creator=raw.get("creator") or raw.get("owner"),
        raw_org=raw.get("organisation") or raw.get("publisher"),
        raw_license_url=raw.get("licenseUrl"),
    )

    # Duration parsing
    raw_dur = raw.get("duration")
    duration_sec: Optional[int] = None
    if isinstance(raw_dur, (int, float)) and raw_dur > 0:
        duration_sec = int(raw_dur)
    elif isinstance(raw_dur, str) and raw_dur.isdigit():
        duration_sec = int(raw_dur)

    # Size
    size_bytes = raw.get("size")
    size_mb: Optional[float] = None
    if isinstance(size_bytes, (int, float)) and size_bytes > 0:
        size_mb = round(size_bytes / BYTES_PER_MB, 1)

    # Thumbnails / Icons
    thumbnail_url = _first_text(raw.get("appIcon") or raw.get("posterImage"))

    player_url = _clean_player_url(identifier, artifact_url, streaming_url)
    source_url = f"https://diksha.gov.in/play/content/{identifier}"

    language = _joined_text(raw.get("language")) or "English"

    extra_metadata = {
        "subject": _first_text(raw.get("subject")),
        "topic": _first_text(raw.get("topic")),
        "gradeLevel": _joined_text(raw.get("gradeLevel")),
        "primaryCategory": _first_text(raw.get("primaryCategory")),
        "resourceType": _first_text(raw.get("resourceType")),
        "compatibilityLevel": raw.get("compatibilityLevel"),
        "restriction_notice": lic_eval.restriction_notice,
    }

    return LearningResourceModel(
        external_id=identifier,
        source="DIKSHA",
        title=title,
        description=description,
        thumbnail_url=thumbnail_url,
        language=language,
        content_type=content_type,
        duration=duration_sec,
        duration_formatted=_format_duration(duration_sec),
        author=lic_eval.creator,
        organization=lic_eval.organization,
        license=lic_eval.license_name,
        license_url=lic_eval.license_url,
        attribution=lic_eval.attribution,
        license_status=lic_eval.license_status,
        embedding_allowed=lic_eval.embedding_allowed,
        commercial_use_allowed=lic_eval.commercial_use_allowed,
        modification_allowed=lic_eval.modification_allowed,
        source_url=source_url,
        player_url=player_url,
        streaming_url=streaming_url,
        artifact_url=artifact_url,
        mime_type=mime_type,
        size_mb=size_mb,
        metadata=extra_metadata,
    )


def map_hierarchy_node(raw_node: Dict[str, Any]) -> CourseHierarchyNode:
    children_raw = raw_node.get("children", [])
    mapped_children: List[CourseHierarchyNode] = []
    if isinstance(children_raw, list):
        for child in children_raw:
            if isinstance(child, dict):
                mapped_children.append(map_hierarchy_node(child))

    return CourseHierarchyNode(
        identifier=raw_node.get("identifier", ""),
        name=raw_node.get("name", "Untitled Node"),
        description=raw_node.get("description"),
        content_type=raw_node.get("contentType", "Resource"),
        mime_type=raw_node.get("mimeType"),
        artifact_url=raw_node.get("artifactUrl"),
        duration=raw_node.get("duration"),
        children=mapped_children,
    )


def normalize_course_hierarchy(raw_hierarchy: Dict[str, Any]) -> DikshaHierarchyResponse:
    identifier = raw_hierarchy.get("identifier", "")
    title = raw_hierarchy.get("name", "DIKSHA Course")
    desc = raw_hierarchy.get("description")

    children = raw_hierarchy.get("children", [])
    modules: List[CourseHierarchyNode] = []
    total_resources = 0

    def count_leaves(node: CourseHierarchyNode) -> int:
        if not node.children:
            return 1
        return sum(count_leaves(c) for c in node.children)

    if isinstance(children, list):
        for child in children:
            if isinstance(child, dict):
                mapped = map_hierarchy_node(child)
                modules.append(mapped)
                total_resources += count_leaves(mapped)

    return DikshaHierarchyResponse(
        identifier=identifier,
        title=title,
        description=desc,
        modules=modules,
        total_resources=total_resources,
    )
