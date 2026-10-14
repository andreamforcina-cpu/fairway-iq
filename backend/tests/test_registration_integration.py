"""Real PostgreSQL registration tests, isolated by the existing rollback fixture."""
import pytest
from argon2 import PasswordHasher
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session, undefer

from backend.api.auth import registration_db
from backend.main import app
from backend.models import User
from backend.tests.test_database_integration import connection  # noqa: F401


@pytest.fixture
def registration_client(connection):
    def test_db():
        with Session(bind=connection, join_transaction_mode='create_savepoint') as session:
            yield session

    app.dependency_overrides[registration_db] = test_db
    try:
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.pop(registration_db, None)


def test_register_persists_hash_and_rejects_normalized_duplicate(registration_client, connection):
    payload = {'full_name': ' Test Golfer ', 'email': 'TEST@example.com', 'password': 'IntegrationPassword123!'}
    response = registration_client.post('/auth/register', json=payload)
    assert response.status_code == 201
    assert set(response.json()) == {'id', 'full_name', 'email', 'created_at'}
    with Session(bind=connection, join_transaction_mode='create_savepoint') as session:
        user = session.scalar(select(User).options(undefer(User.password_hash)))
        assert user.email == 'test@example.com'
        assert user.full_name == 'Test Golfer'
        assert PasswordHasher().verify(user.password_hash, payload['password'])
        assert user.password_hash not in response.text
    duplicate = registration_client.post('/auth/register', json={**payload, 'email': 'test@example.com'})
    assert duplicate.status_code == 409
    assert duplicate.json() == {'detail': 'Unable to register with these details.'}
    # A failed duplicate must leave subsequent transactions usable.
    assert registration_client.post('/auth/register', json={**payload, 'email': 'other@example.com'}).status_code == 201
