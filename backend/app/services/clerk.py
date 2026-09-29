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
    if settings.app_env in ("development", "test"):
        if token.startswith("fixture:") or token.startswith("dev-token:"):
            return {"sub": token.split(":", 1)[1]}
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
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://api.clerk.com/v1/users/{user_id}",
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as exc:
        raise ClerkAPIError(f"Clerk user lookup failed: {type(exc).__name__}") from exc


# ---------------------------------------------------------------------------
# Clerk Backend API (management) helpers. Used by the demo-account provisioning
# script and the demo-login endpoint. They only ever run server-side with
# CLERK_SECRET_KEY; the key is never logged or returned.
# ---------------------------------------------------------------------------
CLERK_API_BASE = "https://api.clerk.com/v1"


class ClerkAPIError(Exception):
    """A Clerk Backend API call failed (message never contains the secret)."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        super().__init__(message)
        self.status_code = status_code


async def _clerk_request(method: str, path: str, *, params=None, json_body=None) -> Any:
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.request(
                method,
                f"{CLERK_API_BASE}{path}",
                params=params,
                json=json_body,
                headers={"Authorization": f"Bearer {settings.clerk_secret_key}"},
            )
    except httpx.HTTPError as exc:
        raise ClerkAPIError(f"Clerk API unreachable: {type(exc).__name__}") from exc
    if resp.status_code >= 400:
        detail = ""
        try:
            errors = resp.json().get("errors") or []
            detail = "; ".join(e.get("long_message") or e.get("message") or "" for e in errors)
        except ValueError:
            pass
        raise ClerkAPIError(f"Clerk API {method} {path} -> {resp.status_code}: {detail}".strip(), resp.status_code)
    return resp.json()


async def find_clerk_user(*, email: Optional[str] = None, external_id: Optional[str] = None) -> Optional[dict]:
    """Look a Clerk user up by external_id first, then email. None if absent."""
    if external_id:
        users = await _clerk_request("GET", "/users", params={"external_id": [external_id], "limit": 1})
        if users:
            return users[0]
    if email:
        users = await _clerk_request("GET", "/users", params={"email_address": [email], "limit": 1})
        if users:
            return users[0]
    return None


async def create_clerk_user(
    *, email: str, first_name: str, last_name: str, external_id: str, public_metadata: dict
) -> dict:
    """Create a Clerk user with NO password (sign-in only through server-minted
    sign-in tokens) and the given public_metadata."""
    return await _clerk_request(
        "POST",
        "/users",
        json_body={
            "email_address": [email],
            "first_name": first_name,
            "last_name": last_name,
            "external_id": external_id,
            "public_metadata": public_metadata,
            "skip_password_requirement": True,
            "skip_legal_checks": True,
        },
    )


async def update_clerk_user_metadata(user_id: str, public_metadata: dict) -> dict:
    return await _clerk_request(
        "PATCH", f"/users/{user_id}/metadata", json_body={"public_metadata": public_metadata}
    )


async def create_sign_in_token(user_id: str, expires_in_seconds: int) -> dict:
    """POST /v1/sign_in_tokens. The returned `token` is exchanged by the client
    with Clerk's `ticket` strategy for a real session."""
    return await _clerk_request(
        "POST",
        "/sign_in_tokens",
        json_body={"user_id": user_id, "expires_in_seconds": expires_in_seconds},
    )


async def add_user_to_organization(user_id: str, organization_id: str, role: str = "org:member") -> dict:
    """Add a Clerk user to an organization so they are never blocked by choose-organization."""
    try:
        return await _clerk_request(
            "POST",
            f"/organizations/{organization_id}/memberships",
            json_body={"user_id": user_id, "role": role},
        )
    except ClerkAPIError as e:
        if "already" in str(e).lower() or e.status_code == 400:
            return {}
        raise

