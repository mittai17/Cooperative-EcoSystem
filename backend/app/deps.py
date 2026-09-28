from dataclasses import dataclass
from typing import Optional
import uuid

from fastapi import HTTPException, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.services.clerk import verify_session_token, TokenVerificationError


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
    try:
        return await verify_session_token(token)
    except TokenVerificationError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


async def get_current_user_clerk_id(claims: dict = Depends(get_current_claims)) -> str:
    return claims["sub"]


async def get_current_identity(
    claims: dict = Depends(get_current_claims),
    db: AsyncSession = Depends(get_db),
) -> AuthenticatedIdentity:
    """Full authenticated-identity dependency: verifies the token, then
    resolves it against our local `users` table so route handlers can make
    role/org-scoped decisions using our own data model."""
    clerk_user_id = claims["sub"]
    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    db_user = result.scalar_one_or_none()
    return AuthenticatedIdentity(clerk_user_id=clerk_user_id, claims=claims, db_user=db_user)


def require_role(*roles: str):
    """Dependency factory: 403s if the authenticated user's role isn't in
    `roles`. Requires the user to already be synced into our `users` table."""

    async def _checker(identity: AuthenticatedIdentity = Depends(get_current_identity)) -> AuthenticatedIdentity:
        if identity.db_user is None:
            raise HTTPException(status_code=403, detail="User not provisioned locally; call /api/v1/auth/sync first")
        if identity.role not in roles:
            raise HTTPException(status_code=403, detail=f"Requires one of roles: {', '.join(roles)}")
        return identity

    return _checker


async def get_optional_claims(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    """If Authorization header is present, verifies the Clerk session JWT
    and returns its decoded claims. If missing, returns None. Raises 401 if
    the header is present but token is invalid/expired."""
    if not authorization:
        return None
    token = _extract_bearer_token(authorization)
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
    clerk_user_id = claims["sub"]
    result = await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    db_user = result.scalar_one_or_none()
    return AuthenticatedIdentity(clerk_user_id=clerk_user_id, claims=claims, db_user=db_user)


def resolve_actor_id(
    identity: Optional[AuthenticatedIdentity],
    explicit_id: Optional[str] = None,
    allowed_roles: Optional[tuple] = None,
) -> Optional[uuid.UUID]:
    """Derives actor UUID from verified Clerk identity if authenticated,
    falling back to explicit_id when unauthenticated.
    If authenticated, enforces role permission if allowed_roles is specified."""
    if identity is not None:
        if allowed_roles and identity.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Operation requires one of roles: {', '.join(allowed_roles)}; current role: {identity.role}",
            )
        if identity.db_user is not None:
            return identity.db_user.id
        raise HTTPException(status_code=403, detail="User not provisioned locally; call /api/v1/auth/sync first")

    if explicit_id:
        try:
            return uuid.UUID(explicit_id)
        except (ValueError, TypeError):
            return None
    return None

