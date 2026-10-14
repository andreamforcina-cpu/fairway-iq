# FAIRWAY IQ authentication — UI increment and backend proposal

## Current state

The backend exposes only `GET /` and `GET /health`, but database infrastructure now exists: SQLAlchemy 2.x typed models, synchronous psycopg 3 sessions, Pydantic Settings configuration, and Alembic migrations. PostgreSQL 17.11 is configured locally with `fairway_iq_dev`; migration `0001_create_users` was applied and the users table verified. The User model includes UUID, normalized unique email, password_hash, full_name, is_active and timezone-aware timestamps. Password hashing/verification, sessions, token issuance, registration/login and server authorization are still planned. The hash-prefix database constraint is not a password hashing implementation.

The welcome screen preserves branding, abstract shot-trajectory visual and typography, with Create Account and outlined Log In actions. A separate View sample preview link retains existing demo navigation; it neither authenticates nor implies that an account exists. Demo tabs are currently public presentation/local-state screens, not protected real-user resources. The dashboard greeting is neutral and its figures remain explicitly sample data. The Profile avatar is a 40-point circle inside a 48-point target. Without a real profile it shows an account icon. Its reusable component accepts a future profile image/initials, but the current caller supplies no fake profile.

## Mobile behavior and security limits

`AuthForm` implements both routes with registration name/email/password/confirmation and login email/password. It provides per-field validation, masked password visibility controls, native autofill hints, keyboard avoidance, accessible labels, busy/error states and reduced-motion-compatible existing stack transitions.

Valid submissions check a local capability declaration that is explicitly false. There is no network request, synthetic account, successful login, token, delay simulating network activity, or credential logging. Busy state may be very brief because the check is local. The service accepts no credentials. Password input exists transiently in React state while editing; it is never persisted. Fields clear after a valid unavailable submission and on navigation away. JavaScript strings cannot be reliably zeroized; this is not a claim that typed text never exists in memory. OS-managed autofill remains controlled by the device.

Registration proposes 15–128 characters without required character classes; confirmation compares exactly. Passwords are not trimmed or silently normalized. Login accepts nonempty passwords up to the safety bound without applying the registration minimum. Name/email validation is client convenience only: backend validation must remain authoritative. Email format checking is intentionally lightweight and must be followed by server parsing and ownership verification.

## Planned authentication layer on the implemented database foundation

1. **PostgreSQL and migrations:** retain the implemented SQLAlchemy 2, psycopg 3 and Alembic architecture. Reuse the User model and add verification state with a new reviewed migration; is_active currently defaults to true and must not imply verified email. Existing password_hash must receive genuine Argon2id output from the planned hashing service. Use synchronous DB routes/dependencies or explicitly offload blocking work; do not add blocking database calls directly to async routes. Define refresh sessions/token families with user ID, token digest, expiry, consumed/revoked state and rotation linkage. Add hashed, single-use email verification/password reset tokens with expiries. Scope future rounds to the authenticated user's ID.
2. **Passwords:** use argon2-cffi with Argon2id, unique library-generated salts, and at least 19 MiB memory, two iterations, parallelism one. Benchmark stronger settings against deployment capacity and rehash on successful login when policy changes. Apply server-side length bounds before hashing and reject breached/common passwords; allow password managers and pasted passwords. Use a dummy hash for unknown users to reduce timing-based enumeration. Never store reversible/plaintext passwords or log form bodies. These baseline parameters follow [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
3. **Endpoints:** `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`, and authenticated `GET /users/me`. Validate with Pydantic request/response schemas. Return generic credential errors and generic registration/reset acknowledgements to avoid account enumeration; only email ownership verification activates the account. Use transactional uniqueness checks. Login returns credentials only after actual password and verification checks.
4. **Access tokens:** propose signed JWT access tokens with a ten-minute lifetime; verify an explicit algorithm allowlist, signature, issuer, audience, expiry, subject and session ID. Keep signing keys in deployment secret management and plan key rotation. Protected requests check session revocation and user ownership; client guards alone never authorize data access.
5. **Refresh rotation:** issue a cryptographically random opaque token with a proposed 30-day absolute session lifetime. Store only its SHA-256 digest server-side. Refresh atomically consumes the old token and issues a replacement in a locked database transaction. Reuse revokes the token family. Serialize refresh operations in the mobile client and define interrupted-refresh behavior explicitly; never bypass replay detection by allowing silent broad reuse. Logout/password reset revoke sessions. See [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html) for refresh-token replay protections.
6. **Mobile integration:** store the refresh token only in Expo SecureStore; keep access tokens in memory. Bootstrap real session state through refresh plus `/users/me`, with loading/authenticated/signed-out states and a single-flight refresh mechanism. Clear credentials on logout, expiry, revocation and unrecoverable refresh errors. Configure appropriate iOS keychain accessibility; handle missing SecureStore data and do not assume uninstall clears every keychain item. Add Expo Router guards for protected screens, retaining separately labeled public previews only by explicit product choice. Confirm exact SDK behavior in [SecureStore documentation](https://docs.expo.dev/versions/latest/sdk/securestore/).
7. **Abuse controls and error safety:** use shared production rate limiting (for example Redis) per IP and account key across login, registration, reset and refresh. Apply progressive throttling rather than permanent attacker-triggered account lockout. Bound request sizes and hashing concurrency; return safe 429 responses. Only trust forwarded IP headers from configured proxies. Redact Authorization headers, passwords, refresh/reset tokens and validation input values from logs/APM. Enforce HTTPS; configure explicit CORS origins for future browser integration. Use typed safe response errors, request IDs and security events without secrets. Design account-enumeration resistance using [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

## Required backend changes before enabling authentication

- Extend the existing User model and Alembic history with verification state and session/reset-token tables. PostgreSQL environment configuration, lazy pooling/sessions, User model and initial migration are already implemented; do not recreate them.
- Add reviewed hashing/JWT dependencies and deployment-managed signing secrets.
- Implement validated auth routes, verified-email/reset delivery, transactional session rotation/revocation and user ownership checks.
- Configure shared rate limits, redacted logging, TLS/proxy/CORS policy, safe exception handlers and API schemas.
- Add backend tests for duplicate registrations, generic credential failures, expiry, replay, concurrent refresh, revoked sessions and unauthorized record access.
- Replace the mobile capability stub with the real service, integrate SecureStore/session bootstrap and guards, and add native login/logout/refresh tests.

The authentication UI increment itself did not implement backend auth. The subsequent database increment added SQLAlchemy, Alembic and psycopg infrastructure and an applied users migration; authentication remains planned. No real auth traffic occurs. Previously documented dependency advisories remain open; this work does not remediate them. Reset/verification, real guard enforcement, session persistence and account avatar data await the backend phase and approval.

## Verification and iPhone checklist

TypeScript and ESLint pass. All 41 tests pass: 20 existing API tests, 11 existing round tests, and 10 auth validation/unavailable-capability tests. Tests use local modules and mocks; they do not verify real authentication or iPhone keyboard/autofill/VoiceOver behavior. The iOS Metro export also passes with the new routes and bundled artwork. Native checks for this increment remain outstanding.

From `mobile/`, run `npm start -- --lan`, sign the CLI and Expo Go into the same Expo account, and scan the QR code while both devices are on the same Wi-Fi. Reload to return to welcome if already inside the demo.

- Verify the abstract trajectory and branding, then open Create Account and Log In.
- Submit blank or malformed values; verify field errors.
- Toggle password visibility and try mismatched registration passwords.
- Use a fictional example.test email and a test passphrase of at least 15 characters for registration. Valid submit must say Authentication not available yet, clear passwords and remain on the form.
- Switch forms/back to welcome; ensure password fields do not retain text.
- Open View sample preview; dashboard remains explicitly sample data. Tap its small avatar; Profile must show You are not logged in.
- Verify the Round Tracker is unchanged, and check keypad usability, large text, VoiceOver and reduced motion.

No staging, commit, or push was performed.

Documentation cleanup on October 14, 2026: backend checks report 14 passed and 3 isolated PostgreSQL integration tests skipped. No database migration or credential change was performed during this cleanup. See `backend-database.md` for implemented database state and safe environment setup.
