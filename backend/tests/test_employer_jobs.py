"""Employer jobs, requirements, matching and application access tests.

Scorer tests are pure. API tests use an AsyncMock session with the auth
dependency overridden, the same style as tests/test_employer.py, so they run
without touching any database.
"""
import uuid
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import ValidationError

from app.api.v1 import employer, employer_jobs
from app.database import get_db
from app.deps import require_user
from app.services.employer_matching import (
    CandidateFacts, CertificateFact, JobFacts, RequirementFact, SkillFact, education_rank, score_candidate,
)

LONG_DESCRIPTION = "Lead procurement operations for member societies across the district, reporting monthly."


# ---------------------------------------------------------------- helpers

def actor(role="employer", org=None):
    return SimpleNamespace(id=uuid.uuid4(), role=role, organisation_id=org or uuid.uuid4(), is_active=True,
                           full_name="Employer User")


def scalar(value):
    result = MagicMock()
    result.scalar_one_or_none.return_value = value
    result.scalar_one.return_value = value
    return result


def job_stub(org, **overrides):
    values = dict(id=uuid.uuid4(), organisation_id=org, source="employer", title="Procurement Officer",
                  location="Anand, Gujarat", sector="Dairy", job_type="Full-time", salary_range=None,
                  description=LONG_DESCRIPTION, openings=2,
                  deadline=datetime.now(timezone.utc) + timedelta(days=30), status="draft", posted_at=None,
                  skills_required=[], employer_name=None)
    values.update(overrides)
    return SimpleNamespace(**values)


def req_stub(**overrides):
    values = dict(id=uuid.uuid4(), kind="skill", skill_name="Dairy Operations", requirement_type="required",
                  min_proficiency=None, weight=1, min_education=None, min_years=None, certification_name=None,
                  created_at=None)
    values.update(overrides)
    return SimpleNamespace(**values)


def detail_stub(**overrides):
    values = dict(job_id=None, department="Operations", experience_required="1-3 years", education=None,
                  certifications=None, salary_min=None, salary_max=None, responsibilities=None, languages=None)
    values.update(overrides)
    return SimpleNamespace(**values)


@pytest.fixture(autouse=True)
def _posting_detail_defaults():
    """Default posting detail and counts for the mock-session tests; individual tests override as needed."""
    with patch.object(employer_jobs, "_load_detail", AsyncMock(side_effect=lambda db, job_id: detail_stub(job_id=job_id))), \
            patch.object(employer_jobs, "_status_counts",
                         AsyncMock(side_effect=lambda db, ids: {i: {} for i in ids})):
        yield


@pytest.fixture
def app_db():
    app = FastAPI()
    app.include_router(employer.router, prefix="/employer")
    app.include_router(employer_jobs.router, prefix="/employer")
    db = AsyncMock()
    db.add = MagicMock()
    db.add_all = MagicMock()
    app.dependency_overrides[get_db] = lambda: db
    return app, db


def client_for(app):
    return AsyncClient(transport=ASGITransport(app), base_url="http://test")


# ---------------------------------------------------------------- scorer (pure)

def _reqs():
    return [
        RequirementFact(kind="skill", skill_name="Accounting", min_proficiency=50, weight=1),
        RequirementFact(kind="skill", skill_name="Dairy Operations", min_proficiency=75, weight=1),
        RequirementFact(kind="education", min_education="Graduate"),
        RequirementFact(kind="experience", min_years=2),
        RequirementFact(kind="certification", certification_name="Cooperative Management"),
    ]


def _full_candidate():
    return CandidateFacts(
        skills=(SkillFact("Accounting", "Expert", verified=True, confidence=90),
                SkillFact("Dairy Operations", "Expert", verified=True, confidence=80)),
        education_level="B.Sc Agriculture", years_of_experience=5,
        certificates=(CertificateFact(title="Cooperative Management", valid=True),),
        district="Anand", state="Gujarat")


def test_perfect_candidate_scores_100_with_full_breakdown():
    result = score_candidate(JobFacts(location="Anand, Gujarat"), _reqs(), _full_candidate())
    assert result["score"] == 100
    assert result["missing_skills"] == []
    assert {m["name"] for m in result["matched_skills"]} == {"Accounting", "Dairy Operations"}
    assert result["breakdown"]["location"]["status"] == "matched"
    assert result["breakdown"]["location"]["weight"] == 0
    assert {item["kind"] for item in result["explanation"]} == {"match"}


def test_score_is_deterministic_under_input_reordering():
    reqs = _reqs()
    cand = _full_candidate()
    shuffled_cand = CandidateFacts(skills=tuple(reversed(cand.skills)), education_level=cand.education_level,
                                   years_of_experience=cand.years_of_experience,
                                   certificates=cand.certificates, district=cand.district, state=cand.state)
    first = score_candidate(JobFacts(location="Anand"), reqs, cand)
    for _ in range(5):
        assert score_candidate(JobFacts(location="Anand"), list(reversed(reqs)), shuffled_cand) == first
        assert score_candidate(JobFacts(location="Anand"), reqs, cand) == first


def test_partial_candidate_matches_hand_computed_score():
    # Coverage 2/2 (40), proficiency avg(1.0, 25/75) = 2/3 (25), education 1.0 (15),
    # experience 1/2 (10); certification not requested so weights renormalise over 90.
    reqs = [
        RequirementFact(kind="skill", skill_name="Accounting", min_proficiency=50, weight=1),
        RequirementFact(kind="skill", skill_name="Dairy Operations", min_proficiency=75, weight=1),
        RequirementFact(kind="education", min_education="Graduate"),
        RequirementFact(kind="experience", min_years=2),
    ]
    cand = CandidateFacts(
        skills=(SkillFact("Accounting", "Proficient"), SkillFact("Dairy Operations", "Foundational")),
        education_level="BA", years_of_experience=1)
    result = score_candidate(JobFacts(), reqs, cand)
    assert result["score"] == 85
    assert result["breakdown"]["certification"]["status"] == "unknown"
    statuses = {m["name"]: m["status"] for m in result["matched_skills"]}
    assert statuses == {"Accounting": "matched", "Dairy Operations": "partial"}


def test_missing_skill_lowers_coverage_and_is_listed():
    cand = CandidateFacts(skills=(SkillFact("Accounting", "Expert"),))
    result = score_candidate(JobFacts(), [
        RequirementFact(kind="skill", skill_name="Accounting", weight=1),
        RequirementFact(kind="skill", skill_name="Dairy Operations", weight=1),
    ], cand)
    assert result["missing_skills"] == ["Dairy Operations"]
    assert result["breakdown"]["required_skills"]["value"] == 1
    assert result["breakdown"]["required_skills"]["total"] == 2
    assert result["breakdown"]["required_skills"]["status"] == "partial"
    assert any(item["text"] == "Missing required skills: Dairy Operations." for item in result["explanation"])


def test_no_requirements_scores_zero_without_error():
    result = score_candidate(JobFacts(), [], _full_candidate())
    assert result["score"] == 0
    assert result["breakdown"]["required_skills"]["status"] == "unknown"
    assert "no scored requirements" in result["explanation"][0]["text"]


def test_missing_candidate_data_scores_zero_for_those_factors():
    result = score_candidate(JobFacts(), [
        RequirementFact(kind="education", min_education="Graduate"),
        RequirementFact(kind="experience", min_years=3),
    ], CandidateFacts())
    assert result["score"] == 0
    assert result["breakdown"]["education"]["status"] == "missing"
    assert "Education not recorded" in result["breakdown"]["education"]["detail"]
    assert result["breakdown"]["experience"]["status"] == "missing"


def test_boundary_values_for_proficiency_and_experience():
    # min_proficiency 0 is always satisfied by a present skill.
    zero = score_candidate(JobFacts(), [RequirementFact(kind="skill", skill_name="X", min_proficiency=0)],
                           CandidateFacts(skills=(SkillFact("x", "Foundational"),)))
    assert zero["score"] == 100
    # Exact threshold counts as matched; one level below is partial.
    exact = score_candidate(JobFacts(), [RequirementFact(kind="skill", skill_name="X", min_proficiency=75)],
                            CandidateFacts(skills=(SkillFact("X", "Proficient"),)))
    assert exact["matched_skills"][0]["status"] == "matched"
    below = score_candidate(JobFacts(), [RequirementFact(kind="skill", skill_name="X", min_proficiency=100)],
                            CandidateFacts(skills=(SkillFact("X", "Proficient"),)))
    assert below["matched_skills"][0]["status"] == "partial"
    # Experience exactly at the minimum is full credit; zero years vs a minimum is zero credit.
    at_min = score_candidate(JobFacts(), [RequirementFact(kind="experience", min_years=2)],
                             CandidateFacts(years_of_experience=2))
    assert at_min["score"] == 100
    none_years = score_candidate(JobFacts(), [RequirementFact(kind="experience", min_years=2)],
                                 CandidateFacts(years_of_experience=0))
    assert none_years["score"] == 0


def test_expired_or_revoked_certificate_does_not_count():
    reqs = [RequirementFact(kind="certification", certification_name="Cooperative Management")]
    invalid = CandidateFacts(certificates=(CertificateFact(title="Cooperative Management", valid=False),))
    assert score_candidate(JobFacts(), reqs, invalid)["score"] == 0
    via_skills = CandidateFacts(certificates=(CertificateFact(title="Other", skills_certified=("cooperative management",),
                                                              valid=True),))
    assert score_candidate(JobFacts(), reqs, via_skills)["score"] == 100


def test_location_is_informational_and_never_scored():
    reqs = [RequirementFact(kind="skill", skill_name="Accounting")]
    cand = CandidateFacts(skills=(SkillFact("Accounting", "Expert"),), district="Pune", state="Maharashtra")
    away = score_candidate(JobFacts(location="Anand, Gujarat"), reqs, cand)
    local = score_candidate(JobFacts(location="Pune, Maharashtra"), reqs, cand)
    assert away["score"] == local["score"] == 100
    assert away["breakdown"]["location"]["status"] == "missing"
    assert local["breakdown"]["location"]["status"] == "matched"


def test_preferred_skills_are_reported_but_not_scored():
    reqs = [RequirementFact(kind="skill", skill_name="Accounting"),
            RequirementFact(kind="skill", skill_name="Python", requirement_type="preferred")]
    result = score_candidate(JobFacts(), reqs, CandidateFacts(skills=(SkillFact("Accounting", "Expert"),)))
    assert result["score"] == 100
    assert result["missing_skills"] == ["Python"]
    assert result["breakdown"]["required_skills"]["total"] == 1


@pytest.mark.parametrize("text,rank", [
    ("Post Graduate", 5), ("M.Sc Chemistry", 5), ("B.Tech", 4), ("Graduate", 4),
    ("Diploma in Dairy", 3), ("ITI", None), ("12th pass", 2), ("10th", 1), ("", None), (None, None),
])
def test_education_rank_mapping(text, rank):
    assert education_rank(text) == rank


# ---------------------------------------------------------------- requirement validation

def test_requirement_bounds_are_enforced():
    with pytest.raises(ValidationError):
        employer_jobs.RequirementIn(skill_name="X", min_proficiency=101)
    with pytest.raises(ValidationError):
        employer_jobs.RequirementIn(skill_name="X", min_proficiency=-1)
    with pytest.raises(ValidationError):
        employer_jobs.RequirementIn(skill_name="X", weight=0)
    with pytest.raises(ValidationError):
        employer_jobs.RequirementIn(skill_name="X", min_proficiency=50, min_level="Expert")
    with pytest.raises(ValidationError):
        employer_jobs.RequirementIn(skill_name="X", kind="education")
    ok = employer_jobs.RequirementIn(skill_name="X", min_proficiency=0)
    assert ok.min_proficiency == 0


# ---------------------------------------------------------------- auth and access control

@pytest.mark.asyncio
async def test_employer_job_routes_require_auth(app_db):
    app, db = app_db
    async with client_for(app) as client:
        checks = [
            ("get", "/employer/jobs"), ("post", "/employer/jobs"),
            ("get", f"/employer/jobs/{uuid.uuid4()}"), ("patch", f"/employer/jobs/{uuid.uuid4()}"),
            ("post", f"/employer/jobs/{uuid.uuid4()}/publish"), ("post", f"/employer/jobs/{uuid.uuid4()}/pause"),
            ("post", f"/employer/jobs/{uuid.uuid4()}/close"),
            ("get", f"/employer/jobs/{uuid.uuid4()}/matches"),
            ("get", f"/employer/jobs/{uuid.uuid4()}/requirements"),
            ("put", f"/employer/jobs/{uuid.uuid4()}/requirements"),
            ("get", "/employer/applications"), ("get", f"/employer/applications/{uuid.uuid4()}"),
            ("patch", f"/employer/applications/{uuid.uuid4()}/status"),
            ("get", f"/employer/candidates/{uuid.uuid4()}"),
        ]
        for method, path in checks:
            response = await client.request(method.upper(), path, json={})
            assert response.status_code == 401, (method, path)
    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_trainee_is_denied_on_every_employer_route(app_db):
    app, db = app_db
    app.dependency_overrides[require_user] = lambda: actor(role="trainee", org=None)
    job_id, app_id, trainee_id = uuid.uuid4(), uuid.uuid4(), uuid.uuid4()
    checks = [
        ("get", "/employer/jobs"), ("post", "/employer/jobs"), ("get", f"/employer/jobs/{job_id}"),
        ("patch", f"/employer/jobs/{job_id}"), ("post", f"/employer/jobs/{job_id}/publish"),
        ("post", f"/employer/jobs/{job_id}/pause"), ("post", f"/employer/jobs/{job_id}/close"),
        ("get", f"/employer/jobs/{job_id}/matches"), ("get", f"/employer/jobs/{job_id}/requirements"),
        ("put", f"/employer/jobs/{job_id}/requirements"), ("get", "/employer/applications"),
        ("get", f"/employer/applications/{app_id}"), ("patch", f"/employer/applications/{app_id}/status"),
        ("get", f"/employer/candidates/{trainee_id}"),
    ]
    async with client_for(app) as client:
        for method, path in checks:
            response = await client.request(method.upper(), path, json={"status": "shortlisted"})
            assert response.status_code == 403, (method, path)
    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_cross_org_job_access_denied(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    foreign = job_stub(uuid.uuid4())
    async with client_for(app) as client:
        for method, path, body in [
            ("get", f"/employer/jobs/{foreign.id}", None),
            ("patch", f"/employer/jobs/{foreign.id}", {"title": "Changed"}),
            ("post", f"/employer/jobs/{foreign.id}/publish", None),
            ("post", f"/employer/jobs/{foreign.id}/pause", None),
            ("post", f"/employer/jobs/{foreign.id}/close", None),
            ("get", f"/employer/jobs/{foreign.id}/matches", None),
            ("get", f"/employer/jobs/{foreign.id}/requirements", None),
            ("put", f"/employer/jobs/{foreign.id}/requirements", {"requirements": []}),
            ("get", f"/employer/applications?job_id={foreign.id}", None),
        ]:
            db.execute.return_value = scalar(foreign)
            response = await getattr(client, method)(path, json=body) if body is not None else await getattr(client, method)(path)
            assert response.status_code == 403, (method, path)
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_cross_org_application_and_candidate_access_denied(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    foreign_job = job_stub(uuid.uuid4())
    application = SimpleNamespace(id=uuid.uuid4(), applicant_id=uuid.uuid4(), status="applied",
                                  employer_note=None, interview_at=None, updated_at=None, applied_at=None)
    row = MagicMock()
    row.one_or_none.return_value = (application, foreign_job, SimpleNamespace(full_name="X"), None)
    db.execute.side_effect = [row]
    async with client_for(app) as client:
        detail = await client.get(f"/employer/applications/{application.id}")
        row_two = MagicMock()
        row_two.one_or_none.return_value = (application, foreign_job)
        db.execute.side_effect = [row_two]
        patched = await client.patch(f"/employer/applications/{application.id}/status", json={"status": "shortlisted"})
    assert detail.status_code == patched.status_code == 403
    assert application.status == "applied"
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_candidate_match_for_foreign_job_denied(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    trainee = SimpleNamespace(id=uuid.uuid4(), role="trainee", full_name="Visible Candidate", email="x@example.com")
    profile = SimpleNamespace(visible_to_employers=True, phone="0")
    candidate = MagicMock()
    candidate.one_or_none.return_value = (trainee, profile)
    db.execute.side_effect = [candidate, scalar(None), scalar(job_stub(uuid.uuid4()))]
    async with client_for(app) as client:
        response = await client.get(f"/employer/candidates/{trainee.id}?job_id={uuid.uuid4()}")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_application_list_scopes_by_org_without_job_filter(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    count = MagicMock()
    count.scalar_one.return_value = 0
    rows = MagicMock()
    rows.all.return_value = []
    db.execute.side_effect = [count, rows]
    async with client_for(app) as client:
        response = await client.get("/employer/applications?status=applied")
    assert response.status_code == 200
    assert response.json() == {"applications": [], "total": 0, "limit": 20, "offset": 0}
    # Compiled statement must carry the organisation filter for non-global roles.
    compiled = str(db.execute.await_args_list[0].args[0].compile(compile_kwargs={"literal_binds": False}))
    assert "jobs.organisation_id" in compiled


# ---------------------------------------------------------------- job creation and lifecycle

@pytest.mark.asyncio
async def test_create_job_starts_as_draft_in_callers_org(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    async with client_for(app) as client:
        response = await client.post("/employer/jobs", json={"title": "Dairy Supervisor"})
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "draft"
    assert body["posted_at"] is None
    created = db.add.call_args_list[0].args[0]
    assert created.organisation_id == user.organisation_id
    assert created.source == "employer"
    assert created.status == "draft"


@pytest.mark.asyncio
async def test_create_job_requires_organisation(app_db):
    app, db = app_db
    user = actor()
    user.organisation_id = None
    app.dependency_overrides[require_user] = lambda: user
    async with client_for(app) as client:
        response = await client.post("/employer/jobs", json={"title": "Dairy Supervisor"})
    assert response.status_code == 403  # org_scope rejects non-global users without an organisation
    db.add.assert_not_called()


@pytest.mark.asyncio
async def test_patch_rejects_status_field(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    async with client_for(app) as client:
        response = await client.patch(f"/employer/jobs/{uuid.uuid4()}", json={"status": "open"})
    assert response.status_code == 422
    db.execute.assert_not_called()


@pytest.mark.asyncio
async def test_publish_reports_every_missing_field(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id, title="Draft", location=None, sector=None,
                   description="Too short", openings=None, deadline=datetime.now(timezone.utc) - timedelta(days=1))
    detail = detail_stub(department=None, experience_required=None, salary_min=500, salary_max=100)
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)), \
            patch.object(employer_jobs, "_load_detail", AsyncMock(return_value=detail)), \
            patch.object(employer_jobs, "_load_requirements", AsyncMock(return_value=[])):
        async with client_for(app) as client:
            response = await client.post(f"/employer/jobs/{job.id}/publish")
    assert response.status_code == 422
    problems = " | ".join(response.json()["detail"]["problems"])
    for fragment in ("Sector is required", "Department is required", "Location is required",
                     "Experience required", "Description must be at least 40", "openings",
                     "deadline must be in the future", "Maximum salary", "required skill"):
        assert fragment in problems, fragment
    assert job.status == "draft"
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_publish_valid_draft_opens_job_once(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id)
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)), \
            patch.object(employer_jobs, "_load_requirements", AsyncMock(return_value=[req_stub()])):
        async with client_for(app) as client:
            response = await client.post(f"/employer/jobs/{job.id}/publish")
    assert response.status_code == 200
    assert response.json()["status"] == "open"
    assert job.posted_at is not None
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_publish_requires_a_required_skill(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id)
    preferred_only = [req_stub(requirement_type="preferred")]
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)), \
            patch.object(employer_jobs, "_load_requirements", AsyncMock(return_value=preferred_only)):
        async with client_for(app) as client:
            response = await client.post(f"/employer/jobs/{job.id}/publish")
    assert response.status_code == 422
    assert "Add at least one required skill" in response.json()["detail"]["problems"][0]


@pytest.mark.asyncio
@pytest.mark.parametrize("start,action,expected", [
    ("draft", "pause", 409), ("open", "pause", 200), ("paused", "pause", 409), ("closed", "pause", 409),
    ("draft", "close", 200), ("open", "close", 200), ("paused", "close", 200), ("closed", "close", 409),
    ("open", "publish", 409), ("paused", "publish", 200), ("closed", "publish", 409),
])
async def test_lifecycle_transitions(app_db, start, action, expected):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id, status=start, posted_at=datetime.now(timezone.utc))
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)), \
            patch.object(employer_jobs, "_load_requirements", AsyncMock(return_value=[req_stub()])):
        async with client_for(app) as client:
            response = await client.post(f"/employer/jobs/{job.id}/{action}")
    assert response.status_code == expected
    if expected == 200:
        assert job.status == {"pause": "paused", "close": "closed", "publish": "open"}[action]
    else:
        assert job.status == start


@pytest.mark.asyncio
async def test_closed_job_cannot_be_edited(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id, status="closed")
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)):
        async with client_for(app) as client:
            response = await client.patch(f"/employer/jobs/{job.id}", json={"location": "Pune"})
    assert response.status_code == 409
    assert job.location == "Anand, Gujarat"


@pytest.mark.asyncio
async def test_job_list_rejects_unknown_status_and_inverted_dates(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    async with client_for(app) as client:
        bad_status = await client.get("/employer/jobs?status=active")
        bad_dates = await client.get("/employer/jobs?posted_from=2026-05-01&posted_to=2026-04-01")
    assert bad_status.status_code == 422
    assert bad_dates.status_code == 422
    db.execute.assert_not_called()


# ---------------------------------------------------------------- requirements

@pytest.mark.asyncio
async def test_requirements_put_rejects_duplicate_skills_and_repeated_kinds(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id)
    dup = {"requirements": [{"skill_name": "Accounting"}, {"skill_name": "accounting "}]}
    twice = {"requirements": [{"skill_name": "Tally"}, {"skill_name": " tally "}]}
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)):
        async with client_for(app) as client:
            r1 = await client.put(f"/employer/jobs/{job.id}/requirements", json=dup)
            r2 = await client.put(f"/employer/jobs/{job.id}/requirements", json=twice)
    assert r1.status_code == r2.status_code == 422
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_requirements_put_maps_level_and_syncs_legacy_skills(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id)
    db.execute.return_value = MagicMock(scalars=MagicMock(return_value=MagicMock(all=MagicMock(return_value=[]))))
    body = {"requirements": [
        {"skill_id": None, "skill_name": "Accounting", "requirement_type": "required", "min_level": "Proficient", "weight": 3},
        {"skill_name": "Tally", "requirement_type": "preferred", "min_proficiency": 50},
    ]}
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)):
        async with client_for(app) as client:
            response = await client.put(f"/employer/jobs/{job.id}/requirements", json=body)
    assert response.status_code == 200, response.text
    saved = response.json()["requirements"]
    accounting = next(r for r in saved if r["skill_name"] == "Accounting")
    assert accounting["min_proficiency"] == 75
    assert accounting["weight"] == 3
    assert job.skills_required == ["Accounting"]
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_requirements_put_rejects_education_kind_posted_as_skill(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id)
    body = {"requirements": [{"kind": "education", "min_education": "Graduate"}]}
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)):
        async with client_for(app) as client:
            response = await client.put(f"/employer/jobs/{job.id}/requirements", json=body)
    assert response.status_code == 422
    db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_patch_accepts_full_job_input_and_derives_salary_label(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id, status="open")
    detail = detail_stub(job_id=job.id)
    body = {"title": "Dairy Supervisor", "sector": "Dairy & Agri-processing", "department": "Procurement",
            "location": "Anand, Gujarat", "employment_type": "Contract", "salary_min": 300000,
            "salary_max": 450000, "experience_required": "3-5 years", "education": "Graduate (B.A. / B.Com / B.Sc.)",
            "description": LONG_DESCRIPTION, "responsibilities": None, "certifications": "NCCT Dairy",
            "languages": "English, Gujarati", "deadline": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat(),
            "openings": 3}
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)), \
            patch.object(employer_jobs, "_load_detail", AsyncMock(return_value=detail)):
        async with client_for(app) as client:
            response = await client.patch(f"/employer/jobs/{job.id}", json=body)
    assert response.status_code == 200, response.text
    assert job.job_type == "Contract"
    assert job.salary_range == "₹300000 - ₹450000"
    assert detail.department == "Procurement" and detail.languages == "English, Gujarati"
    assert response.json()["department"] == "Procurement"
    assert response.json()["employment_type"] == "Contract"


@pytest.mark.asyncio
async def test_create_accepts_full_job_input_with_status_draft(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    body = {"title": "Accounts Clerk", "sector": None, "department": None, "location": None,
            "employment_type": "Full-time", "salary_min": None, "salary_max": None,
            "experience_required": None, "education": None, "description": None, "responsibilities": None,
            "certifications": None, "languages": None, "deadline": None, "openings": 1, "status": "draft"}
    async with client_for(app) as client:
        response = await client.post("/employer/jobs", json=body)
    assert response.status_code == 201, response.text
    assert response.json()["status"] == "draft"


@pytest.mark.asyncio
async def test_job_input_rejects_unknown_fields_and_inverted_salary(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    async with client_for(app) as client:
        unknown = await client.post("/employer/jobs", json={"title": "X", "bogus": 1})
        inverted = await client.post("/employer/jobs", json={"title": "X", "salary_min": 9, "salary_max": 3})
        bad_type = await client.post("/employer/jobs", json={"title": "X", "employment_type": "Freelance"})
    assert unknown.status_code == inverted.status_code == bad_type.status_code == 422
    db.add.assert_not_called()


# ---------------------------------------------------------------- matching endpoint

def _pool_result(rows):
    result = MagicMock()
    result.all.return_value = rows
    result.scalars.return_value.all.return_value = []
    return result


def _candidate(name, visible=True):
    trainee = SimpleNamespace(id=uuid.uuid4(), full_name=name, role="trainee", is_active=True)
    profile = SimpleNamespace(visible_to_employers=visible, district="Anand", state="Gujarat",
                              occupation="Clerk", education_level="Graduate", years_of_experience=3,
                              photo_url=None)
    return trainee, profile


@pytest.mark.asyncio
async def test_matches_are_deterministic_and_sorted(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id)
    pool = [_candidate("Zed"), _candidate("Amy"), _candidate("Bob")]
    reqs = [req_stub(skill_name="Accounting", min_proficiency=50)]
    facts = {}
    for index, (trainee, profile) in enumerate(pool):
        level = ["Expert", "Foundational", "Proficient"][index]
        facts[trainee.id] = CandidateFacts(skills=(SkillFact("Accounting", level),))
    db.execute.return_value = _pool_result(pool)
    responses = []
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)), \
            patch.object(employer_jobs, "_load_requirements", AsyncMock(return_value=reqs)), \
            patch.object(employer_jobs, "_load_detail", AsyncMock(return_value=detail_stub(experience_required=None))), \
            patch.object(employer_jobs, "_applicant_ids_for_job", AsyncMock(return_value=set())), \
            patch.object(employer_jobs, "load_candidate_facts", AsyncMock(return_value=facts)):
        async with client_for(app) as client:
            for _ in range(2):
                db.execute.return_value = _pool_result(pool)
                responses.append((await client.get(f"/employer/jobs/{job.id}/matches")).json())
    assert responses[0] == responses[1]
    matches = responses[0]["matches"]
    # Expert and Proficient both meet min 50 (score 100); Foundational is half-credit on proficiency.
    assert [m["candidate"]["name"] for m in matches] == ["Bob", "Zed", "Amy"]
    assert [m["score"] for m in matches] == [100, 100, 81]
    assert all("email" not in m["candidate"] and "phone" not in m["candidate"] for m in matches)


@pytest.mark.asyncio
async def test_matches_min_score_filter_and_pagination(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id)
    pool = [_candidate(f"Candidate {i}") for i in range(3)]
    facts = {t.id: CandidateFacts(skills=(SkillFact("Accounting", "Expert"),)) for t, _ in pool}
    reqs = [req_stub(skill_name="Accounting")]
    db.execute.return_value = _pool_result(pool)
    with patch.object(employer_jobs, "_employer_job", AsyncMock(return_value=job)), \
            patch.object(employer_jobs, "_load_requirements", AsyncMock(return_value=reqs)), \
            patch.object(employer_jobs, "_applicant_ids_for_job", AsyncMock(return_value=set())), \
            patch.object(employer_jobs, "load_candidate_facts", AsyncMock(return_value=facts)):
        async with client_for(app) as client:
            above = await client.get(f"/employer/jobs/{job.id}/matches?min_score=101")
            page = await client.get(f"/employer/jobs/{job.id}/matches?limit=2&offset=2")
    assert above.status_code == 422
    assert page.status_code == 200
    assert page.json()["total"] == 3
    assert len(page.json()["matches"]) == 1


# ---------------------------------------------------------------- applications

@pytest.mark.asyncio
async def test_application_detail_returns_stored_match_and_no_contact_details(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = job_stub(user.organisation_id)
    applicant = SimpleNamespace(id=uuid.uuid4(), full_name="Priya Shah", email="priya@example.com")
    application = SimpleNamespace(id=uuid.uuid4(), applicant_id=applicant.id, status="shortlisted",
                                  employer_note="Strong accounts", interview_at=None, updated_at=None,
                                  applied_at=None)
    row = MagicMock()
    row.one_or_none.return_value = (application, job, applicant, None)
    stored_match = SimpleNamespace(job_id=job.id, trainee_id=applicant.id, match_score=72,
                                   matched_skills=[{"name": "Accounting", "status": "matched"}], missing_skills=[],
                                   explanation="Overall match 72 out of 100.", created_at=None)
    matches_result = MagicMock()
    matches_result.scalars.return_value.all.return_value = [stored_match]
    empty = MagicMock()
    empty.all.return_value = []
    empty.scalars.return_value.all.return_value = []
    db.execute.side_effect = [row, matches_result, empty, empty]
    async with client_for(app) as client:
        response = await client.get(f"/employer/applications/{application.id}")
    assert response.status_code == 200
    body = response.json()
    assert body["match_score"] == 72
    assert body["matched_skills"] == [{"skill": "Accounting", "status": "matched", "confidence": None}]
    assert body["employer_note"] == "Strong accounts"
    assert body["status"] == "shortlisted"
    assert body["allowed_transitions"] == ["interview", "offered", "rejected"]
    assert "email" not in body and "phone" not in body
    assert "priya@example.com" not in response.text


@pytest.mark.asyncio
async def test_status_patch_alias_uses_transition_rules(app_db):
    app, db = app_db
    user = actor()
    app.dependency_overrides[require_user] = lambda: user
    job = SimpleNamespace(id=uuid.uuid4(), organisation_id=user.organisation_id, title="Officer")
    application = SimpleNamespace(id=uuid.uuid4(), applicant_id=uuid.uuid4(), status="applied",
                                  employer_note=None, interview_at=None, updated_at=None)
    row = MagicMock()
    row.one_or_none.return_value = (application, job)
    db.execute.return_value = row
    with patch("app.api.v1.jobs.notify", new_callable=AsyncMock):
        async with client_for(app) as client:
            response = await client.patch(f"/employer/applications/{application.id}/status",
                                          json={"status": "hired"})
    assert response.status_code == 422
    assert application.status == "applied"


# ---------------------------------------------------------------- real database (scratch Postgres)

async def _real_org(name):
    from app.database import AsyncSessionLocal
    from app.models.user import Organisation
    async with AsyncSessionLocal() as session:
        org = Organisation(id=uuid.uuid4(), name=name, type="Employer", state="Gujarat", is_active=True)
        session.add(org)
        await session.commit()
        return org.id


async def _real_user(client, token_factory, role, org_id=None):
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.user import User
    created = await token_factory(client, role)
    async with AsyncSessionLocal() as session:
        user = (await session.execute(select(User).where(User.clerk_user_id == created["clerk_user_id"]))).scalar_one()
        user.organisation_id = org_id
        await session.commit()
        return {"id": user.id, "headers": created["headers"]}


async def _real_profile(user_id, **fields):
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.profile import UserProfile
    async with AsyncSessionLocal() as session:
        profile = (await session.execute(select(UserProfile).where(UserProfile.user_id == user_id))).scalar_one_or_none()
        if profile is None:
            profile = UserProfile(id=uuid.uuid4(), user_id=user_id)
            session.add(profile)
        for key, value in fields.items():
            setattr(profile, key, value)
        await session.commit()


async def _real_skill(user_id, name, level, verified):
    from sqlalchemy import select
    from app.database import AsyncSessionLocal
    from app.models.skill import Skill, TraineeSkill
    async with AsyncSessionLocal() as session:
        skill = (await session.execute(select(Skill).where(Skill.name == name))).scalar_one_or_none()
        if skill is None:
            skill = Skill(id=uuid.uuid4(), name=name, category="Test")
            session.add(skill)
            await session.flush()
        session.add(TraineeSkill(id=uuid.uuid4(), trainee_id=user_id, skill_id=skill.id, level=level,
                                 confidence=80, verified=verified, evidence=["course:test"]))
        await session.commit()


async def _real_cleanup(job_ids, org_ids):
    """Removes the rows this test created so shared scratch listings (e.g. the mobile job feed) stay unchanged."""
    from sqlalchemy import delete, update
    from app.database import AsyncSessionLocal
    from app.models.user import User
    from app.models.job import Application, JobMatch
    from app.models.job import Job
    from app.models.job_detail import JobDetail
    from app.models.job_requirement import JobRequirement
    from app.models.user import Organisation
    async with AsyncSessionLocal() as session:
        for model, column in ((Application, Application.job_id), (JobMatch, JobMatch.job_id),
                              (JobRequirement, JobRequirement.job_id), (JobDetail, JobDetail.job_id)):
            await session.execute(delete(model).where(column.in_(job_ids)))
        await session.execute(delete(Job).where(Job.id.in_(job_ids)))
        await session.execute(update(User).where(User.organisation_id.in_(org_ids)).values(organisation_id=None))
        await session.execute(delete(Organisation).where(Organisation.id.in_(org_ids)))
        await session.commit()


async def _real_application(job_id, applicant_id):
    from app.database import AsyncSessionLocal
    from app.models.job import Application
    async with AsyncSessionLocal() as session:
        app_row = Application(id=uuid.uuid4(), job_id=job_id, applicant_id=applicant_id, status="applied",
                              applied_at=datetime.now(timezone.utc))
        session.add(app_row)
        await session.commit()
        return app_row.id


@pytest.mark.asyncio
async def test_db_lifecycle_matching_and_org_isolation(token_factory):
    """End-to-end on the scratch DB: draft -> requirements -> publish -> matches -> applications -> pause/close,
    with cross-org and trainee denial checked against real rows. Rows created here are removed afterwards."""
    from app.main import app
    org_a = await _real_org("Employer Lifecycle Org A")
    org_b = await _real_org("Employer Lifecycle Org B")
    created_jobs: list[uuid.UUID] = []
    try:
        await _run_db_lifecycle(token_factory, app, org_a, org_b, created_jobs)
    finally:
        await _real_cleanup(created_jobs, [org_a, org_b])


async def _run_db_lifecycle(token_factory, app, org_a, org_b, created_jobs):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        employer_a = await _real_user(client, token_factory, "employer", org_a)
        employer_b = await _real_user(client, token_factory, "employer", org_b)
        trainee = await _real_user(client, token_factory, "trainee")
        visible = await _real_user(client, token_factory, "trainee")
        await _real_profile(visible["id"], visible_to_employers=True, education_level="B.Sc Agriculture",
                            years_of_experience=5, district="Anand", state="Gujarat")
        await _real_profile(trainee["id"], visible_to_employers=False, education_level="SSC",
                            years_of_experience=0)
        await _real_skill(visible["id"], "Accounting", "Expert", True)
        await _real_skill(trainee["id"], "Accounting", "Foundational", False)

        draft = await client.post("/api/v1/employer/jobs", headers=employer_a["headers"],
                                  json={"title": "Accounts Officer", "location": "Anand, Gujarat",
                                        "sector": "Banking", "department": "Finance & Accounts",
                                        "employment_type": "Full-time", "openings": 2,
                                        "experience_required": "2-4 years",
                                        "education": "Graduate (B.A. / B.Com / B.Sc.)",
                                        "deadline": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
                                        "description": LONG_DESCRIPTION})
        assert draft.status_code == 201, draft.text
        job_id = draft.json()["id"]
        created_jobs.append(uuid.UUID(job_id))
        assert draft.json()["status"] == "draft"

        put = await client.put(f"/api/v1/employer/jobs/{job_id}/requirements", headers=employer_a["headers"],
                               json={"requirements": [
                                   {"skill_name": "Accounting", "min_level": "Proficient", "weight": 2}]})
        assert put.status_code == 200, put.text

        published = await client.post(f"/api/v1/employer/jobs/{job_id}/publish", headers=employer_a["headers"])
        assert published.status_code == 200, published.text
        assert published.json()["status"] == "open"

        listed = await client.get("/api/v1/employer/jobs?status=open&q=Accounts", headers=employer_a["headers"])
        assert job_id in [j["id"] for j in listed.json()["jobs"]]

        matches = await client.get(f"/api/v1/employer/jobs/{job_id}/matches", headers=employer_a["headers"])
        assert matches.status_code == 200, matches.text
        by_id = {m["candidate"]["id"]: m for m in matches.json()["matches"]}
        assert str(visible["id"]) in by_id
        assert by_id[str(visible["id"])]["score"] == 100
        assert str(trainee["id"]) not in by_id  # not visible and has not applied
        assert "email" not in by_id[str(visible["id"])]["candidate"]

        application_id = await _real_application(uuid.UUID(job_id), trainee["id"])
        matches = await client.get(f"/api/v1/employer/jobs/{job_id}/matches", headers=employer_a["headers"])
        applicant = next(m for m in matches.json()["matches"] if m["candidate"]["id"] == str(trainee["id"]))
        assert applicant["applied"] is True
        assert applicant["score"] < 100

        detail = await client.get(f"/api/v1/employer/candidates/{visible['id']}?job_id={job_id}",
                                  headers=employer_a["headers"])
        assert detail.status_code == 200, detail.text
        assert detail.json()["match"]["score"] == 100
        assert detail.json()["skills"][0]["proficiency"] == 100
        assert detail.json()["ai_summary"]["text"]
        assert "email" not in detail.json()

        apps = await client.get(f"/api/v1/employer/applications?job_id={job_id}", headers=employer_a["headers"])
        assert apps.status_code == 200
        assert apps.json()["total"] == 1
        assert apps.json()["applications"][0]["id"] == str(application_id)
        assert apps.json()["applications"][0]["match_score"] == applicant["score"]

        app_detail = await client.get(f"/api/v1/employer/applications/{application_id}", headers=employer_a["headers"])
        assert app_detail.status_code == 200, app_detail.text
        assert "shortlisted" in app_detail.json()["allowed_transitions"]
        assert "email" not in app_detail.json()

        status = await client.patch(f"/api/v1/employer/applications/{application_id}/status",
                                    headers=employer_a["headers"], json={"status": "shortlisted", "note": "Call back"})
        assert status.status_code == 200, status.text

        # Cross-org: employer B cannot see A's job, matches, applications or the application itself.
        assert (await client.get(f"/api/v1/employer/jobs/{job_id}", headers=employer_b["headers"])).status_code == 403
        assert (await client.get(f"/api/v1/employer/jobs/{job_id}/matches", headers=employer_b["headers"])).status_code == 403
        assert (await client.get(f"/api/v1/employer/applications/{application_id}", headers=employer_b["headers"])).status_code == 403
        assert (await client.patch(f"/api/v1/employer/applications/{application_id}/status",
                                   headers=employer_b["headers"], json={"status": "rejected"})).status_code == 403
        assert (await client.get("/api/v1/employer/applications", headers=employer_b["headers"])).json()["total"] == 0
        # Trainee cannot use employer endpoints.
        assert (await client.get(f"/api/v1/employer/jobs/{job_id}/matches", headers=trainee["headers"])).status_code == 403

        paused = await client.post(f"/api/v1/employer/jobs/{job_id}/pause", headers=employer_a["headers"])
        assert paused.json()["status"] == "paused"
        closed = await client.post(f"/api/v1/employer/jobs/{job_id}/close", headers=employer_a["headers"])
        assert closed.json()["status"] == "closed"
        assert (await client.patch(f"/api/v1/employer/jobs/{job_id}", headers=employer_a["headers"],
                                   json={"location": "Pune"})).status_code == 409
