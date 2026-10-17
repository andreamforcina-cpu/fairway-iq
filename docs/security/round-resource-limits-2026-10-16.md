# Round API resource controls — 2026-10-16

> Device follow-up, 2026-10-16: the user reported the requested normal iPhone save/Synced/refresh smoke flow working. This is user-reported evidence; deliberate throttle/concurrency/timeout device tests were not reported. Earlier statements below that this normal smoke check is pending are superseded.

## Implemented scope

Added process-local controls to the existing round API, preserving opaque sessions, server-derived ownership, score validation, transactions, idempotency and history pagination. No new dependency, migration or authentication mechanism was introduced. Development/production databases were not altered; verification used only the previously authorized dedicated test database.

| Boundary | Default | Rejection |
| --- | --- | --- |
| Body bytes | 16,384 bytes for every HTTP request in `/rounds` and `/rounds/*` | 413 |
| Body receive deadline | 10 seconds total for receiving the body | 408 |
| Body fragments | At most 1,024 ASGI request messages, including empty fragments | 413 |
| Concurrent round requests | 32 active requests per process; no application wait queue | 503, Retry-After 1 |
| Network peer quota | 240 reads / 60 writes per 60-second sliding window | 429 with Retry-After |
| Authenticated owner quota | 120 reads / 20 writes per 60-second sliding window | 429 with Retry-After |

GET/HEAD share the read category; other HTTP methods use the peer write category. The owner dependency applies to the actual round POST/GET handlers. History and all detail UUIDs share their read quota; changing IDs, peer address, bearer token or refreshing a session cannot reset the authenticated account quota. Network peers behind a shared address also share the peer quota. Replays and unsuccessful attempts can consume quota; idempotency does not provide a rate-limit exemption.

Middleware consumes peer quota before reading a body or invoking authentication. At capacity, it rejects without reading/parsing or entering the downstream app. It then holds a concurrency slot through body receipt, authentication and downstream completion, releasing it on normal return, rejection, disconnect, exceptions or cancellation. A maliciously slow client cannot make body receipt unbounded. It does not add a handler/SQL execution timeout.

The body reader checks declared length early but always bounds actual bytes, including missing, chunked or dishonest length headers. Duplicate/invalid Content-Length and mismatches with received bytes produce generic 400. Validation of length is intentionally strict; oversized declared lengths can be rejected before a body is received. Accepted fragments are buffered only up to the configured bound and replayed as one body to FastAPI. The complete 18-hole mobile payload with a maximum-length multibyte name fits. GET bodies are bounded too; other namespaces, public health/docs and existing auth quota behavior remain unchanged.

Account quota is checked after the existing session dependency establishes ownership and before any round storage query/write. Session verification itself still needs the existing database access; the peer gate and request slots bound admission before that access. Each limiter keeps at most 2,048 active category/identity buckets with bounded timestamp queues, guarded by a lock. Exhausted key capacity fails closed rather than evicting a live limit; expired keys are reclaimed. No raw access/refresh token is used as a quota key or recorded in logs. Peer headers are not interpreted by this middleware.

Responses use safe generic details, Cache-Control no-store and Pragma no-cache. No supplied payload, account identifier or driver exception is returned. Ownership/not-found behavior and successful response schemas remain unchanged.

## Retry/client behavior

For 429, wait the positive Retry-After duration before retrying the **same** submission UUID and payload. A successful replay still returns the original round. Busy 503 requests can retry after the shorter advertised interval. Do not mint a new ID to bypass quota. The existing mobile store retains failed uploads as pending and retries only on explicit save retry/focus refresh; a new mobile regression confirms 429 preserves exact scores/key and produces one server record on retry. Mobile currently shows a generic pending message rather than a live Retry-After countdown; this remains a UX limitation. Large backlogs may need multiple minute-separated batches because the 20-write quota includes replays.

## Fresh verification

Full backend command using the existing dedicated local test database:

```sh
TEST_DATABASE_URL=postgresql+psycopg:///fairway_iq_test_sprint1_20261016 backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests -q
```

**227 passed, zero failures/skips**, one existing Starlette/httpx deprecation; pytest runtime 6.91 seconds. Includes 29 new unit/ASGI/API tests and one new real PostgreSQL case. Verified body byte/header/fragment boundaries, receive timeout, concurrency admission/cancellation/release, sliding window expiry, bounded-key fail-closed behavior, atomic threaded quota checks, forwarding-header spoofing, account limits across peers/tokens/detail IDs, safe responses and maximum mobile scorecard acceptance. The real PostgreSQL case fills owner quota with identical retries, verifies only one parent/three holes before denial, allows another owner, then successfully replays the original after expiry.

Post-run read-only inspection of the isolated database found zero matching test/race schemas and zero public tables. Ordinary fixtures migrate rollback-only test schemas; concurrency fixtures clean only their own random committed schemas. No development/production migration was performed.

Mobile suite: **129 passed, zero failed/skipped**, including the new throttle-retention regression and the earlier exposure tests. TypeScript and lint passed. Platform export, frontend build and manual iPhone checks were not repeated: no mobile application source or dependency changed. Earlier device acceptance predates the new server controls and is historical. Whitespace and pending-file secret/artifact checks passed.

Changed in this task: `backend/security/round_limits.py` (new), `backend/tests/test_round_limits.py` (new), `backend/api/rounds.py`, `backend/main.py`, `backend/tests/conftest.py` (fresh isolated limiter state per test), `backend/tests/test_rounds_integration.py`, `mobile/tests/accountRounds.test.mjs`, this report, round API contract and four memory documents. Earlier dependency-exposure test/report/correction and publication-memory edits preserved.

## Operational limits and next acceptance

These are single-process admission controls, not global distributed quotas or a complete denial-of-service solution. Multiple workers/replicas multiply effective allowance; restarts reset in-memory quotas. A public deployment needs shared limits or correctly configured gateway policy, header/URL/connection bounds, trusted proxy configuration, TLS and database least privilege/timeouts. Uvicorn or a reverse proxy may rewrite ASGI peer addresses before middleware; restrict trusted proxy sources and never trust arbitrary forwarding headers. Server allocation of a large received ASGI chunk can precede application checks. Slow responses and distributed traffic require server/edge controls too.

The process-local implementation follows the project's existing single-worker development pattern; it does not silently add Redis or change architecture. Constructor defaults are constants, not new private environment settings. Existing 28 mobile dependency findings remain unresolved and unrelated to this protection.

Restart the development backend to load these controls, then verify on iPhone that a normal full/early round becomes Synced, refresh/history still works and a pending retry succeeds after waiting when throttled. No device check of this revision was performed by the agent. Do not repeatedly submit real user rounds to deliberately fill quota; automated tests already cover the boundary with synthetic isolated data.

Main remains at 3b5955c; all task changes are unstaged/uncommitted. No commit, push, fetch, deployment, database reset or private environment inspection occurred. Next action is the targeted device smoke check and review, followed by an explicitly authorized checkpoint if desired.

References for the implementation patterns: [Python 3.12 timeout semantics](https://docs.python.org/3.12/library/asyncio-task.html#asyncio.timeout), [FastAPI cached sub-dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/sub-dependencies/). The concrete bounds and guarantees above come from local implementation/tests, not from those references alone.
