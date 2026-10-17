"""Resource boundaries must reject before parsing/storage and keep retries safe."""
import asyncio
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api import rounds as routes
from backend.main import app
from backend.schemas.rounds import RoundCreate, RoundPage
from backend.security.round_limits import (
    ROUND_BODY_BYTES, RequestSlots, RoundRateLimiter, RoundResourceMiddleware, THROTTLE_DETAIL,
)
from backend.tests.test_rounds import api, payload, record_for  # noqa: F401


def scope(path='/rounds', method='POST', headers=(), peer='peer'):
    return {'type': 'http', 'path': path, 'method': method, 'headers': list(headers), 'client': (peer, 1234)}


def harness(*, max_body=8, max_chunks=1024, timeout=10, slots=None, limiter=None):
    downstream = AsyncMock()
    middleware = RoundResourceMiddleware(downstream,
        limiter or RoundRateLimiter({'read': 100, 'write': 100}), slots or RequestSlots(),
        max_body=max_body, max_chunks=max_chunks, body_timeout=timeout)
    messages = []
    async def send(message):
        messages.append(message)
    return middleware, downstream, messages, send


def request(body=b'', more=False):
    return {'type': 'http.request', 'body': body, 'more_body': more}


def test_round_quota_boundaries_share_categories_not_tokens_or_detail_ids():
    now = [0.0]
    limiter = RoundRateLimiter({'read': 2, 'write': 1}, clock=lambda: now[0])
    assert limiter.check('write', 'owner') is None
    assert limiter.check('write', 'owner') == 60
    assert limiter.check('read', 'owner') is None
    assert limiter.check('write', 'other') is None
    now[0] = 59.5
    assert limiter.check('write', 'owner') == 1
    now[0] = 60
    assert limiter.check('write', 'owner') is None


def test_round_capacity_fails_closed_without_eviction_or_extending_denials():
    now = [0.0]
    limiter = RoundRateLimiter({'write': 1}, max_keys=1, clock=lambda: now[0])
    assert limiter.check('write', 'first') is None
    now[0] = 40
    assert limiter.check('write', 'second') == 20
    assert limiter.check('write', 'first') == 20
    assert len(limiter._buckets) == 1
    now[0] = 60
    assert limiter.check('write', 'second') is None
    assert len(limiter._buckets) == 1


def test_round_rate_limit_is_atomic_across_threads():
    limiter = RoundRateLimiter({'write': 5}, clock=lambda: 0)
    with ThreadPoolExecutor(max_workers=12) as executor:
        results = list(executor.map(lambda _: limiter.check('write', 'owner'), range(40)))
    assert results.count(None) == 5 and results.count(60) == 35


@pytest.mark.parametrize('headers,status', [
    ([(b'content-length', b'9')], 413),
    ([(b'content-length', b'-1')], 400),
    ([(b'content-length', b'')], 400),
    ([(b'content-length', b'1.5')], 400),
    ([(b'content-length', b'1'), (b'content-length', b'1')], 400),
    ([(b'content-length', b'9' * 5000)], 400),
])
def test_declared_body_errors_never_read_or_call_downstream(headers, status):
    middleware, downstream, messages, send = harness()
    receive = AsyncMock(side_effect=AssertionError('must not read'))
    asyncio.run(middleware(scope(headers=headers), receive, send))
    assert messages[0]['status'] == status
    assert (b'cache-control', b'no-store') in messages[0]['headers']
    receive.assert_not_called(); downstream.assert_not_called()
    assert middleware.slots.active == 0


@pytest.mark.parametrize('headers', [[], [(b'content-length', b'1')], [(b'transfer-encoding', b'chunked')]])
def test_actual_stream_bytes_are_bounded_even_when_length_is_missing_or_false(headers):
    middleware, downstream, messages, send = harness()
    receive = AsyncMock(side_effect=[request(b'12345', True), request(b'6789')])
    asyncio.run(middleware(scope(headers=headers), receive, send))
    assert messages[0]['status'] == 413
    downstream.assert_not_called(); assert receive.await_count == 2
    assert middleware.slots.active == 0


def test_exact_byte_boundary_is_replayed_unchanged_after_fragmented_read():
    middleware, downstream, messages, send = harness()
    received = []
    async def endpoint(scope, receive, send):
        received.append(await receive())
    downstream.side_effect = endpoint
    receive = AsyncMock(side_effect=[request(b'1234', True), request(b'5678')])
    asyncio.run(middleware(scope(headers=[(b'content-length', b'8')]), receive, send))
    assert received == [request(b'12345678')]
    assert middleware.slots.active == 0


@pytest.mark.parametrize('declared', [2, 4])
def test_length_mismatch_is_rejected_without_parsing(declared):
    middleware, downstream, messages, send = harness()
    asyncio.run(middleware(scope(headers=[(b'content-length', str(declared).encode())]),
                           AsyncMock(return_value=request(b'123')), send))
    assert messages[0]['status'] == 400
    downstream.assert_not_called()


def test_empty_fragment_flood_has_a_count_bound():
    middleware, downstream, messages, send = harness(max_chunks=2)
    receive = AsyncMock(return_value=request(b'', True))
    asyncio.run(middleware(scope(), receive, send))
    assert messages[0]['status'] == 413 and receive.await_count == 2
    downstream.assert_not_called(); assert middleware.slots.active == 0


def test_body_timeout_does_not_hold_a_slot_or_enter_application():
    middleware, downstream, messages, send = harness(timeout=0.001)
    async def receive():
        await asyncio.Event().wait()
    asyncio.run(middleware(scope(), receive, send))
    assert messages[0]['status'] == 408
    downstream.assert_not_called(); assert middleware.slots.active == 0


def test_disconnect_and_application_exception_release_slots():
    middleware, downstream, messages, send = harness()
    asyncio.run(middleware(scope(), AsyncMock(return_value={'type': 'http.disconnect'}), send))
    downstream.assert_not_called(); assert middleware.slots.active == 0 and not messages
    downstream.side_effect = RuntimeError('synthetic application failure')
    with pytest.raises(RuntimeError):
        asyncio.run(middleware(scope(), AsyncMock(return_value=request()), send))
    assert middleware.slots.active == 0


def test_occupied_slot_returns_busy_without_reading_and_health_bypasses_round_limits():
    async def scenario():
        slots = RequestSlots(1)
        middleware, downstream, messages, send = harness(slots=slots)
        entered, release = asyncio.Event(), asyncio.Event()
        async def endpoint(scope, receive, send):
            if scope['path'] == '/rounds':
                entered.set(); await release.wait()
            else:
                await send({'type': 'http.response.start', 'status': 200, 'headers': []})
        downstream.side_effect = endpoint
        first = asyncio.create_task(middleware(scope(), AsyncMock(return_value=request()), send))
        await entered.wait()
        blocked_receive = AsyncMock(side_effect=AssertionError('must not read'))
        await middleware(scope(), blocked_receive, send)
        assert messages[0]['status'] == 503
        assert (b'retry-after', b'1') in messages[0]['headers']
        blocked_receive.assert_not_called()
        await middleware(scope('/health', 'GET'), blocked_receive, send)
        assert messages[-1]['status'] == 200
        release.set(); await first
        assert slots.active == 0
    asyncio.run(scenario())


def test_peer_limit_cannot_be_bypassed_with_forwarding_headers_or_round_ids():
    limiter = RoundRateLimiter({'read': 1, 'write': 1}, clock=lambda: 0)
    middleware, downstream, messages, send = harness(limiter=limiter)
    asyncio.run(middleware(scope('/rounds/first', 'GET'), AsyncMock(return_value=request()), send))
    downstream.reset_mock()
    receive = AsyncMock(side_effect=AssertionError('must not read'))
    asyncio.run(middleware(scope('/rounds/second', 'GET', [(b'x-forwarded-for', b'new-peer')]), receive, send))
    assert messages[0]['status'] == 429
    assert THROTTLE_DETAIL.encode() in messages[1]['body']
    downstream.assert_not_called(); receive.assert_not_called()


@pytest.mark.parametrize('path', ['/auth/me', '/rounds-extra', '/health'])
def test_other_namespaces_are_unaffected(path):
    middleware, downstream, _, send = harness()
    receive = AsyncMock(side_effect=AssertionError('middleware must not read'))
    asyncio.run(middleware(scope(path), receive, send))
    downstream.assert_awaited_once(); receive.assert_not_called()


def test_large_body_is_rejected_by_real_app_before_auth_or_db():
    with TestClient(app) as client:
        result = client.post('/rounds', content=b'private-marker' + b'x' * ROUND_BODY_BYTES,
                             headers={'Content-Type': 'application/json'})
    assert result.status_code == 413 and 'private-marker' not in result.text
    assert result.headers['Cache-Control'] == 'no-store'
    assert result.headers['Pragma'] == 'no-cache'


def test_owner_quota_is_shared_across_peers_and_authorization_headers(api, monkeypatch):
    client, db, owner = api
    monkeypatch.setattr(routes, 'round_account_limiter', RoundRateLimiter({'read': 2, 'write': 2}, clock=lambda: 0))
    record = record_for(RoundCreate.model_validate(payload()), owner)
    create = MagicMock(return_value=(record, False)); monkeypatch.setattr(routes, 'create_round', create)
    for peer in ['first', 'second']:
        with TestClient(app, client=(peer, 1234)) as other:
            assert other.post('/rounds', json=payload(), headers={'Authorization': 'Bearer synthetic-' + peer}).status_code == 200
    db.reset_mock(); create.reset_mock()
    response = client.post('/rounds', json=payload())
    assert response.status_code == 429
    assert response.headers['Retry-After'] == '60'
    assert response.headers['Pragma'] == 'no-cache'
    create.assert_not_called(); db.commit.assert_not_called()
    monkeypatch.setattr(routes, 'list_rounds', lambda *_: RoundPage(items=[], next_cursor=None))
    assert client.get('/rounds').status_code == 200


def test_maximum_mobile_scorecard_fits_body_limit(api, monkeypatch):
    client, _, owner = api
    body = payload(18); body['course_name'] = 'Å' * 100
    record = record_for(RoundCreate.model_validate(body), owner)
    monkeypatch.setattr(routes, 'create_round', lambda *_: (record, True))
    result = client.post('/rounds', json=body)
    assert result.status_code == 201 and result.json()['played_holes'] == 18


def test_account_read_quota_is_shared_between_history_and_different_detail_ids(api, monkeypatch):
    from uuid import uuid4
    client, db, _ = api
    monkeypatch.setattr(routes, 'round_account_limiter', RoundRateLimiter({'read': 2, 'write': 2}, clock=lambda: 0))
    monkeypatch.setattr(routes, 'list_rounds', lambda *_: RoundPage(items=[], next_cursor=None))
    db.scalar.return_value = None
    assert client.get('/rounds').status_code == 200
    assert client.get('/rounds/' + str(uuid4())).status_code == 404
    db.reset_mock()
    response = client.get('/rounds/' + str(uuid4()))
    assert response.status_code == 429
    db.scalar.assert_not_called()


def test_body_limit_counts_encoded_bytes_rather_than_unicode_characters():
    middleware, downstream, messages, send = harness()
    asyncio.run(middleware(scope(), AsyncMock(return_value=request(('Å' * 5).encode())), send))
    assert messages[0]['status'] == 413
    downstream.assert_not_called()


def test_cancellation_releases_active_request_slot():
    async def scenario():
        middleware, downstream, _, send = harness()
        entered = asyncio.Event()
        async def endpoint(*_):
            entered.set(); await asyncio.Event().wait()
        downstream.side_effect = endpoint
        task = asyncio.create_task(middleware(scope(), AsyncMock(return_value=request()), send))
        await entered.wait()
        assert middleware.slots.active == 1
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        assert middleware.slots.active == 0
    asyncio.run(scenario())
