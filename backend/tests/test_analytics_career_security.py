import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select

from app.database import AsyncSessionLocal
from app.main import app
from app.models.user import User
from app.models.certificate import Certificate
from app.models.job import Application


@pytest.mark.asyncio
async def test_national_counts_are_real_and_admin_only(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
        assert (await client.get('/api/v1/analytics/overview')).status_code == 401
        trainee = await token_factory(client)
        assert (await client.get('/api/v1/analytics/overview', headers=trainee['headers'])).status_code == 403
        admin = await token_factory(client, 'admin')
        response = await client.get('/api/v1/analytics/overview', headers=admin['headers'])
    assert response.status_code == 200
    async with AsyncSessionLocal() as db:
        trainees = (await db.execute(select(func.count()).select_from(User).where(User.role == 'trainee'))).scalar_one()
        certificates = (await db.execute(select(func.count()).select_from(Certificate))).scalar_one()
    assert response.json()['trainees'] == trainees
    assert response.json()['certificates'] == certificates
    assert 0 <= response.json()['employment_rate'] <= 100


@pytest.mark.asyncio
async def test_career_ignores_client_context_and_is_identity_scoped(token_factory):
    async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
        trainee = await token_factory(client)
        other = await token_factory(client)
        with patch('app.api.v1.career.generate_career_response', new=AsyncMock(return_value=None)):
            reply = await client.post('/api/v1/career/chat', headers=trainee['headers'], json={
                'message': 'What next?', 'lang': 'hi',
                'trainee_context': {'skills': [{'name': 'Invented privilege', 'verified': True}]}})
        assert reply.status_code == 200
        assert 'Invented privilege' not in reply.json()['response']
        assert 'आपका लक्ष्य' in reply.json()['response']
        mine = (await client.get('/api/v1/career/chat/history', headers=trainee['headers'])).json()['messages']
        theirs = (await client.get('/api/v1/career/chat/history', headers=other['headers'])).json()['messages']
        assert len(mine) >= 2 and theirs == []
        forbidden = await client.post('/api/v1/career/chat', headers=trainee['headers'], json={
            'message': 'Hi', 'trainee_id': other['id']})
        assert forbidden.status_code == 403
