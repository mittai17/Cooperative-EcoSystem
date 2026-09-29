"""Institution-admin trainee/trainer management: POST/GET/PATCH /api/v1/users.

Runs against the real app + scratch Postgres (see conftest.py's DATABASE_URL
guard) using `token_factory` for real Clerk-shaped auth with a mocked Clerk
backend, exactly like the other integration suites in this directory.
"""
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.main import app
from app.models.user import Organisation, User


async def _make_org(org_type: str = "institution") -> uuid.UUID:
    async with AsyncSessionLocal() as db:
        org = Organisation(id=uuid.uuid4(), name=f"Test Org {uuid.uuid4().hex[:8]}", type=org_type, is_active=True)
        db.add(org)
        await db.commit()
        return org.id


async def _pin_org(user_id: str, org_id: uuid.UUID) -> None:
    """Force a synced user's organisation_id deterministically (the dev-mode
    /auth/sync shortcut otherwise picks *some* institution org, which is not
    deterministic once more than one exists)."""
    async with AsyncSessionLocal() as db:
        user = await db.get(User, uuid.UUID(user_id))
        user.organisation_id = org_id
        await db.commit()


@pytest.mark.asyncio
async def test_institution_admin_creates_trainee_in_own_org(token_factory):
    org_id = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst = await token_factory(client, "institution")
        await _pin_org(inst["id"], org_id)

        email = f"trainee-{uuid.uuid4().hex[:8]}@example.com"
        response = await client.post(
            "/api/v1/users/", headers=inst["headers"],
            json={"email": email, "full_name": "New Trainee", "role": "trainee"},
        )
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["role"] == "trainee"
        assert body["organisation_id"] == str(org_id)
        assert body["is_active"] is True
        assert body["pending_clerk_link"] is True  # no Clerk account yet

        roster = await client.get("/api/v1/users/", headers=inst["headers"], params={"role": "trainee"})
        assert roster.status_code == 200, roster.text
        assert any(item["id"] == body["id"] for item in roster.json())


@pytest.mark.asyncio
async def test_institution_admin_cannot_create_in_another_org(token_factory):
    org_a = await _make_org()
    org_b = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst = await token_factory(client, "institution")
        await _pin_org(inst["id"], org_a)

        response = await client.post(
            "/api/v1/users/", headers=inst["headers"],
            json={
                "email": f"cross-{uuid.uuid4().hex[:8]}@example.com", "full_name": "Cross Org",
                "role": "trainee", "organisation_id": str(org_b),
            },
        )
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_institution_admin_cannot_change_role_via_patch(token_factory):
    org_id = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst = await token_factory(client, "institution")
        await _pin_org(inst["id"], org_id)

        create = await client.post(
            "/api/v1/users/", headers=inst["headers"],
            json={"email": f"t-{uuid.uuid4().hex[:8]}@example.com", "full_name": "Original Name", "role": "trainee"},
        )
        assert create.status_code == 200, create.text
        user_id = create.json()["id"]

        escalation = await client.patch(f"/api/v1/users/{user_id}", headers=inst["headers"], json={"role": "admin"})
        assert escalation.status_code == 403

        edit = await client.patch(f"/api/v1/users/{user_id}", headers=inst["headers"], json={"full_name": "Renamed Trainee"})
        assert edit.status_code == 200, edit.text
        assert edit.json()["full_name"] == "Renamed Trainee"
        assert edit.json()["role"] == "trainee"


@pytest.mark.asyncio
async def test_institution_admin_cannot_edit_outside_own_org(token_factory):
    org_a = await _make_org()
    org_b = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst_a = await token_factory(client, "institution")
        await _pin_org(inst_a["id"], org_a)
        inst_b = await token_factory(client, "institution")
        await _pin_org(inst_b["id"], org_b)

        created = await client.post(
            "/api/v1/users/", headers=inst_a["headers"],
            json={"email": f"scoped-{uuid.uuid4().hex[:8]}@example.com", "full_name": "Scoped Trainee", "role": "trainee"},
        )
        assert created.status_code == 200, created.text
        user_id = created.json()["id"]

        denied = await client.patch(f"/api/v1/users/{user_id}", headers=inst_b["headers"], json={"full_name": "Hijacked"})
        assert denied.status_code == 403


@pytest.mark.asyncio
async def test_trainer_role_is_org_scoped_and_never_sees_email(token_factory):
    org_a = await _make_org()
    org_b = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst = await token_factory(client, "institution")
        await _pin_org(inst["id"], org_a)
        await client.post(
            "/api/v1/users/", headers=inst["headers"],
            json={"email": f"secret-{uuid.uuid4().hex[:8]}@example.com", "full_name": "Secret Trainee", "role": "trainee"},
        )

        trainer = await token_factory(client, "trainer")
        await _pin_org(trainer["id"], org_b)

        roster = await client.get("/api/v1/users/", headers=trainer["headers"])
        assert roster.status_code == 200
        names = {item["full_name"] for item in roster.json()}
        assert "Secret Trainee" not in names  # different org, never visible
        # trainer sees their own email (that's their own profile), never a peer's
        peers = [item for item in roster.json() if item["id"] != trainer["id"]]
        assert all("email" not in item for item in peers)

        trainer_create_attempt = await client.post(
            "/api/v1/users/", headers=trainer["headers"],
            json={"email": f"nope-{uuid.uuid4().hex[:8]}@example.com", "full_name": "Nope", "role": "trainee"},
        )
        assert trainer_create_attempt.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_create_list_and_change_role(token_factory):
    org_id = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        admin = await token_factory(client, "admin")

        create = await client.post(
            "/api/v1/users/", headers=admin["headers"],
            json={
                "email": f"trainer-{uuid.uuid4().hex[:8]}@example.com", "full_name": "New Trainer",
                "role": "trainer", "organisation_id": str(org_id),
                "qualification": "M.Com", "expertise": ["Bookkeeping", "Audit"],
            },
        )
        assert create.status_code == 200, create.text
        user_id = create.json()["id"]

        roster = await client.get("/api/v1/users/", headers=admin["headers"], params={"organisation_id": str(org_id)})
        assert roster.status_code == 200, roster.text
        row = next(item for item in roster.json() if item["id"] == user_id)
        assert row["qualification"] == "M.Com"
        assert row["expertise"] == ["Bookkeeping", "Audit"]

        role_change = await client.patch(f"/api/v1/users/{user_id}", headers=admin["headers"], json={"role": "institution"})
        assert role_change.status_code == 200, role_change.text
        assert role_change.json()["role"] == "institution"


@pytest.mark.asyncio
async def test_trainee_batch_assignment_on_create_and_roster_display(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst = await token_factory(client, "institution")
        prog = await client.post(
            "/api/v1/programmes/", headers=inst["headers"],
            json={"title": f"Users mgmt fixture {uuid.uuid4().hex[:8]}", "sector": "Dairy"},
        )
        assert prog.status_code == 200, prog.text
        programme_id = prog.json()["id"]
        batch = await client.post(
            f"/api/v1/programmes/{programme_id}/batches", headers=inst["headers"],
            json={"name": "Batch A", "capacity": 10},
        )
        assert batch.status_code == 200, batch.text
        batch_id = batch.json()["id"]

        create = await client.post(
            "/api/v1/users/", headers=inst["headers"],
            json={
                "email": f"batched-{uuid.uuid4().hex[:8]}@example.com", "full_name": "Batched Trainee",
                "role": "trainee", "batch_id": batch_id,
            },
        )
        assert create.status_code == 200, create.text
        assert create.json()["batch_id"] == batch_id

        roster = await client.get("/api/v1/users/", headers=inst["headers"], params={"role": "trainee"})
        row = next(item for item in roster.json() if item["id"] == create.json()["id"])
        assert row["batch"] == "Batch A"
        assert row["programme_id"] == programme_id


@pytest.mark.asyncio
async def test_list_assignable_batches_is_org_scoped(token_factory):
    org_a = await _make_org()
    org_b = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst_a = await token_factory(client, "institution")
        await _pin_org(inst_a["id"], org_a)
        prog_a = await client.post(
            "/api/v1/programmes/", headers=inst_a["headers"],
            json={"title": f"Batches fixture A {uuid.uuid4().hex[:8]}", "sector": "Dairy"},
        )
        batch_a = await client.post(
            f"/api/v1/programmes/{prog_a.json()['id']}/batches", headers=inst_a["headers"],
            json={"name": "Batch A1", "capacity": 5},
        )
        assert batch_a.status_code == 200, batch_a.text

        inst_b = await token_factory(client, "institution")
        await _pin_org(inst_b["id"], org_b)
        prog_b = await client.post(
            "/api/v1/programmes/", headers=inst_b["headers"],
            json={"title": f"Batches fixture B {uuid.uuid4().hex[:8]}", "sector": "Dairy"},
        )
        batch_b = await client.post(
            f"/api/v1/programmes/{prog_b.json()['id']}/batches", headers=inst_b["headers"],
            json={"name": "Batch B1", "capacity": 5},
        )
        assert batch_b.status_code == 200, batch_b.text

        seen_by_a = await client.get("/api/v1/users/batches", headers=inst_a["headers"])
        assert seen_by_a.status_code == 200, seen_by_a.text
        ids_a = {row["id"] for row in seen_by_a.json()}
        assert batch_a.json()["id"] in ids_a
        assert batch_b.json()["id"] not in ids_a

        trainer = await token_factory(client, "trainer")
        denied = await client.get("/api/v1/users/batches", headers=trainer["headers"])
        assert denied.status_code == 403


@pytest.mark.asyncio
async def test_deactivate_and_reactivate_trainee(token_factory):
    org_id = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst = await token_factory(client, "institution")
        await _pin_org(inst["id"], org_id)
        create = await client.post(
            "/api/v1/users/", headers=inst["headers"],
            json={"email": f"deact-{uuid.uuid4().hex[:8]}@example.com", "full_name": "To Deactivate", "role": "trainee"},
        )
        user_id = create.json()["id"]

        deactivate = await client.patch(f"/api/v1/users/{user_id}", headers=inst["headers"], json={"is_active": False})
        assert deactivate.status_code == 200, deactivate.text
        assert deactivate.json()["is_active"] is False

        reactivate = await client.patch(f"/api/v1/users/{user_id}", headers=inst["headers"], json={"is_active": True})
        assert reactivate.status_code == 200
        assert reactivate.json()["is_active"] is True


@pytest.mark.asyncio
async def test_duplicate_email_rejected(token_factory):
    org_id = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst = await token_factory(client, "institution")
        await _pin_org(inst["id"], org_id)
        email = f"dup-{uuid.uuid4().hex[:8]}@example.com"
        first = await client.post(
            "/api/v1/users/", headers=inst["headers"],
            json={"email": email, "full_name": "First", "role": "trainee"},
        )
        assert first.status_code == 200, first.text
        second = await client.post(
            "/api/v1/users/", headers=inst["headers"],
            json={"email": email, "full_name": "Second", "role": "trainee"},
        )
        assert second.status_code == 409


@pytest.mark.asyncio
async def test_pending_user_links_to_real_clerk_identity_on_first_login(token_factory):
    """The critical hand-off: an institution-admin-created trainer (no Clerk
    account, `pending_clerk_link=True`) later signs in for real. /auth/sync
    must match them by email and adopt the row - not create a duplicate that
    collides on the unique email constraint, and not silently reset their
    admin-assigned role back to the "trainee" default."""
    org_id = await _make_org()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        inst = await token_factory(client, "institution")
        await _pin_org(inst["id"], org_id)

        email = f"pending-{uuid.uuid4().hex[:8]}@example.com"
        create = await client.post(
            "/api/v1/users/", headers=inst["headers"],
            json={"email": email, "full_name": "Pending Trainer", "role": "trainer", "qualification": "M.Ed"},
        )
        assert create.status_code == 200, create.text
        assert create.json()["pending_clerk_link"] is True
        local_id = create.json()["id"]

        real_clerk_id = f"user_real_{uuid.uuid4().hex}"
        secret = get_settings().internal_api_secret
        assert secret, "scripts/scratch_backend.py should set INTERNAL_API_SECRET"
        sync = await client.post(
            "/api/v1/auth/sync",
            headers={"X-Internal-Secret": secret},
            json={"clerk_user_id": real_clerk_id, "email": email, "full_name": "Pending Trainer", "role": "trainee"},
        )
        assert sync.status_code == 200, sync.text
        body = sync.json()
        assert body["id"] == local_id  # same local row, not a duplicate
        assert body["created"] is False
        assert body["role"] == "trainer"  # admin-assigned role preserved, not downgraded

        async with AsyncSessionLocal() as db:
            row = await db.get(User, uuid.UUID(local_id))
            assert row.clerk_user_id == real_clerk_id
            assert row.organisation_id == org_id
            assert row.role == "trainer"


@pytest.mark.asyncio
async def test_anonymous_and_trainee_cannot_create_users(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        anon = await client.post(
            "/api/v1/users/", json={"email": "anon@example.com", "full_name": "Anon", "role": "trainee"},
        )
        assert anon.status_code == 401

        trainee = await token_factory(client, "trainee")
        denied = await client.post(
            "/api/v1/users/", headers=trainee["headers"],
            json={"email": f"x-{uuid.uuid4().hex[:8]}@example.com", "full_name": "X", "role": "trainee"},
        )
        assert denied.status_code == 403
