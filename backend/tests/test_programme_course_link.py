import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_link_course_to_programme(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")
        # Create a new programme
        prog_resp = await ac.post(
            "/api/v1/programmes/",
            headers=admin["headers"],
            json={"title": f"Link Test Prog {uuid.uuid4().hex[:6]}", "sector": "Cooperative"},
        )
        assert prog_resp.status_code == 200
        prog_id = prog_resp.json()["id"]

        # Get existing courses
        courses_resp = await ac.get("/api/v1/courses/")
        assert courses_resp.status_code == 200
        courses = courses_resp.json()["courses"]
        assert len(courses) > 0
        course_id = courses[0]["id"]

        # Link course to programme via JSON body
        link_resp = await ac.post(
            f"/api/v1/programmes/{prog_id}/courses",
            headers=admin["headers"],
            json={
                "course_id": course_id,
                "sequence_order": 1,
                "is_mandatory": True,
            },
        )
        assert link_resp.status_code == 200
        link_data = link_resp.json()
        assert link_data["programme_id"] == prog_id
        assert link_data["course_id"] == course_id
        assert link_data["sequence_order"] == 1
        assert link_data["is_mandatory"] is True
        assert link_data["status"] == "linked"


@pytest.mark.asyncio
async def test_list_programme_courses_in_sequence(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")
        # Create a new programme
        prog_resp = await ac.post(
            "/api/v1/programmes/",
            headers=admin["headers"],
            json={"title": f"Sequence Test Prog {uuid.uuid4().hex[:6]}", "sector": "Technology"},
        )
        assert prog_resp.status_code == 200
        prog_id = prog_resp.json()["id"]

        # Get courses
        courses_resp = await ac.get("/api/v1/courses/")
        assert courses_resp.status_code == 200
        courses = courses_resp.json()["courses"]
        assert len(courses) >= 2

        course_1_id = courses[0]["id"]
        course_2_id = courses[1]["id"]

        # Link course_1 as sequence 2, course_2 as sequence 1 (deliberately out of order)
        link1 = await ac.post(
            f"/api/v1/programmes/{prog_id}/courses",
            headers=admin["headers"],
            json={"course_id": course_1_id, "sequence_order": 2, "is_mandatory": False},
        )
        assert link1.status_code == 200

        link2 = await ac.post(
            f"/api/v1/programmes/{prog_id}/courses",
            headers=admin["headers"],
            json={"course_id": course_2_id, "sequence_order": 1, "is_mandatory": True},
        )
        assert link2.status_code == 200

        # Retrieve courses for programme
        list_resp = await ac.get(f"/api/v1/programmes/{prog_id}/courses")
        assert list_resp.status_code == 200
        prog_courses = list_resp.json()
        assert isinstance(prog_courses, list)
        assert len(prog_courses) >= 2

        # First item should be sequence 1 (course_2)
        assert prog_courses[0]["id"] == course_2_id
        assert prog_courses[0]["sequence_order"] == 1
        assert prog_courses[0]["is_mandatory"] is True

        # Second item should be sequence 2 (course_1)
        assert prog_courses[1]["id"] == course_1_id
        assert prog_courses[1]["sequence_order"] == 2
        assert prog_courses[1]["is_mandatory"] is False


@pytest.mark.asyncio
async def test_get_programmes_for_course(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")
        # Create two distinct programmes
        p1_resp = await ac.post(
            "/api/v1/programmes/",
            headers=admin["headers"],
            json={"title": f"Parent Prog 1 {uuid.uuid4().hex[:6]}", "sector": "Dairy"},
        )
        p2_resp = await ac.post(
            "/api/v1/programmes/",
            headers=admin["headers"],
            json={"title": f"Parent Prog 2 {uuid.uuid4().hex[:6]}", "sector": "Banking"},
        )
        p1_id = p1_resp.json()["id"]
        p2_id = p2_resp.json()["id"]

        # Get a course
        courses_resp = await ac.get("/api/v1/courses/")
        course_id = courses_resp.json()["courses"][0]["id"]

        # Link course to both programmes
        await ac.post(
            f"/api/v1/programmes/{p1_id}/courses",
            headers=admin["headers"],
            json={"course_id": course_id, "sequence_order": 1},
        )
        await ac.post(
            f"/api/v1/programmes/{p2_id}/courses",
            headers=admin["headers"],
            json={"course_id": course_id, "sequence_order": 1},
        )

        # Query programmes for the course
        prog_for_course_resp = await ac.get(f"/api/v1/courses/{course_id}/programmes")
        assert prog_for_course_resp.status_code == 200
        found_programmes = prog_for_course_resp.json()
        assert isinstance(found_programmes, list)

        found_ids = {p["id"] for p in found_programmes}
        assert p1_id in found_ids
        assert p2_id in found_ids


@pytest.mark.asyncio
async def test_link_validation_errors(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")
        fake_uuid = str(uuid.uuid4())

        # Linking with non-existent programme
        resp = await ac.post(
            f"/api/v1/programmes/{fake_uuid}/courses",
            headers=admin["headers"],
            json={"course_id": fake_uuid, "sequence_order": 1},
        )
        assert resp.status_code == 404

        # Non-existent course on existing programme
        prog_resp = await ac.post(
            "/api/v1/programmes/",
            headers=admin["headers"],
            json={"title": f"Prog {uuid.uuid4().hex[:6]}", "sector": "General"},
        )
        prog_id = prog_resp.json()["id"]

        resp_bad_course = await ac.post(
            f"/api/v1/programmes/{prog_id}/courses",
            headers=admin["headers"],
            json={"course_id": fake_uuid, "sequence_order": 1},
        )
        assert resp_bad_course.status_code == 404

        # Getting courses for non-existent programme
        resp_not_found = await ac.get(f"/api/v1/programmes/{fake_uuid}/courses")
        assert resp_not_found.status_code == 404

        # Getting programmes for non-existent course
        resp_prog_not_found = await ac.get(f"/api/v1/courses/{fake_uuid}/programmes")
        assert resp_prog_not_found.status_code == 404
