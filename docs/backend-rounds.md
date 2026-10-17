# Account-owned rounds API — Sprint 1

> Resource protection update, 2026-10-16: round requests now have bounded body size/receive time/fragments, 32 process-local concurrency slots and separate peer/account sliding-window quotas. Safe 400/408/413/429/503 errors are documented in [resource control report](security/round-resource-limits-2026-10-16.md). Full backend PostgreSQL verification is now 227 passed, zero skipped; the older notes below saying these controls are missing are superseded within this single-process scope. Public gateway/distributed protection remains open.

> Mobile integration was implemented on 2026-10-16; see [mobile account rounds](mobile-account-rounds.md). Unit/hook/transport tests and platform exports pass; iPhone end-to-end acceptance remains pending.

> Development rollout, 2026-10-16: migration 0003 was explicitly approved and successfully applied to the confirmed local `fairway_iq_dev` target. Read-only postflight verified the revision and zero ORM/schema differences. Production remains untouched; mobile integration remains pending. Earlier migration-pending statements below are historical.

> Follow-up verification, 2026-10-16: the full backend suite passed against a newly created dedicated local test database: **197 passed, zero skipped**, including all 11 round integration cases. Migration/ORM agreement and concurrent retry tests passed; temporary schemas were cleaned. Development/production migration remains unapplied. See [verification report](daily-reports/2026-10-16-sprint-1-postgresql-verification.md). Statements below about unavailable PostgreSQL describe the original implementation checkpoint, superseded by this verified result.

Implemented on 2026-10-16. This is a backend contract, not a mobile synchronization implementation. PostgreSQL acceptance remains pending; migration 0003 has not been applied to development or production.

## Authentication and ownership

All endpoints reuse the existing opaque bearer access-token dependency. No JWT or new authentication mechanism is introduced. Ownership always comes from the authenticated user; client ownership fields are rejected. Every history/detail/replay lookup is scoped to that owner. A foreign round and an unknown UUID both return the same 404. Account identifiers and request fingerprints are excluded from responses. Round responses and handled errors carry `Cache-Control: no-store` and `Pragma: no-cache`.

## Submit

`POST /rounds` accepts:

```json
{
  "submission_id": "11111111-1111-4111-8111-111111111111",
  "course_name": "Example Golf Club",
  "planned_holes": 9,
  "completed_at": "2026-10-16T14:00:00Z",
  "holes": [{"number": 1, "par": 4, "strokes": 5, "putts": 2}]
}
```

This sample is an early-finished 1/9 round. Full rounds contain all 9 or 18 hole entries. No in-progress drafts, updates, or deletion endpoints are included.

- Planned length must be the integer 9 or 18. Played length is derived from the submitted entries and must be at least one and no greater than planned length.
- Hole entries must be an ordered contiguous prefix starting at 1: duplicates, gaps and reordered entries are rejected. Numbers are strict integers; strings, floats and booleans are rejected.
- Par 1–6, strokes 1–30, putts 0–strokes. Strokes include putts, matching current mobile semantics.
- Course names are trimmed, 1–100 characters, without Unicode category C characters. Extra fields are rejected, including owner, status, totals and played count.
- Completion timestamps require an explicit timezone and are normalized to UTC. Numeric epoch inputs are rejected. This is client-reported completion time, not a trusted chronology or anti-cheat mechanism; future timestamps are not currently prohibited.

Success returns 201 for creation and 200 for identical replay. The response includes `id`, `submission_id`, `course_name`, `planned_holes`, `played_holes`, `status`, `completed_at`, `created_at`, `holes`, `strokes`, `par`, `putts`, and `relative_to_par`. Status is `complete` when played equals planned, otherwise `early_finished`. Totals and status are derived, not independently stored.

### Idempotency

Generate a UUID once per submission and retain both key and payload for retries. The database uniquely constrains `(user_id, submission_id)`. A SHA-256 fingerprint of normalized validated fields, excluding the submission UUID, distinguishes identical retries from conflicting reuse. Equivalent timezone offsets and trimmed course names canonicalize identically. Different data with the same key returns 409 without modifying the original. Identical payloads with different keys are separate rounds; this is not content deduplication.

A parameterized PostgreSQL `INSERT ... ON CONFLICT DO NOTHING` arbitrates concurrent attempts. Under PostgreSQL's default READ COMMITTED isolation, the subsequent owner-scoped query sees a committed winning insert. Parent and children commit atomically; failures roll back. Concurrent same-key and conflicting-key tests are prepared but have not run against PostgreSQL in this session. Higher isolation or ambiguous commit/network failures require retrying the same key; no success is returned when commit raises.

## History and detail

- `GET /rounds?limit=20&cursor=...`: returns `{ "items": [...], "next_cursor": null }`; limit range 1–100, default 20. Each item includes its bounded set of hole scores.
- `GET /rounds/{round_id}`: returns the same round response, or generic 404.

History is ordered by server receipt `created_at DESC, id DESC`, independent of client completion time. The base64url cursor contains the UTC receipt timestamp and UUID, with maximum length 160. It is a position, not authorization; all requests still enforce ownership. Newer inserts do not shift the remaining keyset pages, but this is not a transactional snapshot. Clients must preserve the returned cursor and may refresh the first page to see newer records. Limit-plus-one fetching determines whether another page exists. No total count is exposed.

Malformed requests return sanitized 422 responses; invalid cursor content returns `Invalid history cursor.` Database and detected stored-integrity failures return generic 503. These routes do not log submitted payloads or database exception details. Existing authentication errors remain governed by the session dependency.

## Schema and migration

`golf_rounds` stores UUID primary key, owner FK, submission UUID, fingerprint, course, planned/played lengths, client completion and server receipt timestamps. `hole_scores` stores its UUID, round FK, number, par, strokes and putts. Required fields are non-null. Parent and hole numeric ranges are checked; per-round hole numbers and owner submission keys are unique. `(user_id, created_at, id)` supports history; the unique hole-number index also supports round lookups.

Deleting a user cascades to rounds and deleting a round cascades to hole scores at database level. No deletion API is added. Cross-row exact child counts and contiguous prefixes are application transaction invariants, not database triggers; response generation also detects broken counts/sequences. Direct database writers must preserve these invariants.

Migration `0003_create_golf_rounds` follows `0002_create_auth_sessions`. It creates only the new tables/index; its downgrade removes those new tables and their contents. Neither direction was executed against any database in this sprint. Offline migration SQL generation is tested. Applying it to development or production requires explicit approval and target review; do not run startup schema creation. Existing local mobile history is not imported or assigned an owner.

## Verification and remaining work

Run from the repository root:

```sh
backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests -q
```

Unit/API tests use mocks for storage and explicit authentication overrides where stated; separate missing-token tests use the real dependency. Integration tests use the existing guarded isolated `TEST_DATABASE_URL` fixture, never the development URL. Configure it privately for a dedicated database whose name begins `fairway_iq_test`, then rerun the full suite. Ordinary integration cases migrate a temporary rollback-only schema. Concurrent tests need separate connections, so they create and remove only their own random committed test schema in that isolated database. No such online tests ran here because the test URL was absent.

Before mobile integration: verify the PostgreSQL suite, review/approve the development migration target, and explicitly authorize the mobile stage. Decide how to isolate or discard unowned legacy local rounds; do not silently upload them. Existing mobile vulnerability findings, deployment TLS/least privilege/backup review and broader abuse controls remain unresolved. Pagination bounds and validation are not request-body, write-rate, or infrastructure resource limits. No public deployment readiness is claimed.
