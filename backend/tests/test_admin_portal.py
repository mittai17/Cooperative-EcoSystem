"""Admin portal (/api/v1/admin/*): role gating, paging shape, zero-safe
aggregations, POST validation, settings round-trip, audit rows and CSV export.

Runs against the real app and the scratch Postgres (see conftest.py guard),
using `token_factory` for Clerk-shaped auth with a mocked Clerk backend.
"""
import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.admin_portal import build_insights, percent
from app.main import app

BASE = "/api/v1/admin"

LIST_ENDPOINTS = [
    "/institutions", "/trainers", "/trainees", "/employers", "/programmes", "/skill-passport",
    "/jobs", "/placements", "/assessments", "/certifications", "/users", "/audit-logs",
]
PAGED_KEYS = {"items", "total", "page", "page_size"}
DENIED_ROLES = ["trainee", "trainer", "institution", "employer", "ncct_admin"]


def client():
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


# ---------------------------------------------------------------------------
# Auth and role gating
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_admin_routes_require_a_token():
    async with client() as c:
        for path in ("/dashboard", "/institutions", "/settings", "/reports/enrollment/export"):
            response = await c.get(f"{BASE}{path}")
            assert response.status_code == 401, path


@pytest.mark.asyncio
async def test_non_admin_roles_are_forbidden(token_factory):
    async with client() as c:
        for role in DENIED_ROLES:
            user = await token_factory(c, role)
            for path in ("/dashboard", "/institutions", "/trainers", "/users", "/settings",
                         "/reports/enrollment", "/reports/enrollment/export", "/audit-logs"):
                response = await c.get(f"{BASE}{path}", headers=user["headers"])
                assert response.status_code == 403, f"{role} {path} -> {response.status_code}"
            post = await c.post(f"{BASE}/institutions", headers=user["headers"], json={
                "name": "X", "state": "Delhi"})
            assert post.status_code == 403, role
            patch = await c.patch(f"{BASE}/settings", headers=user["headers"], json={
                "general": {"org_name": "Hacked"}})
            assert patch.status_code == 403, role


# ---------------------------------------------------------------------------
# Paging shape and dashboard
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_every_list_endpoint_returns_paging_shape(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        for path in LIST_ENDPOINTS:
            response = await c.get(f"{BASE}{path}", headers=admin["headers"], params={"page": 1, "page_size": 2})
            assert response.status_code == 200, f"{path}: {response.text}"
            body = response.json()
            assert set(body) == PAGED_KEYS, path
            assert body["page"] == 1 and body["page_size"] == 2, path
            assert len(body["items"]) <= 2, path
            assert isinstance(body["total"], int) and body["total"] >= len(body["items"]), path


@pytest.mark.asyncio
async def test_paging_defaults_and_bounds(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        default = await c.get(f"{BASE}/trainers", headers=admin["headers"])
        assert default.json()["page"] == 1 and default.json()["page_size"] == 10
        too_big = await c.get(f"{BASE}/trainers", headers=admin["headers"], params={"page_size": 101})
        assert too_big.status_code == 422
        zero_page = await c.get(f"{BASE}/trainers", headers=admin["headers"], params={"page": 0})
        assert zero_page.status_code == 422


def test_percent_is_zero_safe():
    assert percent(5, 0) == 0.0
    assert percent(0, 0) == 0.0
    assert percent(1, 4) == 25.0


def test_insights_are_zero_safe_on_empty_data():
    kpis = {"institutions": 0, "trainers": 0, "trainees": 0, "certified": 0, "employers": 0}
    insights = build_insights(kpis, {"applications": 0, "placements": 0, "rate": 0.0}, None)
    texts = " ".join(item["text"] for item in insights)
    assert "No trainees are on record yet." in texts
    assert "No job applications" in texts
    assert "0%" not in texts  # no fabricated rate when there is no denominator


@pytest.mark.asyncio
async def test_dashboard_shape_and_types(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        response = await c.get(f"{BASE}/dashboard", headers=admin["headers"])
    assert response.status_code == 200, response.text
    body = response.json()
    assert set(body) == {"kpis", "enrollment_trend", "institutions_by_state", "program_distribution",
                         "placement_overview", "top_institutions", "recent_activity",
                         "recent_placements", "ai_insights"}
    for key in ("institutions", "trainers", "trainees", "certified", "employers"):
        assert isinstance(body["kpis"][key], int) and body["kpis"][key] >= 0
        assert isinstance(body["kpis"]["deltas"][key], int)
    assert len(body["enrollment_trend"]) == 6 and len(body["placement_overview"]) == 6
    assert body["ai_insights"], "insights always has at least one entry"
    for institution in body["top_institutions"]:
        assert institution["rating"] is None  # no rating source; never invented


# ---------------------------------------------------------------------------
# POST validation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_post_validation_rejects_bad_input(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        h = admin["headers"]
        cases = [
            ("/institutions", {"name": "X", "state": "Delhi", "surprise": 1}),          # extra field
            ("/institutions", {"name": "", "state": "Delhi"}),                           # empty name
            ("/institutions", {"name": "X", "state": "Delhi", "pincode": "12"}),         # bad pincode
            ("/trainers", {"email": "not-an-email", "full_name": "T"}),                  # bad email
            ("/trainers", {"email": "t@example.com", "full_name": "T", "expertise": [""]}),
            ("/jobs", {"title": "Officer", "employer_name": "Acme", "status": "closed"}),  # not allowed
            ("/jobs", {"title": "Officer", "employer_name": "Acme", "openings": 0}),
            ("/assessments", {"title": "Quiz", "passing_score": 101}),
            ("/programmes", {"title": "P", "duration_weeks": 0}),
            ("/users", {"email": "u@example.com", "full_name": "U", "role": "superuser"}),
        ]
        for path, payload in cases:
            response = await c.post(f"{BASE}{path}", headers=h, json=payload)
            assert response.status_code == 422, f"{path} {payload} -> {response.status_code}"


@pytest.mark.asyncio
async def test_patch_user_cannot_demote_self(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        me = admin["id"]
        response = await c.patch(f"{BASE}/users/{me}", headers=admin["headers"], json={"role": "trainee"})
        assert response.status_code == 409


# ---------------------------------------------------------------------------
# Mutations: audit rows, settings round-trip, CSV export
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_institution_create_writes_audit_row(token_factory):
    name = f"Audit Test Institute {uuid.uuid4().hex[:8]}"
    async with client() as c:
        admin = await token_factory(c, "admin")
        created = await c.post(f"{BASE}/institutions", headers=admin["headers"],
                               json={"name": name, "state": "Karnataka"})
        assert created.status_code == 201, created.text
        institution_id = created.json()["id"]
        assert created.json()["status"] == "active"

        logs = await c.get(f"{BASE}/audit-logs", headers=admin["headers"],
                           params={"q": institution_id, "page_size": 10})
        assert logs.status_code == 200
        matches = [row for row in logs.json()["items"] if row["entity_id"] == institution_id]
        assert matches, "audit row written for the mutation"
        assert matches[0]["action"] == "institution.create"
        assert matches[0]["entity"] == "institution"
        assert matches[0]["actor_name"]

        fetched = await c.get(f"{BASE}/institutions/{institution_id}", headers=admin["headers"])
        assert fetched.status_code == 200 and fetched.json()["name"] == name


@pytest.mark.asyncio
async def test_settings_round_trip(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        h = admin["headers"]
        before = (await c.get(f"{BASE}/settings", headers=h)).json()
        assert set(before) == {"general", "appearance", "notifications", "security"}

        marker = f"NCCT Test {uuid.uuid4().hex[:6]}"
        patched = await c.patch(f"{BASE}/settings", headers=h, json={
            "general": {"org_name": marker},
            "appearance": {"accent_color": "#123456", "density": "compact"},
            "security": {"session_timeout_minutes": 30},
        })
        assert patched.status_code == 200, patched.text
        again = (await c.get(f"{BASE}/settings", headers=h)).json()
        assert again["general"]["org_name"] == marker
        assert again["appearance"]["accent_color"] == "#123456"
        assert again["security"]["session_timeout_minutes"] == 30
        assert again["notifications"] == before["notifications"]  # untouched section unchanged

        restored = await c.patch(f"{BASE}/settings", headers=h, json={
            "general": {"org_name": before["general"]["org_name"]},
            "appearance": {"accent_color": before["appearance"]["accent_color"],
                           "density": before["appearance"]["density"]},
            "security": {"session_timeout_minutes": before["security"]["session_timeout_minutes"]},
        })
        assert restored.status_code == 200


@pytest.mark.asyncio
async def test_settings_reject_unknown_fields_and_empty_patch(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        h = admin["headers"]
        unknown = await c.patch(f"{BASE}/settings", headers=h, json={"general": {"is_superuser": True}})
        assert unknown.status_code == 422
        empty = await c.patch(f"{BASE}/settings", headers=h, json={})
        assert empty.status_code == 422
        bad_colour = await c.patch(f"{BASE}/settings", headers=h, json={"appearance": {"accent_color": "red"}})
        assert bad_colour.status_code == 422


@pytest.mark.asyncio
async def test_csv_export_has_header_row(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        response = await c.get(f"{BASE}/reports/enrollment/export", headers=admin["headers"])
    assert response.status_code == 200, response.text
    assert response.headers["content-type"].startswith("text/csv")
    assert "attachment" in response.headers["content-disposition"]
    header = response.text.splitlines()[0]
    assert header == "Month,New enrollments,Certifications"
    assert len(response.text.splitlines()) == 13  # header + 12 months, zero-filled


@pytest.mark.asyncio
async def test_unknown_report_key_is_rejected(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        response = await c.get(f"{BASE}/reports/payroll", headers=admin["headers"])
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_endpoints_succeed_and_list_back(token_factory):
    """Happy paths for every POST that creates a row, each followed by a list
    lookup so a 500 or a silently dropped write both fail the test."""
    tag = uuid.uuid4().hex[:8]
    async with client() as c:
        admin = await token_factory(c, "admin")
        h = admin["headers"]

        trainer = await c.post(f"{BASE}/trainers", headers=h, json={
            "email": f"trainer-{tag}@example.com", "full_name": f"Trainer {tag}",
            "state": "Kerala", "qualification": "Diploma", "expertise": ["Accounts"]})
        assert trainer.status_code == 201, trainer.text
        found = await c.get(f"{BASE}/trainers", headers=h, params={"q": tag})
        assert any(row["email"] == f"trainer-{tag}@example.com" for row in found.json()["items"])

        trainee = await c.post(f"{BASE}/trainees", headers=h, json={
            "email": f"trainee-{tag}@example.com", "full_name": f"Trainee {tag}"})
        assert trainee.status_code == 201, trainee.text
        duplicate = await c.post(f"{BASE}/trainees", headers=h, json={
            "email": f"trainee-{tag}@example.com", "full_name": f"Trainee {tag}"})
        assert duplicate.status_code == 409

        programme = await c.post(f"{BASE}/programmes", headers=h, json={
            "title": f"Programme {tag}", "sector": "Cooperative", "seats_total": 30})
        assert programme.status_code == 201, programme.text
        listed = await c.get(f"{BASE}/programmes", headers=h, params={"q": tag})
        assert listed.json()["items"][0]["seats_total"] == 30

        enrolled = await c.post(f"{BASE}/trainees", headers=h, json={
            "email": f"enrolled-{tag}@example.com", "full_name": f"Enrolled {tag}",
            "programme_id": programme.json()["id"]})
        assert enrolled.status_code == 201, enrolled.text
        by_program = await c.get(f"{BASE}/trainees", headers=h, params={"program": programme.json()["id"]})
        assert [row["email"] for row in by_program.json()["items"]] == [f"enrolled-{tag}@example.com"]

        job = await c.post(f"{BASE}/jobs", headers=h, json={
            "title": f"Officer {tag}", "employer_name": f"Employer {tag}", "skills_required": ["Accounting"]})
        assert job.status_code == 201, job.text
        assert job.json()["source"] == "employer" and job.json()["status"] == "open"

        assessment = await c.post(f"{BASE}/assessments", headers=h, json={
            "title": f"Quiz {tag}", "programme_id": programme.json()["id"], "passing_score": 70})
        assert assessment.status_code == 201, assessment.text

        bogus = await c.post(f"{BASE}/assessments", headers=h, json={
            "title": "Quiz", "course_id": str(uuid.uuid4())})
        assert bogus.status_code == 422

        user = await c.post(f"{BASE}/users", headers=h, json={
            "email": f"staff-{tag}@example.com", "full_name": f"Staff {tag}", "role": "employer"})
        assert user.status_code == 201, user.text
        deactivated = await c.patch(f"{BASE}/users/{user.json()['id']}", headers=h, json={"is_active": False})
        assert deactivated.status_code == 200 and deactivated.json()["status"] == "inactive"

        missing = await c.patch(f"{BASE}/users/{uuid.uuid4()}", headers=h, json={"is_active": False})
        assert missing.status_code == 404
        empty_patch = await c.patch(f"{BASE}/users/{user.json()['id']}", headers=h, json={})
        assert empty_patch.status_code == 422


@pytest.mark.asyncio
async def test_dashboard_is_zero_safe_on_an_empty_database():
    """Every query returns no rows and zero counts, as on a brand-new database.
    The dashboard must still answer 200 with zeros, empty lists and no nulls
    where a number is expected."""
    from types import SimpleNamespace
    from unittest.mock import MagicMock, AsyncMock
    from app.database import get_db
    from app.deps import require_user

    empty = MagicMock()
    empty.scalar_one.return_value = 0
    empty.scalar_one_or_none.return_value = None
    empty.all.return_value = []
    empty.first.return_value = None
    empty.scalars.return_value.all.return_value = []
    db = AsyncMock()
    db.execute.return_value = empty

    admin = SimpleNamespace(id=uuid.uuid4(), role="admin", is_active=True, organisation_id=None)
    app.dependency_overrides[get_db] = lambda: db
    app.dependency_overrides[require_user] = lambda: admin
    try:
        async with client() as c:
            response = await c.get(f"{BASE}/dashboard")
    finally:
        app.dependency_overrides.pop(get_db, None)
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["kpis"]["institutions"] == 0 and body["kpis"]["trainees"] == 0
    assert body["kpis"]["deltas"]["trainees"] == 0
    assert body["program_distribution"] == []
    assert body["institutions_by_state"] == []
    assert body["top_institutions"] == [] and body["recent_activity"] == []
    assert body["recent_placements"] == []
    assert all(row["placements"] == 0 and row["rate"] == 0.0 for row in body["placement_overview"])
    assert len(body["enrollment_trend"]) == 6
    assert body["ai_insights"][0]["text"] == "No trainees are on record yet."


@pytest.mark.asyncio
async def test_trainers_subject_filter_matches_expertise(token_factory):
    tag = uuid.uuid4().hex[:8]
    async with client() as c:
        admin = await token_factory(c, "admin")
        h = admin["headers"]
        match = await c.post(f"{BASE}/trainers", headers=h, json={
            "email": f"subj-{tag}@example.com", "full_name": f"Subject {tag}", "expertise": ["Dairy Science"]})
        assert match.status_code == 201, match.text
        other = await c.post(f"{BASE}/trainers", headers=h, json={
            "email": f"subj2-{tag}@example.com", "full_name": f"Other {tag}", "expertise": ["Accounts"]})
        assert other.status_code == 201, other.text

        found = await c.get(f"{BASE}/trainers", headers=h, params={"subject": "dairy", "q": tag})
        assert found.status_code == 200
        emails = [row["email"] for row in found.json()["items"]]
        assert emails == [f"subj-{tag}@example.com"]
        assert set(found.json()) == PAGED_KEYS

        too_long = await c.get(f"{BASE}/trainers", headers=h, params={"subject": "x" * 101})
        assert too_long.status_code == 422


@pytest.mark.asyncio
async def test_create_user_rejects_password_and_unknown_fields(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        h = admin["headers"]
        with_password = await c.post(f"{BASE}/users", headers=h, json={
            "email": f"pw-{uuid.uuid4().hex[:6]}@example.com", "full_name": "Pw", "role": "trainer",
            "password": "hunter2hunter2"})
        assert with_password.status_code == 422
        unknown = await c.post(f"{BASE}/users", headers=h, json={
            "email": f"unk-{uuid.uuid4().hex[:6]}@example.com", "full_name": "Unk", "role": "trainer",
            "is_superuser": True})
        assert unknown.status_code == 422


@pytest.mark.asyncio
async def test_users_list_exposes_nullable_last_active(token_factory):
    async with client() as c:
        admin = await token_factory(c, "admin")
        response = await c.get(f"{BASE}/users", headers=admin["headers"], params={"page_size": 100})
    assert response.status_code == 200, response.text
    items = response.json()["items"]
    assert items, "fixture users exist"
    assert all("last_active" in row for row in items)
    assert all(row["last_active"] is None or isinstance(row["last_active"], str) for row in items)
