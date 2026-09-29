from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel
import hmac
import logging
import uuid

from app.config import get_settings
from app.database import get_db
from app.models.user import User, Organisation, is_pending_clerk_link
from app.schemas.user import UserSyncRequest
from app.deps import get_current_identity, get_current_claims, AuthenticatedIdentity
from app.demo_users import DEMO_ACCOUNTS
from app.services import clerk as clerk_service
from app.services.mobile import build_trainee_profile
from app.services.ratelimit import demo_login_limiter

logger = logging.getLogger("demo_login")
KNOWN_ROLES = ("trainee", "trainer", "institution", "employer", "admin", "ncct_admin")

router = APIRouter()


async def _match_by_clerk_id_or_pending_email(db: AsyncSession, clerk_user_id: str, email: str | None) -> tuple[User | None, bool]:
    """Resolve the local row for a real Clerk sign-in. First tries the
    normal clerk_user_id match. If nothing matches and an email is given,
    looks for a row an institution-admin/admin created ahead of time via
    POST /api/v1/users (see `PENDING_CLERK_PREFIX`) with that email and
    adopts it - swapping in the real clerk_user_id - instead of creating a
    second row that would collide on the unique email constraint. A
    non-pending row with that email is left alone (a real identity
    conflict, handled by the caller as it already was).

    Returns (user_or_none, adopted). When adopted is True the caller must
    NOT overwrite `role`/`organisation_id` from Clerk data: those were set
    deliberately by the admin who created the row."""
    user = (await db.execute(select(User).where(User.clerk_user_id == clerk_user_id))).scalar_one_or_none()
    if user is not None:
        return user, False
    if email:
        candidate = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
        if candidate is not None and is_pending_clerk_link(candidate.clerk_user_id):
            candidate.clerk_user_id = clerk_user_id
            return candidate, True
    return None, False


@router.post("/sync")
async def sync_user(payload: UserSyncRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Mirror authoritative Clerk fields after verifying the caller or webhook."""
    expected = get_settings().internal_api_secret
    supplied = request.headers.get("X-Internal-Secret", "")
    internal = bool(expected and supplied and hmac.compare_digest(expected, supplied))
    if not internal:
        clerk_sec = get_settings().clerk_secret_key
        if clerk_sec and supplied and hmac.compare_digest(clerk_sec, supplied):
            internal = True
    if not internal:
        claims = await get_current_claims(request.headers.get("Authorization"))
        if claims.get("sub") != payload.clerk_user_id:
            raise HTTPException(status_code=403, detail="Cannot sync another identity")
    settings = get_settings()
    if internal and settings.app_env in ("development", "test"):
        # Dev/test shortcut: accept payload fields directly without fetching Clerk.
        # Useful for E2E scripts and test runners that use fake clerk IDs.
        role_from_payload = payload.role if hasattr(payload, "role") and payload.role in KNOWN_ROLES else "trainee"
        email_from_payload = payload.email if hasattr(payload, "email") else None
        name_from_payload = payload.full_name if hasattr(payload, "full_name") else None
        if email_from_payload:
            user, adopted = await _match_by_clerk_id_or_pending_email(db, payload.clerk_user_id, email_from_payload)
            created = user is None
            if user is None:
                user = User(id=uuid.uuid4(), clerk_user_id=payload.clerk_user_id)
                db.add(user)
            user.email = email_from_payload
            user.full_name = name_from_payload
            if not adopted:
                # Adopting an admin-created pending row: keep the role they
                # were given (e.g. "trainer") rather than the payload's
                # default, which would silently demote them to "trainee".
                user.role = role_from_payload
            if user.organisation_id is None:
                if role_from_payload in ("institution", "trainer"):
                    inst = (await db.execute(select(Organisation).where(Organisation.type == "institution"))).scalars().first()
                    if inst:
                        user.organisation_id = inst.id
                elif role_from_payload == "employer":
                    emp = (await db.execute(select(Organisation).where(Organisation.type == "employer"))).scalars().first()
                    if emp:
                        user.organisation_id = emp.id
            try:
                await db.commit()
            except IntegrityError as exc:
                await db.rollback()
                raise HTTPException(status_code=409, detail="Email is already linked to another identity") from exc
            await db.refresh(user)
            return {"id": str(user.id), "email": user.email, "role": user.role, "created": created}
    try:
        cu = await clerk_service.get_clerk_user(payload.clerk_user_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not read the Clerk profile") from exc
    emails = cu.get("email_addresses") or []
    primary = cu.get("primary_email_address_id")
    email = next((e.get("email_address") for e in emails if e.get("id") == primary), None)
    if not email:
        raise HTTPException(status_code=422, detail="Clerk user has no primary email address")
    role = (cu.get("public_metadata") or {}).get("role", "trainee")
    if role not in KNOWN_ROLES:
        role = "trainee"
    full_name = f"{cu.get('first_name') or ''} {cu.get('last_name') or ''}".strip() or None
    user, adopted = await _match_by_clerk_id_or_pending_email(db, payload.clerk_user_id, email)
    created = user is None
    if user is None:
        user = User(id=uuid.uuid4(), clerk_user_id=payload.clerk_user_id)
        db.add(user)
    user.email, user.full_name = email, full_name
    if not adopted:
        user.role = role
    if user.organisation_id is None:
        if role in ("institution", "trainer"):
            inst = (await db.execute(select(Organisation).where(Organisation.type == "institution"))).scalars().first()
            if inst:
                user.organisation_id = inst.id
        elif role == "employer":
            emp = (await db.execute(select(Organisation).where(Organisation.type == "employer"))).scalars().first()
            if emp:
                user.organisation_id = emp.id
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Email is already linked to another identity") from exc
    await db.refresh(user)
    return {"id": str(user.id), "email": user.email, "role": user.role, "created": created}


async def _me_payload(db: AsyncSession, u: User) -> dict:
    org = None
    if u.organisation_id:
        row = (await db.execute(select(Organisation).where(Organisation.id == u.organisation_id))).scalar_one_or_none()
        if row:
            org = {"id": str(row.id), "name": row.name, "type": row.type}
    payload = {
        "id": str(u.id),
        "clerk_user_id": u.clerk_user_id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "synced": True,
        "organisation": org,
        # Trainee identity for the mobile Home/Profile screens (None for other roles).
        "trainee": await build_trainee_profile(db, u) if u.role == "trainee" else None,
    }
    return payload


@router.get("/me")
async def get_me(identity: AuthenticatedIdentity = Depends(get_current_identity), db: AsyncSession = Depends(get_db)):
    """Real, Clerk-JWT-protected endpoint: verifies the bearer token against
    Clerk's JWKS (see app/services/clerk.py) and returns the caller's local
    profile if they've synced, or bare Clerk claims otherwise. Returns 401
    for a missing/invalid/expired token via get_current_identity. `id` is the
    local user id (the trainee identity used by every other endpoint)."""
    if identity.db_user is not None:
        return await _me_payload(db, identity.db_user)
    return {
        "clerk_user_id": identity.clerk_user_id,
        "role": identity.claims.get("role", "trainee"),
        "synced": False,
        "message": "Token is valid but user has not been synced yet. Call POST /api/v1/auth/provision.",
    }


@router.post("/provision")
async def provision_me(identity: AuthenticatedIdentity = Depends(get_current_identity), db: AsyncSession = Depends(get_db)):
    """Create the caller's local user row from their verified Clerk identity
    (email/name/role read server-side from Clerk's Backend API, role from the
    admin-controlled `public_metadata.role`, default trainee). Idempotent.
    Unlike /auth/sync this trusts nothing the client sends."""
    if identity.db_user is not None:
        return await _me_payload(db, identity.db_user)
    try:
        cu = await clerk_service.get_clerk_user(identity.clerk_user_id)
    except Exception:
        raise HTTPException(status_code=502, detail="Could not read the Clerk profile")
    emails = cu.get("email_addresses") or []
    primary = cu.get("primary_email_address_id")
    email = next((e["email_address"] for e in emails if e.get("id") == primary), None) or (emails[0]["email_address"] if emails else None)
    if not email:
        raise HTTPException(status_code=422, detail="Clerk user has no email address")
    role = (cu.get("public_metadata") or {}).get("role")
    if role not in KNOWN_ROLES:
        role = "trainee"
    full_name = f"{cu.get('first_name') or ''} {cu.get('last_name') or ''}".strip() or None

    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing is not None:
        if is_pending_clerk_link(existing.clerk_user_id):
            # An institution-admin/admin created this row ahead of the
            # person's first real sign-in (POST /api/v1/users). Adopt it:
            # attach the real Clerk identity, but keep the role/org they
            # were deliberately assigned rather than Clerk's default.
            existing.clerk_user_id = identity.clerk_user_id
            existing.full_name = full_name or existing.full_name
            await db.commit()
            await db.refresh(existing)
            return await _me_payload(db, existing)
        # An email row already exists under another identity: never re-link it here.
        raise HTTPException(status_code=409, detail="A local account with this email is linked to a different identity")
    user = User(id=uuid.uuid4(), clerk_user_id=identity.clerk_user_id, email=email, full_name=full_name, role=role)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return await _me_payload(db, user)


class DemoLoginRequest(BaseModel):
    role: str


def _demo_enabled() -> bool:
    return bool(get_settings().demo_login_enabled)


@router.get("/demo-accounts")
async def demo_accounts():
    """Which demo roles the mobile login screen may offer. Emails only."""
    if not _demo_enabled():
        return {"enabled": False, "accounts": []}
    return {"enabled": True, "accounts": [{"role": a.role, "email": a.email, "name": a.full_name} for a in DEMO_ACCOUNTS.values()]}


@router.post("/demo-login")
async def demo_login(payload: DemoLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Mint a short-lived Clerk sign-in TICKET for one of the fixed demo
    accounts so a judge can open the mobile app without credentials. The
    client exchanges it with Clerk (`signIn.create({strategy: 'ticket', ticket})`)
    and gets a genuine Clerk session/JWT. Guard rails: disabled unless
    DEMO_LOGIN_ENABLED=true; only allowlisted demo roles/users; per-IP rate
    limit; one audit log line per issued ticket (never the ticket)."""
    settings = get_settings()
    if not settings.demo_login_enabled:
        raise HTTPException(status_code=404, detail="Not Found")

    ip = request.client.host if request.client else "unknown"
    if not demo_login_limiter.allow(ip, settings.demo_login_rate_limit_per_minute):
        logger.warning("demo-login rate limited ip=%s", ip)
        raise HTTPException(status_code=429, detail="Too many demo login attempts; try again in a minute")

    account = DEMO_ACCOUNTS.get(payload.role)
    if account is None:
        logger.warning("demo-login rejected role=%r ip=%s", payload.role[:30], ip)
        raise HTTPException(status_code=403, detail="Role is not available for demo login")

    user = (await db.execute(select(User).where(User.email == account.email))).scalar_one_or_none()
    if user is None or user.role != account.role or not user.clerk_user_id.startswith("user_"):
        raise HTTPException(
            status_code=503,
            detail="Demo accounts are not provisioned. Run `python -m app.seed_mobile` in backend/.",
        )

    try:
        token = await clerk_service.create_sign_in_token(user.clerk_user_id, settings.demo_ticket_ttl_seconds)
    except clerk_service.ClerkAPIError as exc:
        logger.error("demo-login clerk error role=%s status=%s", account.role, exc.status_code)
        raise HTTPException(status_code=502, detail="Could not create a demo sign-in ticket")

    logger.info(
        "demo-login issued role=%s user=...%s ip=%s ttl=%ss",
        account.role, user.clerk_user_id[-6:], ip, settings.demo_ticket_ttl_seconds,
    )
    return {
        "ticket": token["token"],
        "expires_in": settings.demo_ticket_ttl_seconds,
        "user": {
            "id": str(user.id),
            "clerk_user_id": user.clerk_user_id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        },
    }
