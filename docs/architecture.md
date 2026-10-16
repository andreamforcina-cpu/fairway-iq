# FAIRWAY IQ architecture

Source-verified 15 October 2026. Implementation status and next actions belong to [CURRENT_STATE.md](CURRENT_STATE.md) and [NEXT_SESSION.md](NEXT_SESSION.md); this overview describes subsystem boundaries, not deployment readiness.

## Applications

| Directory | Stack | Responsibility |
| --- | --- | --- |
| `mobile/` | Expo 57, React Native 0.86, Expo Router, strict TypeScript | Welcome/account flow, authenticated profile, local round tracker/history and Home summaries. Route files remain in `mobile/app/`; reusable logic lives outside routes. |
| `backend/` | Python 3.12, FastAPI, Pydantic Settings, SQLAlchemy 2, psycopg, Alembic | User registration, credential verification, opaque-token sessions and current-user profile. |
| `frontend/` | React, TypeScript, Vite, Tailwind, Motion | Independent website and demo using illustrative data. It is not the authenticated mobile client. |
| `docs/` | Markdown | Technical contracts, security proposals, verification evidence and canonical handoff. |

## Authentication boundary

Mobile account forms call `/auth/register` and `/auth/token`; `/auth/login` verifies credentials only. Passwords use Argon2id. The backend stores token digests, not raw tokens; `/auth/me` checks session expiry/revocation and current user status. Refresh rotation and logout lock the parent session before inspecting refresh state. Schemas allowlist responses and authentication validation errors omit rejected inputs. Auth responses receive no-store headers; rate limits are bounded per-process development protections.

Mobile keeps access tokens in memory and native refresh credentials in SecureStore, bound to the configured API address. Browser sessions are memory-only. A single session-operation queue prevents concurrent refresh/logout mutations; consumed refresh tokens are removed before requests to avoid crash-driven replay. Expo Router guards distinguish authenticated account access from explicit local preview. See [backend sessions](backend-sessions.md), [mobile authentication](mobile-authentication.md) and [security review](security/authentication-review-2026-10-15.md).

## Round data boundary

The tracker stores a versioned library containing one draft, selected hole and completed history in AsyncStorage. This data is local and shared across accounts/preview; it is not owned by the authenticated backend user and is not encrypted or synchronized by this implementation. Tokens never enter AsyncStorage.

`roundStore.ts` validates decoded data and serializes storage reads/writes. `roundLibraryStore.ts` provides the common instance. `useRoundLibrary` owns editing and save/retry status; Home uses `useSavedRounds` for read-only focus reloads. `utils/round.ts` validates hole scores and totals; `utils/dashboard.ts` computes summaries from saved complete rounds, separating 9/18-hole lengths and excluding partials from averages. A partial scorecard contains only played holes while retaining its planned length. Fairways, greens and handicap are not inferred.

## Database and operations

Settings load privately from environment. Application startup does not create schema or run migrations. Alembic history contains users and session/refresh tables. Integration tests require an explicitly configured isolated test database with existing guards and temporary schemas; development credentials must never be substituted. See [database guide](backend-database.md).

No AI service, backend round synchronization, real tournament engine or cross-device persistence is implemented. Production deployment still requires TLS, least privilege, distributed abuse/concurrency controls, redacted telemetry, recovery/ownership verification and an operational session-retention policy. See [dependency review](security/dependency-audit-2026-10-15.md) for current advisory limitations. JWT remains a [proposal](security/jwt-implementation-plan.md).
