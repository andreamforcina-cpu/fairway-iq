# Server-side authentication sessions

## Architecture

This increment adds opaque bearer tokens backed by PostgreSQL. It deliberately avoids JWT/signing keys and new dependencies: every protected request checks server-side session state, enabling immediate revocation. Tokens contain 32 cryptographically random bytes, encoded with separate `fiqa_` (access) and `fiqr_` (refresh) prefixes; they contain no user claims. Only SHA-256 digests are persisted. Fast hashing is appropriate for these random secrets; passwords still use Argon2id.

Existing `/auth/login` remains credential verification only and keeps its response contract. New session creation uses `/auth/token`; mobile now uses this endpoint; see [mobile authentication](mobile-authentication.md). Tokens are returned only by the designated issuance/refresh endpoints after a successful transaction commit. Never log, screenshot or share those responses. Token response model representations omit raw values; infrastructure/APM must also redact bodies, Authorization headers and local variables.

## Endpoints

| Endpoint | Request | Success |
| --- | --- | --- |
| `POST /auth/token` | Same email/password JSON as login | 200 token pair |
| `POST /auth/refresh` | `refresh_token` in JSON | 200 replacement pair |
| `POST /auth/logout` | `refresh_token` in JSON | 204, empty body |
| `GET /auth/me` | `Authorization: Bearer <access_token>` | 200 id, full_name, email, created_at |

Token pair fields: `access_token`, `refresh_token`, `token_type` (`bearer`), `expires_in` (seconds), `refresh_expires_in` (seconds). Access lifetime is 15 minutes. The absolute session/refresh deadline is 30 days from credential verification and cannot be extended by rotation. Close to that deadline the new access lifetime is shortened accordingly. Lifetimes are centralized in `backend/security/tokens.py`.

Invalid credentials return the existing generic 401. Missing, wrong-purpose, unknown, expired or revoked access tokens return generic 401 with `WWW-Authenticate: Bearer`. Validly shaped unknown/expired/reused refresh tokens return generic 401; malformed body values return sanitized 422. Database/configuration errors return generic 503 without SQL or credentials. Logout returns 204 for validly shaped unknown, old or already revoked refresh tokens, preventing a session-existence response oracle.

Issuance, refresh and profile success responses are `Cache-Control: no-store` and `Pragma: no-cache`. Logout is no-store. No cookies, query-string tokens or automatic browser authentication are used. `/auth/me` is read-only, and only serves the currently authenticated user's allowlisted profile.

## Rotation, concurrency and logout

Each refresh marks its old digest as used, creates a new refresh digest and replaces the session's access digest in one transaction. The previous access token immediately stops working. Used refresh digests are retained until deliberate session cleanup; reuse revokes the entire session and that revocation is committed before returning 401. It does not revoke other independently created sessions for the user.

Refresh and logout first locate the parent session ID, lock that parent with PostgreSQL `SELECT FOR UPDATE`, then re-read refresh state. This serializes competing refresh/logout operations. Two concurrent requests using one refresh produce at most one new pair; the replay revokes the session, including that pair. Clients must serialize refresh and must not automatically retry a consumed refresh after losing a response: log in again when necessary. Logout possession of any refresh from the session revokes its active access and refresh credentials. Already in-flight requests may finish; subsequent checks fail.

User active status is checked on issuance, refresh and protected access. Disabling an account immediately denies future access checks. Re-enabling an account is not a substitute for explicitly revoking all sessions after a security incident; an admin/global revocation workflow remains future work.

Login verification and issuance share a per-IP quota of 20 requests per 60 seconds to avoid doubling password-guessing capacity. Refresh/logout each permit 30 requests per IP/window; registration stays at 5. These are existing process-local development protections, not distributed limits. See [rate limiting](backend-rate-limiting.md).

## Migration: applied and verified locally

`0002_create_auth_sessions` adds `auth_sessions` and `refresh_tokens`, UUID keys, user/session foreign keys with cascade, unique digest constraints, hash-format checks, expiry checks, and lookup/expiry indexes. It neither changes the users table nor changes existing rows. Historical migration `0001_create_users` is unchanged.

After explicit user approval, `0002_create_auth_sessions` was applied to local `fairway_iq_dev`, schema `public`, and its committed revision verified. Preflight confirmed revision `0001_create_users` and no conflicting session tables. New columns, types, constraints and indexes match ORM metadata; users columns/indexes/triggers and row count were unchanged, and both new tables were empty. All 85 backend tests passed again on the isolated test database. No schema is created on application startup.

The following command documents the migration for other environments; review the target/schema and obtain explicit approval before applying there. It need not be rerun on this already migrated local database:

```sh
backend/.venv/bin/alembic -c backend/alembic.ini upgrade 0002_create_auth_sessions
```

No new environment secret is required. Existing private DATABASE_URL settings are reused without reading or changing their values during implementation. Never print the URL. Downgrading removes session tables and invalidates all sessions; it requires deliberate authorization and was not run on development.

## Manual verification after migration

1. Start `backend/.venv/bin/python -m uvicorn backend.main:app --reload --no-proxy-headers` for direct local preview.
2. In `/docs`, execute `/auth/token` with a registered test account. Keep the token response private.
3. Use Swagger's Authorize button with the access token, then call `/auth/me`; expect your test profile and no password/hash.
4. Call `/auth/refresh` with the refresh token. Authorize again with the replacement access token. The original access should now return 401.
5. In a separate test session, submit an already used refresh: expect 401 and rejection of the latest access/refresh from that session.
6. Create another session, call logout with its refresh, then verify its access returns 401. Other independent sessions should remain usable.

Mobile now integrates SecureStore, restore, refresh, logout and protected navigation; see [mobile authentication](mobile-authentication.md) for verification limits.

## Automated verification

```sh
TEST_DATABASE_URL=postgresql+psycopg:///fairway_iq_test_registration backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests -q
```

Result: **85 passed, zero skipped**. Existing regression tests remain. Session tests cover issuance, hashed-only storage, profile allowlisting, token-purpose separation, malformed/redacted input, missing authorization, generic database failures, incorrect/unknown credentials, rotation, replay revocation, idempotent logout, independent sessions, access/absolute expiry, shortening near the deadline, inactive users, commit-failure rollback, shared login/token throttling, and real concurrent refresh using two PostgreSQL connections. Metadata comparison verifies migrations match ORM definitions.

All integration tests require the explicit guarded `fairway_iq_test*` database. Normal tests roll back a random schema. The concurrency test needs committed fixtures visible to independent connections: it creates its own random `session_race_*` schema inside that same guarded test database and drops only that schema in `finally`. It never resets a database, migrates public/development tables, or inserts real credentials. One pre-existing Starlette/httpx TestClient deprecation warning remains.

## Remaining production work

- HTTPS, verified remote database TLS, least-privilege roles, encrypted backups and redacted logging/telemetry must be configured operationally.
- Deploy shared/edge rate limiting, global hash-concurrency and request-size limits. Process-local throttling resets with workers.
- Add deliberate expired-session cleanup/retention policy. Preserve used refresh history while a session can still refresh; premature deletion defeats replay detection.
- Add email ownership verification, password recovery/change, incident-wide session revocation, session/device management and abuse monitoring. Multiple logins can currently create multiple sessions; there is no account-level session cap.
- Mobile integration is implemented; the user confirmed initial iPhone verification over home Wi-Fi on 14 October 2026. Expiry-driven refresh and remaining device scenarios are pending; see `mobile-authentication.md`. Do not put tokens in AsyncStorage, URLs or browser localStorage.
- Server-side opaque tokens require a database read per protected request and synchronized server clocks. They are not OAuth/OIDC or JWT, and are not intended for independent offline validation by other services.

Design reference: [OWASP Session Management guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html). Implementation uses existing SQLAlchemy transactions and [row-lock/query behavior](https://docs.sqlalchemy.org/en/20/orm/queryguide/api.html).
