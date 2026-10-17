# FAIRWAY IQ architecture

Source-reviewed 16 October 2026; round boundaries updated after Sprint 1. Original overview dates from 15 October. Implementation status and next actions belong to [CURRENT_STATE.md](CURRENT_STATE.md) and [NEXT_SESSION.md](NEXT_SESSION.md); this overview describes subsystem boundaries, not deployment readiness.

## Applications

| Directory | Stack | Responsibility |
| --- | --- | --- |
| `mobile/` | Expo 57, React Native 0.86, Expo Router, strict TypeScript | Welcome/account flow, authenticated profile, account-scoped round upload/history and Home summaries; separate legacy local preview. Route files remain in `mobile/app/`; reusable logic lives outside routes. |
| `backend/` | Python 3.12, FastAPI, Pydantic Settings, SQLAlchemy 2, psycopg, Alembic | User registration, credential verification, opaque-token sessions, profile and account-owned round submission/history/detail. |
| `frontend/` | React, TypeScript, Vite, Tailwind, Motion | Independent website and demo using illustrative data. It is not the authenticated mobile client. |
| `docs/` | Markdown | Technical contracts, security proposals, verification evidence and canonical handoff. |

## Authentication boundary

Mobile account forms call `/auth/register` and `/auth/token`; `/auth/login` verifies credentials only. Passwords use Argon2id. The backend stores token digests, not raw tokens; `/auth/me` checks session expiry/revocation and current user status. Refresh rotation and logout lock the parent session before inspecting refresh state. Schemas allowlist responses and authentication validation errors omit rejected inputs. Auth responses receive no-store headers; rate limits are bounded per-process development protections.

Mobile keeps access tokens in memory and native refresh credentials in SecureStore, bound to the configured API address. Browser sessions are memory-only. A single session-operation queue prevents concurrent refresh/logout mutations; consumed refresh tokens are removed before requests to avoid crash-driven replay. Expo Router guards distinguish authenticated account access from explicit local preview. See [backend sessions](backend-sessions.md), [mobile authentication](mobile-authentication.md) and [security review](security/authentication-review-2026-10-15.md).

## Round data boundary

Authenticated completions are submitted to owner-scoped PostgreSQL round/hole tables through POST /rounds; history/detail endpoints enforce current session ownership. Server-acknowledged records, durable pending copies, one draft and selected hole use a bounded AsyncStorage cache keyed by API origin/account. Pending UUID/payload is persisted before sending, then acknowledged with the server ID. Legacy shared records remain only in preview and are never automatically imported. Cache data is not encrypted and remains on logout, but the UI/account namespaces are separate. Tokens never enter AsyncStorage. See [round API](backend-rounds.md) and [mobile integration](mobile-account-rounds.md).

`roundStore.ts` validates decoded data and serializes local storage. `roundLibraryStore.ts` serves legacy preview; the session provider supplies a shared `accountRoundStore` for each signed-in scope. `useRoundLibrary` owns editing/save/retry; Home uses `useSavedRounds` through that scoped store, whose refresh preserves the current draft. `utils/round.ts` validates hole scores and totals; `utils/dashboard.ts` computes summaries from saved complete rounds, separating 9/18-hole lengths and excluding partials from averages. A partial scorecard contains only played holes while retaining its planned length. Fairways, greens and handicap are not inferred.

## Database and operations

Settings load privately from environment. Application startup does not create schema or run migrations. Alembic history contains users, session/refresh tables and revision 0003 for round/hole tables. Development migration 0003 was previously approved/applied; this documentation task performs no database operation. Integration tests require an explicitly configured isolated test database with existing guards and temporary schemas; development credentials must never be substituted. See [database guide](backend-database.md).

The backend/mobile upload/retrieval path supports account recovery of rounds; a clean second-device demonstration is not yet recorded. Basic Analytics now shares acknowledged complete-round selection with Home; AI Coach remains a placeholder; no practice planner, goals or real tournament engine exists. Round body/deadline/concurrency and peer/account quotas are process-local safeguards, not distributed deployment protection. Production deployment still requires TLS, least privilege, gateway/shared limits, redacted telemetry, recovery/ownership verification and an operational retention policy. See [dependency review](security/dependency-audit-2026-10-15.md) for current advisory limitations. JWT remains an optional [proposal](security/jwt-implementation-plan.md), not a V1 prerequisite. The current product direction is [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md); opaque sessions are preserved.
