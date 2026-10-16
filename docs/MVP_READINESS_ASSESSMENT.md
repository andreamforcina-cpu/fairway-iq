# FAIRWAY IQ — MVP READINESS ASSESSMENT

**Audit date:** 16 October 2026, America/New_York. **Repository:** main, HEAD b21af72, plus the existing uncommitted SDK 57 patch updates. **Mode:** audit only; no application code changes, commits, pushes, deployments or online database migrations.

## 1. Executive summary

FAIRWAY IQ is a credible local mobile prototype with real account/session integration, a functioning local score tracker and a dashboard calculated from saved device data. It is **not yet the requested end-to-end V1 MVP**.

The decisive gap is **account-owned round persistence in PostgreSQL**. Accounts and authentication sessions have database models and API routes; golf rounds do not. Completing a round writes AsyncStorage, not the backend. Reopening on the same device works, but account isolation and cross-device recovery of golf data are absent.

Assessment: **UI 75%; backend 44%; weighted end-to-end MVP capability coverage 50%**. These are explicit planning estimates, not measured coverage or release approvals. The complete MVP journey fails at saving a round to PostgreSQL. Basic local metrics exist; the Analytics tab is a placeholder. AI Coach is not implemented.

A realistic remaining budget is **160 engineering hours**, approximately **8 weeks at 20 hours/week or 16 weeks at 10 hours/week**, under the deliberately small scope below. Main uncertainty: server round integration, legacy local-data handling, deployment and native QA.

## 2. Smallest professional V1 and current architecture

Define V1 as an **invited mobile pilot/demo over a hosted HTTPS API**, not an unrestricted public production launch. It must support registration/login, persistent native sessions, validated 9/18-hole and early-finished rounds, account-owned PostgreSQL saves/history, basic statistics from those records, a read-only profile and a reproducible tested deployment. Online server saves are sufficient; do not require a full offline synchronization engine.

Keep the web application as a landing page and clearly labeled demo. Building a second authenticated web client would duplicate scope without repairing the missing mobile-to-database journey. Public self-service release adds email verification/recovery and broader operational/privacy obligations beyond this invited-pilot estimate.

| Layer | Verified implementation | Boundary |
| --- | --- | --- |
| Mobile | Expo 57.0.30, Router 57.0.28, React Native 0.86.3, strict TypeScript | Routes in mobile/app; account services and local round services are separate |
| Backend | FastAPI, Pydantic Settings, SQLAlchemy 2, psycopg, Argon2id | Health and account/session API only; no round/statistics API |
| Database | User, AuthSession, RefreshToken models; migrations 0001/0002 | No round or hole-score tables; live schema not queried in this audit |
| Local golf data | Versioned AsyncStorage library with draft, selected hole and history | Shared across accounts and preview; no backend ownership or sync |
| Web | React/Vite/Tailwind/Motion landing page and hardcoded preview | No authenticated API integration |
| Operations | Local commands, manifests, Alembic and tests | No tracked CI workflow, deployment configuration or EAS build profile found in inspected files; external services unverified |

### Code evidence index

- **E1:** backend/main.py includes only auth/session routers and GET /, /health. Health returns a static healthy response; it does not probe PostgreSQL.
- **E2:** backend/api/auth.py: register(), verify_login_credentials(), login(). Registration commits a user; /auth/login verifies credentials only.
- **E3:** backend/api/sessions.py and backend/services/sessions.py: token(), refresh(), logout(), me(), rotate_session(), authenticated_user(). These implement actual opaque sessions, not JWT.
- **E4:** backend/models/{user,auth_session}.py, models/__init__.py and migrations/versions/0001_create_users.py, 0002_create_auth_sessions.py. The registered model set is users/sessions/refresh tokens only.
- **E5:** mobile/services/{sessionApi,sessionManager,sessionStorage}.ts, hooks/useSession.tsx and components/SessionNavigator.tsx. Native SecureStore restore, serialized refresh/logout and explicit preview guards.
- **E6:** mobile/components/RoundTracker.tsx and utils/round.ts: finish(), saveFinished(), finishRound(), holeErrors(), roundTotals(). Early finish keeps the played prefix and planned length.
- **E7:** mobile/services/roundStore.ts: completeRound(), decodeLibrary(), createRoundStore(); roundLibraryStore.ts supplies AsyncStorage. useRoundLibrary.ts persists edits. No HTTP round save exists.
- **E8:** mobile/components/RoundDashboard.tsx, hooks/useSavedRounds.ts and utils/dashboard.ts: dashboardSummary(). Real local averages, separate 9/18 complete rounds, partials excluded, no calculated handicap/fairways/greens.
- **E9:** mobile/app/(tabs)/analytics.tsx and coach.tsx render UpcomingScreen; profile.tsx shows authenticated name/email and logout. No profile editing.
- **E10:** frontend/src/App.tsx defines hardcoded rounds and static advice; no API-backed analytics or coaching.
- **E11:** backend/tests and mobile/tests, including session, Unicode, cache, roundStore, dashboard and motion regressions. Frontend package.json has build/lint, no test script.
- **E12:** backend/security/{passwords,tokens,rate_limits,response_headers}.py, schemas/auth.py, core/config.py and db/session.py implement current safeguards and configuration boundaries.

Older documentation describes earlier checkpoints, sometimes claiming authentication is planned or Home is sample-only. Those statements are historical; E1–E12 and the current manifests determine this assessment. Historical database migration verification is not fresh runtime evidence.

## 3. Feature completion matrix

Definitions: **COMPLETE** = implemented, integrated and verified for its stated scope; **PARTIAL** = important delivery/verification gaps; **MOCK** = static/sample behavior; **NOT STARTED** = no meaningful implementation; **BLOCKED** = a decision/dependency prevents safe completion. No complete screen is automatically a complete feature.

### Implementation, integration and effort

Effort ranges below are overlapping work packages, not additive totals; use sections 8–9 for the total budget.

| Feature | Status | Working functionality | Missing for V1 | API / PostgreSQL | Remaining effort |
| --- | --- | --- | --- | --- | --- |
| Registration/login | PARTIAL | Validated registration, Argon2id, real token issuance | Hosted verification; public account lifecycle if scope expands | Integrated; users persist | 6–12h pilot hardening/QA |
| Persistent sessions | PARTIAL | SecureStore refresh, restore, rotation, logout | Current-patch device check, expiry/deep-link/failure matrix | Integrated; session tables | 6–12h |
| Round tracking | PARTIAL | 9/18 holes, par/strokes/putts, partial finish and validation | Connect completion to owned server save and robust failure state | Local only | 12–20h integration/QA |
| PostgreSQL round storage | NOT STARTED | Authentication DB foundation is reusable | Round/hole models, contract, ownership, transaction and retry safety | No round routes/tables | 28–44h API/schema/tests |
| Round history | PARTIAL | Local saved scorecards and restart persistence | Server history/detail, account separation, legacy-data policy | AsyncStorage only | 12–22h |
| Mobile dashboard | PARTIAL | Real local complete-round averages and recent rounds | Derive from owned server records; loading/error integration | No round backend | 8–14h |
| Basic analytics | PARTIAL | Local scoring/putt summaries in Home | Real Analytics screen; simple trends/relative-to-par with clear denominators | No analytics API | 12–22h |
| Profile | PARTIAL | Real name/email and logout | Hosted/current-patch verification; account lifecycle boundaries | /auth/me integrated | 3–6h for read-only V1 |
| Navigation/forms | PARTIAL | Router tabs, guards, explicit preview, field errors | Native deep-link, accessibility and failure-state matrix | Guards protect account access, not local golf ownership | 6–12h |
| Web application | MOCK as product client | Landing page and sample interactive dashboard | No authenticated client; keep outside V1 app scope | None | 2–4h copy/deployment alignment |
| AI Coach | NOT STARTED | Honest upcoming-screen placeholder | All AI/backend/evaluation behavior | None | Deferred; excluded from V1 estimate |
| Testing/deployment | PARTIAL / BLOCKED for release | Passing local suites and export history | Isolated DB execution, CI, signed build, hosted API, operational evidence | Production target not selected/verified | 28–44h plus integration QA |

### Coverage, manual evidence and concerns

| Feature | Automated evidence | Manual evidence | Main concern |
| --- | --- | --- | --- |
| Registration/login | API success/errors, normalization, redaction, hashing and malformed Unicode | User previously reported registration/login working | Duplicate-registration status reveals account existence |
| Sessions | Mocked lifecycle/concurrency queue tests; DB integration exists but skipped today | User reported restore/logout; expiry not individually demonstrated | Lost refresh response requires login; offline logout may not confirm server revocation |
| Tracker | Calculations, validation and all early-finish lengths covered | User reported principal early-finish checklist working | Local saves can fail; must await save confirmation |
| PostgreSQL rounds | No implementation-specific tests possible yet | None | V1 journey blocker and future ownership boundary |
| History | Round-trip, corruption, ordering, capacity and failure recovery tests | User reported history/reopen persistence | Same local records visible across accounts/preview |
| Dashboard | Complete/partial filters, latest-five math, 9/18 separation | User reported 42.0 complete-round value, partial exclusion, filter and persistence | Local-only values are not cloud/account statistics |
| Analytics | Dashboard helper tests only | No implemented Analytics screen to validate | Avoid inventing fairway/green percentages or mixing lengths |
| Profile | /auth/me and allowlist/session tests | User reported name/email and logout | Read-only; no recovery/edit/delete workflow |
| Navigation/forms | Validation and motion doubles; no full rendered E2E suite | Principal navigation/reduced-motion checklist reported working | VoiceOver/large text/deep links not individually verified |
| Web | TypeScript/build/lint, no automated interaction suite | No fresh browser QA in this audit | Marketing copy should not imply deployed AI/account features |
| AI | None | None | Placeholder must remain explicit |
| Testing/deployment | See section 6 | No current signed-build/hosted release test | Passing unit tests do not prove deployability |

All device confirmations predate the latest four Expo patches. No new iPhone/browser verification was performed by the auditor. Post-patch native smoke testing remains pending.

## 4. End-to-end user journey

WORKING below means supported by current source/tests and historical user evidence for the local setup, not a fresh live service or device execution.

| Step | Result | Evidence and practical limit |
| --- | --- | --- |
| 1. Open FAIRWAY IQ | WORKING locally | Router layouts and Expo app; signed/hosted distribution unverified |
| 2. Create an account | WORKING locally | E2 register() and mobile sessionApi.register(); user row persists when DB is configured |
| 3. Log in | WORKING locally | E3 /auth/token and E5; /auth/login alone is not a session |
| 4. Stay logged in after restart | WORKING on native happy path | SecureStore and restore rotation in E5; offline/expiry behavior has limits |
| 5. Start round | WORKING locally | E6 createRound/start flow |
| 6. Record scores/putts | WORKING locally | E6 field validation; strokes includes putts; putts cannot exceed strokes |
| 7. Finish round | WORKING locally | E6/E7 validate and create local history, including early finish |
| 8. Save to PostgreSQL | NOT WORKING | E1/E4 have no round route/table; E7 writes AsyncStorage |
| 9. Reopen saved round | PARTIAL | Works on that device; no server retrieval or cross-device account history |
| 10. View real statistics | PARTIAL | E8 uses actual local scores; no server-derived Analytics screen |
| 11. Log out securely | PARTIAL | Local clear and server revocation implemented; offline uncertainty reported, local golf data remains shared |

**Exact break:** step 8. Account persistence and device round persistence are two separate paths. Successful login does not make golf records account-owned. Two accounts on one phone currently use the same round library; a second device cannot recover those rounds through the API.

## 5. Architecture and security assessment

### Critical V1/release blockers

These are delivery blockers, not claims of discovered critical-severity exploits.

1. No owned round schema/API/mobile save/read path. Cross-user authorization for future golf records cannot be claimed before it exists and is tested.
2. Local round data is shared across accounts/preview and has no cloud recovery. Do not silently upload or assign legacy records to whoever logs in next.
3. No verified hosted HTTPS API, release build, CI/database test path or deployment/restore runbook. /health is process liveness only.
4. Current live PostgreSQL behavior was not verified: 15 integration cases skipped. Do not substitute the development database or treat historical 85/85 results as current.

### High-priority risks

- Mobile audit: **28 package findings, 18 high/10 moderate**; four transitive roots: braces, node-forge, uuid and decode-uri-component. Parent-package propagation is not 28 proven exploits. URI decoding has potential navigation exposure; build/signing prerequisites differ for the tooling packages. See [decoder advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) and docs/security/sdk57-remediation-review-2026-10-16.md. Latest SDK 57 patches did not remove them; no compatible forced override was verified.
- Registration returns 201 versus 409 for duplicate email. Generic text does not eliminate enumeration. Email ownership verification and recovery are absent; required before unrestricted public self-service.
- Rate limits are process-local per-IP windows; no shared enforcement, bounded global hash concurrency or request-size middleware was found. Argon2 work consumes meaningful memory under parallel load.
- HTTPS is required by the mobile API client outside development, but server TLS/proxy configuration, remote database certificate policy, least privilege, backups and restoration were not operationally verified.
- SQL parameters are hidden, secrets use private configuration and auth errors are sanitized. A deployment-wide logging/APM redaction policy is not proven by these source controls.
- Round storage is not encrypted; logout does not isolate or remove account golf data. Retention/export/deletion and privacy expectations need a deliberate policy.

### Safeguards already implemented

Argon2id uses 64 MiB, three iterations, four lanes and fresh salts. This is consistent with a modern memory-hard password approach; capacity still needs hardware testing. Reference: [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). Unknown users incur dummy verification; this is not proof of constant timing.

Opaque access/refresh tokens are purpose-separated and hashed at rest. Refresh replay revokes a server session; rotation/logout use parent-row locking. Access/profile checks include expiry, revocation and active-user status. Mobile uses SecureStore for native refresh credentials and memory for access; browser sessions are memory-only. No JWT is needed to complete this MVP.

Parameterized SQLAlchemy queries, explicit response allowlists, malformed-Unicode rejection, sanitized validation and no-store auth responses are present. Database startup does not run migrations. Integration tests have isolated-target guards and temporary schemas.

### Lower-priority improvements

Clarify stale preview/Profile copy; review accessibility focus/large text; add bounded/virtualized history as real usage warrants; plan session cleanup and rehash policy; improve developer/deployment documentation. Do not replace the current architecture merely to change token format.

## 6. Fresh test and quality results

All checks below were run during this audit on the current working tree unless marked historical.

| Check | Actual result |
| --- | --- |
| Backend pytest, full configured suite | **109 passed, 15 skipped, 1 warning**, exit 0 |
| Isolated PostgreSQL integration | **Not executed**: explicit isolated TEST_DATABASE_URL unavailable; cases skipped safely |
| Backend warning | Starlette TestClient/httpx deprecation; not a test failure |
| Mobile TypeScript | Passed, exit 0 |
| Mobile ESLint | Passed, exit 0 |
| Mobile automated tests | **93 passed**, zero failures/skips, exit 0 |
| Web TypeScript/build | Passed; npm run build invokes tsc -b and Vite |
| Web ESLint | Passed, exit 0 |
| Web automated interaction tests | No test script/suite found; not claimed as passed |
| Mobile npm audit | Exit 1; 28 findings remain |
| Web npm audit | Exit 0; zero registry findings, not proof of security |
| git diff --check | Passed |
| Private env/cache/build ignore checks | Passed; file contents not inspected |
| Native/browser manual QA | Not performed during audit |
| Expo iOS/Android/web exports | Historical prior-step passes after SDK patches; not repeated here |

No coverage percentage was measured. Test counts include parametrized cases and do not establish full branch, rendered UI, authorization or end-to-end coverage. Backend advisory scanning was not available/run; previous pip check was dependency consistency only. Unit tests may generate offline migration SQL; no online migration or development-database operation was executed.

## 7. Weighted completion model

Scoring measures capability delivered against the invited V1 scope, including integration and verification. Each category score is an engineering judgment from 0–100, not a count of polished screens.

| Category | Weight | Score | Weighted points | Reason |
| --- | ---: | ---: | ---: | --- |
| Authentication | 15% | 80 | 12.0 | Real sessions and restore; lifecycle/hosted verification gaps |
| Backend/database | 15% | 40 | 6.0 | Strong account foundation; golf domain absent |
| Round tracking/persistence | 20% | 45 | 9.0 | Local tracker mature; server persistence/ownership missing |
| Dashboard | 10% | 60 | 6.0 | Real local summaries, not account cloud data |
| Analytics | 10% | 20 | 2.0 | Helper summaries exist; dedicated experience absent |
| Profile | 5% | 70 | 3.5 | Real read-only identity; narrow scope |
| Security | 10% | 45 | 4.5 | Useful controls; material operational/dependency gaps |
| Testing | 10% | 60 | 6.0 | Passing suites; DB/device/CI gaps |
| Deployment | 5% | 10 | 0.5 | Buildable locally, no verified release environment |
| **Total** | **100%** | | **49.5/100** | **Approximately 50% end-to-end capability coverage** |

Formula: sum(weight × category score) / 100. **No percentage overrides the step-8 release blocker.**

Separate estimates, with different denominators:

- **UI: 75%.** Account screens 25% × 90; dashboard 20% × 85; tracker/history 30% × 90; Analytics 15% × 10; profile 10% × 70 = 75. This assesses implemented V1 interactions, not visual aesthetics. AI and a web app are excluded.
- **Backend: 44%.** Account/session API 40% × 85; complete V1 schema 20% × 40; round/statistics API 25% × 0; operational delivery 15% × 10 = 43.5, rounded to 44.
- **End-to-end: 50%.** The 49.5 weighted table above, rounded. Confidence **medium**, with a planning uncertainty of roughly ±10 percentage points. Confidence is higher in the identified missing capabilities than in any percentage.

## 8. Remaining development effort

| Scenario | Engineering hours | At 10 h/week | At 20 h/week |
| --- | ---: | ---: | ---: |
| Optimistic | 100 | 10 weeks | 5 weeks |
| Realistic | 160 | 16 weeks | 8 weeks |
| Conservative | 240 | 24 weeks | 12 weeks |

These are remaining focused engineering hours, not calendar guarantees or quotes. They include implementation, integration, tests, bug fixing, security/dependency work and deployment. Waiting for accounts, signing, approvals or platform review adds elapsed time.

Assumptions: one developer familiar with this repository; preserve the existing UI/authentication; invited online-first pilot; manual course/par input; one straightforward round API, not bidirectional offline sync; read-only profile; basic score/putt trends; web stays a landing page; no AI, GPS or tournament engine. Conservative work allows more native/dependency/deployment regressions. Public release, recovery/email delivery, major framework migration, richer profile or offline synchronization can exceed this envelope.

## 9. Prioritized weekly sprint roadmap

Plan eight nominal **20-hour weekly sprints** for the realistic scenario. At 10 hours/week, split each into two weeks. The timeboxes are planning budgets, including tests and fixes, not identical task-complexity claims.

| Sprint | Objective and work | Dependencies | Acceptance criteria | Hours |
| --- | --- | --- | --- | ---: |
| 1 | Define round contract; design owned round/hole schema and draft/finished/partial rules; add isolated tests | Confirm pilot scope and test target | Reviewed contract/model tests; migration prepared only, target/application separately approved | 20 |
| 2 | Implement authenticated create/list/detail routes, transactions, bounds, pagination and duplicate-save protection | Sprint 1 | User B cannot read/write user A's records; invalid/retried saves handled; isolated PostgreSQL tests pass | 20 |
| 3 | Connect mobile completion/history to API with safe loading, auth refresh and retry behavior | Sprint 2 | Account creates and retrieves server round after app restart; failed request does not falsely report saved | 20 |
| 4 | Resolve legacy shared local data; account isolation and server-backed Home/history | Sprint 3; explicit legacy-data decision | Two-account and second-device tests; no silent reassignment/import; partials retain correct totals | 20 |
| 5 | Deliver basic Analytics from owned records; 9/18 filters, scoring/putt trends and empty/error states | Server data path | Dashboard/Analytics reconcile with known fixtures; no fabricated fairway/green/handicap values | 20 |
| 6 | Security/reliability pass: dependency decision, resource limits, privacy/logging and auth edge cases | Confirm exposure model; approvals for major upgrades | Documented advisory dispositions; ownership/abuse/error regressions pass; no credential leakage | 20 |
| 7 | CI, isolated DB pipeline, HTTPS staging API, least privilege, signed build and runbooks | Hosting/signing accounts; migration approval | Fresh environment can reproduce build/test/deploy; health/readiness distinction and backup/restore procedure verified | 20 |
| 8 | Native E2E/accessibility/network regression, fixes and demo/release acceptance | Staging and build | Eleven-step journey succeeds including PostgreSQL and second-device history; release checklist signed off | 20 |
| **Total** | | | | **160** |

Create the test environment early; final infrastructure is not a reason to defer all integration tests until sprint 7. Use a controlled deployment lane with rollback; do not automatically migrate on application startup.

## 10. Version 1 / 1.1 / 2 scope

| Version | Scope |
| --- | --- |
| **V1 — must have** | Invited mobile registration/login/restore/logout; read-only profile; validated rounds; owned PostgreSQL saves and history; basic real-data Home/Analytics; bounded secure API; reproducible HTTPS staging and signed demonstrator; isolated tests, ownership checks and essential native QA; explicit privacy/legacy-data handling |
| **V1.1 — useful next** | Profile editing, export/delete/account-management UX, improved charts and filters, local cache/offline queue, course conveniences, session/device management. Email verification/recovery becomes mandatory earlier if moving to unrestricted public registration. |
| **V2 — future** | AI Golf Coach, ML predictions, GPS/shot tracking, live tournament leaderboards, broadcast experiences, advanced course explorer and complex admin dashboards |

Do not count these advanced features as existing because marketing names or tabs are present. Keep AI/Analytics placeholders honest or remove unfinished tabs from the release navigation through a future approved product change. JWT is optional architecture work, not an MVP requirement.

## 11. Recommended next development task

**Design and implement the first account-owned round persistence vertical slice after explicit implementation authorization.** Start with the API contract and model/test design, then POST a completed round and GET it back under current_user ownership. Reuse existing score rules and opaque-session authentication. Agree stable identifiers/idempotency and the legacy local-library policy before mobile upload.

First acceptance test: account A saves a partial or complete round, restarts the app and retrieves it from PostgreSQL; account B cannot access it. Migration preparation is separate from permission to apply it. Do not start by building AI Coach, redesigning Home or replacing working sessions with JWT.

## 12. Git state, audit artifacts and boundaries

At audit start: main at b21af72, no staged files. Existing local modifications were the four memory files, mobile/package.json and mobile/package-lock.json, plus the untracked SDK 57 remediation review. They were preserved. The audit added this assessment and updated the four memory documents only. Application code and dependency files were not edited by the audit. No commit/push/deploy/database operation occurred; current remote services and live schema remain unverified.

If a prior assessment exists, preserve it under a unique sibling filename before replacing the canonical report. Final whitespace checking includes documentation. Generated frontend build output remains ignored.

## 13. Confidence and limitations

**High confidence:** no round backend schema/routes exist; local storage is shared; dedicated Analytics/Coach are placeholders; current automated check results. **Medium confidence:** happy-path usability from user reports and integration correctness inferred from source/unit tests. **Lower confidence:** native behavior after patch updates, active service/database state, operational security, exact remaining hours and completion percentages.

This is source review plus non-destructive automated verification, not penetration testing, a production certification, a fresh manual device test or proof that dependencies are safe. No credentials or private environment contents were inspected. Estimates must be revised after the first server-persistence slice and staging/device validation.
