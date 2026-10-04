"""DEV-ONLY demo bearer identity (`Authorization: Bearer demo:<key>`).

Covers the gate (app/dev_demo_auth.resolve_dev_demo_key) and its effect on real
routes against the scratch Postgres. Settings are changed with monkeypatch on
the cached Settings object, which is restored after each test.
"""
import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.demo_users import DEMO_ACCOUNTS
from app.dev_demo_auth import DEV_DEMO_KEY_TO_ROLE, resolve_dev_demo_key, resolve_dev_demo_user
from app.main import app
from app.models.user import Organisation, User


@pytest.fixture
def dev_settings(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "app_env", "development")
    monkeypatch.setattr(settings, "demo_login_enabled", True)
    return settings


def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


def demo_headers(key: str) -> dict:
    return {"Authorization": f"Bearer demo:{key}"}


async def _ensure_demo_row(role: str) -> None:
    """Make sure the scratch DB has the seeded demo row for `role` (idempotent).
    Creates the employer organisation when the employer row needs one."""
    account = DEMO_ACCOUNTS[role]
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.email == account.email))).scalar_one_or_none()
        if user is None:
            org_id = None
            if role == "employer":
                org = Organisation(id=uuid.uuid4(), name="Demo Test Employer", type="employer")
                db.add(org)
                org_id = org.id
            db.add(User(
                id=uuid.uuid4(), clerk_user_id=f"demo_local_test_{role}_{uuid.uuid4().hex[:8]}",
                email=account.email, full_name=account.full_name, role=account.role,
                organisation_id=org_id,
            ))
            await db.commit()
        elif user.role == account.role and role == "employer" and user.organisation_id is None:
            org = Organisation(id=uuid.uuid4(), name="Demo Test Employer", type="employer")
            db.add(org)
            user.organisation_id = org.id
            await db.commit()


@pytest.fixture
async def seeded_demo_rows(dev_settings):
    for role in ("employer", "admin", "trainee"):
        await _ensure_demo_row(role)


# ---------------------------------------------------------------------------
# Gate unit tests (no database)
# ---------------------------------------------------------------------------

def test_gate_accepts_known_key_in_development(dev_settings):
    assert resolve_dev_demo_key("demo:demo-employer") == "demo-employer"


@pytest.mark.parametrize("key", sorted(DEV_DEMO_KEY_TO_ROLE))
def test_gate_accepts_every_mapped_key(dev_settings, key):
    assert resolve_dev_demo_key(f"demo:{key}") == key


@pytest.mark.parametrize("token", [
    "demo:demo-kiosk",
    "demo:demo-employer2",
    "demo:DEMO-EMPLOYER",
    "demo:employer",
    "demo:",
    "demo:../demo-admin",
])
def test_gate_rejects_unknown_keys(dev_settings, token):
    with pytest.raises(HTTPException) as exc:
        resolve_dev_demo_key(token)
    assert exc.value.status_code == 401


def test_gate_rejects_production(dev_settings, monkeypatch):
    monkeypatch.setattr(dev_settings, "app_env", "production")
    with pytest.raises(HTTPException) as exc:
        resolve_dev_demo_key("demo:demo-admin")
    assert exc.value.status_code == 401


@pytest.mark.parametrize("env", ["Development", "test", "staging", ""])
def test_gate_requires_exact_development(dev_settings, monkeypatch, env):
    monkeypatch.setattr(dev_settings, "app_env", env)
    with pytest.raises(HTTPException) as exc:
        resolve_dev_demo_key("demo:demo-admin")
    assert exc.value.status_code == 401


def test_gate_rejects_when_demo_login_disabled(dev_settings, monkeypatch):
    monkeypatch.setattr(dev_settings, "demo_login_enabled", False)
    with pytest.raises(HTTPException) as exc:
        resolve_dev_demo_key("demo:demo-employer")
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_resolve_user_missing_row_is_401():
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = None
    db.execute.return_value = result
    with pytest.raises(HTTPException) as exc:
        await resolve_dev_demo_user(db, "demo-employer")
    assert exc.value.status_code == 401
    assert "not seeded" in exc.value.detail


@pytest.mark.asyncio
async def test_resolve_user_role_mismatch_is_401():
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = MagicMock(role="trainee")
    db.execute.return_value = result
    with pytest.raises(HTTPException) as exc:
        await resolve_dev_demo_user(db, "demo-employer")
    assert exc.value.status_code == 401


# ---------------------------------------------------------------------------
# Route behaviour (scratch Postgres)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_demo_token_works_for_employer_and_admin(seeded_demo_rows):
    async with client() as c:
        employer = await c.get("/api/v1/employer/overview", headers=demo_headers("demo-employer"))
        assert employer.status_code == 200, employer.text
        admin = await c.get("/api/v1/admin/dashboard", headers=demo_headers("demo-admin"))
        assert admin.status_code == 200, admin.text


@pytest.mark.asyncio
async def test_demo_token_rejected_in_production(seeded_demo_rows, monkeypatch, dev_settings):
    monkeypatch.setattr(dev_settings, "app_env", "production")
    async with client() as c:
        for path, key in (("/api/v1/employer/overview", "demo-employer"), ("/api/v1/admin/dashboard", "demo-admin")):
            response = await c.get(path, headers=demo_headers(key))
            assert response.status_code == 401, path


@pytest.mark.asyncio
async def test_demo_token_rejected_when_demo_login_disabled(seeded_demo_rows, monkeypatch, dev_settings):
    monkeypatch.setattr(dev_settings, "demo_login_enabled", False)
    async with client() as c:
        response = await c.get("/api/v1/admin/dashboard", headers=demo_headers("demo-admin"))
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_unknown_demo_key_rejected(seeded_demo_rows):
    async with client() as c:
        for key in ("demo-kiosk", "demo-root", "admin"):
            response = await c.get("/api/v1/admin/dashboard", headers=demo_headers(key))
            assert response.status_code == 401, key


@pytest.mark.asyncio
async def test_trainee_demo_token_cannot_reach_admin(seeded_demo_rows):
    async with client() as c:
        response = await c.get("/api/v1/admin/institutions", headers=demo_headers("demo-trainee"))
        assert response.status_code == 403
        response = await c.get("/api/v1/admin/dashboard", headers=demo_headers("demo-trainee"))
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# Local-database gate: demo identities must never act on a remote database.
# Only the parsed hostname of a synthetic URL is used; no real DSN is read.
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("host", [
    "ep-cool-frost-123456.us-east-2.aws.neon.tech",
    "localhost.evil.example.com",
    "127.0.0.1.nip.io",
    "10.0.0.5",
    "db.example.com",
])
def test_gate_refuses_remote_database_host(dev_settings, monkeypatch, host):
    monkeypatch.setattr(dev_settings, "database_url", f"postgresql://user:pw@{host}:5432/app?sslmode=require")
    with pytest.raises(HTTPException) as exc:
        resolve_dev_demo_key("demo:demo-admin")
    assert exc.value.status_code == 401


@pytest.mark.parametrize("host", ["localhost", "127.0.0.1"])
def test_gate_accepts_local_database_host(dev_settings, monkeypatch, host):
    monkeypatch.setattr(dev_settings, "database_url", f"postgresql://user:pw@{host}:55432/app")
    assert resolve_dev_demo_key("demo:demo-admin") == "demo-admin"


def test_gate_refuses_unparseable_database_url(dev_settings, monkeypatch):
    monkeypatch.setattr(dev_settings, "database_url", "not a url")
    with pytest.raises(HTTPException) as exc:
        resolve_dev_demo_key("demo:demo-admin")
    assert exc.value.status_code == 401
