"""Keep process-local throttle state isolated between independent tests."""
import pytest
from backend.main import auth_rate_limiter, round_peer_limiter
from backend.api.rounds import round_account_limiter


@pytest.fixture(autouse=True)
def isolated_auth_limits():
    # No production reset API; each test starts and ends with clean local state.
    for limiter in (auth_rate_limiter, round_peer_limiter, round_account_limiter):
        with limiter._lock:
            limiter._buckets.clear()
    yield
    for limiter in (auth_rate_limiter, round_peer_limiter, round_account_limiter):
        with limiter._lock:
            limiter._buckets.clear()
