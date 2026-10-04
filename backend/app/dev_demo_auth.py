"""DEV-ONLY demo identity for browser demo logins.

`Authorization: Bearer demo:<demo_user_key>` lets the web app's demo personas
call the employer/admin APIs without a Clerk session. It is accepted only when
ALL of these hold (see `resolve_dev_demo_key`):

* settings.APP_ENV == "development" (exact match; anything else is refused,
  which also means it is never accepted in production),
* settings.DEMO_LOGIN_ENABLED is true, and
* the DATABASE_URL host is exactly localhost or 127.0.0.1, so demo identities
  can never act on a remote (e.g. hosted Neon) database.

The key must be one of DEV_DEMO_KEY_TO_ROLE. It is mapped to the seeded demo
account for that role (app.demo_users.DEMO_ACCOUNTS, matched by email) and the
local `users` row must exist with the same role. A missing row is a 401.
"""
from typing import Optional
from urllib.parse import urlparse

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.demo_users import DEMO_ACCOUNTS
from app.models.user import User

DEMO_TOKEN_PREFIX = "demo:"
# Demo tokens are only ever honoured against a local database. The configured
# DATABASE_URL host must be exactly one of these (parsed, never substring-matched).
LOCAL_DB_HOSTS = frozenset({"localhost", "127.0.0.1"})
# Claim key set on the verified-claims dict for a dev demo identity. Only this
# module sets it, after the gate passes.
DEMO_CLAIM = "dev_demo_key"

DEV_DEMO_KEY_TO_ROLE = {
    "demo-employer": "employer",
    "demo-admin": "admin",
    "demo-trainee": "trainee",
    "demo-trainer": "trainer",
    "demo-institution": "institution",
}


def is_dev_demo_token(token: str) -> bool:
    return token.startswith(DEMO_TOKEN_PREFIX)


def _database_is_local(database_url: str) -> bool:
    """True only when the URL's parsed hostname is exactly a loopback name.
    Never logs or returns the URL itself."""
    try:
        host = urlparse(database_url or "").hostname
    except ValueError:
        return False
    return host in LOCAL_DB_HOSTS


def resolve_dev_demo_key(token: str, settings: Optional[Settings] = None) -> str:
    """The single gate for `demo:` bearer tokens. Returns the demo key when the
    token may be used, otherwise raises 401. Every refusal is a 401 so a demo
    token never reveals whether a key exists."""
    settings = settings or get_settings()
    if settings.app_env != "development" or not settings.demo_login_enabled:
        raise HTTPException(status_code=401, detail="Demo authentication is not enabled in this environment")
    if not _database_is_local(settings.database_url):
        raise HTTPException(status_code=401, detail="Demo authentication requires a local database")
    key = token[len(DEMO_TOKEN_PREFIX):]
    if key not in DEV_DEMO_KEY_TO_ROLE:
        raise HTTPException(status_code=401, detail="Unknown demo identity")
    return key


async def resolve_dev_demo_user(db: AsyncSession, key: str) -> User:
    """Map a validated demo key to its seeded local user row. 401 if the row is
    missing (database not seeded) or its role no longer matches the account."""
    role = DEV_DEMO_KEY_TO_ROLE.get(key)
    account = DEMO_ACCOUNTS.get(role) if role else None
    if account is None:
        raise HTTPException(status_code=401, detail="Unknown demo identity")
    user = (await db.execute(select(User).where(User.email == account.email))).scalar_one_or_none()
    if user is None or user.role != account.role:
        raise HTTPException(
            status_code=401,
            detail=f"Demo user for '{key}' is not seeded in this database; run `python -m app.seed_mobile` in backend/",
        )
    return user
