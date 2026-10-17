# FAIRWAY IQ — Measurable V1 Acceptance Criteria

2026-10-16 update: a local CI workflow is now prepared; hosted execution and clean-install verification remain pending. See [CI quality lane](ci-quality-checks.md). The prior four security/Analytics/strategy commits are complete at `4a8a1ac`; older working-tree/pending-device statements below describe their earlier checkpoint. Principal Analytics/Home iPhone comparison is user-reported successful; broader native acceptance remains open.

Aligned 2026-10-16 for a controlled invited mobile pilot/demonstrator. All gates must have evidence; no overall percentage can substitute. Current statuses combine inspected source and explicitly dated prior evidence, not fresh execution of tests/services/devices during this strategy task.

Evidence labels: **Implemented** = inspected code; **Automated** = previously executed named tests; **User-reported** = user's device confirmation; **Pending** = acceptance evidence absent. Passing mock tests, a bundled export, an API integration test and a physical second-device test are different evidence types.

| ID | Measurable pass condition | Current evidence / remaining gap |
| --- | --- | --- |
| V1-01 Registration/login | A new synthetic pilot user registers, logs in, receives a session and sees their own profile; invalid inputs/credentials return safe errors; no secret is logged/returned | Implemented and prior API/DB tests; local principal device flow reported. Hosted lane pending |
| V1-02 Persistent auth | After an online native restart, restore/rotation identifies the same account; logout clears local credentials and confirmed online revocation rejects the session; expiry/replay cases pass automated tests | Implemented/prior automated evidence and principal restore reported. Release-build expiry/lifecycle matrix pending; offline restore is not promised |
| V1-03 Valid tracking | Full 9, full 18, and early 3/9 scorecards preserve only played holes and correct scores; malformed scores, skipped holes and putts > strokes are rejected | Automated numeric/early-length tests; principal native flow reported; full device matrix not individually confirmed |
| V1-04 Durable PostgreSQL save | POST then detail/list returns identical owned data; same key/payload returns same record, changed payload returns 409; interrupted write leaves no partial parent/children | Implemented and real isolated PostgreSQL tests, including concurrent submissions and rollback. Development migration 0003 already verified |
| V1-05 Retrieval/second device | A Synced round survives online relaunch and is retrieved on a clean second device under the same account, without copying device storage | First-device principal reopen is user-reported. Clean second-device retrieval remains pending; source capability is not a device test |
| V1-06 Ownership/legacy | Account B cannot list/read A's round; foreign/unknown IDs have matching safe 404; account switches hide A's draft/summary; old shared records stay in preview and are not uploaded automatically | Real API isolation tests and mobile service/hook tests pass historically. Separate two-account native/preview checks not individually confirmed |
| V1-07 Basic Analytics/Home | For each 9/18 filter, acknowledged complete records produce exact sample count and arithmetic mean strokes/putts; partial/draft/pending/preview exclusions are explicit; Home and Analytics reconcile under the approved source policy | Home and Analytics now use shared acknowledged-only complete-round selection. 142 mobile tests/typecheck/lint/exports passed; native filter/sample/account/error verification remains pending |
| V1-08 Read-only profile | Current account name/email and logout work; signed-out/preview does not expose another user's identity | Implemented and principal user reports; no edit/delete UI claimed |
| V1-09 Safe API/resources | Validation/redaction/cache/auth/ownership tests pass; >16 KiB bodies and deadline/fragment overload are rejected; quotas/concurrency deny safely; same-key retry succeeds after expiry | 227 prior backend passes, including PostgreSQL and new controls; user reported normal flow after update. Shared/gateway production controls and deployment tuning pending |
| V1-10 Reproducible quality | A clean approved CI/test environment installs pinned dependencies and passes backend including isolated PostgreSQL with no integration skips, mobile types/lint/tests and platform build; release reviewer records results | Recorded local backend 227/mobile 142 passes and earlier exports; no tracked CI/release lane verified. Existing deprecation/dispositions recorded, not hidden |
| V1-11 Demonstrable deployment | A documented fresh setup produces a usable mobile build connected to hosted HTTPS API/PostgreSQL; target config/secrets, readiness, controlled migration, rollback and backup/restore are verified | Missing/unverified. Existing LAN Expo demo is not this acceptance gate. No deployment target/build was exercised in this task |
| V1-12 Trust/accessibility/privacy | Save/pending/error states are truthful; missing metrics remain absent; primary navigation/fields work with VoiceOver/large text/reduced motion; cache retention/legacy behavior is explained; advisory review and pilot risk decision recorded | Source accessibility and data-state safeguards exist. Full device evidence, release privacy/retention decision and dependency-risk disposition pending |

## Deterministic analytics acceptance fixtures (future implementation)

These are synthetic test cases, not user performance data:

- A complete 9-hole record at par 4/strokes 5/putts 2 each has 45 strokes, played par 36, 18 putts and +9. A second eligible 9-hole record at strokes 4/putts 1 each produces means 40.5 strokes and 13.5 putts, sample n=2.
- An 18-hole record never changes the 9-hole means. A 3/9 round at 5 strokes/2 putts has 15 strokes, played par 12, six putts and +3, but is excluded from complete-round averages.
- A pending copy of either record does not enter acknowledged-record metrics. Its state/count remains visible and it enters the dataset only after acknowledgment. Preview/draft/another account never contributes.
- Empty eligible data returns absent values, not zero. Genuine zero recorded putts remains zero. One eligible round can show a descriptive score with n=1; it cannot create an improvement trend. Multiple records still do not establish statistical significance or causal benefit.
- A bounded last-five window and 1,000-record cache are labeled; totals are not claimed to represent lifetime play. Timestamps/order/sample filters are deterministic. Different course/tee difficulty is not controlled by current records.

No penalties, FIR, GIR, official handicap or strokes gained is computed from the current schema. Break-100/90/80 achievements are V1.1, not V1 analytics; they require complete eligible 18-hole scores strictly below their threshold.

## Deployment/security evidence packet

For an approved future demonstrator, record build/commit identity, target environment, synthetic acceptance accounts, test results, host/TLS/database certificate settings, least-privilege application versus migration roles, proxy trust/gateway limits, readiness/schema check, migration approval/result and rollback/restore exercise. Never include credentials, tokens or connection strings. Local /health is liveness, not proof of DB/schema readiness. Native refresh stays in SecureStore; browser session limitations remain explicit.

Every advisory root needs dated source/exposure/disposition and a named release decision. The current 28 findings are not fixed by request throttling or lower observed exposure. A reachable unmitigated high-impact path cannot be silently waived; determine the exposure and safe pilot boundary before release. An invited demo decision is not unrestricted public-launch approval. Account ownership verification/recovery and wider lifecycle controls must be revisited before public self-service.

## Acceptance record protocol

Use one row per ID with date, environment/build, executor (automated/agent/user), result, evidence link and unresolved issue. Do not turn a general “works” into separate unperformed edge-case results. For V1-05, name the two test devices/builds in non-identifying terms and confirm no cache transfer. For engineering checks, distinguish skipped tests from passes and isolated test schemas from development data. No tests, interviews or deployment were executed by this documentation update; engineering results above are historical recorded evidence.
