"""Malformed Unicode must fail validation before hashing, querying or response encoding."""
import json
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api.auth import login_db, registration_db
from backend.api.sessions import session_db
from backend.main import app


@pytest.mark.parametrize('path,dependency', [('/auth/register', registration_db), ('/auth/login', login_db), ('/auth/token', session_db)])
@pytest.mark.parametrize('surrogate', ['\ud800', '\udfff'])
def test_unpaired_surrogate_password_is_redacted_before_work(path, dependency, surrogate, monkeypatch):
    import backend.api.auth as auth
    session = MagicMock()
    hasher = MagicMock(side_effect=AssertionError('Malformed Unicode must not reach hashing'))
    verifier = MagicMock(side_effect=AssertionError('Malformed Unicode must not reach verification'))
    monkeypatch.setattr(auth, 'hash_password', hasher)
    monkeypatch.setattr(auth, 'verify_password', verifier)
    app.dependency_overrides[dependency] = lambda: session
    payload = {'email': 'golfer@example.com', 'password': 'synthetic-private-marker' + surrogate}
    if path == '/auth/register':
        payload['full_name'] = 'Synthetic Golfer'
    try:
        with TestClient(app, raise_server_exceptions=False) as client:
            response = client.post(path, content=json.dumps(payload, ensure_ascii=True), headers={'Content-Type': 'application/json'})
        assert response.status_code == 422
        assert 'synthetic-private-marker' not in response.text
        hasher.assert_not_called()
        verifier.assert_not_called()
        session.execute.assert_not_called()
        session.add.assert_not_called()
    finally:
        app.dependency_overrides.pop(dependency, None)


@pytest.mark.parametrize('path,dependency', [('/auth/register', registration_db), ('/auth/login', login_db), ('/auth/token', session_db)])
@pytest.mark.parametrize('field', ['email', 'password'])
def test_nested_authentication_values_are_sanitized_before_work(path, dependency, field):
    session = MagicMock()
    payload = {'email': 'golfer@example.com', 'password': 'synthetic passphrase'}
    if path == '/auth/register':
        payload['full_name'] = 'Synthetic Golfer'
    payload[field] = {'synthetic-private-marker': ['nested', 'invalid']}
    app.dependency_overrides[dependency] = lambda: session
    try:
        with TestClient(app) as client:
            response = client.post(path, json=payload)
        assert response.status_code == 422
        assert 'synthetic-private-marker' not in response.text
        assert all('input' not in detail for detail in response.json()['detail'])
        session.execute.assert_not_called()
        session.add.assert_not_called()
    finally:
        app.dependency_overrides.pop(dependency, None)
