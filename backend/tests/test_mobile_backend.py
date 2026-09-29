"""Mobile backend: seed idempotency, demo-login guard rails (mocked Clerk
HTTP), token-derived identity and the mobile-shaped endpoints.

Isolation: these tests never touch the real demo accounts. They monkeypatch
the DEMO_ACCOUNTS allowlist to per-run unique emails, seed under fake
`user_test_*` Clerk ids, mock Clerk's HTTP API and JWT verification, and
delete every row attached to the users they created on teardown (so the suite
is safe to run against a shared database). Shared reference rows (courses,
programme, jobs...) are natural-keyed and identical to what the real seed
creates.
"""
import json
import uuid
from dataclasses import replace
from unittest.mock import AsyncMock, patch

import httpx
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select, text

from app import demo_users, seed_mobile
from app.config import get_settings
from app.database import AsyncSessionLocal
from app.main import app
from app.models.user import User
from app.services.ratelimit import demo_login_limiter

pytestmark = pytest.mark.asyncio(loop_scope="module")

RUN = uuid.uuid4().hex[:8]
CLERK_IDS = {
    role: f"user_test_{RUN}_{role}"
    for role in ["trainee", "trainer", "institution", "employer", "admin"]
}


def _tok(clerk_id: str) -> dict:
    return {"Authorization": f"Bearer tok:{clerk_id}"}


async def _fake_verify(token: str):
    if not token.startswith("tok:"):
        from app.services.clerk import TokenVerificationError
        raise TokenVerificationError("bad token")
    return {"sub": token[4:]}


@pytest.fixture(autouse=True)
def _mock_jwt_and_reset_limiter():
    demo_login_limiter.reset()
    with patch("app.deps.verify_session_token", side_effect=_fake_verify):
        yield
    demo_login_limiter.reset()


CLEAN_BY_TRAINEE = [
    "offline_downloads", "career_chat_messages", "module_progress", "job_matches", "applications",
    "attendance_records", "certificates", "trainee_skills", "course_enrollments", "enrollments",
    "nominations", "assessment_results", "skill_gaps",
]


async def _purge_user(db, user_id):
    for t in CLEAN_BY_TRAINEE:
        col = "applicant_id" if t == "applications" else "trainee_id"
        await db.execute(text(f"delete from {t} where {col} = :u"), {"u": user_id})
    await db.execute(text("delete from career_plans where trainee_id = :u"), {"u": user_id})  # steps/recs cascade
    await db.execute(text("delete from users where id = :u"), {"u": user_id})


@pytest_asyncio.fixture(scope="module", loop_scope="module")
async def demo_env():
    """Seed the mobile demo dataset under unique, test-only demo accounts."""
    accounts = {
        role: replace(a, email=f"demo.{role}.{RUN}@coopsetu.demo", external_id=f"test-{RUN}-{role}")
        for role, a in demo_users.DEMO_ACCOUNTS.items()
    }
    originals = dict(demo_users.DEMO_ACCOUNTS)
    demo_users.DEMO_ACCOUNTS.clear()
    demo_users.DEMO_ACCOUNTS.update(accounts)
    # Certificate codes are globally unique public ids: suffix them so this
    # run cannot collide with (or touch) the real demo trainee's certificates.
    original_certs = seed_mobile.CERTIFICATES
    seed_mobile.CERTIFICATES = [dict(c, code=f"{c['code']}-{RUN}") for c in original_certs]
    try:
        async with AsyncSessionLocal() as db:
            stats = await seed_mobile.seed_mobile_data(db, dict(CLERK_IDS))
        yield {"accounts": accounts, "first_stats": stats}
    finally:
        seed_mobile.CERTIFICATES = original_certs
        demo_users.DEMO_ACCOUNTS.clear()
        demo_users.DEMO_ACCOUNTS.update(originals)
        async with AsyncSessionLocal() as db:
            ids = (await db.execute(select(User.id).where(User.email.like(f"%{RUN}%")))).scalars().all()
            for uid in ids:
                await _purge_user(db, uid)
            await db.commit()


@pytest_asyncio.fixture(loop_scope="module")
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(loop_scope="module")
async def fresh_trainee(client):
    """A brand-new trainee (for tests that write), removed afterwards."""
    clerk_id = f"user_test_{uuid.uuid4().hex[:10]}"
    from tests.helpers import sync_fixture
    data = await sync_fixture(client, clerk_id=clerk_id,
        email=f"fresh.{uuid.uuid4().hex[:8]}.{RUN}@coopsetu.demo", full_name="Fresh Trainee")
    yield {"id": data["id"], "clerk_id": clerk_id, "headers": _tok(clerk_id)}
    async with AsyncSessionLocal() as db:
        await _purge_user(db, uuid.UUID(data["id"]))
        await db.commit()


def _clerk_mock(handler):
    real = httpx.AsyncClient

    def factory(*a, **kw):
        kw["transport"] = httpx.MockTransport(handler)
        return real(*a, **kw)

    return patch("app.services.clerk.httpx.AsyncClient", side_effect=factory)


@pytest.fixture
def demo_enabled():
    s = get_settings()
    with patch.object(s, "demo_login_enabled", True), patch.object(s, "demo_login_rate_limit_per_minute", 3):
        yield s


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------
async def test_seed_is_idempotent(demo_env):
    async with AsyncSessionLocal() as db:
        before = await seed_mobile.table_counts(db)
        stats = await seed_mobile.seed_mobile_data(db, dict(CLERK_IDS))
        after = await seed_mobile.table_counts(db)
    assert sum(stats.values()) == 0, stats
    assert before == after
    # Whatever this run inserted, the first pass created the trainee's data.
    assert demo_env["first_stats"].get("users", 0) in (0, 2, 5)


async def test_seed_attaches_data_to_demo_trainee(demo_env):
    email = demo_env["accounts"]["trainee"].email
    async with AsyncSessionLocal() as db:
        uid = (await db.execute(select(User.id).where(User.email == email))).scalar_one()
        def q(sql):
            return db.execute(text(sql), {"u": uid})
        assert (await q("select count(*) from course_enrollments where trainee_id=:u")).scalar() == 3
        assert (await q("select count(*) from trainee_skills where trainee_id=:u")).scalar() == 5
        assert (await q("select count(*) from certificates where trainee_id=:u")).scalar() == 2
        assert (await q("select count(*) from attendance_records where trainee_id=:u")).scalar() == 4
        assert (await q("select count(*) from applications where applicant_id=:u")).scalar() == 2
        assert (await q("select count(*) from module_progress where trainee_id=:u")).scalar() == 5


# ---------------------------------------------------------------------------
# Demo login guard rails (Clerk HTTP mocked)
# ---------------------------------------------------------------------------
async def test_demo_login_disabled_flag_returns_404(client, demo_env):
    from app.config import Settings
    # the code default is OFF (independent of any local .env)
    assert Settings.model_fields["demo_login_enabled"].default is False
    calls = []
    with patch.object(get_settings(), "demo_login_enabled", False), \
            _clerk_mock(lambda r: calls.append(r) or httpx.Response(200, json={})):
        r = await client.post("/api/v1/auth/demo-login", json={"role": "trainee"})
        accounts = (await client.get("/api/v1/auth/demo-accounts")).json()
    assert r.status_code == 404
    assert calls == []
    assert accounts == {"enabled": False, "accounts": []}


@pytest.mark.parametrize("role", ["unknown_role", "hacker", "superadmin", "ncct_admin", "", "TRAINEE"])
async def test_demo_login_rejects_non_allowlisted_roles(client, demo_env, demo_enabled, role):
    calls = []
    with _clerk_mock(lambda r: calls.append(r) or httpx.Response(200, json={"token": "x"})):
        r = await client.post("/api/v1/auth/demo-login", json={"role": role})
    assert r.status_code == 403
    assert calls == []  # never reaches Clerk


async def test_demo_login_issues_ticket_for_allowlisted_user(client, demo_env, demo_enabled):
    seen = {}

    def handler(request: httpx.Request):
        seen["url"] = str(request.url)
        seen["body"] = json.loads(request.content)
        seen["auth"] = request.headers.get("authorization", "")
        return httpx.Response(200, json={"object": "sign_in_token", "token": "sit_test_ticket", "user_id": seen["body"]["user_id"]})

    with _clerk_mock(handler):
        r = await client.post("/api/v1/auth/demo-login", json={"role": "trainee"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["ticket"] == "sit_test_ticket"
    assert body["expires_in"] == 300
    assert body["user"]["role"] == "trainee"
    assert body["user"]["email"] == demo_env["accounts"]["trainee"].email
    assert body["user"]["full_name"] == "Ravindra Suresh Patil"
    assert seen["url"] == "https://api.clerk.com/v1/sign_in_tokens"
    assert seen["body"] == {"user_id": CLERK_IDS["trainee"], "expires_in_seconds": 300}
    assert seen["auth"].startswith("Bearer ")

    with _clerk_mock(handler):
        r2 = await client.post("/api/v1/auth/demo-login", json={"role": "trainer"})
    assert r2.status_code == 200 and r2.json()["user"]["role"] == "trainer"
    assert seen["body"]["user_id"] == CLERK_IDS["trainer"]

    listing = (await client.get("/api/v1/auth/demo-accounts")).json()
    assert listing["enabled"] is True
    assert {a["role"] for a in listing["accounts"]} == {"trainee", "trainer", "institution", "employer", "admin"}


async def test_demo_login_rate_limited_per_ip(client, demo_env, demo_enabled):
    handler = lambda r: httpx.Response(200, json={"token": "sit_x"})  # noqa: E731
    with _clerk_mock(handler):
        codes = [(await client.post("/api/v1/auth/demo-login", json={"role": "trainee"})).status_code for _ in range(5)]
    assert codes == [200, 200, 200, 429, 429]


async def test_demo_login_clerk_failure_is_502_and_hides_details(client, demo_env, demo_enabled):
    with _clerk_mock(lambda r: httpx.Response(401, json={"errors": [{"message": "bad key sk_live_SECRET"}]})):
        r = await client.post("/api/v1/auth/demo-login", json={"role": "trainee"})
    assert r.status_code == 502
    assert "sk_" not in r.text


async def test_demo_login_unprovisioned_user_is_503(client, demo_env, demo_enabled):
    async with AsyncSessionLocal() as db:
        await db.execute(text("update users set clerk_user_id = :c where email = :e"),
                         {"c": f"demo_local_x_{RUN}", "e": demo_env["accounts"]["trainee"].email})
        await db.commit()
    try:
        with _clerk_mock(lambda r: httpx.Response(200, json={"token": "x"})):
            r = await client.post("/api/v1/auth/demo-login", json={"role": "trainee"})
        assert r.status_code == 503
    finally:
        async with AsyncSessionLocal() as db:
            await db.execute(text("update users set clerk_user_id = :c where email = :e"),
                             {"c": CLERK_IDS["trainee"], "e": demo_env["accounts"]["trainee"].email})
            await db.commit()


# ---------------------------------------------------------------------------
# Identity + mobile shapes (demo trainee, read-only)
# ---------------------------------------------------------------------------
async def test_auth_me_returns_local_id_and_trainee_profile(client, demo_env):
    r = await client.get("/api/v1/auth/me", headers=_tok(CLERK_IDS["trainee"]))
    assert r.status_code == 200
    me = r.json()
    uuid.UUID(me["id"])
    assert me["role"] == "trainee" and me["synced"] is True
    t = me["trainee"]
    assert t["id"] == me["id"]
    assert t["name"] == "Ravindra Suresh Patil"
    assert t["email"] == demo_env["accounts"]["trainee"].email
    assert t["role"] == "Trainee"
    assert t["enrolled_institution"] == demo_users.VAMNICOM_ORG_NAME
    assert t["programme"] == seed_mobile.DEMO_PROGRAMME_TITLE
    assert t["avatar_initials"] == "RP"
    trainer = (await client.get("/api/v1/auth/me", headers=_tok(CLERK_IDS["trainer"]))).json()
    assert trainer["role"] == "trainer" and trainer["trainee"] is None


async def test_mobile_courses_shape_and_progress(client, demo_env):
    r = await client.get("/api/v1/mobile/courses", headers=_tok(CLERK_IDS["trainee"]))
    assert r.status_code == 200
    courses = {c["title"]: c for c in r.json()["courses"]}
    coop = courses["Cooperative Management Fundamentals"]
    for key in ("id", "title", "category", "level", "duration_hours", "instructor", "rating", "enrolled", "skills", "progress", "modules"):
        assert key in coop
    assert coop["progress"] == 75
    assert [m["completed"] for m in coop["modules"]] == [True, True, True, False, False]
    assert coop["modules"][0]["duration"] == "18 min"
    assert coop["modules"][0]["title"].startswith("1. Introduction")
    assert coop["modules"][0]["summary"]
    assert courses["Rural Development Fundamentals"]["progress"] == 0
    assert courses["Dairy Cooperative Operations"]["progress"] == 100
    # enrolled courses first
    titles = [c["title"] for c in r.json()["courses"]]
    assert set(titles[:3]) == {"Cooperative Management Fundamentals", "Data Analytics for Cooperatives", "Dairy Cooperative Operations"}
    # anonymous: catalog without personal progress
    anon = (await client.get("/api/v1/mobile/courses")).json()["courses"]
    assert all(c["progress"] == 0 for c in anon)


async def test_mobile_jobs_have_match_percentages_sorted(client, demo_env):
    r = await client.get("/api/v1/mobile/jobs", headers=_tok(CLERK_IDS["trainee"]))
    assert r.status_code == 200
    jobs = r.json()["jobs"]
    ncdc = "National Cooperative Development Corporation (NCDC)"
    by = {(j["title"], j["employer"]): j for j in jobs}
    dairy = by[("Dairy Procurement Supervisor", "Amul Dairy Cooperative Union")]
    assert dairy["match_percentage"] == 92
    assert dairy["applied"] is True and dairy["openings"] == 5 and isinstance(dairy["posted_days_ago"], int)
    for key in ("id", "title", "employer", "location", "sector", "type", "salary", "skills_required"):
        assert key in dairy
    assert by[("Cooperative Development Officer", ncdc)]["match_percentage"] == 85
    assert by[("Credit Officer - Cooperative Bank", "Maharashtra State Cooperative Bank")]["match_percentage"] == 78
    assert by[("Agri-Marketing Specialist", "Rajasthan Cooperative Marketing Federation")]["match_percentage"] == 64
    # best match first; jobs with no required skills (no percentage) sort last
    pcts = [j.get("match_percentage", -1) for j in jobs]
    assert pcts == sorted(pcts, reverse=True)
    anon = (await client.get("/api/v1/mobile/jobs")).json()["jobs"]
    assert all("match_percentage" not in j for j in anon)


async def test_skill_passport_uses_token_identity(client, demo_env):
    r = await client.get("/api/v1/skills/my-passport", headers=_tok(CLERK_IDS["trainee"]))
    data = r.json()
    assert data["summary"] == {"total_skills": 5, "verified_count": 3, "avg_confidence": 72.0}
    cm = next(s for s in data["skills"] if s["name"] == "Cooperative Management")
    assert cm["level"] == "Proficient" and cm["confidence"] == 92 and cm["verified"] is True
    assert cm["category"] == "Management"
    assert [e["type"] for e in cm["evidence"]] == ["Course", "Institutional Assessment"]
    assert cm["evidence"][0] == {"type": "Course", "title": "Cooperative Management Fundamentals", "date": "2026-08-15"}


async def test_certificates_token_wins_over_explicit_trainee_id(client, demo_env, fresh_trainee):
    r = await client.get("/api/v1/certificates/my", params={"trainee_id": fresh_trainee["id"]}, headers=_tok(CLERK_IDS["trainee"]))
    certs = r.json()["certificates"]
    assert {c["id"] for c in certs} == {f"CST-2026-DAI-00842-{RUN}", f"CST-2026-MGT-00192-{RUN}"}
    c = next(c for c in certs if c["id"] == f"CST-2026-DAI-00842-{RUN}")
    assert c["holder_name"] == "Ravindra Suresh Patil" and c["grade"] == "A" and c["status"].lower() == "valid"
    assert c["issue_date"] == "2026-07-15" and c["expiry_date"] == "2029-07-15"
    assert c["skills_certified"] == ["Dairy Operations", "Cooperative Management", "Quality Assurance"]
    # explicit id still works without a token (compat)
    r2 = await client.get("/api/v1/certificates/my", params={"trainee_id": fresh_trainee["id"]})
    assert r2.json() == {"certificates": []}


async def test_attendance_history_shape(client, demo_env):
    r = await client.get("/api/v1/attendance/my", headers=_tok(CLERK_IDS["trainee"]))
    data = r.json()
    recs = data["records"]
    assert [x["date"] for x in recs] == ["2026-09-25", "2026-09-24", "2026-09-23", "2026-09-22"]
    assert recs[0] == {"date": "2026-09-25", "session": "Cooperative Management Fundamentals - Batch B",
                       "status": "present", "method": "QR Code Scan", "timestamp": "09:42 AM"}
    assert recs[2]["method"] == "Biometric / QR" and recs[3]["status"] == "late" and recs[3]["method"] == "Manual Entry"
    assert data["overall_percentage"] == 100.0 and data["total_sessions"] == 4 and data["present"] == 4


async def test_career_plan_from_db_and_default_for_anonymous(client, demo_env):
    r = await client.get("/api/v1/career/recommendations", headers=_tok(CLERK_IDS["trainee"]))
    d = r.json()
    assert d["target_role"] == "Cooperative Development Officer" and d["current_match"] == 72
    assert [x["priority"] for x in d["recommendations"]] == [1, 2, 3]
    assert d["recommendations"][2]["type"] == "assessment"
    assert d["recommendations"][0]["impact"] == "+15% match"
    assert [s["status"] for s in d["career_path"]] == ["current", "next", "future", "future"]
    assert d["career_path"][1] == {"step": 2, "title": "Junior Cooperative Officer", "status": "next", "timeline": "3-6 months"}
    anon = await client.get("/api/v1/career/recommendations")
    assert anon.status_code == 401


async def test_offline_packages_list(client, demo_env):
    r = await client.get("/api/v1/mobile/offline/packages", headers=_tok(CLERK_IDS["trainee"]))
    pk = r.json()["packages"]
    by = {p["title"]: p for p in pk}
    coop = by["Cooperative Management Fundamentals"]
    assert coop["lesson_count"] == 5 and coop["version"] == 1 and coop["size_kb"] == 9000
    assert coop["downloaded"] is False and len(coop["course"]["modules"]) == 5


# ---------------------------------------------------------------------------
# Writes (fresh trainee, token identity)
# ---------------------------------------------------------------------------
async def test_writes_require_identity(client, demo_env):
    some_course = (await client.get("/api/v1/mobile/courses")).json()["courses"][0]
    assert (await client.post(f"/api/v1/mobile/offline/packages/{some_course['id']}/download")).status_code == 401
    bad = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer nonsense"})
    assert bad.status_code == 401


async def test_module_progress_and_enroll_idempotent(client, demo_env, fresh_trainee):
    h = fresh_trainee["headers"]
    courses = (await client.get("/api/v1/mobile/courses", headers=h)).json()["courses"]
    coop = next(c for c in courses if c["title"] == "Cooperative Management Fundamentals")
    assert coop["progress"] == 0 and not any(m["completed"] for m in coop["modules"])
    e1 = await client.post(f"/api/v1/courses/{coop['id']}/enroll", headers=h)
    e2 = await client.post(f"/api/v1/courses/{coop['id']}/enroll", headers=h)
    assert e1.json()["enrollment_id"] == e2.json()["enrollment_id"]
    # enroll bumps courses.enrolled_count once; undo it so the suite leaves shared rows untouched
    async with AsyncSessionLocal() as db:
        await db.execute(text("update courses set enrolled_count = enrolled_count - 1 where id = :i"), {"i": uuid.UUID(coop["id"])})
        await db.commit()

    m0, m1 = coop["modules"][0]["id"], coop["modules"][1]["id"]
    r = await client.post(f"/api/v1/mobile/courses/{coop['id']}/modules/{m0}/progress", json={"completed": True}, headers=h)
    assert r.json() == {"course_id": coop["id"], "module_id": m0, "completed": True, "course_progress": 20}
    r = await client.post(f"/api/v1/mobile/courses/{coop['id']}/modules/{m1}/progress", json={"completed": True}, headers=h)
    assert r.json()["course_progress"] == 40
    again = await client.post(f"/api/v1/mobile/courses/{coop['id']}/modules/{m1}/progress", json={"completed": True}, headers=h)
    assert again.json()["course_progress"] == 40
    one = (await client.get(f"/api/v1/mobile/courses/{coop['id']}", headers=h)).json()
    assert one["progress"] == 40 and [m["completed"] for m in one["modules"]][:3] == [True, True, False]
    r = await client.post(f"/api/v1/mobile/courses/{coop['id']}/modules/{m1}/progress", json={"completed": False}, headers=h)
    assert r.json()["course_progress"] == 20
    # a module that is not in that course
    other = next(c for c in courses if c["title"] == "Dairy Cooperative Operations")
    bad = await client.post(f"/api/v1/mobile/courses/{other['id']}/modules/{m0}/progress", json={"completed": True}, headers=h)
    assert bad.status_code == 404


async def test_attendance_scan_derives_trainee_from_token(client, demo_env, fresh_trainee):
    async with AsyncSessionLocal() as db:
        prog_id = (await db.execute(text("select id from programmes where title = :t"), {"t": seed_mobile.DEMO_PROGRAMME_TITLE})).scalar_one()
        token = f"scan-{RUN}-{uuid.uuid4().hex[:6]}"
        sid = uuid.uuid4()
        nomination_id = uuid.uuid4()
        await db.execute(text("insert into nominations (id, trainee_id, programme_id, status) values (:i,:u,:p,'approved')"),
                         {"i": nomination_id, "u": uuid.UUID(fresh_trainee["id"]), "p": prog_id})
        await db.execute(text("insert into attendance_sessions (id, session_name, programme_id, qr_token, valid_minutes, created_at) values (:i,:n,:p,:t,30,now())"),
                         {"i": sid, "n": f"Test session {RUN}", "p": prog_id, "t": token})
        await db.commit()
    try:
        h = fresh_trainee["headers"]
        # prefixed QR payload + no trainee_id in body: identity comes from the token
        r = await client.post("/api/v1/attendance/scan", json={"qr_token": f"coopsetu:attend:{token}"}, headers=h)
        assert r.status_code == 200, r.text
        assert r.json()["trainee_id"] == fresh_trainee["id"]
        dup = await client.post("/api/v1/attendance/scan", json={"qr_token": token}, headers=h)
        assert dup.status_code == 409
        hist = (await client.get("/api/v1/attendance/my", headers=h)).json()
        assert hist["records"][0]["session"] == f"Test session {RUN}" and hist["records"][0]["method"] == "QR Code Scan"
        assert (await client.post("/api/v1/attendance/scan", json={"qr_token": token})).status_code == 422
    finally:
        async with AsyncSessionLocal() as db:
            await db.execute(text("delete from attendance_records where session_id = :i"), {"i": sid})
            await db.execute(text("delete from attendance_sessions where id = :i"), {"i": sid})
            await db.execute(text("delete from nominations where id = :i"), {"i": nomination_id})
            await db.commit()


async def test_job_apply_token_identity_idempotent(client, demo_env, fresh_trainee):
    h = fresh_trainee["headers"]
    jobs = (await client.get("/api/v1/mobile/jobs", headers=h)).json()["jobs"]
    job = next(j for j in jobs if j["title"] == "Agri-Marketing Specialist")
    assert job["applied"] is False
    a1 = await client.post(f"/api/v1/jobs/{job['id']}/apply", headers=h)
    a2 = await client.post(f"/api/v1/jobs/{job['id']}/apply", headers=h)
    assert a1.status_code == 200 and a1.json()["status"] == "applied"
    assert a2.json()["id"] == a1.json()["id"]
    jobs = (await client.get("/api/v1/mobile/jobs", headers=h)).json()["jobs"]
    assert next(j for j in jobs if j["id"] == job["id"])["applied"] is True
    mine = (await client.get("/api/v1/jobs/my-applications", headers=h)).json()["applications"]
    assert len(mine) == 1


async def test_offline_package_download_and_remove(client, demo_env, fresh_trainee):
    h = fresh_trainee["headers"]
    pk = (await client.get("/api/v1/mobile/offline/packages", headers=h)).json()["packages"][0]
    cid = pk["course_id"]
    d = await client.post(f"/api/v1/mobile/offline/packages/{cid}/download", headers=h)
    assert d.status_code == 200 and d.json()["downloaded"] is True and d.json()["course"]["modules"]
    d2 = await client.post(f"/api/v1/mobile/offline/packages/{cid}/download", headers=h)
    assert d2.json()["downloaded_at"] == d.json()["downloaded_at"]
    listed = (await client.get("/api/v1/mobile/offline/packages", headers=h)).json()["packages"]
    assert next(p for p in listed if p["course_id"] == cid)["downloaded"] is True
    assert (await client.delete(f"/api/v1/mobile/offline/packages/{cid}", headers=h)).json()["removed"] is True
    assert (await client.delete(f"/api/v1/mobile/offline/packages/{cid}", headers=h)).json()["removed"] is False
    assert (await client.post("/api/v1/mobile/offline/packages/not-a-uuid/download", headers=h)).status_code == 404


async def test_offline_sync_persists_lesson_completion_for_token_user(client, demo_env, fresh_trainee):
    h = fresh_trainee["headers"]
    courses = (await client.get("/api/v1/mobile/courses", headers=h)).json()["courses"]
    coop = next(c for c in courses if c["title"] == "Cooperative Management Fundamentals")
    body = {"items": [
        {"id": "s1", "action": "MARK_LESSON_COMPLETE", "payload": {"course_id": coop["id"], "lesson_id": coop["modules"][0]["id"]}},
        {"id": "s2", "action": "MARK_LESSON_COMPLETE", "payload": {"course_id": "x", "lesson_id": "not-a-uuid"}},
    ]}
    r = await client.post("/api/v1/offline-sync/batch", json=body, headers=h)
    assert [x["status"] for x in r.json()["results"]] == ["success", "rejected"]
    one = (await client.get(f"/api/v1/mobile/courses/{coop['id']}", headers=h)).json()
    assert one["modules"][0]["completed"] is True and one["progress"] == 20


async def test_career_chat_persists_history_with_actions(client, demo_env, fresh_trainee):
    h = fresh_trainee["headers"]
    with patch("app.api.v1.career.generate_career_response", new=AsyncMock(return_value=None)):
        r = await client.post("/api/v1/career/chat", json={"message": "Which job should I target?"}, headers=h)
    assert r.status_code == 200
    d = r.json()
    assert d["source"] == "deterministic_fallback" and d["response"]
    assert d["message"]["sender"] == "ai" and d["message"]["text"] == d["response"]
    assert {a["actionKey"] for a in d["message"]["suggested_actions"]} == {"view_skill_gap", "browse_courses", "see_job_matches"}
    hist = (await client.get("/api/v1/career/chat/history", headers=h)).json()["messages"]
    assert [m["sender"] for m in hist] == ["user", "ai"]
    assert hist[0]["text"] == "Which job should I target?"
    assert (await client.get("/api/v1/career/chat/history")).status_code == 401


# ---------------------------------------------------------------------------
# /auth/provision (real-identity onboarding for new Clerk sign-ups)
# ---------------------------------------------------------------------------
async def test_provision_creates_local_row_from_clerk_profile(client, demo_env):
    clerk_id = f"user_test_prov_{RUN}"
    email = f"prov.{RUN}@coopsetu.demo"
    profile = {"id": clerk_id, "first_name": "Asha", "last_name": "Kale", "primary_email_address_id": "idn_1",
               "email_addresses": [{"id": "idn_1", "email_address": email}], "public_metadata": {"role": "not-a-role"}}
    with patch("app.services.clerk.get_clerk_user", new=AsyncMock(return_value=profile)):
        r = await client.post("/api/v1/auth/provision", headers=_tok(clerk_id))
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["role"] == "trainee"  # unknown metadata role never escalates
        assert body["email"] == email and body["trainee"]["avatar_initials"] == "AK"
        again = await client.post("/api/v1/auth/provision", headers=_tok(clerk_id))
        assert again.json()["id"] == body["id"]
    me = await client.get("/api/v1/auth/me", headers=_tok(clerk_id))
    assert me.json()["synced"] is True
    async with AsyncSessionLocal() as db:
        await _purge_user(db, uuid.UUID(body["id"]))
        await db.commit()
    assert (await client.post("/api/v1/auth/provision")).status_code == 401
