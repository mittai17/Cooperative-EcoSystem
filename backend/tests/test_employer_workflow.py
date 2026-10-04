"""Employer workflow API: auth, org isolation, team roles, interview/offer
transitions, human-only evaluation decisions, report preview and CSV export,
settings, and aggregate privacy. Runs against the scratch Postgres via
`python scripts/scratch_backend.py pytest`."""
import csv
import io
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select

from app.database import AsyncSessionLocal
from app.main import app
from app.models.analytics import SkillDemand
from app.models.employer_workflow import (
    EmployerFeedbackRatings, EmployerOrgProfile, EmployerTeamMember, EmployerUserPreferences,
    Interview, Offer, TalentPoolEntry,
)
from app.models.job import Application, EmployerFeedback, Job, JobMatch
from app.models.notification import Notification
from app.models.profile import UserProfile
from app.models.user import Organisation, User

BASE = "/api/v1/employer"
READ_ENDPOINTS = ["/dashboard", "/interviews", "/offers", "/talent-pool", "/feedback",
                  "/feedback/aggregate", "/analytics", "/reports", "/reports/recruitment",
                  "/company", "/team", "/settings"]
# Rows created by these tests are purged at teardown so the shared scratch DB
# stays small and other suites (e.g. candidate/job listings) see only their own data.
LEDGER: dict[str, set] = {"orgs": set(), "jobs": set(), "users": set()}
TEST_SKILLS = ("Zq Gap Skill",)
RATINGS = {"technical_skills": 4, "communication": 5, "problem_solving": 4,
           "domain_knowledge": 3, "digital_skills": 4, "work_readiness": 5}


@pytest.fixture(autouse=True)
async def _purge_created_rows():
    LEDGER["orgs"].clear()
    LEDGER["jobs"].clear()
    LEDGER["users"].clear()
    yield
    await _purge(LEDGER["orgs"], LEDGER["jobs"], LEDGER["users"])


async def _purge(orgs: set, jobs: set, users: set) -> None:
    """Delete in dependency order. Only ids recorded in LEDGER are touched."""
    if not (orgs or jobs or users):
        return
    job_ids, org_ids, user_ids = list(jobs), list(orgs), list(users)
    async with AsyncSessionLocal() as session:
        feedback_ids = select(EmployerFeedback.id).where(EmployerFeedback.job_id.in_(job_ids))
        await session.execute(delete(EmployerFeedbackRatings).where(EmployerFeedbackRatings.feedback_id.in_(feedback_ids)))
        await session.execute(delete(EmployerFeedback).where(EmployerFeedback.job_id.in_(job_ids)))
        await session.execute(delete(Interview).where(Interview.job_id.in_(job_ids)))
        await session.execute(delete(Offer).where(Offer.job_id.in_(job_ids)))
        await session.execute(delete(Application).where(Application.job_id.in_(job_ids)))
        await session.execute(delete(JobMatch).where(JobMatch.job_id.in_(job_ids)))
        await session.execute(delete(Job).where(Job.id.in_(job_ids)))
        await session.execute(delete(TalentPoolEntry).where(TalentPoolEntry.organisation_id.in_(org_ids)))
        await session.execute(delete(EmployerTeamMember).where(EmployerTeamMember.organisation_id.in_(org_ids)))
        await session.execute(delete(EmployerOrgProfile).where(EmployerOrgProfile.organisation_id.in_(org_ids)))
        await session.execute(delete(Notification).where(Notification.user_id.in_(user_ids)))
        await session.execute(delete(EmployerUserPreferences).where(EmployerUserPreferences.user_id.in_(user_ids)))
        await session.execute(delete(UserProfile).where(UserProfile.user_id.in_(user_ids)))
        await session.execute(delete(SkillDemand).where(SkillDemand.skill_name.in_(TEST_SKILLS)))
        await session.execute(delete(User).where(User.id.in_(user_ids)))
        await session.execute(delete(Organisation).where(Organisation.id.in_(org_ids)))
        await session.commit()


def _future(days=2) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).replace(microsecond=0).isoformat()


def _offer_body(application_id, status="draft", **overrides):
    body = {"application_id": str(application_id), "salary": 450000, "employment_type": "full_time",
            "joining_date": (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat(),
            "location": "Anand", "benefits": "Health cover", "status": status}
    body.update(overrides)
    return body


async def _org(name: str) -> uuid.UUID:
    async with AsyncSessionLocal() as session:
        org = Organisation(id=uuid.uuid4(), name=name, type="Employer", state="Gujarat", is_active=True)
        session.add(org)
        await session.commit()
        LEDGER["orgs"].add(org.id)
        return org.id


async def _employer(client, token_factory, org_id):
    created = await token_factory(client, "employer")
    async with AsyncSessionLocal() as session:
        user = (await session.execute(select(User).where(User.clerk_user_id == created["clerk_user_id"]))).scalar_one()
        user.organisation_id = org_id
        await session.commit()
        LEDGER["users"].add(user.id)
        return {"id": user.id, "email": user.email, "headers": created["headers"]}


async def _trainee(client, token_factory):
    created = await token_factory(client, "trainee")
    async with AsyncSessionLocal() as session:
        user = (await session.execute(select(User).where(User.clerk_user_id == created["clerk_user_id"]))).scalar_one()
        LEDGER["users"].add(user.id)
        return {"id": user.id, "headers": created["headers"]}


async def _job(org_id, title="Credit Officer", source="employer", status="open") -> uuid.UUID:
    async with AsyncSessionLocal() as session:
        job = Job(id=uuid.uuid4(), title=title, employer_name="Org", location="Anand, Gujarat",
                  organisation_id=org_id, source=source, status=status, openings=2,
                  posted_at=datetime.now(timezone.utc), skills_required=["Credit Appraisal", "Data Analysis"])
        session.add(job)
        await session.commit()
        LEDGER["jobs"].add(job.id)
        return job.id


async def _application(job_id, trainee_id, status="shortlisted") -> uuid.UUID:
    async with AsyncSessionLocal() as session:
        now = datetime.now(timezone.utc)
        app_row = Application(id=uuid.uuid4(), job_id=job_id, applicant_id=trainee_id, status=status,
                              applied_at=now - timedelta(days=10), updated_at=now)
        session.add(app_row)
        await session.commit()
        return app_row.id


async def _application_status(application_id) -> str:
    async with AsyncSessionLocal() as session:
        return (await session.get(Application, application_id)).status


async def _email(user_id) -> str:
    async with AsyncSessionLocal() as session:
        return (await session.get(User, user_id)).email


async def _add_team_row(org_id, user_id, role):
    async with AsyncSessionLocal() as session:
        session.add(EmployerTeamMember(id=uuid.uuid4(), organisation_id=org_id, user_id=user_id, team_role=role))
        await session.commit()


async def _notification_kinds(user_id) -> list[str]:
    async with AsyncSessionLocal() as session:
        return (await session.execute(select(Notification.kind).where(
            Notification.user_id == user_id))).scalars().all()


async def _new_interview(client, headers, application_id):
    response = await client.post(f"{BASE}/interviews", headers=headers, json={
        "application_id": str(application_id), "scheduled_at": _future(), "mode": "online",
        "meeting_link": "https://meet.example.com/abc", "interviewer_name": "Panel"})
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.asyncio
async def test_employer_endpoints_require_authentication(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        for path in READ_ENDPOINTS:
            response = await client.get(f"{BASE}{path}")
            assert response.status_code == 401, path


@pytest.mark.asyncio
async def test_trainee_is_denied_every_employer_endpoint(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        trainee = await _trainee(client, token_factory)
        for path in READ_ENDPOINTS:
            response = await client.get(f"{BASE}{path}", headers=trainee["headers"])
            assert response.status_code == 403, path
        response = await client.post(f"{BASE}/team", headers=trainee["headers"],
                                     json={"email": "x@example.com", "role": "recruiter"})
        assert response.status_code == 403
        response = await client.patch(f"{BASE}/settings", headers=trainee["headers"],
                                      json={"notifications": {"job_deadline": False}})
        assert response.status_code == 403


@pytest.mark.asyncio
async def test_dashboard_and_analytics_are_zero_safe_for_an_empty_org(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Empty {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        dashboard = await client.get(f"{BASE}/dashboard", headers=employer["headers"])
        assert dashboard.status_code == 200, dashboard.text
        body = dashboard.json()
        assert set(body) == {"viewer_name", "organisation_name", "kpis", "today", "funnel", "skill_match",
                             "top_candidates", "recent_applications", "candidate_sources", "hiring_timeline",
                             "upcoming_interviews", "feedback"}
        assert set(body["kpis"]) == {"active_jobs", "applications", "shortlisted", "interviews", "offers", "hired"}
        assert all(kpi["value"] == 0 and kpi["delta"] == 0 and kpi["period"] == "Last 6 months"
                   for kpi in body["kpis"].values())
        assert [stage["key"] for stage in body["funnel"]] == ["applied", "screened", "shortlisted", "interview", "offered", "hired"]
        assert all(stage["count"] == 0 and stage["percent"] == 0.0 and stage["conversion"] is None
                   for stage in body["funnel"][1:]) and body["funnel"][0]["conversion"] is None
        assert body["today"] == [] and body["recent_applications"] == [] and body["feedback"] == []
        assert body["top_candidates"] == [] and body["upcoming_interviews"] == []
        assert body["viewer_name"] and body["organisation_name"].startswith("Empty")
        assert len(body["hiring_timeline"]) == 6
        assert set(body["hiring_timeline"][0]) == {"month", "applications", "interviews", "hired"}
        assert len((await client.get(f"{BASE}/dashboard", params={"timeline_range": "1y"},
                                     headers=employer["headers"])).json()["hiring_timeline"]) == 12
        assert len((await client.get(f"{BASE}/dashboard", params={"timeline_range": "3m"},
                                     headers=employer["headers"])).json()["hiring_timeline"]) == 3
        analytics = await client.get(f"{BASE}/analytics", params={"months": 3}, headers=employer["headers"])
        assert analytics.status_code == 200, analytics.text
        kpis = analytics.json()["kpis"]
        assert kpis["hiring_conversion_pct"] is None and kpis["time_to_hire_days"] is None
        assert analytics.json()["range_months"] == 3
        assert [row["stage"] for row in analytics.json()["funnel"]] == [
            "applied", "shortlisted", "interview", "offered", "hired"]
        assert (await client.get(f"{BASE}/analytics", params={"months": 0}, headers=employer["headers"])).status_code == 422

@pytest.mark.asyncio
async def test_dashboard_query_params_are_validated(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Params {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        url = f"{BASE}/dashboard"
        headers = employer["headers"]
        custom = await client.get(url, params={"funnel_range": "custom"}, headers=headers)
        assert custom.status_code == 422
        inverted = await client.get(url, params={"funnel_range": "custom", "funnel_from": "2026-05-10",
                                                 "funnel_to": "2026-05-01"}, headers=headers)
        assert inverted.status_code == 422
        ok = await client.get(url, params={"funnel_range": "custom", "funnel_from": "2026-05-01",
                                           "funnel_to": "2026-05-31", "timeline_range": "3m"}, headers=headers)
        assert ok.status_code == 200, ok.text
        assert ok.json()["kpis"]["applications"]["period"] == "Custom range"
        assert (await client.get(url, params={"funnel_range": "5y"}, headers=headers)).status_code == 422
        assert (await client.get(url, params={"timeline_range": "2y"}, headers=headers)).status_code == 422
        thirty = await client.get(url, params={"funnel_range": "30d"}, headers=headers)
        assert thirty.json()["kpis"]["hired"]["period"] == "Last 30 days"


@pytest.mark.asyncio
async def test_dashboard_counts_real_rows_and_funnel_is_cumulative(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Counts {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        trainee = await _trainee(client, token_factory)
        job_id = await _job(org)
        await _application(job_id, trainee["id"], status="applied")
        await _application(job_id, trainee["id"], status="shortlisted")
        await _application(job_id, trainee["id"], status="hired")
        body = (await client.get(f"{BASE}/dashboard", params={"funnel_range": "30d"},
                                 headers=employer["headers"])).json()
        assert body["kpis"]["applications"]["value"] == 3
        assert body["kpis"]["shortlisted"]["value"] == 2
        assert body["kpis"]["hired"]["value"] == 1
        assert body["kpis"]["active_jobs"]["value"] == 1
        counts = {stage["key"]: stage["count"] for stage in body["funnel"]}
        assert counts == {"applied": 3, "screened": 2, "shortlisted": 2, "interview": 1, "offered": 1, "hired": 1}
        assert body["funnel"][2]["conversion"] == 100.0 and body["funnel"][1]["percent"] == 66.7
        assert body["recent_applications"] and body["recent_applications"][0]["role"] == "Credit Officer"

@pytest.mark.asyncio
async def test_cross_org_access_is_denied_for_interviews_offers_pool_company_and_team(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org_a = await _org(f"Org A {uuid.uuid4().hex[:6]}")
        org_b = await _org(f"Org B {uuid.uuid4().hex[:6]}")
        owner_a = await _employer(client, token_factory, org_a)
        owner_b = await _employer(client, token_factory, org_b)
        trainee = await _trainee(client, token_factory)
        app_a = await _application(await _job(org_a), trainee["id"])

        interview = await _new_interview(client, owner_a["headers"], app_a)
        iv_path = f"{BASE}/interviews/{interview['id']}"
        assert (await client.get(iv_path, headers=owner_b["headers"])).status_code == 403
        assert (await client.patch(iv_path, headers=owner_b["headers"], json={"notes": "x"})).status_code == 403
        assert (await client.patch(iv_path, headers=owner_b["headers"], json={"decision": "reject"})).status_code == 403
        assert (await client.post(f"{iv_path}/evaluation", headers=owner_b["headers"],
                                  json={"scores": {"technical_skills": 5}})).status_code == 403

        offer = await client.post(f"{BASE}/offers", headers=owner_a["headers"], json=_offer_body(app_a))
        assert offer.status_code == 201, offer.text
        offer_path = f"{BASE}/offers/{offer.json()['id']}"
        assert (await client.get(offer_path, headers=owner_b["headers"])).status_code == 403
        assert (await client.patch(offer_path, headers=owner_b["headers"], json={"status": "sent"})).status_code == 403

        pool = await client.post(f"{BASE}/talent-pool", headers=owner_a["headers"],
                                 json={"trainee_id": str(trainee["id"]), "category": "saved"})
        assert pool.status_code == 201, pool.text
        pool_path = f"{BASE}/talent-pool/{pool.json()['id']}"
        assert (await client.patch(pool_path, headers=owner_b["headers"], json={"note": "x"})).status_code == 403
        assert (await client.delete(pool_path, headers=owner_b["headers"])).status_code == 403

        company = await client.patch(f"{BASE}/company", headers=owner_b["headers"], json={"name": "Hijacked"})
        assert company.status_code == 200 and company.json()["id"] == str(org_b)
        async with AsyncSessionLocal() as session:
            assert (await session.get(Organisation, org_a)).name.startswith("Org A")

        member_a = owner_a["id"]
        assert (await client.patch(f"{BASE}/team/{member_a}", headers=owner_b["headers"],
                                   json={"role": "recruiter"})).status_code == 404
        invite = await client.post(f"{BASE}/team", headers=owner_b["headers"], json={"email": await _email(member_a)})
        assert invite.status_code == 409


@pytest.mark.asyncio
async def test_team_roles_are_enforced_server_side(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Team {uuid.uuid4().hex[:6]}")
        admin = await _employer(client, token_factory, org)
        recruiter = await _employer(client, token_factory, org)
        await _add_team_row(org, admin["id"], "employer_admin")
        await _add_team_row(org, recruiter["id"], "recruiter")
        # An employer account that has not joined any organisation yet.
        newcomer = await token_factory(client, "employer")
        newcomer_email = f"{newcomer['clerk_user_id']}@example.com"
        async with AsyncSessionLocal() as session:
            newcomer_row = (await session.execute(select(User).where(
                User.clerk_user_id == newcomer["clerk_user_id"]))).scalar_one()
            newcomer_row.organisation_id = None
            LEDGER["users"].add(newcomer_row.id)
            await session.commit()

        listing = (await client.get(f"{BASE}/team", headers=recruiter["headers"])).json()
        assert listing["current_role"] == "recruiter" and listing["can_manage"] is False
        roles = {m["id"]: m["role"] for m in listing["members"]}
        assert roles[str(admin["id"])] == "employer_admin" and roles[str(recruiter["id"])] == "recruiter"

        assert (await client.post(f"{BASE}/team", headers=recruiter["headers"],
                                  json={"email": newcomer_email, "role": "recruiter"})).status_code == 403
        assert (await client.patch(f"{BASE}/team/{recruiter['id']}", headers=recruiter["headers"],
                                   json={"role": "employer_admin"})).status_code == 403
        assert (await client.patch(f"{BASE}/company", headers=recruiter["headers"],
                                   json={"name": "Nope"})).status_code == 403

        invite = await client.post(f"{BASE}/team", headers=admin["headers"],
                                   json={"email": newcomer_email, "role": "hiring_manager"})
        assert invite.status_code == 201, invite.text
        assert invite.json()["role"] == "hiring_manager" and invite.json()["status"] == "active"

        promoted = await client.patch(f"{BASE}/team/{recruiter['id']}", headers=admin["headers"],
                                      json={"role": "hiring_manager"})
        assert promoted.status_code == 200, promoted.text
        assert promoted.json()["role"] == "hiring_manager"

        # The only Employer Admin cannot demote themselves.
        last_admin = await client.patch(f"{BASE}/team/{admin['id']}", headers=admin["headers"],
                                        json={"role": "recruiter"})
        assert last_admin.status_code == 409


@pytest.mark.asyncio
async def test_offer_accepted_moves_application_to_hired(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Offer {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        trainee = await _trainee(client, token_factory)
        app_id = await _application(await _job(org), trainee["id"], status="shortlisted")

        offer = await client.post(f"{BASE}/offers", headers=employer["headers"], json=_offer_body(app_id))
        assert offer.status_code == 201, offer.text
        assert offer.json()["status"] == "draft" and offer.json()["salary"] == 450000
        offer_path = f"{BASE}/offers/{offer.json()['id']}"
        assert (await client.patch(offer_path, headers=employer["headers"],
                                   json={"status": "accepted"})).status_code == 422

        sent = await client.patch(offer_path, headers=employer["headers"], json={"status": "sent"})
        assert sent.status_code == 200 and sent.json()["status"] == "sent"
        assert await _application_status(app_id) == "offered"
        assert (await client.patch(offer_path, headers=employer["headers"],
                                   json={"salary": 600000})).status_code == 409

        accepted = await client.patch(offer_path, headers=employer["headers"], json={"status": "accepted"})
        assert accepted.status_code == 200 and accepted.json()["status"] == "accepted"
        assert await _application_status(app_id) == "hired"
        kinds = await _notification_kinds(trainee["id"])
        assert "offer_accepted" in kinds and "offer_received" in kinds

        # Hired is terminal: a second accept on the same offer is refused.
        assert (await client.patch(offer_path, headers=employer["headers"],
                                   json={"status": "accepted"})).status_code == 409


@pytest.mark.asyncio
async def test_offer_needs_terms_to_send_and_decline_keeps_application_offered(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Terms {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        trainee = await _trainee(client, token_factory)
        app_id = await _application(await _job(org), trainee["id"], status="interview")
        no_salary = _offer_body(app_id, status="sent")
        no_salary.pop("salary")
        assert (await client.post(f"{BASE}/offers", headers=employer["headers"], json=no_salary)).status_code == 422

        draft = await client.post(f"{BASE}/offers", headers=employer["headers"], json={**no_salary, "status": "draft"})
        assert draft.status_code == 201 and draft.json()["salary"] is None
        offer_path = f"{BASE}/offers/{draft.json()['id']}"
        assert (await client.patch(offer_path, headers=employer["headers"],
                                   json={"status": "sent"})).status_code == 422
        assert (await client.patch(offer_path, headers=employer["headers"],
                                   json={"salary": 500000})).status_code == 200
        assert (await client.patch(offer_path, headers=employer["headers"],
                                   json={"status": "sent"})).status_code == 200
        assert (await client.patch(offer_path, headers=employer["headers"],
                                   json={"status": "declined"})).status_code == 200
        assert await _application_status(app_id) == "offered"
        assert (await client.post(f"{BASE}/offers", headers=employer["headers"],
                                  json=_offer_body(app_id))).status_code == 201


@pytest.mark.asyncio
async def test_interview_scheduling_rules_and_trainee_notification(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Sched {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        trainee = await _trainee(client, token_factory)
        job_id = await _job(org)
        applied_only = await _application(job_id, trainee["id"], status="applied")
        shortlisted = await _application(job_id, trainee["id"], status="shortlisted")

        blocked = await client.post(f"{BASE}/interviews", headers=employer["headers"], json={
            "application_id": str(applied_only), "scheduled_at": _future()})
        assert blocked.status_code == 422

        past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        assert (await client.post(f"{BASE}/interviews", headers=employer["headers"], json={
            "application_id": str(shortlisted), "scheduled_at": past})).status_code == 422

        interview = await _new_interview(client, employer["headers"], shortlisted)
        assert await _application_status(shortlisted) == "interview"
        assert "interview_scheduled" in await _notification_kinds(trainee["id"])

        cancelled = await client.patch(f"{BASE}/interviews/{interview['id']}", headers=employer["headers"],
                                       json={"status": "cancelled"})
        assert cancelled.status_code == 200 and cancelled.json()["status"] == "cancelled"
        assert (await client.patch(f"{BASE}/interviews/{interview['id']}", headers=employer["headers"],
                                   json={"notes": "late"})).status_code == 409


@pytest.mark.asyncio
async def test_evaluation_never_sets_decision_automatically(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Eval {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        trainee = await _trainee(client, token_factory)
        app_id = await _application(await _job(org), trainee["id"], status="shortlisted")
        interview = await _new_interview(client, employer["headers"], app_id)
        iv_path = f"{BASE}/interviews/{interview['id']}"
        path = f"{iv_path}/evaluation"

        assert (await client.post(path, headers=trainee["headers"],
                                  json={"scores": {"technical_skills": 5}})).status_code == 403
        # The evaluation body has no decision field; any extra key is rejected, not stored.
        for extra in ({"decision": "proceed"}, {"decision_source": "ai"}):
            rejected = await client.post(path, headers=employer["headers"],
                                         json={"scores": {"technical_skills": 5}, **extra})
            assert rejected.status_code == 422, extra
        assert (await client.post(path, headers=employer["headers"], json={"scores": {}})).status_code == 422
        assert (await client.post(path, headers=employer["headers"],
                                  json={"scores": {"technical_skills": 9}})).status_code == 422

        scored = await client.post(path, headers=employer["headers"], json={
            "scores": {"technical_skills": 4, "communication": 5}, "overall_recommendation": "recommend",
            "notes": "Solid fundamentals"})
        assert scored.status_code == 200, scored.text
        body = scored.json()
        assert body["status"] == "completed" and body["overall_rating"] == 5
        assert body["overall_recommendation"] == "recommend"
        assert body["evaluation"] == {"technical_skills": 4, "communication": 5}
        assert body["decision"] is None
        async with AsyncSessionLocal() as session:
            row = await session.get(Interview, interview["id"])
            assert row.decision is None and row.decided_by_id is None

        # A human records the decision separately through PATCH; a trainee cannot.
        assert (await client.patch(iv_path, headers=trainee["headers"],
                                   json={"decision": "hold"})).status_code == 403
        decided = await client.patch(iv_path, headers=employer["headers"], json={"decision": "hold"})
        assert decided.status_code == 200 and decided.json()["decision"] == "hold"
        async with AsyncSessionLocal() as session:
            row = await session.get(Interview, interview["id"])
            assert row.decided_by_id == employer["id"]
        assert (await client.patch(iv_path, headers=employer["headers"],
                                   json={"decision": "maybe"})).status_code == 422


@pytest.mark.asyncio
async def test_report_preview_and_csv_export(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Csv {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        trainee = await _trainee(client, token_factory)
        async with AsyncSessionLocal() as session:
            user = await session.get(User, trainee["id"])
            user.full_name = "=HYPERLINK(\"http://evil\")"
            await session.commit()
        await _application(await _job(org, title="Dairy Procurement Supervisor"), trainee["id"], status="hired")

        catalog = (await client.get(f"{BASE}/reports", headers=employer["headers"])).json()["reports"]
        assert {"recruitment", "hiring_funnel", "job_performance", "candidate_skills", "interview",
                "employment", "employer_feedback"} == {row["key"] for row in catalog}

        preview = await client.get(f"{BASE}/reports/recruitment", headers=employer["headers"])
        assert preview.status_code == 200, preview.text
        body = preview.json()
        keys = [c["key"] for c in body["columns"]]
        assert keys == ["job_title", "candidate", "stage", "applied_at", "interview_at"]
        assert body["total_rows"] >= 1 and len(body["rows"]) <= 25
        assert all(set(row) == set(keys) for row in body["rows"])

        response = await client.get(f"{BASE}/reports/recruitment/export", params={"format": "csv"},
                                    headers=employer["headers"])
        assert response.status_code == 200, response.text
        assert response.headers["content-type"].startswith("text/csv")
        assert "attachment" in response.headers["content-disposition"]
        rows = list(csv.reader(io.StringIO(response.text)))
        assert rows[0] == keys
        dairy = [row for row in rows[1:] if row and row[0] == "Dairy Procurement Supervisor"]
        assert len(dairy) == 1 and dairy[0][2] == "hired"
        # Spreadsheet formula injection is neutralised with a leading apostrophe.
        assert dairy[0][1] == "'=HYPERLINK(\"http://evil\")"

        funnel = (await client.get(f"{BASE}/reports/hiring_funnel", headers=employer["headers"])).json()
        assert funnel["columns"][0]["key"] == "stage"
        assert {"stage": "hired", "count": 1} in funnel["rows"]

        assert (await client.get(f"{BASE}/reports/recruitment/export", params={"format": "xlsx"},
                                 headers=employer["headers"])).status_code == 422
        assert (await client.get(f"{BASE}/reports/unknown", headers=employer["headers"])).status_code == 404
        assert (await client.get(f"{BASE}/reports/unknown/export", headers=employer["headers"])).status_code == 404


@pytest.mark.asyncio
async def test_feedback_requires_hire_and_aggregate_hides_other_employers(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org_a = await _org(f"Confidential Employer {uuid.uuid4().hex[:6]}")
        org_b = await _org(f"Rival {uuid.uuid4().hex[:6]}")
        owner_a = await _employer(client, token_factory, org_a)
        owner_b = await _employer(client, token_factory, org_b)
        trainee = await _trainee(client, token_factory)
        job_a = await _job(org_a, title="Secret Warehouse Role")
        app_a = await _application(job_a, trainee["id"], status="shortlisted")

        payload = {"job_id": str(job_a), "trainee_id": str(trainee["id"]), "ratings": RATINGS,
                   "additional_skills_needed": ["Zq Gap Skill"], "comments": "Ready for more"}
        assert (await client.post(f"{BASE}/feedback", headers=owner_a["headers"], json=payload)).status_code == 422
        assert (await client.post(f"{BASE}/feedback", headers=owner_a["headers"],
                                  json={**payload, "ratings": {"technical_skills": 4}})).status_code == 422

        async with AsyncSessionLocal() as session:
            (await session.get(Application, app_a)).status = "hired"
            await session.commit()
        logged = await client.post(f"{BASE}/feedback", headers=owner_a["headers"], json=payload)
        assert logged.status_code == 201, logged.text
        record = logged.json()
        assert record["ratings"] == RATINGS and record["additional_skills_needed"] == ["Zq Gap Skill"]
        assert record["performance_rating"] == 4
        assert (await client.post(f"{BASE}/feedback", headers=owner_a["headers"], json=payload)).status_code == 409

        # Another organisation cannot log feedback against this job.
        assert (await client.post(f"{BASE}/feedback", headers=owner_b["headers"], json=payload)).status_code == 403

        listing = (await client.get(f"{BASE}/feedback", headers=owner_a["headers"])).json()
        assert set(listing) == {"hires", "feedback"}
        assert listing["hires"][0]["feedback_submitted"] is True
        assert listing["feedback"][0]["ratings"] == RATINGS
        assert (await client.get(f"{BASE}/feedback", headers=owner_b["headers"])).json()["feedback"] == []

        aggregate = await client.get(f"{BASE}/feedback/aggregate", headers=owner_b["headers"])
        assert aggregate.status_code == 200, aggregate.text
        body = aggregate.json()
        assert set(body) == {"responses", "skills"}
        assert body["responses"] >= 1
        assert "Zq Gap Skill" in {row["skill"] for row in body["skills"]}
        assert all(set(row) == {"skill", "mentions"} for row in body["skills"])
        text = aggregate.text
        for private in ("Confidential Employer", "Secret Warehouse Role", str(org_a), str(job_a), str(trainee["id"])):
            assert private not in text


@pytest.mark.asyncio
async def test_talent_pool_visibility_and_category_updates(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Pool {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        hidden = await _trainee(client, token_factory)
        visible = await _trainee(client, token_factory)
        async with AsyncSessionLocal() as session:
            session.add(UserProfile(id=uuid.uuid4(), user_id=visible["id"], visible_to_employers=True,
                                    district="Anand", state="Gujarat"))
            await session.commit()

        refused = await client.post(f"{BASE}/talent-pool", headers=employer["headers"],
                                    json={"trainee_id": str(hidden["id"]), "category": "saved"})
        assert refused.status_code == 403

        added = await client.post(f"{BASE}/talent-pool", headers=employer["headers"],
                                  json={"trainee_id": str(visible["id"]), "category": "high_potential",
                                        "note": "Strong on credit"})
        assert added.status_code == 201, added.text
        assert added.json()["location"] == "Anand, Gujarat" and added.json()["match_score"] is None
        assert (await client.post(f"{BASE}/talent-pool", headers=employer["headers"],
                                  json={"trainee_id": str(visible["id"]), "category": "saved"})).status_code == 409

        entry = f"{BASE}/talent-pool/{added.json()['id']}"
        updated = await client.patch(entry, headers=employer["headers"], json={"category": "future_hiring"})
        assert updated.status_code == 200 and updated.json()["category"] == "future_hiring"
        listed = await client.get(f"{BASE}/talent-pool", params={"category": "future_hiring"},
                                  headers=employer["headers"])
        assert [row["id"] for row in listed.json()["entries"]] == [added.json()["id"]]
        assert (await client.delete(entry, headers=employer["headers"])).json()["status"] == "deleted"
        assert (await client.delete(entry, headers=employer["headers"])).status_code == 404



@pytest.mark.asyncio
async def test_analytics_company_and_settings_shapes(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        org = await _org(f"Shape {uuid.uuid4().hex[:6]}")
        employer = await _employer(client, token_factory, org)
        await _add_team_row(org, employer["id"], "employer_admin")
        trainee = await _trainee(client, token_factory)
        await _application(await _job(org), trainee["id"], status="hired")

        analytics = (await client.get(f"{BASE}/analytics", params={"months": 6}, headers=employer["headers"])).json()
        assert analytics["kpis"]["hires"] == 1 and analytics["kpis"]["applications"] == 1
        assert analytics["kpis"]["time_to_hire_days"] == 10.0
        assert analytics["kpis"]["hiring_conversion_pct"] == 100.0
        assert len(analytics["hiring_timeline"]) == 6
        assert analytics["top_skills"][0]["skill"] in {"Credit Appraisal", "Data Analysis"}
        assert "Applied on CoopSetu" in {row["source"] for row in analytics["candidate_sources"]}
        assert analytics["job_performance"][0]["hires"] == 1

        company = await client.patch(f"{BASE}/company", headers=employer["headers"], json={
            "sector": "Dairy", "location": "Anand, Gujarat", "departments": ["Procurement", "Finance", "Procurement"],
            "description": "Milk cooperative", "contact_email": "hr@example.org", "website": "https://coop.example.org"})
        assert company.status_code == 200, company.text
        profile = company.json()
        assert profile["sector"] == "Dairy" and profile["departments"] == ["Procurement", "Finance"]
        assert (await client.get(f"{BASE}/company", headers=employer["headers"])).json()["description"] == "Milk cooperative"
        assert (await client.patch(f"{BASE}/company", headers=employer["headers"],
                                   json={"website": "ftp://nope"})).status_code == 422

        settings = (await client.get(f"{BASE}/settings", headers=employer["headers"])).json()
        assert settings["account"]["role"] == "employer_admin"
        assert settings["notifications"] == {"interview_reminders": True, "new_application": True,
                                             "candidate_response": True, "job_deadline": True}
        updated = await client.patch(f"{BASE}/settings", headers=employer["headers"], json={
            "notifications": {"candidate_response": False}, "account": {"name": "Asha Patel"}})
        assert updated.status_code == 200, updated.text
        assert updated.json()["notifications"]["candidate_response"] is False
        assert updated.json()["notifications"]["job_deadline"] is True
        assert updated.json()["account"]["name"] == "Asha Patel"
        assert (await client.patch(f"{BASE}/settings", headers=employer["headers"],
                                   json={"notifications": {"unknown_pref": True}})).status_code == 422
