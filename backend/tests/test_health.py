import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "CoopSetu" in data["service"]

@pytest.mark.asyncio
async def test_docs_available():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/docs")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_jobs_list():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/jobs/")
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data

@pytest.mark.asyncio
async def test_skill_roles():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/skills/roles")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_analytics_overview():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/analytics/overview")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_certificate_verify():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/certificates/verify/CST-2026-DAI-00842")
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] == True

@pytest.mark.asyncio
async def test_skill_gap_analysis():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/skills/gap-analysis", json={"target_role": "Cooperative Development Officer"})
    assert response.status_code == 200
    data = response.json()
    assert "match_score" in data
    assert "gaps" in data

@pytest.mark.asyncio
async def test_career_chat():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/career/chat", json={"message": "What jobs can I get?"})
    assert response.status_code == 200
    data = response.json()
    assert "response" in data
