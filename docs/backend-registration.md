# User registration

`POST /auth/register` creates a PostgreSQL user. It does not log in the user or issue tokens. Existing `/` and `/health` endpoints remain available without database configuration.

## Contract

Send JSON with `full_name`, `email`, and `password`. For example, use a synthetic address and a unique test password in your local API client; never paste real credentials into terminal history or documentation.

- Name: trimmed, 1–100 characters, no Unicode control characters.
- Email: validated with email-validator without DNS/deliverability checks, normalized and lowercased, maximum 254 characters. This deliberately treats account addresses as case insensitive. It does not prove ownership.
- Password: 15–128 characters, cannot be all whitespace; preserved exactly without trimming or normalization. Long passphrases are supported; no arbitrary character composition rules. Unknown request fields are rejected.

HTTP **201** returns exactly `id` (UUID), `full_name`, `email`, and `created_at` (timezone-aware ISO timestamp). No password, hash, token, or internal account fields are returned.

HTTP **422** reports invalid fields without echoing submitted values, including malformed JSON. HTTP **409** reports `Unable to register with these details.` for an email unique-index conflict. HTTP **503** reports `Registration is temporarily unavailable.` for database/configuration/hashing failures. Raw database errors and SQL parameters are not returned or logged by this implementation.

## Implementation and security

The synchronous FastAPI route executes database work and Argon2 hashing in the thread pool. The existing SQLAlchemy session and User model are reused. Argon2id uses argon2-cffi with fresh random salts, 64 MiB memory, three iterations and parallelism four. Only the resulting encoded hash is stored. Requirements pin the added library and its bindings/CFFI dependencies. Registration adds no migration, session/token issuance, mobile integration, or automatic schema creation. Credential verification is documented in [backend-login.md](backend-login.md).

Registration flushes inside a transaction, builds the allowlisted response, then commits. The PostgreSQL unique email index arbitrates duplicates, including concurrent registrations; failures roll back. There is no race-prone preflight uniqueness check. Only the expected unique-index violation becomes a 409; unrelated constraint failures are unavailable errors.

Use the existing private DATABASE_URL setup in [backend-database.md](backend-database.md). Start from the repository root:

```sh
backend/.venv/bin/python -m pip install -r backend/requirements-dev.txt
backend/.venv/bin/python -m uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000/docs` and inspect `/auth/register`. Submitting against your development configuration really creates a user; automated tests use a separate database instead. Do not expose the development server publicly.

## Verification

Run unit tests with `backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests -q`. PostgreSQL tests skip without explicit TEST_DATABASE_URL. They refuse database names outside the `fairway_iq_test` prefix and use random schemas in rollback-only outer transactions. They never fall back to DATABASE_URL or load development credentials. Existing migrations are applied only inside those test schemas.

A separate local database `fairway_iq_test_registration` was created using the local operating-system PostgreSQL role, with no password changes. To rerun on this machine:

```sh
TEST_DATABASE_URL=postgresql+psycopg:///fairway_iq_test_registration backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests -q
```

Checkpoint verification: **53 backend tests passed, with no skips**, including all five PostgreSQL integration tests for registration, login and database behavior. The isolated database was checked afterward: zero application tables and zero temporary test schemas remained. `git diff --check` and dependency consistency checks passed; one existing TestClient deprecation warning remains.

Coverage includes normalized registration, genuine salted Argon2id hashes, malformed/invalid input, response allowlisting, normalized duplicates, rollback/recovery, commit errors, unrelated constraint errors, hashing errors, missing database configuration, and existing endpoint/database regression tests. The real PostgreSQL registration test verifies persisted data and duplicate behavior. No real credentials are inserted.

## Remaining production requirements

- Add edge/request-size limits and rate/concurrency limits before public exposure: each hash consumes memory/CPU, and FastAPI's thread pool is not an abuse protection system.
- Add email ownership verification, breached-password screening, and registration abuse prevention. `is_active=true` is the existing model default, not verified ownership.
- Different 201/409 outcomes allow account enumeration despite generic error wording. Revisit the registration/verification contract before production.
- Configure HTTPS, verified database TLS, least-privilege roles, and redacted infrastructure/APM logs. Never enable request-body logging on authentication endpoints.
- [Login credential verification](backend-login.md) is now implemented without sessions. Access/refresh tokens, secure mobile storage, authentication guards, password reset, and authenticated profile integration remain unimplemented.
- Concurrent duplicate requests rely on the verified unique index; a concurrent-load test is not yet included. Transient commit-acknowledgement failures can require retry/duplicate handling by the client.
- Existing Starlette/httpx TestClient deprecation warning remains; no unrelated dependency upgrades were performed.
