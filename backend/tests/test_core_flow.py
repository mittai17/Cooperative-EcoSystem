import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_auth_me_rejects_unauthenticated_request():
    """The Clerk-JWT-protected dependency must 401 with no/garbage bearer
    token (real JWKS verification path in app/services/clerk.py)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        no_header = await ac.get("/api/v1/auth/me")
        assert no_header.status_code == 401

        bad_token = await ac.get("/api/v1/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"})
        assert bad_token.status_code == 401


@pytest.mark.asyncio
async def test_assessment_submission_updates_skill_passport():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        sync_resp = await ac.post(
            "/api/v1/auth/sync",
            json={
                "clerk_user_id": f"test_clerk_{uuid.uuid4().hex[:8]}",
                "email": f"test_{uuid.uuid4().hex[:8]}@coopsetu.example.com",
                "full_name": "Test Trainee",
                "role": "trainee",
            },
        )
        assert sync_resp.status_code == 200
        trainee_id = sync_resp.json()["id"]

        submit_resp = await ac.post(
            f"/api/v1/assessments/a1/submit",
            params={"score": 91, "trainee_id": trainee_id},
        )
        assert submit_resp.status_code == 200
        data = submit_resp.json()
        assert data["passed"] is True
        assert data["skill_updated"]

        passport_resp = await ac.get("/api/v1/skills/my-passport", params={"trainee_id": trainee_id})
        assert passport_resp.status_code == 200
        passport = passport_resp.json()
        assert passport["summary"]["total_skills"] >= 1
        assert any(s["verified"] for s in passport["skills"])


@pytest.mark.asyncio
async def test_nomination_requires_existing_trainee():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        prog_resp = await ac.post(
            "/api/v1/programmes/",
            json={"title": f"Test Programme {uuid.uuid4().hex[:6]}", "sector": "Testing"},
        )
        assert prog_resp.status_code == 200
        programme_id = prog_resp.json()["id"]

        bad_nomination = await ac.post(
            "/api/v1/programmes/nominations",
            json={"programme_id": programme_id, "trainee_id": str(uuid.uuid4())},
        )
        assert bad_nomination.status_code == 404


@pytest.mark.asyncio
async def test_certificate_issue_requires_valid_trainee_and_programme():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post(
            "/api/v1/certificates/issue",
            json={"trainee_id": str(uuid.uuid4()), "programme_id": str(uuid.uuid4()), "grade": "A"},
        )
        assert resp.status_code == 404
