"""Bounded, process-local throttling for the single-worker development API."""
from collections import OrderedDict, deque
from collections.abc import Callable
from math import ceil
from threading import Lock
from time import monotonic

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

AUTH_LIMITS = {'/auth/login': 20, '/auth/register': 5}


class AuthRateLimiter:
    def __init__(self, window: float = 60, max_keys: int = 10000,
                 clock: Callable[[], float] = monotonic):
        if window <= 0 or max_keys < 1:
            raise ValueError('Rate limit window and capacity must be positive.')
        self.window = window
        self.max_keys = max_keys
        self._clock = clock
        self._lock = Lock()
        self._buckets: OrderedDict[tuple[str, str], deque[float]] = OrderedDict()

    def check(self, path: str, client: str) -> int | None:
        """Atomically consume an attempt or return the seconds until retry."""
        limit = AUTH_LIMITS[path]
        with self._lock:
            now = self._clock()
            cutoff = now - self.window
            # Buckets are ordered by latest accepted request; expired keys leave first.
            while self._buckets:
                oldest = next(iter(self._buckets))
                if self._buckets[oldest][-1] > cutoff:
                    break
                self._buckets.popitem(last=False)
            key = (path, client)
            bucket = self._buckets.get(key)
            if bucket is None:
                if len(self._buckets) >= self.max_keys:
                    # Fail closed for new keys rather than evicting an active limit.
                    oldest_bucket = next(iter(self._buckets.values()))
                    return max(1, ceil(oldest_bucket[-1] + self.window - now))
                bucket = deque()
                self._buckets[key] = bucket
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= limit:
                return max(1, ceil(bucket[0] + self.window - now))
            bucket.append(now)
            self._buckets.move_to_end(key)
            return None


class AuthRateLimitMiddleware:
    def __init__(self, app: ASGIApp, limiter: AuthRateLimiter):
        self.app = app
        self.limiter = limiter

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        path = scope.get('path', '')
        if scope['type'] == 'http' and scope['method'] == 'POST' and path in AUTH_LIMITS:
            peer = scope.get('client')
            # Never parse or trust client-supplied forwarding headers here.
            client = peer[0] if peer else 'unknown-peer'
            retry_after = self.limiter.check(path, client)
            if retry_after is not None:
                response = JSONResponse(
                    {'detail': 'Too many requests. Please try again later.'},
                    status_code=429,
                    headers={'Retry-After': str(retry_after), 'Cache-Control': 'no-store'},
                )
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)
