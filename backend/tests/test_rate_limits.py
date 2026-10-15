from concurrent.futures import ThreadPoolExecutor
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api.auth import login_db, registration_db
from backend.api.sessions import session_db
from backend.main import app
from backend.security.rate_limits import AUTH_LIMITS, AuthRateLimiter, AuthRateLimitMiddleware


def test_sliding_window_boundary_and_independent_clients_and_paths():
    now = [0.0]
    limiter = AuthRateLimiter(clock=lambda: now[0])
    for _ in range(5):
        assert limiter.check('/auth/register', 'first') is None
    assert limiter.check('/auth/register', 'first') == 60
    assert limiter.check('/auth/register', 'second') is None
    assert limiter.check('/auth/login', 'first') is None
    now[0] = 59.2
    assert limiter.check('/auth/register', 'first') == 1
    now[0] = 60.0
    assert limiter.check('/auth/register', 'first') is None


def test_capacity_fails_closed_and_expired_keys_are_reclaimed():
    now = [0.0]
    limiter = AuthRateLimiter(max_keys=1, clock=lambda: now[0])
    assert limiter.check('/auth/register', 'first') is None
    assert limiter.check('/auth/register', 'second') == 60
    assert len(limiter._buckets) == 1
    now[0] = 60
    assert limiter.check('/auth/register', 'second') is None
    assert len(limiter._buckets) == 1


def test_concurrent_requests_cannot_exceed_limit():
    limiter = AuthRateLimiter(clock=lambda: 0)
    with ThreadPoolExecutor(max_workers=12) as executor:
        outcomes = list(executor.map(lambda _: limiter.check('/auth/register', 'peer'), range(40)))
    assert outcomes.count(None) == 5
    assert outcomes.count(60) == 35


@pytest.mark.parametrize('path', AUTH_LIMITS)
def test_throttle_response_and_forwarded_headers_cannot_bypass_it(path):
    dependency = (login_db if path.endswith('login') else registration_db
                  if path.endswith('register') else session_db)
    session = MagicMock()
    app.dependency_overrides[dependency] = lambda: session
    try:
        with TestClient(app) as client:
            for number in range(AUTH_LIMITS[path]):
                # Invalid payloads count, too, without doing expensive hashing.
                response = client.post(path, json={}, headers={'X-Forwarded-For': f'192.0.2.{number}'})
                assert response.status_code == 422
            session.reset_mock()
            response = client.post(path, json={'password': 'private-marker'})
            assert response.status_code == 429
            assert response.json() == {'detail': 'Too many requests. Please try again later.'}
            assert int(response.headers['Retry-After']) > 0
            assert response.headers['Cache-Control'] == 'no-store'
            assert 'private-marker' not in response.text
            session.execute.assert_not_called()
            session.add.assert_not_called()
            assert client.get('/health').status_code == 200
            assert client.get('/docs').status_code == 200
    finally:
        app.dependency_overrides.pop(dependency, None)


def test_rejected_request_never_reads_body_or_calls_downstream():
    import asyncio

    limiter = AuthRateLimiter(clock=lambda: 0)
    for _ in range(5):
        limiter.check('/auth/register', 'peer')
    downstream = MagicMock()
    receive = MagicMock(side_effect=AssertionError('Body must not be read'))
    messages = []

    async def send(message):
        messages.append(message)

    middleware = AuthRateLimitMiddleware(downstream, limiter)
    asyncio.run(middleware({'type': 'http', 'method': 'POST', 'path': '/auth/register',
                            'client': ('peer', 1234)}, receive, send))
    assert messages[0]['status'] == 429
    receive.assert_not_called()
    downstream.assert_not_called()


def test_denials_do_not_extend_window_and_staggered_attempts_expire_individually():
    now = [0.0]
    limiter = AuthRateLimiter(clock=lambda: now[0])
    assert limiter.check('/auth/register', 'peer') is None
    now[0] = 10.0
    for _ in range(4):
        assert limiter.check('/auth/register', 'peer') is None
    assert limiter.check('/auth/register', 'peer') == 50
    now[0] = 59.0
    assert limiter.check('/auth/register', 'peer') == 1
    now[0] = 60.0
    assert limiter.check('/auth/register', 'peer') is None
    assert limiter.check('/auth/register', 'peer') == 10
