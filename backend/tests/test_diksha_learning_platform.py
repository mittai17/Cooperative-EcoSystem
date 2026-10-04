"""Comprehensive tests for DIKSHA educational integration, learning progress,
events, assessments, certificates, and course builder.
"""
import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from integrations.diksha import (
    evaluate_license,
    LicenseStatus,
    normalize_diksha_item,
    normalize_course_hierarchy,
)


def test_license_evaluation_cc_by():
    res = evaluate_license("CC BY 4.0", "NCERT", "Dr. A. Sharma", "NCCT")
    assert res.license_status == LicenseStatus.ALLOWED_WITH_ATTRIBUTION
    assert res.embedding_allowed is True
    assert res.commercial_use_allowed is True
    assert "NCERT" in res.attribution
    assert "Dr. A. Sharma" in res.attribution
    assert "https://creativecommons.org/licenses/by/4.0/" in (res.license_url or "")


def test_license_evaluation_non_commercial():
    res = evaluate_license("CC BY-NC-SA 4.0", "Punjab Board", "Prof. Singh")
    assert res.license_status == LicenseStatus.NON_COMMERCIAL_ONLY
    assert res.embedding_allowed is True
    assert res.commercial_use_allowed is False
    assert "Non-commercial" in (res.restriction_notice or "")


def test_license_evaluation_restricted():
    res = evaluate_license("All Rights Reserved - Restricted", "Private Publisher")
    assert res.license_status == LicenseStatus.RESTRICTED
    assert res.embedding_allowed is False
    assert "Unavailable for in-app playback" in (res.restriction_notice or "")


def test_normalize_raw_diksha_video():
    raw = {
        "identifier": "do_12345",
        "name": "Cooperative Bookkeeping Basics",
        "description": "An introduction to PACS ledger accounting.",
        "mimeType": "video/mp4",
        "artifactUrl": "https://files.odev.oci.diksha.gov.in/content/do_12345/video.mp4",
        "language": ["Hindi", "English"],
        "subject": ["Economics"],
        "license": "CC BY-NC 4.0",
        "duration": 720,
    }
    norm = normalize_diksha_item(raw)
    assert norm is not None
    assert norm.external_id == "do_12345"
    assert norm.title == "Cooperative Bookkeeping Basics"
    assert norm.content_type == "video"
    assert norm.duration == 720
    assert norm.duration_formatted == "12m"
    assert norm.embedding_allowed is True
    assert norm.source == "DIKSHA"


def test_normalize_raw_diksha_pdf():
    raw = {
        "identifier": "do_pdf_999",
        "name": "PACS Governance Bylaws",
        "mimeType": "application/pdf",
        "artifactUrl": "https://obj.diksha.gov.in/content/bylaws.pdf",
        "license": "CC BY 4.0",
    }
    norm = normalize_diksha_item(raw)
    assert norm is not None
    assert norm.content_type == "document"
    assert norm.embedding_allowed is True


@pytest.mark.asyncio
async def test_learning_progress_and_events(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        trainee = await token_factory(client, "trainee")

        # 1. Update progress
        resp = await client.post(
            "/api/v1/learning/progress",
            headers=trainee["headers"],
            json={
                "content_id": "do_test_progress_1",
                "source": "DIKSHA",
                "last_position": 120,
                "completion_percentage": 50,
                "time_spent_seconds": 120,
                "completed": False,
            },
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["completion_percentage"] == 50
        assert data["completed"] is False

        # 2. Get progress
        get_p = await client.get(
            "/api/v1/learning/progress/do_test_progress_1",
            headers=trainee["headers"],
        )
        assert get_p.status_code == 200
        assert get_p.json()["last_position"] == 120
        assert get_p.json()["completion_percentage"] == 50

        # 3. Complete progress
        resp2 = await client.post(
            "/api/v1/learning/progress",
            headers=trainee["headers"],
            json={
                "content_id": "do_test_progress_1",
                "last_position": 240,
                "completion_percentage": 100,
                "time_spent_seconds": 120,
                "completed": True,
            },
        )
        assert resp2.status_code == 200
        assert resp2.json()["completed"] is True

        # 4. Record event
        ev = await client.post(
            "/api/v1/learning/events",
            headers=trainee["headers"],
            json={
                "content_id": "do_test_progress_1",
                "event_type": "CONTENT_COMPLETED",
                "metadata": {"test": True},
            },
        )
        assert ev.status_code == 200
        assert ev.json()["status"] == "recorded"

        # 5. Check history
        hist = await client.get("/api/v1/learning/history", headers=trainee["headers"])
        assert hist.status_code == 200
        hist_data = hist.json()
        assert hist_data["total_completed"] >= 1
        assert any(item["content_id"] == "do_test_progress_1" for item in hist_data["items"])


@pytest.mark.asyncio
async def test_diksha_assessment_and_certification(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        trainee = await token_factory(client, "trainee")

        # 1. Fetch assessment
        res_a = await client.get(
            "/api/v1/learning/content/do_cert_test/assessment",
            headers=trainee["headers"],
        )
        assert res_a.status_code == 200
        quiz = res_a.json()
        assert quiz["total_questions"] >= 2
        assert quiz["passing_score"] == 75

        # 2. Submit correct answers -> Pass & issue certificate
        eval_resp = await client.post(
            "/api/v1/learning/content/do_cert_test/evaluate-assessment",
            headers=trainee["headers"],
            json={
                "answers": {"q1": "a", "q2": "a", "q3": "a", "q4": "a"},
                "time_spent_seconds": 45,
            },
        )
        assert eval_resp.status_code == 200, eval_resp.text
        eval_data = eval_resp.json()
        assert eval_data["passed"] is True
        assert eval_data["score"] == 100
        assert eval_data["certificate"] is not None
        assert eval_data["certificate"]["verification_code"] is not None
        assert eval_data["skill_updated"] is not None

        # 3. Verify public certificate endpoint accepts the new certificate code!
        vcode = eval_data["certificate"]["verification_code"]
        v_resp = await client.get(f"/api/v1/certificates/verify/{vcode}")
        assert v_resp.status_code == 200
        assert v_resp.json()["certificate"]["holder_name"] == eval_data["certificate"]["holder_name"]
