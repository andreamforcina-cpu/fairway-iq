"""Unit/API tests override database access; no development database is accessed."""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from argon2 import PasswordHasher
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError, OperationalError

from backend.api.auth import registration_db
from backend.main import app
from backend.security.passwords import hash_password

PAYLOAD = {'full_name': ' John Smith ', 'email': ' JOHN@EXAMPLE.COM ', 'password': 'SecurePassword123!'}


@pytest.fixture
def api():
    session = MagicMock()

    def flush():
        user = session.add.call_args.args[0]
        user.id = uuid4()
        user.created_at = datetime.now(timezone.utc)

    session.flush.side_effect = flush
    app.dependency_overrides[registration_db] = lambda: session
    try:
        with TestClient(app) as client:
            yield client, session
    finally:
        app.dependency_overrides.pop(registration_db, None)


def test_registration_success_and_safe_response(api):
    client, session = api
    result = client.post('/auth/register', json=PAYLOAD)
    assert result.status_code == 201
    assert set(result.json()) == {'id', 'full_name', 'email', 'created_at'}
    assert result.headers['Cache-Control'] == 'no-store'
    assert result.headers['Pragma'] == 'no-cache'
    assert result.json()['email'] == 'john@example.com'
    assert result.json()['full_name'] == 'John Smith'
    user = session.add.call_args.args[0]
    assert PasswordHasher().verify(user.password_hash, PAYLOAD['password'])
    assert PAYLOAD['password'] not in result.text
    assert user.password_hash not in result.text
    session.commit.assert_called_once()


@pytest.mark.parametrize('field,value', [
    ('email', 'invalid'), ('email', 'a' * 321),
    ('full_name', ''), ('full_name', ' '), ('full_name', 'x' * 101), ('full_name', 'A\x00B'),
    ('password', 'weak'), ('password', 'x' * 129), ('password', ' ' * 20),
    ('password', None), ('email', None), ('full_name', None),
])
def test_invalid_registration_does_not_write_or_echo_inputs(api, field, value):
    client, session = api
    result = client.post('/auth/register', json={**PAYLOAD, field: value})
    assert result.status_code == 422
    assert 'input' not in result.json()['detail'][0]
    assert PAYLOAD['password'] not in result.text
    session.add.assert_not_called()
    session.commit.assert_not_called()


def test_extra_fields_and_malformed_json_do_not_echo_secrets(api):
    client, session = api
    for result in [
        client.post('/auth/register', json={**PAYLOAD, 'secret-marker': 'private'}),
        client.post('/auth/register', content='{"password":"secret-marker",', headers={'Content-Type': 'application/json'}),
    ]:
        assert result.status_code == 422
        assert 'secret-marker' not in result.text
    session.add.assert_not_called()


def test_passwords_are_salted_argon2id():
    first = hash_password(PAYLOAD['password'])
    second = hash_password(PAYLOAD['password'])
    assert first.startswith('$argon2id$v=19$m=65536,t=3,p=4$')
    assert first != second
    assert PasswordHasher().verify(first, PAYLOAD['password'])


@pytest.mark.parametrize('duplicate', [True, False])
def test_database_errors_are_safe_and_rollback(api, duplicate):
    client, session = api
    original = SimpleNamespace(sqlstate='23505', diag=SimpleNamespace(constraint_name='ix_users_email'))
    session.flush.side_effect = (IntegrityError('private-sql', {'password': 'private-secret'}, original)
                                if duplicate else OperationalError('private-sql', {}, Exception('private-secret')))
    result = client.post('/auth/register', json=PAYLOAD)
    assert result.status_code == (409 if duplicate else 503)
    assert 'private' not in result.text
    session.rollback.assert_called_once()
    session.commit.assert_not_called()


def test_commit_failure_is_not_success(api):
    client, session = api
    session.commit.side_effect = OperationalError('secret', {}, Exception('secret'))
    result = client.post('/auth/register', json=PAYLOAD)
    assert result.status_code == 503
    assert 'secret' not in result.text
    session.rollback.assert_called_once()


def test_unrelated_integrity_failure_is_not_reported_as_duplicate(api):
    client, session = api
    original = SimpleNamespace(sqlstate='23514', diag=SimpleNamespace(constraint_name='private-constraint'))
    session.flush.side_effect = IntegrityError('private', {}, original)
    result = client.post('/auth/register', json=PAYLOAD)
    assert result.status_code == 503
    assert 'private' not in result.text
    session.rollback.assert_called_once()


def test_hash_failure_does_not_write(api, monkeypatch):
    from argon2.exceptions import HashingError
    import backend.api.auth as auth

    client, session = api
    monkeypatch.setattr(auth, 'hash_password', MagicMock(side_effect=HashingError('private')))
    result = client.post('/auth/register', json=PAYLOAD)
    assert result.status_code == 503
    assert 'private' not in result.text
    session.add.assert_not_called()
    session.commit.assert_not_called()


def test_missing_database_configuration_returns_safe_error(monkeypatch):
    import backend.api.auth as auth
    from backend.core.config import Settings

    def unavailable():
        Settings(_env_file=None, database_url=None)
        yield

    monkeypatch.setattr(auth, 'get_db', unavailable)
    with TestClient(app) as client:
        result = client.post('/auth/register', json=PAYLOAD)
    assert result.status_code == 503
    assert result.json() == {'detail': 'Registration is temporarily unavailable.'}
