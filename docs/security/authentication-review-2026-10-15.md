# Authentication security review — 15 October 2026

Scope: source review and synthetic unit/API tests; no production traffic, private environment inspection, database operations or timing penetration test. Existing opaque sessions remain the implemented authentication design.

## Verified implementation

- Argon2id v19, 64 MiB memory, three iterations, four lanes; fresh salts of at least 16 bytes and 32-byte outputs. Tests extract the actual generated parameters and verify different salts, exact Unicode passwords and incorrect-password rejection. This exceeds OWASP's listed minimum memory/iteration configuration; deployment hardware still needs capacity testing. [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [argon2-cffi API](https://argon2-cffi.readthedocs.io/en/stable/api.html).
- Unknown/empty stored hashes use a per-worker random dummy hash and cannot authenticate even if dummy verification returned true. Malformed hashes trigger dummy verification; ordinary mismatch does not repeat costly hashing. These deterministic tests verify work paths, not equal elapsed time or resistance to statistical timing attacks.
- Login and token issuance share normalized email lookup and the same per-IP quota. Wrong, absent and inactive accounts return the same credential error; inactive-account verification still does hash work. SQLAlchemy parameters and allowlisted profiles remain in use.
- Auth response middleware now supplies `Cache-Control: no-store` and `Pragma: no-cache` across `/auth/` responses, including handled validation/database errors and throttling. Tests verify registration success, 401/405/422/429/503 and unchanged public-health caching. Unhandled process/server errors and external reverse-proxy policy are not covered by this guarantee.
- Token validation now rejects unsupported purposes instead of silently treating them as refresh. Existing access/refresh routes use supported values already; this is a fail-closed helper correction, not a new token format.
- Malformed JSON passwords containing isolated UTF-16 surrogates are rejected with sanitized 422 before hashing, verification or account queries. Regression tests reproduced a 500/reachable-work path before the fix. Valid supplementary characters remain supported; Python whitespace/BOM rules are also covered without trimming passwords.
- Mobile password/name length validation now counts Unicode code points like Python instead of UTF-16 code units. Native input caps allow supplementary characters; names reject Unicode categories C as the backend does. No password normalization is performed. Native keyboard/autofill remains unverified.

## Outstanding risks and priorities

1. Registration status (201 versus 409) reveals whether an email is registered. The generic body does not remove that oracle. Changing the contract requires a product decision, email ownership verification/delivery design and tests; do not silently claim it is enumeration-resistant. Failed logins are generic, but timing cannot be assumed constant across database/network/account conditions.
2. Hashing can consume approximately 64 MiB per concurrent call, excluding process overhead. Process-local per-IP limits are not a global concurrency budget and are not distributed across workers. Before public exposure, benchmark realistic hardware and add reviewed edge/shared rate limits, request-size bounds and a bounded hash-work queue.
3. No automatic rehash-on-login workflow exists. Existing parameters are fixed; a future policy change needs an explicit safe successful-login update path and rollback tests.
4. HTTPS, remote verified TLS, least-privilege database credentials, secret-safe operational logging, ownership verification, recovery, incident-wide revocation and session cleanup remain operational/product work.
5. PostgreSQL integration tests remain opt-in and skipped without an explicit isolated test URL. Unit tests with mocks do not prove live transactions or concurrent locks. No development database was substituted.
6. SecureStore failure and offline logout can leave server-side sessions alive until revocation/expiry; the UI reports uncertainty. Browser sessions remain memory-only. No token should enter logs, telemetry, URLs or AsyncStorage.

## Decision

Retain opaque access/refresh sessions for this app. A JWT migration has no approved runtime requirement in this sprint. See [JWT implementation plan](jwt-implementation-plan.md), which is a proposal only. No authentication dependency, signing key, migration or JWT endpoint was introduced.
