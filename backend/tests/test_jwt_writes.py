import uuid
from unittest.mock import AsyncMock, patch
import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app


async def _sync_user(ac: AsyncClient, role: str) -> dict:
    clerk_id = f"clerk_{role}_{uuid.uuid4().hex[:8]}"
    email = f"{role}_{uuid.uuid4().hex[:8]}@example.com"
    resp = await ac.post(
        "/api/v1/auth/sync",
        json={
            "clerk_user_id": clerk_id,
            "email": email,
            "full_name": f"Test {role.title()}",
            "role": role,
        },
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    data["clerk_user_id"] = clerk_id
    data["role"] = role
    return data


async def _create_test_programme(ac: AsyncClient) -> dict:
    resp = await ac.post(
        "/api/v1/programmes/",
        json={"title": f"JWT Test Programme {uuid.uuid4().hex[:6]}", "sector": "Dairy"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# Fallback Mode Tests (No JWT token provided -> explicit IDs work)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_fallback_job_application_and_history():
    """Unauthenticated users can apply using explicit applicant_id and
    retrieve applications by explicit applicant_id query param."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        trainee = await _sync_user(ac, "trainee")

        # Apply using explicit applicant_id
        apply_resp = await ac.post(
            "/api/v1/jobs/job-dairy-supervisor-anand/apply",
            params={"applicant_id": trainee["id"]},
        )
        assert apply_resp.status_code == 200
        assert apply_resp.json()["status"] == "applied"

        # View applications with explicit applicant_id
        apps_resp = await ac.get("/api/v1/jobs/my-applications", params={"applicant_id": trainee["id"]})
        assert apps_resp.status_code == 200
        apps = apps_resp.json()["applications"]
        assert len(apps) >= 1
        assert any(a["id"] == apply_resp.json()["id"] for a in apps)


@pytest.mark.asyncio
async def test_fallback_programme_nomination():
    """Unauthenticated users can nominate a trainee using explicit trainee_id."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        trainee = await _sync_user(ac, "trainee")
        programme = await _create_test_programme(ac)

        resp = await ac.post(
            "/api/v1/programmes/nominations",
            json={"programme_id": programme["id"], "trainee_id": trainee["id"]},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_fallback_certificate_issuance():
    """Unauthenticated issuance works with explicit trainee_id and programme_id."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        trainee = await _sync_user(ac, "trainee")
        programme = await _create_test_programme(ac)

        resp = await ac.post(
            "/api/v1/certificates/issue",
            json={"trainee_id": trainee["id"], "programme_id": programme["id"], "grade": "A"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "issued"
        assert "verification_code" in data


@pytest.mark.asyncio
async def test_fallback_employer_feedback():
    """Unauthenticated employer feedback works with explicit trainee_id."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        trainee = await _sync_user(ac, "trainee")

        resp = await ac.post(
            "/api/v1/jobs/feedback",
            json={
                "trainee_id": trainee["id"],
                "job_id": "job-dairy-supervisor-anand",
                "useful_skills": ["Dairy Operations"],
                "missing_skills": [],
                "training_relevance": 5,
                "performance_rating": 5,
                "comments": "Great hire",
            },
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "submitted"


# ---------------------------------------------------------------------------
# Verified Clerk Token Mode & Role Enforcement Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_trainee_role_enforcement():
    """Trainee can apply and nominate (with auto-derived identity), but CANNOT
    generate QR sessions, post job listings, or issue certificates."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        trainee = await _sync_user(ac, "trainee")
        programme = await _create_test_programme(ac)

        headers = {"Authorization": f"Bearer mock_token_{trainee['clerk_user_id']}"}

        with patch("app.deps.verify_session_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = {"sub": trainee["clerk_user_id"], "role": "trainee"}

            # 1. Trainee CANNOT post a job listing (403)
            job_post = await ac.post(
                "/api/v1/jobs/",
                json={"title": "Unauthorized Job", "employer_name": "Coop Corp", "location": "Delhi"},
                headers=headers,
            )
            assert job_post.status_code == 403
            assert "Only employers or admins" in job_post.json()["detail"]

            # 2. Trainee CANNOT generate QR attendance session (403)
            qr_post = await ac.post(
                "/api/v1/attendance/generate-qr",
                json={"session_name": "Trainee QR Attempt", "programme_id": programme["id"]},
                headers=headers,
            )
            assert qr_post.status_code == 403
            assert "Only trainers, institutions, or admins" in qr_post.json()["detail"]

            # 3. Trainee CANNOT issue certificates (403)
            cert_post = await ac.post(
                "/api/v1/certificates/issue",
                json={"trainee_id": trainee["id"], "programme_id": programme["id"]},
                headers=headers,
            )
            assert cert_post.status_code == 403
            assert "Only institutions, trainers, or admins" in cert_post.json()["detail"]

            # 4. Trainee CAN apply for a job without providing applicant_id param (auto-derived identity)
            apply_resp = await ac.post(
                "/api/v1/jobs/job-dairy-supervisor-anand/apply",
                headers=headers,
            )
            assert apply_resp.status_code == 200
            assert apply_resp.json()["status"] == "applied"
            app_id = apply_resp.json()["id"]

            # 5. Trainee CAN retrieve own applications without applicant_id param
            my_apps = await ac.get("/api/v1/jobs/my-applications", headers=headers)
            assert my_apps.status_code == 200
            apps = my_apps.json()["applications"]
            assert any(a["id"] == app_id for a in apps)

            # 6. Trainee CAN nominate self for programme without trainee_id in body
            nom_resp = await ac.post(
                "/api/v1/programmes/nominations",
                json={"programme_id": programme["id"]},
                headers=headers,
            )
            assert nom_resp.status_code == 200
            assert nom_resp.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_employer_role_enforcement():
    """Employer can post jobs and submit employer feedback, but CANNOT submit
    trainee assessments, apply for jobs, or generate QR attendance sessions."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        employer = await _sync_user(ac, "employer")
        trainee = await _sync_user(ac, "trainee")
        programme = await _create_test_programme(ac)

        headers = {"Authorization": f"Bearer mock_token_{employer['clerk_user_id']}"}

        with patch("app.deps.verify_session_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = {"sub": employer["clerk_user_id"], "role": "employer"}

            # 1. Employer CANNOT submit assessment (403)
            assess_resp = await ac.post(
                "/api/v1/assessments/a1/submit",
                params={"score": 85},
                headers=headers,
            )
            assert assess_resp.status_code == 403
            assert "Operation requires one of roles: trainee, admin" in assess_resp.json()["detail"]

            # 2. Employer CANNOT apply for a job (403)
            apply_resp = await ac.post(
                "/api/v1/jobs/job-dairy-supervisor-anand/apply",
                headers=headers,
            )
            assert apply_resp.status_code == 403
            assert "Operation requires one of roles: trainee, admin" in apply_resp.json()["detail"]

            # 3. Employer CANNOT nominate for programme (403)
            nom_resp = await ac.post(
                "/api/v1/programmes/nominations",
                json={"programme_id": programme["id"]},
                headers=headers,
            )
            assert nom_resp.status_code == 403
            assert "Operation requires one of roles: trainee, admin" in nom_resp.json()["detail"]

            # 4. Employer CANNOT generate QR attendance session (403)
            qr_resp = await ac.post(
                "/api/v1/attendance/generate-qr",
                json={"session_name": "Employer QR", "programme_id": programme["id"]},
                headers=headers,
            )
            assert qr_resp.status_code == 403

            # 5. Employer CAN post a job listing (200)
            job_resp = await ac.post(
                "/api/v1/jobs/",
                json={
                    "title": f"Employer Posted Job {uuid.uuid4().hex[:6]}",
                    "employer_name": "Verified Employer Union",
                    "location": "Pune",
                },
                headers=headers,
            )
            assert job_resp.status_code == 200
            assert job_resp.json()["status"] == "created"

            # 6. Employer CAN submit employer feedback (200)
            feedback_resp = await ac.post(
                "/api/v1/jobs/feedback",
                json={
                    "trainee_id": trainee["id"],
                    "job_id": "job-dairy-supervisor-anand",
                    "useful_skills": ["Management"],
                    "missing_skills": [],
                    "training_relevance": 4,
                    "performance_rating": 4,
                },
                headers=headers,
            )
            assert feedback_resp.status_code == 200
            assert feedback_resp.json()["status"] == "submitted"


@pytest.mark.asyncio
async def test_trainer_and_institution_role_enforcement():
    """Trainer / Institution can generate QR attendance and issue certificates,
    but CANNOT post job listings or submit employer feedback."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        trainer = await _sync_user(ac, "trainer")
        trainee = await _sync_user(ac, "trainee")
        programme = await _create_test_programme(ac)

        headers = {"Authorization": f"Bearer mock_token_{trainer['clerk_user_id']}"}

        with patch("app.deps.verify_session_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = {"sub": trainer["clerk_user_id"], "role": "trainer"}

            # 1. Trainer CAN generate QR session (200)
            qr_resp = await ac.post(
                "/api/v1/attendance/generate-qr",
                json={"session_name": "Trainer Lecture QR", "programme_id": programme["id"]},
                headers=headers,
            )
            assert qr_resp.status_code == 200
            assert "qr_token" in qr_resp.json()

            # 2. Trainer CAN issue certificate (200)
            cert_resp = await ac.post(
                "/api/v1/certificates/issue",
                json={"trainee_id": trainee["id"], "programme_id": programme["id"], "grade": "A+"},
                headers=headers,
            )
            assert cert_resp.status_code == 200
            assert cert_resp.json()["status"] == "issued"

            # 3. Trainer CANNOT post jobs (403)
            job_resp = await ac.post(
                "/api/v1/jobs/",
                json={"title": "Trainer Job", "employer_name": "Coop", "location": "Surat"},
                headers=headers,
            )
            assert job_resp.status_code == 403

            # 4. Trainer CANNOT submit employer feedback (403)
            feedback_resp = await ac.post(
                "/api/v1/jobs/feedback",
                json={
                    "trainee_id": trainee["id"],
                    "job_id": "job-dairy-supervisor-anand",
                    "useful_skills": ["Cooperation"],
                    "missing_skills": [],
                    "training_relevance": 5,
                    "performance_rating": 5,
                },
                headers=headers,
            )
            assert feedback_resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_role_enforcement():
    """Admin has permissions across operations (can post jobs, generate QR, issue certificates)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await _sync_user(ac, "admin")
        trainee = await _sync_user(ac, "trainee")
        programme = await _create_test_programme(ac)

        headers = {"Authorization": f"Bearer mock_token_{admin['clerk_user_id']}"}

        with patch("app.deps.verify_session_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = {"sub": admin["clerk_user_id"], "role": "admin"}

            # Admin can post jobs
            job_resp = await ac.post(
                "/api/v1/jobs/",
                json={"title": "Admin Job", "employer_name": "NCCT Admin", "location": "Delhi"},
                headers=headers,
            )
            assert job_resp.status_code == 200

            # Admin can generate QR
            qr_resp = await ac.post(
                "/api/v1/attendance/generate-qr",
                json={"session_name": "Admin Attendance", "programme_id": programme["id"]},
                headers=headers,
            )
            assert qr_resp.status_code == 200

            # Admin can issue certificates
            cert_resp = await ac.post(
                "/api/v1/certificates/issue",
                json={"trainee_id": trainee["id"], "programme_id": programme["id"]},
                headers=headers,
            )
            assert cert_resp.status_code == 200


@pytest.mark.asyncio
async def test_unsynced_clerk_identity_rejected():
    """A valid Clerk JWT for an account not yet synced to the local DB returns 403
    on protected actor actions."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"Authorization": "Bearer mock_token_unsynced"}

        with patch("app.deps.verify_session_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = {"sub": "clerk_unsynced_never_in_db", "role": "trainee"}

            resp = await ac.post(
                "/api/v1/jobs/job-dairy-supervisor-anand/apply",
                headers=headers,
            )
            assert resp.status_code == 403
            assert "User not provisioned locally" in resp.json()["detail"]
