# FAIRWAY IQ — PRODUCT STRATEGY ALIGNMENT REPORT

2026-10-16. Scope: strategic documentation, primary-source competitor research and backlog alignment only. No application rewrite, UI redesign, database change, dependency installation, outreach, commit, push or deployment.

## 1. Updated product positioning

**FAIRWAY IQ — Your Personal Golf Improvement System.**

Track your rounds. Understand your weaknesses. Practice smarter. Lower your scores.

Focus discovery on US amateur golfers typically reporting 90–110 gross 18-hole strokes. Intended value: connect reliable records to understandable observations, focused practice and subsequent measurable progress. The loop is **TRACK → ANALYZE → PRACTICE → IMPROVE**. Practice/AI and demonstrated improvement are future product objectives, not present capabilities or guaranteed outcomes. See [PRODUCT_VISION.md](PRODUCT_VISION.md).

## 2. Current verified development status

Inspected current source, Git and canonical memory. The historical [MVP assessment](MVP_READINESS_ASSESSMENT.md) predates delivery of rounds and remains unchanged as a baseline; its 75% UI/44% backend/approximately 50% MVP and effort figures are not a current readiness estimate.

| Area | Current source/evidence | Boundary |
| --- | --- | --- |
| Authentication | Registration, Argon2id, opaque access/refresh sessions, SecureStore native restore and profile/logout implemented | No JWT substitution; hosted/release lifecycle and public-account requirements remain |
| Tracker | Full 9/18 and early finish, score validation and device draft retention | Do not mix partials with full-round averages |
| PostgreSQL rounds | UUID owner/hole models, migration 0003, POST/list/detail, transactions/idempotency and isolation tests implemented | Development migration previously approved/applied; no database inspected/changed during this task |
| Mobile round integration | Owner/origin-specific cache, pending acknowledgments, server history and status-aware retry implemented | Legacy preview is separate; cache unencrypted/retained after logout; no complete offline restore/background sync |
| Home | Actual account-scoped cached round summaries and recent scorecards | Includes pending copies; proposed canonical Analytics policy needs future reconciliation |
| Analytics | Route still renders UpcomingScreen | Next concrete coding blocker |
| Goals/practice/AI | No goal model, practice planner or AI service; Coach is an honest placeholder | Versioned later; not V1 implementation |
| Operations | Local tests/config/migrations exist; new round admission controls in working tree | No tracked CI/deploy/EAS lane verified; no hosted demonstrator or clean second-device evidence |

Previously executed results: **227 backend tests including isolated PostgreSQL, zero skipped; 129 mobile tests, zero skipped; mobile TypeScript/lint passed**. Platform exports passed earlier. User reported principal save/Synced/refresh/relaunch flows and a later normal smoke after resource controls. Optional two-account/device, offline, full/partial and accessibility cases are not individually established by general confirmations. None of these suites/devices was rerun in this documentation task.

Current engineering work is the completed-but-uncommitted security follow-up: bounded round body/time/fragments/concurrency and peer/account quotas, plus dependency-exposure/retry tests and reports. Its checkpoint proposal awaits explicit commit authorization. Source/test work was preserved.

## 3. Revised MVP scope

V1 stays a controlled invited mobile pilot: registration, secure/persistent sessions, dashboard, tracker, PostgreSQL records, account-owned history, basic analytics, read-only profile, secure integration, automated tests and reproducible deployment. Web stays a clearly labeled landing/demo rather than a parallel authenticated client.

[MVP_SUCCESS_CRITERIA.md](MVP_SUCCESS_CRITERIA.md) defines twelve evidence gates, including exact fixture arithmetic, source/sample rules, second-device retrieval, other-account denial, pending/idempotent behavior and hosted build/operational evidence. V1 is not accepted merely because local saving works or screens exist. No new readiness percentage or completion date is asserted.

## 4. Product roadmap

| Version | Objective | Dependency/gate |
| --- | --- | --- |
| V1 | Reliable account round tracking and basic descriptive analytics demonstrator | Finish Analytics, close native/cross-device acceptance and establish reproducible hosting/CI/distribution |
| V1.1 | Personal goals: Break 100/90/80, targets and comparisons | Accepted V1, correct complete-18-hole thresholds and sufficient labeled samples |
| V1.2 | Reviewed short practice plans and completion tracking | Validated problem, defensible observations, approved additional data/content |
| V1.3 | AI explanations grounded in real account evidence | Deterministic metrics, reviewed content, provider/privacy/cost decisions and reliability evaluations |
| V2 | Optional GPS, explorer, dispersion, strokes gained, predictive/ML features | Specific validated need, adequate shot/location/baseline data and approved permissions/architecture |
| V3 | Tournament pipelines, leaderboards, broadcast visuals and real-time AI/event analysis | Approved feed rights/access, real use case, recoverable event pipelines and freshness evidence |

Detailed scope, dependencies and acceptance are in [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md). Advanced phases are options after their gates, not an excuse to expand current work.

## 5. Competitive differentiation hypotheses

The [competitive analysis](COMPETITIVE_ANALYSIS.md) links verified primary pages for 18Birdies, Golfshot, TheGrint, Arccos, SwingU and Shot Scope, with dates and plan/device/access limits. No market statistics, prices, customer interviews or competitor feature-absence claims were invented. Shot Scope storefront returned 403; official support pages provided only the narrower documented comparison.

Basic tracking and an AI label are not unique. SwingU already publishes improvement-priority/practice guidance ([primary page](https://swingu.com/pro)), so a records-to-practice loop is not itself a demonstrated competitive advantage. Simpler execution for a specific segment, trust through evidence and low-friction follow-through remain hypotheses. Do not claim superior usability or score reduction without research.

[MARKET_VALIDATION_PLAN.md](MARKET_VALIDATION_PLAN.md) proposes ten adult US golfer interviews, including incumbent-app users, a neutral concise guide, privacy-conscious notes, switching/payment questions and behavior-backed decision signals. Targets are proposed heuristics, not results or US market estimates. No participant was contacted and no payment/revenue evidence exists.

## 6. Data and analytics strategy

Use acknowledged owner records as canonical performance evidence; distinguish drafts, pending copies and legacy preview. Current fields are course text, planned/played holes, hole number/par/strokes/putts and timestamps. Preserve 9/18 separation and partial-round semantics. Basic arithmetic includes sample counts, selected window and cache limit; absent data is not a zero score. One observation is not a trend; several observations still do not establish causality or standardized course difficulty.

The next Analytics slice should reuse existing services/components and pure functions, with no new schema, dependency or analytics backend required for the bounded V1 scope. Home's current pending-inclusive summary must be reconciled explicitly. Do not derive penalties, official handicap, strokes gained, fairways/greens or a precise weakness ranking from missing inputs. New tracking fields need a separately approved product reason.

## 7. Security and engineering considerations

Keep the existing stack, opaque sessions, Argon2id, SecureStore, ownership, PostgreSQL constraints, error redaction, isolated integration guardrails and migration approvals. Current round quotas/resource caps are single-process, reset on restart and do not replace public gateway/shared controls. The known **28 mobile dependency findings remain unresolved**; the exposure correction/tests do not remove the vulnerable package or prove whole-app non-reachability.

Hosted TLS, trusted proxies, remote DB certificate verification, least-privilege roles, readiness, backup/restore, retention/privacy and public-account lifecycle still need explicit evidence. A local superuser test does not prove least-privilege deployment. Future AI must retrieve only authorized context, protect credentials, treat user text as untrusted and refuse unsupported statistics. No technology/provider replacement or schema/hosting action was made here.

## 8. Documentation delivered

Created:

- [PRODUCT_VISION.md](PRODUCT_VISION.md)
- [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md)
- [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md)
- [MVP_SUCCESS_CRITERIA.md](MVP_SUCCESS_CRITERIA.md)
- [MARKET_VALIDATION_PLAN.md](MARKET_VALIDATION_PLAN.md)
- This report.

Updated the four canonical memory files, [architecture.md](architecture.md) to correct obsolete local-only round boundaries, and [mobile-architecture.md](mobile-architecture.md) with a historical/current pointer. Earlier logs, security reports and original MVP assessment preserved. No permanent AGENTS.md instructions changed.

Fresh verification for this task: required-document/section review, local Markdown links, source/roadmap/status consistency, unchanged historical assessment, whitespace and credential/artifact checks. Application suites/builds/device tests were not run for documentation-only changes; the recorded counts above remain historical. No interviews or hosted test took place.

## 9. Development priorities

1. Preserve completed **Sprint 1 — Secure PostgreSQL Round Persistence**; close outstanding two-device/native ownership acceptance without rebuilding it.
2. Obtain authorization for **Sprint 2 — Basic Analytics from Owned Rounds**, the next verified missing V1 function.
3. Establish an approved reproducible CI/HTTPS/signed-demo lane and complete operational/native acceptance before calling V1 ready.
4. Run consented market discovery when outreach/data handling is explicitly approved; use it to test later goal/practice priorities.
5. Keep the uncommitted security checkpoint review separate: this strategy request is not commit authorization. Its old manifest must be refreshed to include/reconcile these documentation changes before any authorized checkpoint.

No Git commit/push occurred. Branch main, HEAD 3b5955c; index empty. Existing backend/mobile security changes remain uncommitted; all new strategy work is documentation-only. No remote state was fetched or deployed.

## 10. Recommended next coding task

After explicit implementation authorization, replace the Analytics placeholder with a small read-only account-owned summary using acknowledged complete 9/18 records, counts, mean strokes/putts and a bounded recent score sequence. Reuse layout/tokens/components, preserve existing functionality and show empty/loading/error/pending limitations honestly. Add focused calculation/account/source-selection tests and reconcile Home. No AI, new tracking fields, database migration or UI redesign is needed for that slice.

This report concludes the requested strategic update; it does not start that coding task or authorize the pending commits.
