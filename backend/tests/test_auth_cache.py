"""Authentication responses, including errors, must not be stored by intermediaries."""
import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.mark.parametrize('method,path,body', [
    ('POST', '/auth/register', {}),
    ('POST', '/auth/login', {}),
    ('POST', '/auth/token', {}),
    ('POST', '/auth/refresh', {}),
    ('POST', '/auth/logout', {}),
    ('GET', '/auth/me', None),
    ('GET', '/auth/token', None),
])
def test_auth_errors_are_not_cacheable(method, path, body, monkeypatch):
    import backend.api.auth as auth
    import backend.api.sessions as sessions

    class UnusedDatabase:
        def __getattr__(self, name):
            raise AssertionError('Invalid requests must not execute database operations.')

    def unused_db():
        yield UnusedDatabase()

    # Dependency setup precedes body validation. Do not depend on a private .env
    # or open a real connection just to inspect validation/authentication headers.
    monkeypatch.setattr(auth, 'get_db', unused_db)
    monkeypatch.setattr(sessions, 'get_db', unused_db)
    with TestClient(app) as client:
        response = client.request(method, path, json=body)
    assert response.status_code in {401, 405, 422}
    assert response.headers.get('Cache-Control') == 'no-store'
    assert response.headers.get('Pragma') == 'no-cache'


def test_public_health_does_not_receive_authentication_cache_policy():
    with TestClient(app) as client:
        response = client.get('/health')
    assert response.status_code == 200
    assert 'Cache-Control' not in response.headers


def test_database_error_response_also_gets_no_store(monkeypatch):
    from sqlalchemy.exc import OperationalError
    import backend.api.auth as auth
    def unavailable():
        raise OperationalError('synthetic-query', {}, Exception('synthetic-secret'))
        yield
    monkeypatch.setattr(auth, 'get_db', unavailable)
    with TestClient(app) as client:
        response = client.post('/auth/login', json={'email': 'golfer@example.com', 'password': 'synthetic'})
    assert response.status_code == 503
    assert response.headers['Cache-Control'] == 'no-store'
    assert response.headers['Pragma'] == 'no-cache'
    assert 'synthetic' not in response.text
