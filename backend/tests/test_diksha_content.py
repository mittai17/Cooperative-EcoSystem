"""DIKSHA content search tests.

No live network calls: the httpx client is replaced for every test via
svc._new_client, and an autouse guard fails any test that opens a client without
a fixture asking for one. The database is an AsyncMock session, so nothing
touches Postgres.
"""
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1 import diksha_content
from app.database import get_db
from app.deps import require_user
from app.services import diksha_content as svc

BASE = "/content/diksha"
OK_HOST = "https://obj.diksha.gov.in/"


# ---------------------------------------------------------------- helpers

def user(role="trainee"):
    return SimpleNamespace(id=uuid.uuid4(), role=role, organisation_id=None, is_active=True)


def raw_item(identifier, artifact_url=None, **extra):
    item = {
        "identifier": identifier,
        "name": f"Video {identifier}",
        "artifactUrl": f"{OK_HOST}content/{identifier}.mp4" if artifact_url is None else artifact_url,
        "language": ["Hindi", "English"],
        "subject": ["Science"],
        "license": "CC BY 4.0",
        "copyright": "NCERT",
        "size": 5242880,
        "description": "A lesson.",
    }
    item.update(extra)
    return item


def search_ok(items):
    return httpx.Response(200, json={"params": {"status": "successful"}, "result": {"count": len(items), "content": items}})


def _forbidden_client():
    raise AssertionError("unexpected outbound HTTP client in DIKSHA tests")


class _FakeClient:
    """Stands in for httpx.AsyncClient inside the service; records posts, never sends."""

    def __init__(self, post):
        self.post = post

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False


@pytest.fixture(autouse=True)
def _no_network():
    """Any outbound client creation fails the test loudly unless upstream() is used."""
    svc.clear_cache()
    with patch.object(svc, "_new_client", side_effect=_forbidden_client):
        yield
    svc.clear_cache()


@pytest.fixture
def upstream():
    """Enables the search client with a mocked POST. Set `.return_value` or `.side_effect` on the yielded mock."""
    post = AsyncMock(return_value=search_ok([]))
    with patch.object(svc, "_new_client", side_effect=lambda: _FakeClient(post)):
        yield post


@pytest.fixture
def app_db():
    app = FastAPI()
    app.include_router(diksha_content.router, prefix=BASE)
    db = AsyncMock()
    app.dependency_overrides[get_db] = lambda: db
    return app, db


def as_user(app, u):
    app.dependency_overrides[require_user] = lambda: u


def client_for(app):
    return AsyncClient(transport=ASGITransport(app), base_url="http://test")


# ---------------------------------------------------------------- normalisation

async def test_returns_normalised_playable_items(app_db, upstream):
    app, _db = app_db
    as_user(app, user())
    upstream.return_value = search_ok([raw_item("do_1", size=5242880), raw_item("do_2", size=None, subject=[], language="Hindi")])
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "  hindi science  ", "limit": 5, "offset": 10})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["limit"] == 5
    assert body["offset"] == 10
    assert body["items"][0] == {
        "identifier": "do_1",
        "title": "Video do_1",
        "subject": "Science",
        "language": "Hindi, English",
        "license": "CC BY 4.0",
        "copyright": "NCERT",
        "size_mb": 5.0,
        "video_url": f"{OK_HOST}content/do_1.mp4",
    }
    assert body["items"][1]["size_mb"] is None
    assert body["items"][1]["subject"] is None
    assert body["items"][1]["language"] == "Hindi"

    sent = upstream.call_args.kwargs["json"]["request"]
    assert sent["query"] == "hindi science"
    assert sent["filters"] == {"contentType": ["Resource"], "mimeType": ["video/mp4"]}
    assert sent["limit"] == 5 and sent["offset"] == 10


async def test_subject_is_added_to_query_text_not_filters(app_db, upstream):
    app, _db = app_db
    as_user(app, user())
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "gravity", "subject": "Physics"})
    assert resp.status_code == 200, resp.text
    sent = upstream.call_args.kwargs["json"]["request"]
    assert sent["query"] == "gravity Physics"
    assert "subject" not in sent["filters"]


async def test_drops_items_not_on_diksha_object_store(app_db, upstream):
    app, _db = app_db
    as_user(app, user())
    upstream.return_value = search_ok([
        raw_item("ok_1"),
        raw_item("evil_host", artifact_url="https://evil.example.com/x.mp4"),
        raw_item("lookalike", artifact_url="https://obj.diksha.gov.in.evil.com/x.mp4"),
        raw_item("plain_http", artifact_url="http://obj.diksha.gov.in/x.mp4"),
        raw_item("no_url", artifact_url=""),
    ])
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "science"})
    assert resp.status_code == 200, resp.text
    assert [item["identifier"] for item in resp.json()["items"]] == ["ok_1"]


# ---------------------------------------------------------------- validation

@pytest.mark.parametrize("subject", ["Art", "science", "", "Physics; DROP TABLE"])
async def test_unknown_subject_is_422(app_db, upstream, subject):
    app, _db = app_db
    as_user(app, user())
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "science", "subject": subject})
    assert resp.status_code == 422
    upstream.assert_not_awaited()


@pytest.mark.parametrize("q", ["a", " a ", "", "x" * 101])
async def test_query_length_is_422(app_db, upstream, q):
    app, _db = app_db
    as_user(app, user())
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": q})
    assert resp.status_code == 422
    upstream.assert_not_awaited()


@pytest.mark.parametrize("params", [{"limit": 0}, {"limit": 25}, {"offset": -1}, {"offset": 501}])
async def test_limit_and_offset_bounds_are_422(app_db, upstream, params):
    app, _db = app_db
    as_user(app, user())
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "science", **params})
    assert resp.status_code == 422
    upstream.assert_not_awaited()


# ---------------------------------------------------------------- upstream failures

async def test_upstream_failed_status_is_502(app_db, upstream):
    app, _db = app_db
    as_user(app, user())
    upstream.return_value = httpx.Response(200, json={"params": {"status": "failed", "errmsg": "x"}, "result": {}})
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "science"})
    assert resp.status_code == 502
    assert "unavailable" in resp.json()["detail"]


async def test_upstream_non_200_is_502(app_db, upstream):
    app, _db = app_db
    as_user(app, user())
    upstream.return_value = httpx.Response(503, text="maintenance")
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "science"})
    assert resp.status_code == 502


async def test_upstream_network_error_is_502(app_db, upstream):
    app, _db = app_db
    as_user(app, user())
    upstream.side_effect = httpx.ConnectError("connection refused")
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "science"})
    assert resp.status_code == 502


async def test_failed_search_is_not_cached(app_db, upstream):
    app, _db = app_db
    as_user(app, user())
    upstream.side_effect = [httpx.ConnectError("down"), search_ok([raw_item("do_9")])]
    async with client_for(app) as client:
        first = await client.get(f"{BASE}/search", params={"q": "science"})
        second = await client.get(f"{BASE}/search", params={"q": "science"})
    assert first.status_code == 502
    assert second.status_code == 200
    assert upstream.await_count == 2


# ---------------------------------------------------------------- auth and roles

async def test_anonymous_is_401(app_db, upstream):
    app, _db = app_db  # require_user is NOT overridden: the real token check must reject.
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "science"})
    assert resp.status_code == 401
    upstream.assert_not_awaited()


@pytest.mark.parametrize("role", ["trainee", "trainer", "admin"])
async def test_allowed_roles_pass(app_db, upstream, role):
    app, _db = app_db
    as_user(app, user(role=role))
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "science"})
    assert resp.status_code == 200, resp.text


@pytest.mark.parametrize("role", ["employer", "institution", "ncct_admin"])
async def test_excluded_roles_are_403(app_db, upstream, role):
    app, _db = app_db
    as_user(app, user(role=role))
    async with client_for(app) as client:
        resp = await client.get(f"{BASE}/search", params={"q": "science"})
    assert resp.status_code == 403
    upstream.assert_not_awaited()


# ---------------------------------------------------------------- cache

async def test_second_identical_call_is_served_from_cache(app_db, upstream):
    app, _db = app_db
    as_user(app, user())
    upstream.return_value = search_ok([raw_item("do_1")])
    async with client_for(app) as client:
        first = await client.get(f"{BASE}/search", params={"q": "science", "limit": 12, "offset": 0})
        second = await client.get(f"{BASE}/search", params={"q": "science", "limit": 12, "offset": 0})
        other_page = await client.get(f"{BASE}/search", params={"q": "science", "limit": 12, "offset": 12})
    assert first.json() == second.json()
    assert other_page.status_code == 200
    assert upstream.await_count == 2  # one for the first call, one for the different offset
