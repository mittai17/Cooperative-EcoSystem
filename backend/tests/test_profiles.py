import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1 import users, organisations
from app.database import get_db
from app.deps import require_user
from app.models.user import User


@pytest.mark.asyncio
async def test_profile_update_cannot_change_privileges():
    user = User(id=uuid.uuid4(), clerk_user_id="user_test", role="trainee", email="self@example.com", is_active=True)
    db = AsyncMock()
    app = FastAPI()
    app.include_router(users.router)
    app.dependency_overrides[require_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.patch("/me", json={"role": "admin"})
        assert response.status_code == 422
        response = await client.patch(f"/{user.id}", json={"role": "admin"})
        assert response.status_code == 403
        response = await client.patch("/me", json={"preferred_language": "hi", "career_target_role": "Manager"})
        assert response.status_code == 200
        assert response.json()["preferred_language"] == "hi"
        assert user.role == "trainee"


@pytest.mark.asyncio
async def test_cross_org_profile_denied_and_peer_email_hidden():
    org_id = uuid.uuid4()
    actor = User(id=uuid.uuid4(), role="institution", organisation_id=org_id)
    peer = User(id=uuid.uuid4(), role="trainee", organisation_id=org_id, email="private@example.com")
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = peer
    db.execute.return_value = result
    app = FastAPI()
    app.include_router(users.router)
    app.dependency_overrides[require_user] = lambda: actor
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"/{peer.id}")
        assert response.status_code == 200
        assert "email" not in response.json()
        peer.organisation_id = uuid.uuid4()
        response = await client.get(f"/{peer.id}")
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_organisation_writes_are_scoped():
    actor = User(id=uuid.uuid4(), role="institution", organisation_id=uuid.uuid4())
    app = FastAPI()
    app.include_router(organisations.router)
    app.dependency_overrides[require_user] = lambda: actor
    app.dependency_overrides[get_db] = lambda: AsyncMock()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.patch(f"/{uuid.uuid4()}", json={"name": "Other"})
        assert response.status_code == 403
