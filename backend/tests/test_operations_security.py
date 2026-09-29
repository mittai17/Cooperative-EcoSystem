"""Authorization regressions using isolated routers and a mocked session only."""
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1 import hostel, logistics, programmes, timetable
from app.database import get_db
from app.deps import require_user


@pytest.fixture
def operations_app():
    app = FastAPI()
    for name, module in (("hostel", hostel), ("logistics", logistics),
                         ("programmes", programmes), ("timetable", timetable)):
        app.include_router(module.router, prefix=f"/{name}")
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    return app, db


def actor(role="institution", organisation_id=None):
    return SimpleNamespace(id=uuid.uuid4(), role=role,
                           organisation_id=organisation_id, is_active=True)


def result(row=None):
    value = MagicMock()
    value.scalar_one_or_none.return_value = row
    value.scalars.return_value.all.return_value = []
    value.scalars.return_value.first.return_value = None
    return value


@pytest.mark.asyncio
@pytest.mark.parametrize("method,path,body", [
    ("get", "/hostel/", None), ("get", "/logistics/", None),
    ("get", "/timetable/", None), ("get", "/programmes/nominations/list", None),
    ("post", "/programmes/", {"title": "Test", "sector": "Dairy"}),
    ("post", "/programmes/nominations", {"programme_id": str(uuid.uuid4())}),
    ("post", f"/hostel/rooms/{uuid.uuid4()}/check-out", None),
])
async def test_sensitive_operations_require_auth(operations_app, method, path, body):
    app, db = operations_app
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.request(method, path, json=body)
    assert response.status_code == 401
    db.execute.assert_not_called()
    db.commit.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("role", ["trainee", "trainer", "employer", "ncct_admin"])
async def test_only_institution_and_admin_can_create(operations_app, role):
    app, db = operations_app
    app.dependency_overrides[require_user] = lambda: actor(role)
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.post("/programmes/", json={"title": "Test", "sector": "Dairy"})
    assert response.status_code == 403
    db.commit.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("path", ["/hostel/", "/logistics/", "/timetable/", "/programmes/nominations/list"])
async def test_institution_reads_are_scoped(operations_app, path):
    app, db = operations_app
    org = uuid.uuid4()
    app.dependency_overrides[require_user] = lambda: actor(organisation_id=org)
    db.execute.return_value = result()
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.get(path)
    assert response.status_code == 200, response.text
    for call in db.execute.call_args_list:
        query = call.args[0]
        assert org in query.compile().params.values()
        assert "organisation_id =" in str(query)


@pytest.mark.asyncio
async def test_cross_org_task_cannot_be_changed(operations_app):
    app, db = operations_app
    task = SimpleNamespace(organisation_id=uuid.uuid4(), done=False)
    app.dependency_overrides[require_user] = lambda: actor(organisation_id=uuid.uuid4())
    db.execute.return_value = result(task)
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.patch(f"/logistics/tasks/{uuid.uuid4()}", json={"done": True})
    assert response.status_code == 403
    assert task.done is False
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_cross_org_room_cannot_be_checked_out(operations_app):
    app, db = operations_app
    room = SimpleNamespace(block_id=uuid.uuid4(), status="occupied")
    app.dependency_overrides[require_user] = lambda: actor(organisation_id=uuid.uuid4())
    db.execute.return_value = result(room)
    db.get.return_value = SimpleNamespace(organisation_id=uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.post(f"/hostel/rooms/{uuid.uuid4()}/check-out")
    assert response.status_code == 403
    assert room.status == "occupied"
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_trainee_cannot_nominate_another_user(operations_app):
    app, db = operations_app
    app.dependency_overrides[require_user] = lambda: actor("trainee")
    db.execute.return_value = result(SimpleNamespace(id=uuid.uuid4()))
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.post("/programmes/nominations", json={
            "programme_id": str(uuid.uuid4()), "trainee_id": str(uuid.uuid4())})
    assert response.status_code == 403
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_cross_org_nomination_cannot_be_approved(operations_app):
    app, db = operations_app
    nomination = SimpleNamespace(programme_id=uuid.uuid4(), status="pending")
    app.dependency_overrides[require_user] = lambda: actor(organisation_id=uuid.uuid4())
    db.execute.return_value = result(nomination)
    db.get.return_value = SimpleNamespace(organisation_id=uuid.uuid4())
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.patch(f"/programmes/nominations/{uuid.uuid4()}?status=approved")
    assert response.status_code == 403
    assert nomination.status == "pending"
    db.commit.assert_not_called()
