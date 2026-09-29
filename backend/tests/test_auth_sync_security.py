import uuid
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1 import auth
from app.database import get_db


@pytest.mark.asyncio
async def test_sync_rejects_anonymous_and_wrong_identity():
    app = FastAPI()
    app.include_router(auth.router)
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/sync", json={"clerk_user_id": "user_victim"})
        assert response.status_code == 401
        with patch.object(auth, "get_current_claims", AsyncMock(return_value={"sub": "user_attacker"})):
            response = await client.post("/sync", headers={"Authorization": "Bearer test"}, json={"clerk_user_id": "user_victim"})
            assert response.status_code == 403
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_sync_uses_clerk_not_submitted_privileges():
    from unittest.mock import MagicMock
    from app.models.user import User
    user = User(id=uuid.uuid4(), clerk_user_id="user_test", email="old@example.com", role="trainee")
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = user
    db.execute.return_value = result
    app = FastAPI()
    app.include_router(auth.router)
    app.dependency_overrides[get_db] = lambda: db
    clerk = {"primary_email_address_id": "mail_1", "email_addresses": [{"id": "mail_1", "email_address": "real@example.com"}],
             "first_name": "Real", "last_name": "Name", "public_metadata": {"role": "trainee"}}
    with patch.object(auth, "get_current_claims", AsyncMock(return_value={"sub": "user_test"})), patch.object(auth.clerk_service, "get_clerk_user", AsyncMock(return_value=clerk)):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/sync", headers={"Authorization": "Bearer test"}, json={"clerk_user_id": "user_test", "role": "admin", "email": "fake@example.com", "full_name": "Fake"})
    assert response.status_code == 200
    assert response.json()["created"] is False
    assert user.role == "trainee" and user.email == "real@example.com" and user.full_name == "Real Name"
