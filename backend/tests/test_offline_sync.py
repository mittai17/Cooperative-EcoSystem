import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_offline_sync_status():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/offline-sync/status")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["sync_supported"] is True
    assert "MARK_LESSON_COMPLETE" in data["supported_actions"]

@pytest.mark.asyncio
async def test_offline_sync_batch_processing():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "items": [
                {
                    "id": "sync-1",
                    "action": "MARK_LESSON_COMPLETE",
                    "payload": {
                        "course_id": "course-coop-mgmt-101",
                        "lesson_id": "course-coop-mgmt-101-m0-l0",
                        "completed_at": "2026-09-27T12:00:00Z",
                    },
                    "client_timestamp": "2026-09-27T12:00:00Z",
                },
                {
                    "id": "sync-2",
                    "action": "RECORD_ATTENDANCE",
                    "payload": {
                        "qr_token": "coopsetu:attend:test_offline_qr",
                        "session_id": "offline_session",
                        "scanned_at": "2026-09-27T12:05:00Z",
                    },
                    "client_timestamp": "2026-09-27T12:05:00Z",
                },
                {
                    "id": "sync-3",
                    "action": "SUBMIT_ASSESSMENT",
                    "payload": {
                        "assessment_id": "asmt-1",
                        "score": 92,
                        "submitted_at": "2026-09-27T12:10:00Z",
                    },
                    "client_timestamp": "2026-09-27T12:10:00Z",
                },
            ]
        }
        response = await ac.post("/api/v1/offline-sync/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["processed_count"] == 3
    assert len(data["results"]) == 3
    for res in data["results"]:
        assert res["status"] in ["success", "duplicate"]
