# Login credential verification

`POST /auth/login` verifies credentials only. **HTTP 200 does not create an authenticated session**, grant access to protected resources, set cookies, or issue tokens. Mobile authentication is not connected.

## Request and responses

Send JSON containing `email` and `password`:

```json
{"email": "golfer@example.com", "password": "ExamplePassphrase123!"}
```

This is synthetic example data. Do not log request bodies or paste real passwords into shell history.

Email uses exactly the registration normalization/validation: whitespace trimmed, email-validator normalization, lowercased account identity, maximum 254 characters. Passwords are preserved exactly, with length 1–128 characters; login does not reapply registration's 15-character minimum to guesses. Missing, wrongly typed, empty, oversized, malformed JSON, and extra-field input returns **422** with sanitized errors that do not echo inputs.

Success (**200**):

```json
{"message": "Credentials verified. No authenticated session has been created."}
```

Unknown email, incorrect password, and inactive account all return **401**:

```json
{"detail": "Invalid email or password."}
```

Database/configuration failures return **503**:

```json
{"detail": "Credential verification is temporarily unavailable."}
```

## Security and implementation

- A parameterized SQLAlchemy query retrieves only the hash and active status. No user object, email, UUID, password or hash is returned by login.
- The existing Argon2id module verifies hashes using argon2-cffi's high-level [PasswordHasher.verify API](https://argon2-cffi.readthedocs.io/en/stable/api.html#argon2.PasswordHasher.verify).
- Unknown accounts perform a verification against a random dummy hash generated once per worker using the same hashing parameters. Inactive accounts also perform password verification before rejection. Malformed hashes fail closed with dummy work. This removes the obvious fast failure path; it does not promise indistinguishable end-to-end timings, especially for future hashes with different parameters.
- Verification runs in a synchronous FastAPI route/thread pool. No arbitrary delays or password logging are added.
- Database errors are suppressed and failed transactions rolled back. Login performs no commits or password/hash updates.
- Auth validation errors are redacted for both register and login, including invalid JSON and unknown fields. Infrastructure/APM must separately be configured not to capture authentication request bodies or raw local variables.

## Testing and preview

Start the backend from the repository root:

```sh
backend/.venv/bin/python -m uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000/docs`. Use an account you previously registered, then try an incorrect password and unknown address. These checks verify credentials only; they do not sign the mobile app in.

Automated verification:

```sh
TEST_DATABASE_URL=postgresql+psycopg:///fairway_iq_test_registration backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests -q
```

Final result: **53 passed, no skips**, including five isolated PostgreSQL tests. Tests cover valid login, normalization, incorrect password, unknown email, inactive account, invalid/malformed input, database/configuration errors, response redaction, malformed stored hashes and an explicit dummy-verification assertion. A PostgreSQL test registers a synthetic account, verifies it, rejects invalid credentials, and rejects it after deactivation. Existing registration and database tests remain passing. One existing Starlette/httpx TestClient deprecation warning remains.

Manual verification: the user confirmed registration returned 201, valid credentials returned 200, and both an incorrect password and an unknown email returned the same generic 401 response. The successful and invalid response bodies shown in Swagger contained no passwords, hashes or tokens. Credential verification created no authenticated session.

The existing integration fixture accepts only explicitly named `fairway_iq_test*` databases and creates temporary schemas within transactions that are rolled back. It never falls back to the development DATABASE_URL. No development data or migrations were modified.

## Remaining limitations

Before public deployment add request-size limits, shared login rate limits, concurrency limiting and abuse monitoring. Each Argon2 verification consumes approximately 64 MiB; dummy checks intentionally have the same cost. Require HTTPS and verified database TLS remotely. Email verification, password reset, MFA, hash upgrade policy, JWT/access tokens, refresh rotation, secure mobile storage and protected-route guards remain planned. Registration's different success/duplicate responses still expose account existence independently of this login endpoint. Timing tests are structural rather than statistical load measurements.

## Authentication throttling

The API now limits login to 20 and registration to 5 requests per client IP in a sliding 60-second window. Exhausted limits return generic HTTP 429 with Retry-After before database or password work. This is process-local protection for single-worker development; production needs shared/edge limits. See [rate-limiting documentation](backend-rate-limiting.md). Earlier verification counts above describe the preceding authentication checkpoint.
