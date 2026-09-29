import uuid

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.main import app
from app.models.course import Module


@pytest.mark.asyncio
async def test_offline_batch_requires_auth_and_replays_once(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
        assert (await client.get('/api/v1/offline-sync/status')).status_code == 200
        assert (await client.post('/api/v1/offline-sync/batch', json={'items': []})).status_code == 401
        trainee = await token_factory(client)
        other = await token_factory(client)
        async with AsyncSessionLocal() as db:
            module_id = (await db.execute(select(Module.id).limit(1))).scalar_one()
        client_id = uuid.uuid4().hex
        body = {'items': [{'id': client_id, 'action': 'MARK_LESSON_COMPLETE',
                           'payload': {'lesson_id': str(module_id)}}]}
        first = await client.post('/api/v1/offline-sync/batch', headers=trainee['headers'], json=body)
        assert first.status_code == 200, first.text
        assert first.json()['results'][0]['status'] == 'success'
        second = await client.post('/api/v1/offline-sync/batch', headers=trainee['headers'], json=body)
        assert second.json()['results'][0]['status'] == 'duplicate'
        stolen = await client.post('/api/v1/offline-sync/batch', headers=other['headers'], json=body)
        assert stolen.json()['results'][0]['status'] == 'rejected'


@pytest.mark.asyncio
async def test_offline_assessment_score_is_not_accepted(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
        trainee = await token_factory(client)
        response = await client.post('/api/v1/offline-sync/batch', headers=trainee['headers'],
                                     json={'items': [{'id': uuid.uuid4().hex,
                                                      'action': 'SUBMIT_ASSESSMENT',
                                                      'payload': {'score': 100}}]})
        assert response.status_code == 422
