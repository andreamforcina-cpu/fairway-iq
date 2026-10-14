"""Credential verification tests never access the configured development database."""
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from backend.api.auth import login_db
from backend.main import app
from backend.security.passwords import hash_password, verify_password

PASSWORD = 'TestCredentialPassword123!'


@pytest.fixture
def api():
    session = MagicMock()
    session.execute.return_value.one_or_none.return_value = SimpleNamespace(
        password_hash=hash_password(PASSWORD), is_active=True,
    )
    app.dependency_overrides[login_db] = lambda: session
    try:
        with TestClient(app) as client:
            yield client, session
    finally:
        app.dependency_overrides.pop(login_db, None)


def test_valid_and_normalized_login(api):
    client, session = api
    result = client.post('/auth/login', json={'email': ' TEST@EXAMPLE.COM ', 'password': PASSWORD})
    assert result.status_code == 200
    assert result.json() == {'message': 'Credentials verified. No authenticated session has been created.'}
    assert session.execute.call_args.args[0].compile().params == {'email_1': 'test@example.com'}
    assert not result.cookies
    session.commit.assert_not_called()
    session.add.assert_not_called()


def test_unknown_wrong_and_inactive_are_indistinguishable(api):
    client, session = api
    responses = []
    for account, password in [
        (SimpleNamespace(password_hash=hash_password(PASSWORD), is_active=True), 'wrong'),
        (None, PASSWORD),
        (SimpleNamespace(password_hash=hash_password(PASSWORD), is_active=False), PASSWORD),
    ]:
        session.execute.return_value.one_or_none.return_value = account
        result = client.post('/auth/login', json={'email': 'test@example.com', 'password': password})
        assert result.status_code == 401
        responses.append(result.json())
        assert PASSWORD not in result.text
    assert responses == [{'detail': 'Invalid email or password.'}] * 3


@pytest.mark.parametrize('body', [
    {'email': 'invalid', 'password': PASSWORD},
    {'email': 'test@example.com', 'password': ''},
    {'email': 'test@example.com', 'password': 'x' * 129},
    {'email': 'test@example.com', 'password': None},
    {'email': 'test@example.com'},
    {'email': 'test@example.com', 'password': PASSWORD, 'private-marker': 'secret'},
])
def test_invalid_input_is_redacted_without_query(api, body):
    client, session = api
    result = client.post('/auth/login', json=body)
    assert result.status_code == 422
    assert PASSWORD not in result.text and 'private-marker' not in result.text
    assert all('input' not in item for item in result.json()['detail'])
    session.execute.assert_not_called()


def test_malformed_json_is_redacted(api):
    client, session = api
    result = client.post('/auth/login', content='{"password":"private-marker",', headers={'Content-Type': 'application/json'})
    assert result.status_code == 422
    assert 'private-marker' not in result.text
    session.execute.assert_not_called()


def test_database_failure_is_safe(api):
    client, session = api
    session.execute.side_effect = OperationalError('private-query', {}, Exception('private-secret'))
    result = client.post('/auth/login', json={'email': 'test@example.com', 'password': PASSWORD})
    assert result.status_code == 503
    assert 'private' not in result.text and PASSWORD not in result.text
    session.rollback.assert_called_once()


def test_missing_configuration_is_safe(monkeypatch):
    import backend.api.auth as auth
    from backend.core.config import Settings

    def unavailable():
        Settings(_env_file=None, database_url=None)
        yield

    monkeypatch.setattr(auth, 'get_db', unavailable)
    with TestClient(app) as client:
        result = client.post('/auth/login', json={'email': 'test@example.com', 'password': PASSWORD})
    assert result.status_code == 503
    assert result.json() == {'detail': 'Credential verification is temporarily unavailable.'}


def test_unknown_account_performs_dummy_argon2_verification(monkeypatch):
    import backend.security.passwords as passwords
    hasher = MagicMock(wraps=passwords._hasher)
    spy = hasher.verify
    monkeypatch.setattr(passwords, '_hasher', hasher)
    assert not verify_password(None, PASSWORD)
    spy.assert_called_once_with(passwords._DUMMY_HASH, PASSWORD)


def test_malformed_hash_fails_closed():
    assert not verify_password('not-an-argon2-hash', PASSWORD)
