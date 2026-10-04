from dataclasses import dataclass
from typing import Optional
import uuid

from fastapi import HTTPException, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.services.clerk import verify_session_token, TokenVerificationError
from app.dev_demo_auth import DEMO_CLAIM, is_dev_demo_token, resolve_dev_demo_key, resolve_dev_demo_user


@dataclass
class AuthenticatedIdentity:
    """The verified Clerk identity for the current request. `db_user` is
    populated only if a matching local user row already exists (created via
    POST /api/v1/auth/sync) - it can be None for a brand-new Clerk account
    that hasn't synced yet."""

    clerk_user_id: str
    claims: dict
    db_user: Optional[User] = None

    @property
    def role(self) -> str:
        if self.db_user is not None:
            return self.db_user.role
        return self.claims.get("role", "trainee")


def _extract_bearer_token(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return token


async def get_current_claims(authorization: str = Header(None)) -> dict:
    """Verify the Clerk session JWT and return its decoded claims. Raises
    401 for any missing/invalid/expired/unverifiable token."""
    token = _extract_bearer_token(authorization)
    if is_dev_demo_token(token):
        return _dev_demo_claims(token)
    try:
        return await verify_session_token(token)
    except TokenVerificationError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


def _dev_demo_claims(token: str) -> dict:
    """DEV-ONLY: `Bearer demo:<key>` (see app/dev_demo_auth.py). Raises 401 unless
    the dev gate passes; the returned claims carry the demo key, not a Clerk id."""
    key = resolve_dev_demo_key(token)
    return {"sub": f"demo:{key}", DEMO_CLAIM: key}


async def _identity_for_claims(claims: dict, db: AsyncSession) -> AuthenticatedIdentity:
    if DEMO_CLAIM in claims:
        user = await resolve_dev_demo_user(db, claims[DEMO_CLAIM])
        return AuthenticatedIdentity(clerk_user_id=user.clerk_user_id, claims=claims, db_user=user)
    clerk_user_id = claims["sub"]
    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    db_user = result.scalar_one_or_none()
    return AuthenticatedIdentity(clerk_user_id=clerk_user_id, claims=claims, db_user=db_user)


async def get_current_user_clerk_id(claims: dict = Depends(get_current_claims)) -> str:
    return claims["sub"]


async def get_current_identity(
    claims: dict = Depends(get_current_claims),
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedIdentity:
    """Full authenticated-identity dependency: verifies the token, then
    resolves it against our local `users` table so route handlers can make
    role/org-scoped decisions using our own data model."""
    return await _identity_for_claims(claims, db)


def require_role(*roles: str):
    """Dependency factory: 403s if the authenticated user's role isn't in
    `roles`. Requires the user to already be synced into our `users` table."""

    async def _checker(identity: AuthenticatedIdentity = Depends(get_current_identity)) -> AuthenticatedIdentity:
        if identity.db_user is None:
            raise HTTPException(status_code=403, detail="User not provisioned locally; call /api/v1/auth/provision first")
        if identity.role not in roles:
            raise HTTPException(status_code=403, detail=f"Requires one of roles: {', '.join(roles)}")
        return identity

    return _checker


# Roles with platform-wide (cross-organisation) reach. `admin` may read and
# write everywhere; `ncct_admin` is the national read-only view: it passes
# org_scope() (no org filter) but must still be listed explicitly in
# require_roles() to be allowed on any endpoint.
GLOBAL_ROLES = ("admin", "ncct_admin")
KNOWN_ROLES = ("trainee", "trainer", "institution", "employer", "admin", "ncct_admin")


async def require_user(
    identity: AuthenticatedIdentity = Depends(get_current_identity),
) -> User:
    """Authenticated + provisioned + active local user. 401 without a valid
    token (from get_current_claims), 403 if the token is valid but the user
    has no local row yet (call POST /auth/provision) or is deactivated.
    Returns the `User` row. New endpoints must use this (or require_roles),
    never the anonymous fallback."""
    if identity.db_user is None:
        raise HTTPException(status_code=403, detail="User not provisioned locally; call /api/v1/auth/provision first")
    if identity.db_user.is_active is False:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    return identity.db_user


def require_roles(*roles: str):
    """Dependency factory: like require_user but 403s unless the user's role is
    one of `roles` (list `admin` explicitly when it should pass). Returns the
    `User` row."""
    if not roles:
        raise ValueError("require_roles needs at least one role")

    async def _checker(user: User = Depends(require_user)) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=403, detail=f"Requires one of roles: {', '.join(roles)}")
        return user

    return _checker


def org_scope(user: User) -> Optional[uuid.UUID]:
    """The organisation a user's org-scoped queries must be limited to.

    Returns None for platform-wide roles (admin, ncct_admin): apply no org
    filter. Otherwise returns `user.organisation_id`; a non-global user with no
    organisation gets 403 (fail closed - never fall back to "everything")."""
    if user.role in GLOBAL_ROLES:
        return None
    if user.organisation_id is None:
        raise HTTPException(status_code=403, detail="Your account is not linked to an organisation")
    return user.organisation_id


def assert_org_access(user: User, organisation_id: Optional[uuid.UUID]) -> None:
    """403 unless `user` may act on a resource owned by `organisation_id`.
    A resource with no owning organisation is only reachable by global roles."""
    scope = org_scope(user)
    if scope is None:
        return
    if organisation_id is None or organisation_id != scope:
        raise HTTPException(status_code=403, detail="Resource belongs to a different organisation")


def anonymous_actor_uuid(explicit_id: Optional[str], *, raise_if_disabled: bool = True) -> Optional[uuid.UUID]:
    """Client-supplied actor id for unauthenticated callers (scripts, tests).

    Gated by settings.ALLOWED_ANONYMOUS_ACTOR (`allow_anonymous_actor`, default
    on only when APP_ENV=development). When disabled and an id is supplied this
    raises 401 (or returns None with raise_if_disabled=False). Returns None for
    a missing/invalid id."""
    if not explicit_id:
        return None
    if not get_settings().anonymous_actor_allowed:
        if raise_if_disabled:
            raise HTTPException(status_code=401, detail="Authentication required")
        return None
    try:
        return uuid.UUID(str(explicit_id))
    except (ValueError, TypeError):
        return None


async def get_optional_claims(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """If Authorization header is present, verifies the Clerk session JWT
    and returns its decoded claims. If missing, returns None. Raises 401 if
    the header is present but token is invalid/expired."""
    if not authorization:
        return None
    token = _extract_bearer_token(authorization)
    if is_dev_demo_token(token):
        return _dev_demo_claims(token)
    try:
        return await verify_session_token(token)
    except TokenVerificationError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


async def get_optional_identity(
    claims: Optional[dict] = Depends(get_optional_claims),
    db: AsyncSession = Depends(get_db),
) -> Optional[AuthenticatedIdentity]:
    """Optional authenticated-identity dependency: verifies token if present
    and resolves local user row from DB. Returns None if unauthenticated."""
    if claims is None:
        return None
    return await _identity_for_claims(claims, db)


def resolve_actor_id(
    identity: Optional[AuthenticatedIdentity],
    explicit_id: Optional[str] = None,
    allowed_roles: Optional[tuple] = None,
) -> Optional[uuid.UUID]:
    """Derives actor UUID from verified Clerk identity if authenticated,
    falling back to explicit_id when unauthenticated *and* the anonymous-actor
    fallback is enabled (ALLOW_ANONYMOUS_ACTOR; default on only in development;
    otherwise an explicit id without a token is a 401).
    If authenticated, enforces role permission if allowed_roles is specified."""
    if identity is not None:
        if allowed_roles and identity.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Operation requires one of roles: {', '.join(allowed_roles)}; current role: {identity.role}",
            )
        if identity.db_user is not None:
            return identity.db_user.id
        raise HTTPException(status_code=403, detail="User not provisioned locally; call /api/v1/auth/provision first")

    return anonymous_actor_uuid(explicit_id)
