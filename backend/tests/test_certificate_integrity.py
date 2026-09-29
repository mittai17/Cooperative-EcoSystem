import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.database import AsyncSessionLocal
from app.main import app
from app.models.certificate import Certificate
from app.models.programme import Batch, Enrollment, Programme


@pytest.mark.asyncio
async def test_signed_certificate_detects_tamper_and_revocation(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        admin = await token_factory(client, role="admin")
        trainee = await token_factory(client, role="trainee")
        programme = Programme(id=uuid.uuid4(), title="Test Governance", sector="Governance")
        batch = Batch(id=uuid.uuid4(), programme_id=programme.id, name="Test", min_attendance_pct=0)
        enrollment = Enrollment(id=uuid.uuid4(), trainee_id=uuid.UUID(trainee["id"]),
                                batch_id=batch.id, status="active")
        async with AsyncSessionLocal() as db:
            db.add(programme)
            await db.flush()
            db.add(batch)
            await db.flush()
            db.add(enrollment)
            await db.commit()
        eligibility = await client.get("/api/v1/certificates/eligibility", headers=admin["headers"],
                                       params={"programme_id": str(programme.id), "batch_id": str(batch.id)})
        assert eligibility.status_code == 200, eligibility.text
        assert eligibility.json()["trainees"][0]["eligible"] is True
        issue = await client.post("/api/v1/certificates/issue", headers=admin["headers"],
                                  json={"trainee_id": trainee["id"], "programme_id": str(programme.id), "grade": "A"})
        assert issue.status_code == 200, issue.text
        code = issue.json()["verification_code"]
        verify = await client.get(f"/api/v1/certificates/verify/{code}")
        assert verify.status_code == 200
        assert verify.json()["valid"] is True
        assert verify.json()["integrity"] == "ok"
        repeated = await client.post("/api/v1/certificates/issue", headers=admin["headers"],
                                     json={"trainee_id": trainee["id"], "programme_id": str(programme.id)})
        assert repeated.status_code == 409
        assert (await client.get("/api/v1/certificates/verify/CST-2026-DAI-00842")).json()["valid"] is False
        async with AsyncSessionLocal() as db:
            cert = await db.get(Certificate, uuid.UUID(issue.json()["id"]))
            cert.grade = "A+"
            await db.commit()
        tampered = await client.get(f"/api/v1/certificates/verify/{code}")
        assert tampered.json()["valid"] is False
        assert tampered.json()["integrity"] == "failed"
        async with AsyncSessionLocal() as db:
            cert = await db.get(Certificate, uuid.UUID(issue.json()["id"]))
            cert.grade = "A"
            await db.commit()
        revoke = await client.post(f"/api/v1/certificates/{code}/revoke", headers=admin["headers"],
                                   json={"reason": "Issued in error"})
        assert revoke.status_code == 200, revoke.text
        revoked = await client.get(f"/api/v1/certificates/verify/{code}")
        assert revoked.json()["status"] == "revoked"
        assert revoked.json()["integrity"] == "ok"
        assert revoked.json()["valid"] is False
