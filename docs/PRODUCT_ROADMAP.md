# FAIRWAY IQ — Product Roadmap

Aligned 2026-10-16. This is the current product sequencing proposal, superseding conflicting future-version groupings in older reports. It does not authorize coding, migrations, major upgrades, deployment, commits or push. Keep historical reports intact.

## Current checkpoint and sequencing rule

**Sprint 1 — Secure PostgreSQL Round Persistence remains the foundational priority. Its implementation is complete, so do not restart it.** UUID round/hole models, migration 0003, authenticated owner-scoped POST/list/detail, duplicate handling, PostgreSQL integration and mobile account-specific upload/history are implemented. Development migration was separately approved/applied; principal iPhone save/refresh/relaunch flows are user-reported working. Cross-device and independently confirmed two-account native acceptance remain QA gates, not reasons to rebuild the slice.

Latest recorded automated evidence is 227 backend/PostgreSQL (prior run) and 142 mobile tests passing, with mobile TypeScript/lint. These are previous-session results, not fresh runs for this documentation task. Resource controls and exposure tests are still uncommitted; main/last confirmed push is 3b5955c. Commit approval requested earlier was not granted by this strategy request.

Sprint 2 basic Analytics is now implemented in the working tree; its device acceptance is pending. A reproducible hosted/demo/CI lane is the next verified delivery blocker. Close residual Sprint 1/two-device acceptance in parallel; do not introduce goals/practice/AI to avoid finishing V1. See [Analytics implementation](mobile-analytics.md).

## Version 1 — Functional MVP

Objective: a trustworthy account-owned mobile round tracking and descriptive analytics pilot with a reproducible hosted demonstration.

| Capability | Current status | Completion dependency / acceptance |
| --- | --- | --- |
| Registration and secure login | Implemented locally | Confirm hosted registration/login with synthetic accounts; preserve Argon2id and opaque sessions |
| Persistent authentication | Implemented; principal device restoration reported | Native restart, expiry/rotation/logout acceptance on release build; known offline restore behavior explained |
| Dashboard | Implemented from acknowledged account-scoped history | Shares Analytics selection; native sample/count reconciliation still needs device acceptance |
| Round Tracker | Full 9/18 and early finish implemented | Confirm numeric validation, cancel/finish, durable pending status and ordinary native navigation |
| PostgreSQL persistence | Sprint 1 implemented and isolated-DB verified | Keep atomic save/idempotency/ownership regressions passing; no new migration needed for basic analytics |
| Account-owned history | Backend/mobile implemented | Demonstrate clean second-device retrieval and account isolation; keep legacy preview separate |
| Basic performance analytics | Read-only Analytics implemented; 142 mobile tests/typecheck/lint/exports passed | Native filter/sample/empty/error acceptance pending; acknowledged complete 9/18 records only |
| Profile | Read-only identity/logout implemented | Display only current account fields; no V1 profile-edit feature required |
| Secure backend integration | Implemented locally; resource controls uncommitted | Verify hosted TLS/proxy/least-privilege policy, error redaction, quota/idempotency behavior and advisory dispositions |
| Automated testing | Local suites and guarded PostgreSQL tests implemented | Reproducible checks in an isolated CI lane; essential native acceptance evidence |
| Demonstrable deployment | Not verified; no tracked deploy/CI/EAS configuration found | Approved host/distribution target, reproducible build, HTTPS API, controlled migration/rollback and backup/restore runbook |
| Web | Separate landing/demo | Label illustrative/unavailable features; no second authenticated web client required |

V1 does not require AI, goal storage, practice scheduling, penalties/FIR/GIR fields, GPS, paid subscriptions, official handicap, shot capture or tournaments. Existing AI placeholder remains honest; this task makes no UI change. V1 is an invited pilot, not an unrestricted public account service. Email ownership/recovery and a complete account lifecycle become a separate prerequisite before open self-service release, not something to silently omit from that later scope.

### Sprint 2 — Basic Analytics from Owned Rounds

Implemented after strategy alignment; device acceptance is pending. The following contract is retained for verification:

- Reuse the existing scoped store/services and reusable components outside route files. Replace only the Analytics placeholder content; preserve navigation, palette, typography, motion/accessibility and existing tracker behavior.
- Calculate from server-acknowledged entries (`serverId`), excluding preview, drafts, pending submissions and partials from complete-round averages. List partial/pending counts separately. Home now applies the same acknowledged-only account policy; compare its Last 5 selection with Analytics. Preview Home remains local.
- Offer separate 9/18 views, complete sample count, mean strokes/putts per complete round and a last-five complete score sequence. Retain per-record played-par/relative-to-par detail. Show sample size and the bounded cache/window. Avoid adding a chart dependency or analytics API when existing bounded data and pure helpers suffice.
- With zero eligible rounds show absence, not zero scores; one round supports a descriptive value, not a trend. With two or more, show the sequence/date range without significance or causality claims. Free-text course names lack tees/ratings and do not establish comparable difficulty.
- Add focused fixture tests for length separation, pending/partial exclusion, zero putts, deterministic ordering, sample counts, cache bounds and account switches; verify Home/Analytics reconciliation and native loading/error/retry behavior.

Acceptance: [MVP_SUCCESS_CRITERIA.md](MVP_SUCCESS_CRITERIA.md), especially V1-07. Follow with the hosted-demo/CI lane and two-device evidence, rather than starting a new product phase.

## Version 1.1 — Personal Improvement

Objective: explicit personal goals and understandable descriptive progress, not an official performance rating.

Scope: Break 100, Break 90 and later Break 80; personal score/putt targets; recent-round comparisons; progress indicators; simple evidence-backed insights. Goal thresholds mean gross score strictly below the number on an eligible complete 18-hole round (e.g. 99 or fewer for Break 100). Do not double nine-hole rounds or count partial rounds as achieving these goals. Nine-hole targets need their own explicit definition.

Dependencies: accepted V1, user validation of goal language, approved goal storage/retention design and sufficient comparable records. No schema change is authorized now.

Acceptance: goal/length/owner is explicit; achievement is reproducible from actual acknowledged records; zero/missing samples are honest; displayed comparisons carry sample/window/course caveats; goal edits and account isolation are tested. At least two records are required for a numerical comparison; that is not statistical evidence of improvement.

## Version 1.2 — Practice Planner

Objective: connect a defensible observation or chosen focus to a short practice activity and follow-through.

Scope: identify only measurable patterns; suggest one priority/short reviewed session; let users choose/override a focus; record completion; review later round observations. Separate generic guidance from data-personalized advice. Current putt totals can support descriptive counts, not a comprehensive weakness diagnosis. Penalties, shot distances and lie data are not collected; propose added fields only after validation/approval.

Dependencies: V1.1 baselines, discovery evidence, a qualified review of drill content and an explicitly approved practice-data model. Avoid building a general scheduling platform.

Acceptance: every recommendation names its observed evidence or admits it is generic/user-selected; unsupported dimensions are not ranked; users can log/skip a session; data remains owner-scoped; future comparisons use declared windows and do not attribute change solely to the app. Pilot follow-through is measured with missing reports retained.

## Version 1.3 — AI Golf Coach

Objective: explain actual records and reviewed practice choices in plain language.

Scope: natural-language summaries, grounded coaching explanations/practice recommendations, progress reviews and explicit AI reliability controls. No autonomous account actions, invented statistics or model-generated handicap claims.

Dependencies: reliable deterministic metrics, V1.2 reviewed content, authorized model/provider/cost and privacy decisions, restricted account-context retrieval, evaluation fixtures and failure fallbacks. Keep opaque sessions; JWT is not a prerequisite.

Acceptance: numerical statements are traceable to selected round IDs/aggregates; insufficient data causes a bounded explanation; unrecorded penalties/FIR/GIR/distances are never invented; user/course text is treated as untrusted data; prompts contain no credentials; refusal/fallback and account-isolation tests pass. Evaluate representative zero/partial/mixed-length/adversarial cases before enabling a pilot. No clinical diagnosis or guaranteed score reduction.

## Version 2 — Advanced Golf Technology

Potential scope: GPS shot tracking, course explorer, dispersion, strokes gained, predictive analytics and advanced ML. These are options, not a committed bundle.

Dependencies: validated need beyond manual capture, approved location/data permissions, suitable licensed course/baseline data, reliable shot-level records, device/battery QA and technical/cost feasibility. Strokes gained requires position/lie/baseline evidence not present today.

Acceptance per separately selected feature: verified accuracy against defined fixtures/reference data, permission/denial and battery behavior, missing-sensor handling, privacy/retention controls and no interference with core tracking. Predictive claims need held-out evaluation and uncertainty; availability of historical records alone does not establish model accuracy.

## Version 3 — Tournament Intelligence

Long-term options: live leaderboards, tournament ingestion pipelines, broadcast-style visualizations, AI tournament explanations and real-time event analytics. Retained explicitly as a sports-technology/broadcast-engineering direction; not a V1 dependency.

Dependencies: validated audience/use case, approved data-feed access/rights/cost, event identity and clock consistency, operational pipeline capacity and the stable core product. Do not build infrastructure before choosing a real data source.

Acceptance for a future approved pilot: replayable fixture/event pipeline, deduplication/order/corrections, visible latency/freshness, recovery from feed gaps, accessible visualizations and grounded AI commentary. Mark delayed/simulated demos explicitly; never present fabricated scores as live tournament facts.

## Release and scope discipline

V1 is accepted only against the [measurable checklist](MVP_SUCCESS_CRITERIA.md). Security risk treatment and demonstrable deployment are gates, not a release percentage. Do not reuse the historical 50%/160-hour audit as a current estimate; Sprint 1 delivery changed the underlying scope. No new timeline or readiness percentage is asserted without a separately estimated backlog.

The existing security checkpoint manifest predates these strategy files. Reconcile its documentation group before any future authorized commit; no old manifest automatically approves these new files. Product research can proceed alongside engineering as a plan, but no interviews/outreach, payment, deployment or further coding is authorized by this document.
