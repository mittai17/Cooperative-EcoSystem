"""Legacy test setup through authenticated sync, with Clerk mocked locally."""
from unittest.mock import patch
import uuid


async def sync_fixture(client, role='trainee', clerk_id=None, email=None, full_name=None):
    clerk_id = clerk_id or f'user_fixture_{uuid.uuid4().hex}'
    email = email or f'{clerk_id}@example.com'
    profile = {'id': clerk_id, 'first_name': full_name or f'Test {role}', 'last_name': '',
               'primary_email_address_id': 'e', 'email_addresses': [{'id': 'e', 'email_address': email}],
               'public_metadata': {'role': role}}
    with patch('app.deps.verify_session_token', return_value={'sub': clerk_id}), patch(
        'app.services.clerk.get_clerk_user', return_value=profile
    ):
        response = await client.post('/api/v1/auth/sync',
            headers={'Authorization': 'Bearer fixture-sync'},
            json={'clerk_user_id': clerk_id, 'email': email, 'full_name': full_name, 'role': role})
    assert response.status_code == 200, response.text
    return {**response.json(), 'clerk_user_id': clerk_id, 'role': role}


async def create_programme(client):
    admin = await sync_fixture(client, 'admin')
    with patch('app.deps.verify_session_token', return_value={'sub': admin['clerk_user_id']}):
        response = await client.post('/api/v1/programmes/',
            headers={'Authorization': 'Bearer fixture-admin'},
            json={'title': f'Test Programme {uuid.uuid4().hex}', 'sector': 'Testing'})
    assert response.status_code == 200, response.text
    return response.json()
