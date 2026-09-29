from datetime import datetime, timedelta, timezone
import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.main import app
from app.models.assessment import Assessment, AssessmentAttempt, AssessmentQuestion


@pytest.mark.asyncio
async def test_server_grades_timed_attempt_and_updates_passport(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        trainee = await token_factory(client)
        assessment = Assessment(id=uuid.uuid4(), title="Governance test", skill_name="Cooperative Governance",
                                total_questions=2, duration_minutes=10, passing_score=50,
                                max_attempts=1, show_answers="after_submit")
        questions = [
            AssessmentQuestion(id=uuid.uuid4(), assessment_id=assessment.id, position=1, type="mcq_single",
                               prompt="Who votes?", options=[{"id": "a", "text": "Members"}, {"id": "b", "text": "Only chair"}],
                               correct=["a"], marks=1, topic="Governance"),
            AssessmentQuestion(id=uuid.uuid4(), assessment_id=assessment.id, position=2, type="true_false",
                               prompt="Minutes record decisions", options=[], correct=[True], marks=1, topic="Records"),
        ]
        async with AsyncSessionLocal() as db:
            db.add(assessment)
            db.add_all(questions)
            await db.commit()

        start = await client.post(f"/api/v1/assessments/{assessment.id}/attempts", headers=trainee["headers"])
        assert start.status_code == 200, start.text
        payload = start.json()
        assert "correct" not in str(payload)
        assert len(payload["questions"]) == 2
        attempt_id = payload["attempt_id"]
        assert (await client.post(f"/api/v1/assessments/{assessment.id}/attempts", headers=trainee["headers"])).status_code == 409
        saved = await client.put(f"/api/v1/assessments/attempts/{attempt_id}/answers",
                                 headers=trainee["headers"],
                                 json={"question_id": str(questions[0].id), "answer": ["a"]})
        assert saved.status_code == 200, saved.text
        submit = await client.post(f"/api/v1/assessments/attempts/{attempt_id}/submit", headers=trainee["headers"])
        assert submit.status_code == 200, submit.text
        assert submit.json()["score"] == 50
        assert submit.json()["passed"] is True
        assert submit.json()["topic_breakdown"]["Governance"]["earned"] == 1
        assert (await client.post(f"/api/v1/assessments/attempts/{attempt_id}/submit", headers=trainee["headers"])).status_code == 409
        assert (await client.post(f"/api/v1/assessments/{assessment.id}/attempts", headers=trainee["headers"])).status_code == 409
        passport = await client.get("/api/v1/skills/my-passport", headers=trainee["headers"])
        assert any(skill["name"] == "Cooperative Governance" and skill["verified"] for skill in passport.json()["skills"])
        legacy = await client.post(f"/api/v1/assessments/{assessment.id}/submit?score=100", headers=trainee["headers"])
        assert legacy.status_code == 410


@pytest.mark.asyncio
async def test_late_attempt_rejected(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        trainee = await token_factory(client)
        assessment = Assessment(id=uuid.uuid4(), title="Timed test", duration_minutes=1, max_attempts=1)
        question = AssessmentQuestion(id=uuid.uuid4(), assessment_id=assessment.id, position=1,
                                      type="true_false", prompt="True?", correct=[True], marks=1)
        async with AsyncSessionLocal() as db:
            db.add_all([assessment, question])
            await db.commit()
        start = await client.post(f"/api/v1/assessments/{assessment.id}/attempts", headers=trainee["headers"])
        assert start.status_code == 200, start.text
        async with AsyncSessionLocal() as db:
            attempt = await db.get(AssessmentAttempt, uuid.UUID(start.json()["attempt_id"]))
            attempt.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
            await db.commit()
        late = await client.post(f"/api/v1/assessments/attempts/{start.json()['attempt_id']}/submit", headers=trainee["headers"])
        assert late.status_code == 409
        async with AsyncSessionLocal() as db:
            attempt = await db.get(AssessmentAttempt, uuid.UUID(start.json()["attempt_id"]))
            assert attempt.status == "expired"


@pytest.mark.asyncio
async def test_resume_attempt_returns_saved_answers(token_factory):
    """GET /attempts/{id} lets a trainee who navigated away mid-attempt pick
    the questions and their saved answers back up instead of losing the
    attempt (the frontend timed-assessment flow relies on this)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        trainee = await token_factory(client)
        other = await token_factory(client)
        assessment = Assessment(id=uuid.uuid4(), title="Resume test", duration_minutes=30, max_attempts=2)
        question = AssessmentQuestion(id=uuid.uuid4(), assessment_id=assessment.id, position=1,
                                      type="true_false", prompt="True?", correct=[True], marks=1)
        async with AsyncSessionLocal() as db:
            db.add_all([assessment, question])
            await db.commit()
        start = await client.post(f"/api/v1/assessments/{assessment.id}/attempts", headers=trainee["headers"])
        assert start.status_code == 200, start.text
        attempt_id = start.json()["attempt_id"]
        await client.put(f"/api/v1/assessments/attempts/{attempt_id}/answers",
                         headers=trainee["headers"], json={"question_id": str(question.id), "answer": [True]})

        resumed = await client.get(f"/api/v1/assessments/attempts/{attempt_id}", headers=trainee["headers"])
        assert resumed.status_code == 200, resumed.text
        body = resumed.json()
        assert body["assessment_id"] == str(assessment.id)
        assert len(body["questions"]) == 1
        assert "correct" not in str(body)
        assert body["answers"][str(question.id)] == [True]

        # A different trainee's attempt is not resumable by this one (404, not leaked).
        cross_owner = await client.get(f"/api/v1/assessments/attempts/{attempt_id}", headers=other["headers"])
        assert cross_owner.status_code == 404

        submit = await client.post(f"/api/v1/assessments/attempts/{attempt_id}/submit", headers=trainee["headers"])
        assert submit.status_code == 200, submit.text
        after_submit = await client.get(f"/api/v1/assessments/attempts/{attempt_id}", headers=trainee["headers"])
        assert after_submit.status_code == 409
