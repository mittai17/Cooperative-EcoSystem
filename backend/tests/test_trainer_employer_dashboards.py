"""Coverage for the new read-only trainer/employer dashboard endpoints added
to wire apps/web/src/app/{employer,trainer}/** off lib/mock-data and onto the
real backend: attendance classes/sessions "mine" rollups, the assessments
results rollup, and the employer hired/feedback-history endpoints."""
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1 import assessments, attendance, jobs
from app.database import get_db
from app.deps import require_user


def actor(role="trainer", org=None):
    return SimpleNamespace(id=uuid.uuid4(), role=role, organisation_id=org, is_active=True)


def scalars_result(items):
    result = MagicMock()
    result.scalars.return_value.all.return_value = items
    return result


def rows_result(items):
    result = MagicMock()
    result.all.return_value = items
    return result


@pytest.fixture
def attendance_app():
    app = FastAPI()
    app.include_router(attendance.router, prefix="/attendance")
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    return app, db


@pytest.fixture
def assessments_app():
    app = FastAPI()
    app.include_router(assessments.router, prefix="/assessments")
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    return app, db


@pytest.fixture
def jobs_app():
    app = FastAPI()
    app.include_router(jobs.router, prefix="/jobs")
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    return app, db


@pytest.mark.asyncio
async def test_classes_mine_requires_org_for_non_admin(attendance_app):
    app, db = attendance_app
    app.dependency_overrides[require_user] = lambda: actor("trainer", org=None)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/attendance/classes/mine")
    assert response.status_code == 403
    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_classes_mine_empty_for_admin(attendance_app):
    app, db = attendance_app
    app.dependency_overrides[require_user] = lambda: actor("admin")
    db.execute.side_effect = [rows_result([]), scalars_result([])]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/attendance/classes/mine")
    assert response.status_code == 200
    assert response.json() == {"classes": []}


@pytest.mark.asyncio
async def test_classes_mine_rejects_trainee(attendance_app):
    app, db = attendance_app
    app.dependency_overrides[require_user] = lambda: actor("trainee")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/attendance/classes/mine")
    assert response.status_code == 403
    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_sessions_mine_empty(attendance_app):
    app, db = attendance_app
    app.dependency_overrides[require_user] = lambda: actor("admin")
    db.execute.return_value = rows_result([])
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/attendance/sessions/mine")
    assert response.status_code == 200
    assert response.json() == {"sessions": []}


@pytest.mark.asyncio
async def test_assessment_results_mine_empty_for_no_programmes(assessments_app):
    app, db = assessments_app
    app.dependency_overrides[require_user] = lambda: actor("institution", org=uuid.uuid4())
    db.execute.side_effect = [scalars_result([]), scalars_result([])]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/assessments/results/mine")
    assert response.status_code == 200
    assert response.json() == {"average_score": None, "total_submissions": 0, "recent": []}


@pytest.mark.asyncio
async def test_assessment_results_mine_rejects_trainee(assessments_app):
    app, db = assessments_app
    app.dependency_overrides[require_user] = lambda: actor("trainee")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/assessments/results/mine")
    assert response.status_code == 403
    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_hired_candidates_empty(jobs_app):
    app, db = jobs_app
    app.dependency_overrides[require_user] = lambda: actor("employer", org=uuid.uuid4())
    db.execute.side_effect = [rows_result([]), rows_result([])]
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/jobs/hired")
    assert response.status_code == 200
    assert response.json() == {"hires": []}


@pytest.mark.asyncio
async def test_feedback_mine_empty(jobs_app):
    app, db = jobs_app
    app.dependency_overrides[require_user] = lambda: actor("employer", org=uuid.uuid4())
    db.execute.return_value = rows_result([])
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/jobs/feedback/mine")
    assert response.status_code == 200
    assert response.json() == {"feedback": []}


@pytest.mark.asyncio
async def test_hired_and_feedback_reject_trainee(jobs_app):
    app, db = jobs_app
    app.dependency_overrides[require_user] = lambda: actor("trainee")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        hired = await client.get("/jobs/hired")
        feedback = await client.get("/jobs/feedback/mine")
    assert hired.status_code == 403
    assert feedback.status_code == 403
    db.execute.assert_not_called()
