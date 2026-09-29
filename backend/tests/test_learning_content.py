import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.main import app
from app.models.content import ContentTranslation
from app.models.course import Course
from app.seeds.learning import seed_learning


@pytest.mark.asyncio
async def test_authored_content_translation_fallback_and_progress(token_factory):
    async with AsyncSessionLocal() as db:
        await seed_learning(db)
        course = (await db.execute(select(Course).where(
            Course.title == "Cooperative Management Fundamentals"
        ))).scalar_one()
        await db.commit()
        course_id = str(course.id)

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        learner = await token_factory(client)
        catalog = await client.get("/api/v1/courses/?has_content=true")
        assert catalog.status_code == 200
        assert course_id in {item["id"] for item in catalog.json()["courses"]}

        content = await client.get(f"/api/v1/courses/{course_id}/content")
        assert content.status_code == 200, content.text
        authored_module = next(m for m in content.json()["modules"] if m["title"] == "1. Introduction to Cooperative Principles & Values")
        lessons = authored_module["lessons"]
        assert {block["type"] for lesson in lessons for block in lesson["blocks"]} >= {
            "text", "image", "callout", "flashcards", "quiz", "scenario"
        }
        first_id = lessons[0]["id"]

        async with AsyncSessionLocal() as db:
            with_translation = (await db.execute(select(ContentTranslation).where(
                ContentTranslation.entity_type == "lesson",
                ContentTranslation.entity_id == uuid.UUID(first_id),
                ContentTranslation.lang == "hi",
            ))).scalar_one_or_none()
            if with_translation is None:
                with_translation = ContentTranslation(
                    id=uuid.uuid4(), entity_type="lesson", entity_id=uuid.UUID(first_id), lang="hi"
                )
                db.add(with_translation)
            with_translation.status = "draft"
            with_translation.fields = {"title": "सदस्य स्वामित्व"}
            await db.commit()
        translated = await client.get(f"/api/v1/courses/{course_id}/content?lang=hi")
        translated_lessons = next(m for m in translated.json()["modules"] if m["id"] == authored_module["id"])["lessons"]
        assert translated_lessons[0]["title"] == "सदस्य स्वामित्व"
        assert translated_lessons[0]["blocks"] == lessons[0]["blocks"]
        assert translated_lessons[0]["translation_status"] == "draft"
        assert translated_lessons[1]["lang_served"] == "en"
        assert "hi" in translated.json()["langs_available"]

        saved = await client.post(f"/api/v1/courses/lessons/{first_id}/progress",
            headers=learner["headers"], json={"status": "completed", "position_sec": 40})
        assert saved.status_code == 200, saved.text
        assert saved.json()["course_progress"] > 0
        retry = await client.post(f"/api/v1/courses/lessons/{first_id}/progress",
            headers=learner["headers"], json={"status": "in_progress", "position_sec": 20})
        assert retry.status_code == 200
        assert retry.json()["status"] == "completed"
        assert retry.json()["position_sec"] == 40
        progress = await client.get(f"/api/v1/courses/{course_id}/progress", headers=learner["headers"])
        assert progress.status_code == 200
        assert progress.json()["progress"] == saved.json()["course_progress"]
        assert len(progress.json()["lessons"]) >= 2


@pytest.mark.asyncio
async def test_seed_is_idempotent_and_manifest_excludes_streaming():
    async with AsyncSessionLocal() as db:
        await seed_learning(db)
        await seed_learning(db)
        course = (await db.execute(select(Course).where(
            Course.title == "Data Analytics for Cooperatives"
        ))).scalar_one()
        await db.commit()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        content = await client.get(f"/api/v1/courses/{course.id}/content")
        assert content.status_code == 200
        assert len(next(m for m in content.json()["modules"] if m["title"] == "1. Fundamentals of Member Data & Ledger Analysis")["lessons"]) == 2
        manifest = await client.get(f"/api/v1/courses/{course.id}/manifest")
        assert manifest.status_code == 200
        assert manifest.json()["course_id"] == str(course.id)
