"""DIKSHA and Sunbird license safety and evaluation layer.

Strictly preserves licensing terms, intellectual property attribution,
commercial use rights, modification rights, and playback permissions.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Optional


class LicenseStatus(str, Enum):
    ALLOWED = "ALLOWED"
    ALLOWED_WITH_ATTRIBUTION = "ALLOWED_WITH_ATTRIBUTION"
    NON_COMMERCIAL_ONLY = "NON_COMMERCIAL_ONLY"
    RESTRICTED = "RESTRICTED"
    UNKNOWN = "UNKNOWN"


@dataclass
class LicenseEvaluationResult:
    license_status: LicenseStatus
    license_name: str
    license_url: Optional[str]
    attribution: str
    creator: Optional[str]
    organization: Optional[str]
    copyright_holder: Optional[str]
    embedding_allowed: bool
    commercial_use_allowed: bool
    modification_allowed: bool
    restriction_notice: Optional[str]


# Known Creative Commons license mappings
_CC_URL_MAP = {
    "cc by": "https://creativecommons.org/licenses/by/4.0/",
    "cc by 4.0": "https://creativecommons.org/licenses/by/4.0/",
    "cc by 3.0": "https://creativecommons.org/licenses/by/3.0/",
    "cc by-sa": "https://creativecommons.org/licenses/by-sa/4.0/",
    "cc by-sa 4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
    "cc by-nc": "https://creativecommons.org/licenses/by-nc/4.0/",
    "cc by-nc 4.0": "https://creativecommons.org/licenses/by-nc/4.0/",
    "cc by-nc-sa": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    "cc by-nc-sa 4.0": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
    "cc by-nc-nd": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    "cc by-nc-nd 4.0": "https://creativecommons.org/licenses/by-nc-nd/4.0/",
    "cc0": "https://creativecommons.org/publicdomain/zero/1.0/",
    "public domain": "https://creativecommons.org/publicdomain/mark/1.0/",
}


def _extract_str(val: Any) -> Optional[str]:
    if isinstance(val, list):
        for item in val:
            if isinstance(item, str) and item.strip():
                return item.strip()
        return None
    if isinstance(val, str) and val.strip():
        return val.strip()
    return None


def evaluate_license(
    raw_license: Any,
    raw_copyright: Any = None,
    raw_creator: Any = None,
    raw_org: Any = None,
    raw_license_url: Any = None,
) -> LicenseEvaluationResult:
    """Evaluates the license metadata of a DIKSHA resource and determines
    embedding, attribution, commercial, and modification rights."""
    license_str = _extract_str(raw_license) or ""
    copyright_str = _extract_str(raw_copyright)
    creator_str = _extract_str(raw_creator)
    org_str = _extract_str(raw_org)
    license_url_str = _extract_str(raw_license_url)

    normalized_lic = license_str.lower().strip()
    license_url = license_url_str

    for key, url in _CC_URL_MAP.items():
        if key in normalized_lic:
            if not license_url:
                license_url = url
            break

    # Determine status & permissions
    if not normalized_lic:
        # Unknown license: do not redistribute or commercialize; allow official stream if hosted by DIKSHA
        status = LicenseStatus.UNKNOWN
        embedding_allowed = True
        commercial_allowed = False
        modification_allowed = False
        restriction_notice = "License unspecified by author. Playable under DIKSHA Terms of Use."
        clean_license_name = "Unspecified / DIKSHA Terms of Use"
    elif "restricted" in normalized_lic or "all rights reserved" in normalized_lic or "proprietary" in normalized_lic:
        status = LicenseStatus.RESTRICTED
        embedding_allowed = False
        commercial_allowed = False
        modification_allowed = False
        restriction_notice = "Unavailable for in-app playback due to content licensing restrictions."
        clean_license_name = license_str or "Restricted"
    elif "cc0" in normalized_lic or "public domain" in normalized_lic:
        status = LicenseStatus.ALLOWED
        embedding_allowed = True
        commercial_allowed = True
        modification_allowed = True
        restriction_notice = None
        clean_license_name = license_str or "Public Domain / CC0"
    elif "nc" in normalized_lic:  # Non-commercial
        status = LicenseStatus.NON_COMMERCIAL_ONLY
        embedding_allowed = True
        commercial_allowed = False
        modification_allowed = "nd" not in normalized_lic
        restriction_notice = "Non-commercial educational use only. Distribution for profit is prohibited."
        clean_license_name = license_str
    elif "by" in normalized_lic:
        status = LicenseStatus.ALLOWED_WITH_ATTRIBUTION
        embedding_allowed = True
        commercial_allowed = True
        modification_allowed = "nd" not in normalized_lic
        restriction_notice = "Educational use allowed with attribution."
        clean_license_name = license_str
    else:
        # Standard educational license
        status = LicenseStatus.ALLOWED_WITH_ATTRIBUTION
        embedding_allowed = True
        commercial_allowed = False
        modification_allowed = False
        restriction_notice = f"Licensed under {license_str}. Attribution required."
        clean_license_name = license_str

    # Build canonical attribution line
    attrib_components = ["Source: DIKSHA (diksha.gov.in)"]
    if creator_str:
        attrib_components.append(f"Creator: {creator_str}")
    if org_str:
        attrib_components.append(f"Organisation: {org_str}")
    if copyright_str:
        attrib_components.append(f"Copyright: {copyright_str}")
    attrib_components.append(f"License: {clean_license_name}")

    attribution_line = " · ".join(attrib_components)

    return LicenseEvaluationResult(
        license_status=status,
        license_name=clean_license_name,
        license_url=license_url,
        attribution=attribution_line,
        creator=creator_str,
        organization=org_str,
        copyright_holder=copyright_str,
        embedding_allowed=embedding_allowed,
        commercial_use_allowed=commercial_allowed,
        modification_allowed=modification_allowed,
        restriction_notice=restriction_notice,
    )
