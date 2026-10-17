"""Bounded, single-process resource controls for the round API namespace."""
import asyncio
from collections import OrderedDict, deque
from collections.abc import Callable, Mapping
from math import ceil
from threading import Lock
from time import monotonic

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

ROUND_BODY_BYTES = 16 * 1024
ROUND_BODY_SECONDS = 10
ROUND_BODY_CHUNKS = 1024
ROUND_CONCURRENCY = 32
ROUND_PEER_LIMITS = {'read': 240, 'write': 60}
ROUND_ACCOUNT_LIMITS = {'read': 120, 'write': 20}
THROTTLE_DETAIL = 'Too many round requests. Please try again later.'


class RoundRateLimiter:
    def __init__(self, limits: Mapping[str, int], window: float = 60, max_keys: int = 2048,
                 clock: Callable[[], float] = monotonic):
        if window <= 0 or max_keys < 1 or not limits or any(limit < 1 for limit in limits.values()):
            raise ValueError('Round rate limits must be positive.')
        self.limits = dict(limits)
        self.window = window
        self.max_keys = max_keys
        self._clock = clock
        self._lock = Lock()
        self._buckets: OrderedDict[tuple[str, str], deque[float]] = OrderedDict()

    def check(self, category: str, identity: str) -> int | None:
        limit = self.limits[category]
        with self._lock:
            now = self._clock()
            while self._buckets:
                oldest = next(iter(self._buckets))
                if self._buckets[oldest][-1] > now - self.window:
                    break
                self._buckets.popitem(last=False)
            key = (category, identity)
            bucket = self._buckets.get(key)
            if bucket is None:
                if len(self._buckets) >= self.max_keys:
                    oldest_bucket = next(iter(self._buckets.values()))
                    return max(1, ceil(oldest_bucket[-1] + self.window - now))
                bucket = deque()
                self._buckets[key] = bucket
            while bucket and bucket[0] <= now - self.window:
                bucket.popleft()
            if len(bucket) >= limit:
                return max(1, ceil(bucket[0] + self.window - now))
            bucket.append(now)
            self._buckets.move_to_end(key)
            return None


class RequestSlots:
    def __init__(self, maximum: int = ROUND_CONCURRENCY):
        if maximum < 1:
            raise ValueError('Round concurrency must be positive.')
        self.maximum = maximum
        self.active = 0
        self._lock = Lock()

    def acquire(self) -> bool:
        with self._lock:
            if self.active >= self.maximum:
                return False
            self.active += 1
            return True

    def release(self) -> None:
        with self._lock:
            self.active -= 1


def category_for(method: str) -> str:
    return 'read' if method in {'GET', 'HEAD'} else 'write'


class _BodyRejected(Exception):
    def __init__(self, status: int, detail: str):
        self.status, self.detail = status, detail


class RoundResourceMiddleware:
    def __init__(self, app: ASGIApp, limiter: RoundRateLimiter, slots: RequestSlots,
                 max_body: int = ROUND_BODY_BYTES, body_timeout: float = ROUND_BODY_SECONDS,
                 max_chunks: int = ROUND_BODY_CHUNKS):
        if max_body < 1 or body_timeout <= 0 or max_chunks < 1:
            raise ValueError('Round request bounds must be positive.')
        self.app, self.limiter, self.slots = app, limiter, slots
        self.max_body, self.body_timeout, self.max_chunks = max_body, body_timeout, max_chunks

    async def reject(self, scope: Scope, receive: Receive, send: Send, status: int,
                     detail: str, retry: int | None = None) -> None:
        headers = {'Cache-Control': 'no-store', 'Pragma': 'no-cache'}
        if retry is not None:
            headers['Retry-After'] = str(retry)
        await JSONResponse({'detail': detail}, status_code=status, headers=headers)(scope, receive, send)

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        path = scope.get('path', '')
        if scope['type'] != 'http' or not (path == '/rounds' or path.startswith('/rounds/')):
            await self.app(scope, receive, send)
            return
        peer = scope.get('client')
        # Forwarded headers are not trusted here. Configure trusted proxies at the server boundary.
        retry = self.limiter.check(category_for(scope['method']), peer[0] if peer else 'unknown-peer')
        if retry is not None:
            await self.reject(scope, receive, send, 429, THROTTLE_DETAIL, retry)
            return
        if not self.slots.acquire():
            await self.reject(scope, receive, send, 503, 'Round service is busy. Please try again later.', 1)
            return
        try:
            lengths = [value.strip() for key, value in scope.get('headers', []) if key.lower() == b'content-length']
            if len(lengths) > 1 or (lengths and (not lengths[0].isdigit() or len(lengths[0]) > 10)):
                await self.reject(scope, receive, send, 400, 'Invalid request length.')
                return
            declared = int(lengths[0]) if lengths else None
            if declared is not None and declared > self.max_body:
                await self.reject(scope, receive, send, 413, 'Round request body is too large.')
                return
            body = bytearray()
            try:
                async with asyncio.timeout(self.body_timeout):
                    for _ in range(self.max_chunks):
                        message = await receive()
                        if message['type'] == 'http.disconnect':
                            return
                        chunk = message.get('body', b'')
                        if len(body) + len(chunk) > self.max_body:
                            raise _BodyRejected(413, 'Round request body is too large.')
                        body.extend(chunk)
                        if not message.get('more_body', False):
                            break
                    else:
                        raise _BodyRejected(413, 'Round request has too many body fragments.')
            except _BodyRejected as error:
                await self.reject(scope, receive, send, error.status, error.detail)
                return
            except TimeoutError:
                await self.reject(scope, receive, send, 408, 'Round request body timed out.')
                return
            if declared is not None and len(body) != declared:
                await self.reject(scope, receive, send, 400, 'Invalid request length.')
                return
            delivered = False

            async def replay() -> Message:
                nonlocal delivered
                if not delivered:
                    delivered = True
                    return {'type': 'http.request', 'body': bytes(body), 'more_body': False}
                return await receive()

            await self.app(scope, replay, send)
        finally:
            self.slots.release()
