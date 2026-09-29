import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1 import employer, jobs
from app.database import get_db
from app.deps import require_user


def actor(role="employer", org=None):
    return SimpleNamespace(id=uuid.uuid4(), role=role, organisation_id=org or uuid.uuid4(), is_active=True)


def scalar(value):
    result = MagicMock()
    result.scalar_one_or_none.return_value = value
    return result


@pytest.fixture
def app_db():
    app = FastAPI()
    app.include_router(jobs.router, prefix="/jobs")
    app.include_router(employer.router, prefix="/employer")
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    return app, db


@pytest.mark.asyncio
async def test_employer_routes_require_auth(app_db):
    app, db = app_db
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        for path in ("/jobs/mine", "/employer/overview", "/employer/candidates"):
            response = await client.get(path)
            assert response.status_code == 401
    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_cross_org_job_and_applicants_denied(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = SimpleNamespace(id=uuid.uuid4(), organisation_id=uuid.uuid4(), source="employer")
    db.execute.return_value = scalar(job)
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        edit = await client.patch(f"/jobs/{job.id}", json={"status": "closed"})
        applicants = await client.get(f"/jobs/{job.id}/applications")
    assert edit.status_code == applicants.status_code == 403
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_transition_notifies_only_for_a_real_change(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = SimpleNamespace(id=uuid.uuid4(), organisation_id=user.organisation_id, title="Cooperative Officer")
    application = SimpleNamespace(id=uuid.uuid4(), applicant_id=uuid.uuid4(), status="applied",
                                  employer_note=None, interview_at=None, updated_at=None)
    row = MagicMock()
    row.one_or_none.return_value = (application, job)
    db.execute.return_value = row
    with patch("app.api.v1.jobs.notify", new_callable=AsyncMock) as notify:
        async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
            changed = await client.patch(f"/employer/applications/{application.id}", json={"status": "shortlisted"})
            unchanged = await client.patch(f"/employer/applications/{application.id}", json={"status": "shortlisted"})
        assert changed.status_code == unchanged.status_code == 200
        assert application.status == "shortlisted"
        notify.assert_awaited_once()
    assert db.commit.await_count == 2


@pytest.mark.asyncio
async def test_invalid_transition_rejected(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = SimpleNamespace(id=uuid.uuid4(), organisation_id=user.organisation_id)
    application = SimpleNamespace(id=uuid.uuid4(), applicant_id=uuid.uuid4(), status="applied")
    row = MagicMock()
    row.one_or_none.return_value = (application, job)
    db.execute.return_value = row
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.patch(f"/employer/applications/{application.id}", json={"status": "hired"})
    assert response.status_code == 422
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_candidate_requires_opt_in_or_own_application(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    trainee = SimpleNamespace(id=uuid.uuid4(), role="trainee", full_name="Private Candidate")
    profile = SimpleNamespace(visible_to_employers=False)
    candidate = MagicMock()
    candidate.one_or_none.return_value = (trainee, profile)
    no_application = scalar(None)
    db.execute.side_effect = [candidate, no_application]
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.get(f"/employer/candidates/{trainee.id}")
    assert response.status_code == 403
    assert db.execute.await_count == 2
