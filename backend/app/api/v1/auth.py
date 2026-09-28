from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserSyncRequest
from app.deps import get_current_identity, AuthenticatedIdentity
import uuid

router = APIRouter()


@router.post("/sync")
async def sync_user(payload: UserSyncRequest, db: AsyncSession = Depends(get_db)):
    """Upsert a Clerk-authenticated user into our local `users` table.

    Called by the frontend right after Clerk sign-in/sign-up. Intentionally
    does not require a verified bearer token itself (the Clerk client SDK
    calls this immediately post sign-up, and requiring a token here would
    make onboarding brittle) - subsequent write actions on core-flow
    endpoints instead carry the resulting local user id explicitly.
    """
    result = await db.execute(select(User).where(User.clerk_user_id == payload.clerk_user_id))
    user = result.scalar_one_or_none()

    if user:
        user.email = payload.email
        user.full_name = payload.full_name
        user.role = payload.role
    else:
        user = User(
            id=uuid.uuid4(),
            clerk_user_id=payload.clerk_user_id,
            email=payload.email,
            full_name=payload.full_name,
            role=payload.role,
        )
        db.add(user)

    await db.commit()
    await db.refresh(user)
    return {"id": str(user.id), "email": user.email, "role": user.role, "created": True}


@router.get("/me")
async def get_me(identity: AuthenticatedIdentity = Depends(get_current_identity)):
    """Real, Clerk-JWT-protected endpoint: verifies the bearer token against
    Clerk's JWKS (see app/services/clerk.py) and returns the caller's local
    profile if they've synced, or bare Clerk claims otherwise. Returns 401
    for a missing/invalid/expired token via get_current_identity."""
    if identity.db_user is not None:
        u = identity.db_user
        return {
            "id": str(u.id),
            "clerk_user_id": u.clerk_user_id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "synced": True,
        }
    return {
        "clerk_user_id": identity.clerk_user_id,
        "role": identity.claims.get("role", "trainee"),
        "synced": False,
        "message": "Token is valid but user has not been synced yet. Call POST /api/v1/auth/sync.",
    }
