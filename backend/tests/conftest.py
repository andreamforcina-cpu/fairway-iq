"""Keep process-local throttle state isolated between independent tests."""
import pytest
from backend.main import auth_rate_limiter


@pytest.fixture(autouse=True)
def isolated_auth_limits():
    # No production reset API; each test starts and ends with clean local state.
    with auth_rate_limiter._lock:
        auth_rate_limiter._buckets.clear()
    yield
    with auth_rate_limiter._lock:
        auth_rate_limiter._buckets.clear()
