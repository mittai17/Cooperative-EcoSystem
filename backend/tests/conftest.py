"""Explicit local identity fixtures; never replace authentication globally."""
import os
from urllib.parse import urlparse
import uuid
from unittest.mock import AsyncMock, patch

import pytest

# Refuse the production .env before app.database is imported during collection.
url = urlparse(os.environ.get('DATABASE_URL', ''))
if url.hostname not in ('localhost', '127.0.0.1') or url.port != 55432:
    raise pytest.UsageError('Run tests via python scripts/scratch_backend.py pytest (scratch DB only)')


@pytest.fixture
def token_factory():
    """Provision test users through the real sync handler with mocked Clerk data."""
    profiles = {}

    async def verify(token):
        from app.services.clerk import TokenVerificationError
        if not token.startswith('fixture:') or token[8:] not in profiles:
            raise TokenVerificationError('Invalid fixture token')
        return {'sub': token[8:]}

    async def profile(clerk_id):
        return profiles[clerk_id]

    async def create(client, role='trainee'):
        clerk_id = f'user_fixture_{uuid.uuid4().hex}'
        email = f'{clerk_id}@example.com'
        profiles[clerk_id] = {
            'id': clerk_id, 'first_name': 'Test', 'last_name': role,
            'primary_email_address_id': 'email',
            'email_addresses': [{'id': 'email', 'email_address': email}],
            'public_metadata': {'role': role},
        }
        headers = {'Authorization': f'Bearer fixture:{clerk_id}'}
        result = await client.post('/api/v1/auth/sync', headers=headers, json={
            'clerk_user_id': clerk_id, 'email': email, 'full_name': f'Test {role}', 'role': role,
        })
        assert result.status_code == 200, result.text
        return {**result.json(), 'clerk_user_id': clerk_id, 'headers': headers}

    with patch('app.deps.verify_session_token', side_effect=verify), patch(
        'app.services.clerk.get_clerk_user', side_effect=profile
    ):
        yield create
