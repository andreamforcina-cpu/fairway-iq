"""Session primitives and API failure paths; no development database access."""
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import OperationalError

from backend.api.sessions import session_db
from backend.main import app
from backend.security.tokens import new_token, token_digest, valid_token


def test_purpose_separation_entropy_and_digest():
    access, refresh = new_token('access'), new_token('refresh')
    assert access != new_token('access')
    assert len(access) == len(refresh) == 48
    assert valid_token(access, 'access') and valid_token(refresh, 'refresh')
    assert not valid_token(access, 'refresh')
    assert not valid_token(refresh, 'access')
    assert token_digest(access) == token_digest(access)
    assert len(token_digest(access)) == 64 and access not in token_digest(access)


@pytest.fixture
def api():
    db = MagicMock()
    app.dependency_overrides[session_db] = lambda: db
    try:
        with TestClient(app) as client:
            yield client, db
    finally:
        app.dependency_overrides.pop(session_db, None)


@pytest.mark.parametrize('path', ['/auth/token', '/auth/refresh', '/auth/logout'])
def test_invalid_inputs_never_echo_secrets(api, path):
    client, db = api
    response = client.post(path, json={'password': 'private-marker', 'refresh_token': 'private-marker'})
    assert response.status_code == 422
    assert 'private-marker' not in response.text
    db.execute.assert_not_called()
    db.scalar.assert_not_called()
    db.commit.assert_not_called()


@pytest.mark.parametrize('authorization', [None, 'Basic private-marker', 'Bearer private-marker'])
def test_me_requires_bearer(api, authorization):
    client, db = api
    response = client.get('/auth/me', headers={'Authorization': authorization} if authorization else {})
    assert response.status_code == 401
    assert response.headers['WWW-Authenticate'] == 'Bearer'
    assert 'private-marker' not in response.text
    db.scalar.assert_not_called()


@pytest.mark.parametrize('path', ['/auth/token', '/auth/refresh', '/auth/logout', '/auth/me'])
def test_database_errors_do_not_leak(monkeypatch, path):
    import backend.api.sessions as routes

    def unavailable():
        raise OperationalError('private-query', {}, Exception('private-secret'))
        yield

    monkeypatch.setattr(routes, 'get_db', unavailable)
    with TestClient(app) as client:
        response = (client.get(path, headers={'Authorization': 'Bearer ' + new_token('access')})
                    if path.endswith('me') else client.post(path, json=(
                        {'email': 'test@example.com', 'password': 'IntegrationPassword123!'}
                        if path.endswith('token') else {'refresh_token': new_token('refresh')})))
    assert response.status_code == 503
    assert response.json() == {'detail': 'Authentication is temporarily unavailable.'}


def test_login_and_token_share_rate_limit():
    from backend.security.rate_limits import AuthRateLimiter
    limiter = AuthRateLimiter(clock=lambda: 0)
    for _ in range(10):
        assert limiter.check('/auth/login', 'peer') is None
        assert limiter.check('/auth/token', 'peer') is None
    assert limiter.check('/auth/login', 'peer') == 60
    assert limiter.check('/auth/token', 'peer') == 60
