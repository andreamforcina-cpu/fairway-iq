# JWT implementation plan — proposal only

Prepared 15 October 2026. No implementation is authorized by this document. Existing opaque sessions already provide server-side revocation, refresh rotation and replay detection; keep them unless independent services require signed-token validation and the tradeoffs are explicitly approved.

## Approval gates

1. State the concrete consumer and why opaque-token introspection is insufficient. Decide whether immediate logout/account-disable enforcement still requires a database/introspection check; offline JWT validation otherwise allows access until expiry. Keep the present behavior until this tradeoff is approved.
2. Select and audit a maintained Python JOSE library and compatible cryptographic dependency, without installing it as part of planning. Choose a fixed asymmetric signing algorithm supported by all consumers; never choose an algorithm from an untrusted token header. Review key management and compliance requirements before the final algorithm decision.
3. Define a versioned contract and migration/rollback strategy. Preserve `/auth/login` as credential-only, or deliberately version/deprecate it. Native clients must be upgraded to validate the new response shape; the current client deliberately requires opaque `fiqa_` access tokens. Do not silently change `/auth/token` under existing clients.

## Proposed design after approval

- Short-lived signed access token with minimum claims: `iss`, intended `aud`, immutable user UUID in `sub`, `iat`, `exp`, unique `jti`, and server-side session identifier. No passwords, emails, sensitive profile data or authorizations that can become stale without a defined invalidation policy. Signing is not encryption.
- Validate signature and pinned algorithm, issuer, intended audience, token type, expiry and required claim types before using identity. Define narrow clock tolerance and distinct validation rules for each token purpose. Reject unsigned tokens, algorithm/key confusion and cross-purpose substitution, following [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html).
- Keep refresh tokens opaque, hashed at rest and single-use with the current parent-session lock, absolute deadline and replay-triggered revocation. A JWT refresh token alone does not provide replay prevention.
- Store signing keys in deployment secret management, use an allowlisted key identifier and a controlled JWKS distribution path if multiple verifiers exist. Do not fetch attacker-provided key URLs or files. Plan overlap, emergency rotation, unknown-key failure and cache invalidation.
- Preserve SecureStore refresh persistence and memory-only mobile access, serialization, no-store responses, generic errors, safe telemetry and HTTPS. JWT client-side parsing never grants authorization.

## Required test and rollout matrix

- Valid/expired/future-issued tokens; wrong issuer/audience/type; missing or incorrectly typed required claims; malformed/oversized input; unsigned and algorithm-confused tokens; wrong signatures; key rotation/unknown key; narrow clock tolerance.
- Active/inactive user, ownership authorization and agreed revocation behavior; no account data in claims or errors; verification/DB/config failures must fail closed with safe responses.
- Refresh replay, concurrent refresh/logout, absolute expiry, commit failure and isolated-session revocation remain regression requirements on an explicit isolated PostgreSQL database.
- Mobile upgrade, restore, refresh, lost-response behavior, logout, deep links and offline errors on real devices; old clients retain opaque-token compatibility until retirement is approved.
- Operational key-rotation rehearsal, redaction inspection and rollback to opaque sessions with explicit session invalidation policy. No schema change or migration without separate target confirmation and approval.

Acceptance: reviewed threat model, measured consumer benefit, dependency/key approvals and all relevant tests pass. This plan does not establish OAuth/OIDC compliance or authorize a deployment.
