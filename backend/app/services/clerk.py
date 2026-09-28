"""Clerk identity integration.

Two concerns live here:
1. Real JWT verification of session tokens issued by Clerk, done locally
   against Clerk's published JWKS (no network round-trip per request beyond
   an infrequent, cached JWKS refresh) - this is what protects routes.
2. Thin wrappers around Clerk's management REST API (used only for
   out-of-band lookups such as fetching full profile info by user id; not
   on the hot path of request authentication).
"""
import time
import logging
from typing import Any, Dict, Optional

import httpx
from jose import jwt
from jose.exceptions import JWTError

from app.config import get_settings

logger = logging.getLogger("clerk")

# Module-level JWKS cache. Clerk's signing keys rotate rarely; caching avoids
# a network call on every authenticated request while still refreshing
# periodically so a real rotation is picked up without a redeploy.
_JWKS_CACHE: Dict[str, Any] = {"keys": None, "fetched_at": 0.0}
_JWKS_TTL_SECONDS = 60 * 60  # 1 hour


class TokenVerificationError(Exception):
    """Raised for any failure to establish a trusted, verified identity."""


async def _get_jwks(issuer: str) -> Dict[str, Any]:
    now = time.time()
    if _JWKS_CACHE["keys"] is not None and (now - _JWKS_CACHE["fetched_at"]) < _JWKS_TTL_SECONDS:
        return _JWKS_CACHE["keys"]

    jwks_url = f"{issuer.rstrip('/')}/.well-known/jwks.json"
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(jwks_url)
        resp.raise_for_status()
        jwks = resp.json()

    _JWKS_CACHE["keys"] = jwks
    _JWKS_CACHE["fetched_at"] = now
    return jwks


def _find_jwk(jwks: Dict[str, Any], kid: Optional[str]) -> Optional[Dict[str, Any]]:
    keys = jwks.get("keys", [])
    if not keys:
        return None
    if kid is None:
        return keys[0]
    for key in keys:
        if key.get("kid") == kid:
            return key
    return None


async def verify_session_token(token: str) -> Dict[str, Any]:
    """Verify a Clerk-issued session JWT against Clerk's JWKS and return the
    decoded claims. Raises TokenVerificationError on any failure (expired,
    bad signature, wrong issuer, malformed token, JWKS unreachable, etc.)."""
    settings = get_settings()
    issuer = settings.clerk_jwt_issuer

    try:
        unverified_header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise TokenVerificationError(f"Malformed token header: {exc}") from exc

    try:
        jwks = await _get_jwks(issuer)
    except httpx.HTTPError as exc:
        raise TokenVerificationError(f"Could not fetch JWKS from Clerk: {exc}") from exc

    key = _find_jwk(jwks, unverified_header.get("kid"))
    if key is None:
        # Key rotation may have happened since our cache was populated;
        # force one refresh and retry once before giving up.
        _JWKS_CACHE["keys"] = None
        try:
            jwks = await _get_jwks(issuer)
        except httpx.HTTPError as exc:
            raise TokenVerificationError(f"Could not refresh JWKS from Clerk: {exc}") from exc
        key = _find_jwk(jwks, unverified_header.get("kid"))
        if key is None:
            raise TokenVerificationError("No matching JWKS key for token 'kid'")

    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False},  # Clerk session tokens don't set a fixed `aud`
        )
    except JWTError as exc:
        raise TokenVerificationError(f"Token signature/claims verification failed: {exc}") from exc

    if "sub" not in claims:
        raise TokenVerificationError("Token missing 'sub' claim")

    return claims


async def get_clerk_user(user_id: str) -> dict:
    """Fetch full profile info for a Clerk user id via Clerk's management API.
    Used for out-of-band admin lookups only, never for request auth."""
    settings = get_settings()
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
        )
        response.raise_for_status()
        return response.json()
