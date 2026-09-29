"""Access-control regressions for the current authenticated contracts."""
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_anonymous_privileged_writes_are_rejected():
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
        responses = [
            await client.post('/api/v1/programmes/', json={'title': 'Unauthorized'}),
            await client.patch(f'/api/v1/users/{uuid.uuid4()}', json={'role': 'admin'}),
            await client.post('/api/v1/certificates/issue', json={
                'trainee_id': str(uuid.uuid4()), 'programme_id': str(uuid.uuid4())}),
            await client.post('/api/v1/offline-sync/batch', json={'items': []}),
            await client.get('/api/v1/analytics/overview'),
        ]
    assert all(response.status_code == 401 for response in responses)


@pytest.mark.asyncio
async def test_trainee_cannot_escalate_and_admin_can_create_programme(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
        trainee = await token_factory(client)
        admin = await token_factory(client, 'admin')
        escalation = await client.patch(f"/api/v1/users/{trainee['id']}",
                                        headers=trainee['headers'], json={'role': 'admin'})
        assert escalation.status_code == 403
        denied = await client.post('/api/v1/programmes/', headers=trainee['headers'],
                                   json={'title': 'Unauthorized'})
        assert denied.status_code == 403
        created = await client.post('/api/v1/programmes/', headers=admin['headers'],
                                    json={'title': f'JWT Test {uuid.uuid4().hex[:8]}', 'sector': 'Dairy'})
        assert created.status_code == 200, created.text
        assert (await client.post('/api/v1/assessments/a1/submit', headers=trainee['headers'],
                                  params={'score': 100})).status_code in (410, 422)
