"""Foundation contract checks; no database or provider network access."""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from app.api.v1 import notifications, system
from app.database import get_db
from app.deps import require_user
from app.models.notification import Notification
from app.services.notifications import notify


def test_capabilities_distinguish_configuration_from_implementation():
    settings = SimpleNamespace(gemini_api_key="secret-value", youtube_api_key="another-secret")
    result = system.integration_capabilities(settings)
    assert result["integrations"]["gemini"]["available"] is True
    assert result["integrations"]["youtube"]["configured"] is True
    assert result["integrations"]["youtube"]["available"] is False
    assert result["integrations"]["fcm"]["configured"] is False
    assert "secret" not in str(result)
    assert result["features"]["remote_push"] is False


@pytest.mark.asyncio
async def test_notify_participates_in_callers_transaction():
    db = MagicMock()
    db.flush = AsyncMock()
    db.commit = AsyncMock()
    event = await notify(db, uuid4(), "nomination_decision", {"status": "approved"})
    db.add.assert_called_once_with(event)
    db.flush.assert_awaited_once()
    db.commit.assert_not_awaited()
    assert event.push_status is None


@pytest.mark.asyncio
async def test_notification_routes_require_auth_without_touching_database():
    app = FastAPI()
    app.include_router(notifications.router, prefix="/notifications")
    db = MagicMock()
    app.dependency_overrides[get_db] = lambda: db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for method, url, payload in [
            ("GET", "/notifications", None),
            ("POST", f"/notifications/{uuid4()}/read", None),
            ("POST", "/notifications/devices", {"token": "device"}),
            ("DELETE", f"/notifications/devices/{uuid4()}", None),
        ]:
            response = await client.request(method, url, json=payload)
            assert response.status_code == 401
    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_mark_read_owner_filter_and_idempotency():
    user = SimpleNamespace(id=uuid4())
    event = Notification(id=uuid4(), user_id=user.id, kind="test", created_at=datetime.now(timezone.utc))
    result = MagicMock()
    result.scalar_one_or_none.return_value = event
    db = MagicMock(execute=AsyncMock(return_value=result), commit=AsyncMock())
    await notifications.mark_read(event.id, user, db)
    first_timestamp = event.read_at
    await notifications.mark_read(event.id, user, db)
    assert event.read_at == first_timestamp
    db.commit.assert_awaited_once()
    statement = db.execute.call_args.args[0]
    assert user.id in statement.compile().params.values()
    assert "notifications.user_id =" in str(statement)
    assert "FOR UPDATE" in str(statement)
    result.scalar_one_or_none.return_value = None
    with pytest.raises(Exception) as error:
        await notifications.mark_read(uuid4(), user, db)
    assert error.value.status_code == 404


@pytest.mark.asyncio
async def test_inbox_queries_always_scope_to_owner():
    user = SimpleNamespace(id=uuid4())
    rows = MagicMock()
    rows.scalars.return_value.all.return_value = []
    count = MagicMock()
    count.scalar_one.return_value = 0
    db = MagicMock(execute=AsyncMock(side_effect=[rows, count]))
    result = await notifications.inbox(10, 0, False, user, db)
    assert result["items"] == []
    for call in db.execute.call_args_list:
        assert user.id in call.args[0].compile().params.values()
        assert "notifications.user_id =" in str(call.args[0])


@pytest.mark.asyncio
async def test_device_registration_is_atomic_and_never_returns_token():
    device_id = uuid4()
    result = MagicMock()
    result.scalar_one.return_value = device_id
    db = MagicMock(execute=AsyncMock(return_value=result), commit=AsyncMock())
    user = SimpleNamespace(id=uuid4())
    response = await notifications.register_device(
        notifications.DeviceRegistration(token="a-device-token", provider="fcm"), user, db)
    assert response == {"id": device_id, "registered": True, "remote_push_available": False}
    assert "ON CONFLICT (token) DO UPDATE" in str(db.execute.call_args.args[0])
    db.commit.assert_awaited_once()
    with pytest.raises(ValueError):
        notifications.DeviceRegistration(token="   ")


@pytest.mark.asyncio
async def test_unregister_device_cannot_delete_another_users_token():
    user = SimpleNamespace(id=uuid4())
    db = MagicMock(execute=AsyncMock(), commit=AsyncMock())
    response = await notifications.unregister_device(uuid4(), user, db)
    assert response.status_code == 204
    statement = db.execute.call_args.args[0]
    assert "push_tokens.user_id =" in str(statement)
    assert user.id in statement.compile().params.values()
