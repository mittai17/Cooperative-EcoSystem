"""Institution management: list/create/get/patch/deactivate + role checks.

Runs against the real (scratch) DB via `token_factory`, matching the style of
test_programme_course_link.py. Every org/user created here is uniquely named,
so the suite is safe to re-run without manual cleanup (idempotent-safe).
"""
import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import update

from app.database import AsyncSessionLocal
from app.main import app
from app.models.user import User as UserModel


async def _attach_to_org(user_id: str, organisation_id) -> None:
    """Test-only helper: there is no public endpoint to set organisation_id,
    so this writes it directly to make an org-scoped user/trainee fixture."""
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(UserModel).where(UserModel.id == uuid.UUID(user_id)).values(organisation_id=organisation_id)
        )
        await session.commit()


def _payload(**overrides):
    body = {
        "name": f"Test RICM {uuid.uuid4().hex[:8]}",
        "type": "RICM",
        "state": "Maharashtra",
        "district": "Pune",
        "address": "1 Cooperative Marg",
        "pincode": "411001",
        "phone": "+919812345678",
        "email": f"contact-{uuid.uuid4().hex[:6]}@example.com",
        "accreditation_number": f"ACC-{uuid.uuid4().hex[:6]}",
    }
    body.update(overrides)
    return body


@pytest.mark.asyncio
async def test_create_list_get_patch_organisation(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")

        created = await ac.post("/api/v1/organisations/", headers=admin["headers"], json=_payload())
        assert created.status_code == 201, created.text
        org = created.json()
        assert org["type"] == "RICM"
        assert org["is_active"] is True
        assert org["trainee_count"] == 0
        assert org["programme_count"] == 0
        org_id = org["id"]

        listed = await ac.get("/api/v1/organisations/", headers=admin["headers"])
        assert listed.status_code == 200
        assert any(row["id"] == org_id for row in listed.json())

        fetched = await ac.get(f"/api/v1/organisations/{org_id}", headers=admin["headers"])
        assert fetched.status_code == 200
        assert fetched.json()["name"] == org["name"]

        patched = await ac.patch(
            f"/api/v1/organisations/{org_id}", headers=admin["headers"], json={"district": "Nagpur"}
        )
        assert patched.status_code == 200
        assert patched.json()["district"] == "Nagpur"


@pytest.mark.asyncio
async def test_create_rejects_invalid_type_and_missing_fields(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")

        bad_type = await ac.post(
            "/api/v1/organisations/", headers=admin["headers"], json=_payload(type="NOT_A_TYPE")
        )
        assert bad_type.status_code == 422

        missing_state = await ac.post(
            "/api/v1/organisations/",
            headers=admin["headers"],
            json={"name": "No State College", "type": "ICM"},
        )
        assert missing_state.status_code == 422


@pytest.mark.asyncio
async def test_non_admin_cannot_create_or_deactivate(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")
        trainee = await token_factory(ac, role="trainee")

        denied_create = await ac.post(
            "/api/v1/organisations/", headers=trainee["headers"], json=_payload()
        )
        assert denied_create.status_code == 403

        created = await ac.post("/api/v1/organisations/", headers=admin["headers"], json=_payload())
        org_id = created.json()["id"]

        denied_deactivate = await ac.post(
            f"/api/v1/organisations/{org_id}/deactivate", headers=trainee["headers"]
        )
        assert denied_deactivate.status_code == 403


@pytest.mark.asyncio
async def test_anonymous_requests_are_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        responses = [
            await ac.get("/api/v1/organisations/"),
            await ac.post("/api/v1/organisations/", json=_payload()),
            await ac.post(f"/api/v1/organisations/{uuid.uuid4()}/deactivate"),
        ]
    assert all(response.status_code == 401 for response in responses)


@pytest.mark.asyncio
async def test_institution_role_sees_only_its_own_organisation(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")
        org_a = (await ac.post("/api/v1/organisations/", headers=admin["headers"], json=_payload())).json()
        org_b = (await ac.post("/api/v1/organisations/", headers=admin["headers"], json=_payload())).json()

        institution_user = await token_factory(ac, role="institution")
        await _attach_to_org(institution_user["id"], uuid.UUID(org_a["id"]))

        listed = await ac.get("/api/v1/organisations/", headers=institution_user["headers"])
        assert listed.status_code == 200
        rows = listed.json()
        assert {row["id"] for row in rows} == {org_a["id"]}

        own = await ac.get(f"/api/v1/organisations/{org_a['id']}", headers=institution_user["headers"])
        assert own.status_code == 200

        other = await ac.get(f"/api/v1/organisations/{org_b['id']}", headers=institution_user["headers"])
        assert other.status_code == 403


@pytest.mark.asyncio
async def test_deactivate_blocked_while_trainees_attached_then_succeeds(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")
        org = (await ac.post("/api/v1/organisations/", headers=admin["headers"], json=_payload())).json()
        org_id = org["id"]

        trainee = await token_factory(ac, role="trainee")
        await _attach_to_org(trainee["id"], uuid.UUID(org_id))

        blocked = await ac.post(f"/api/v1/organisations/{org_id}/deactivate", headers=admin["headers"])
        assert blocked.status_code == 409
        assert "trainee" in blocked.json()["detail"].lower()

        # Detach the trainee (simulating a transfer) so deactivation can proceed.
        await _attach_to_org(trainee["id"], None)

        deactivated = await ac.post(f"/api/v1/organisations/{org_id}/deactivate", headers=admin["headers"])
        assert deactivated.status_code == 200
        assert deactivated.json()["is_active"] is False

        # Idempotent: deactivating again is a no-op 200, not an error.
        again = await ac.post(f"/api/v1/organisations/{org_id}/deactivate", headers=admin["headers"])
        assert again.status_code == 200
        assert again.json()["is_active"] is False


@pytest.mark.asyncio
async def test_deactivate_blocked_while_active_programme_attached(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        admin = await token_factory(ac, role="admin")
        org = (await ac.post("/api/v1/organisations/", headers=admin["headers"], json=_payload())).json()
        org_id = org["id"]

        institution_user = await token_factory(ac, role="institution")
        await _attach_to_org(institution_user["id"], uuid.UUID(org_id))

        prog = await ac.post(
            "/api/v1/programmes/",
            headers=institution_user["headers"],
            json={"title": f"Org Bound Programme {uuid.uuid4().hex[:6]}", "sector": "Dairy"},
        )
        assert prog.status_code == 200, prog.text

        blocked = await ac.post(f"/api/v1/organisations/{org_id}/deactivate", headers=admin["headers"])
        assert blocked.status_code == 409
        assert "programme" in blocked.json()["detail"].lower()
