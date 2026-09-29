import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.main import app
from app.models.programme import Enrollment, Programme


@pytest.mark.asyncio
async def test_nomination_approval_creates_one_enrollment(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
        admin = await token_factory(client, 'admin')
        trainee = await token_factory(client)
        p = await client.post('/api/v1/programmes/', headers=admin['headers'],
                              json={'title': f'Nomination fixture {uuid.uuid4()}', 'sector': 'Dairy', 'seats_total': 1})
        assert p.status_code == 200, p.text
        programme_id = p.json()['id']
        batch = await client.post(f'/api/v1/programmes/{programme_id}/batches',
                                  headers=admin['headers'], json={'name': 'Batch A', 'capacity': 1})
        assert batch.status_code == 200, batch.text
        nomination = await client.post('/api/v1/programmes/nominations', headers=trainee['headers'],
                                       json={'programme_id': programme_id})
        assert nomination.status_code == 200, nomination.text
        duplicate = await client.post('/api/v1/programmes/nominations', headers=trainee['headers'],
                                      json={'programme_id': programme_id})
        assert duplicate.status_code == 409
        assert (await client.patch(f"/api/v1/programmes/nominations/{nomination.json()['id']}",
                                   params={'status': 'approved', 'batch_id': batch.json()['id']},
                                   headers=trainee['headers'])).status_code == 403
        approved = await client.patch(f"/api/v1/programmes/nominations/{nomination.json()['id']}",
                                      params={'status': 'approved', 'batch_id': batch.json()['id']},
                                      headers=admin['headers'])
        assert approved.status_code == 200, approved.text
        repeat = await client.patch(f"/api/v1/programmes/nominations/{nomination.json()['id']}",
                                    params={'status': 'approved', 'batch_id': batch.json()['id']},
                                    headers=admin['headers'])
        assert repeat.status_code == 409
        mine = await client.get('/api/v1/programmes/nominations/my', headers=trainee['headers'])
        assert mine.json()[0]['status'] == 'approved'
    async with AsyncSessionLocal() as db:
        enrollments = (await db.execute(select(Enrollment).where(Enrollment.trainee_id == uuid.UUID(trainee['id']),
                                                          Enrollment.batch_id == uuid.UUID(batch.json()['id'])))).scalars().all()
        programme = await db.get(Programme, uuid.UUID(programme_id))
        assert len(enrollments) == 1
        assert programme.seats_filled == 1
