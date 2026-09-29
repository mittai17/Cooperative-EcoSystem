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
    """Legacy client-scored endpoint may no longer award verified skills."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post('/api/v1/assessments/a1/submit', params={'score': 100})
        assert response.status_code in (401, 410, 422)


@pytest.mark.asyncio
async def test_nomination_requires_existing_trainee(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, 'admin')
        programme = await ac.post('/api/v1/programmes/', headers=admin['headers'],
                                  json={'title': f'Test Programme {uuid.uuid4().hex[:6]}', 'sector': 'Testing'})
        assert programme.status_code == 200
        bad = await ac.post('/api/v1/programmes/nominations', headers=admin['headers'],
                            json={'programme_id': programme.json()['id'], 'trainee_id': str(uuid.uuid4())})
        assert bad.status_code == 404


@pytest.mark.asyncio
async def test_certificate_issue_requires_valid_trainee_and_programme(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, 'admin')
        response = await ac.post('/api/v1/certificates/issue', headers=admin['headers'],
                                 json={'trainee_id': str(uuid.uuid4()), 'programme_id': str(uuid.uuid4()), 'grade': 'A'})
        assert response.status_code in (404, 422)
