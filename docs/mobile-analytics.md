# Mobile basic Analytics — Sprint 2

> Device follow-up, 2026-10-16: the user reported the requested principal Analytics/Home comparison working on iPhone. This is user-reported evidence; the broader filter/fixture/offline/account/accessibility checklist is not individually confirmed. Earlier general pending-acceptance wording below is superseded only for that principal smoke flow.

Implemented 2026-10-16. Device acceptance is pending. This is a descriptive V1 slice, not coaching, causal analysis or a hosted-release acceptance claim.

## Data rules

Authenticated Home and Analytics use only entries acknowledged by the server (`serverId`) from the existing account/API-origin-scoped library. The library validates decoded data; the helper does not establish authorization itself. Backend ownership checks and the scoped store remain the security boundary. Preview Home keeps its existing local behavior; Analytics in preview offers login and does not read that shared library.

Complete means played holes equal planned 9 or 18. These lengths are never combined. Analytics uses at most the five most recently completed eligible records of the selected length; mean strokes and putts use exactly that sample. Zero eligible entries show absent values, a single record is labeled n=1 without a trend claim, and genuine zero putts stays zero. Completion timestamp descending and then ID descending determines deterministic ties, without mutating storage inputs.

Synced partials remain available in round history but are excluded from complete-round averages. Pending entries enter metrics only after acknowledgment, with a separate pending count. Partial/pending counts are for the selected planned length; synced partials and pending copies do not get counted twice as the same exclusion category. Drafts/preview records are never part of account metrics.

Analytics shows eligible cache count, selected n, averages, excluded counts and a newest-first list of the selected scores, dates, played par, relative score and putts. At most 1,000 cached records are available; these are not lifetime statistics or a complete historical trend model. Different courses/tees are not normalized. No penalties, fairways, greens, handicap, strokes gained, weakness ranking or guaranteed improvement is inferred.

## Home reconciliation and interaction

Home uses the same account selection/math. Choose the same length and **Last 5 complete rounds** to compare with Analytics; Home's default **Last complete round** intentionally uses n=1. Home's recent list includes synced partials of all lengths and excludes pending copies; the Rounds screen retains all pending/history views. Preview Home remains device-local and is explicitly labeled.

Existing route structure, palette, typography and components are preserved. `app/(tabs)/analytics.tsx` re-exports the reusable component; calculations stay in `utils/dashboard.ts`. No API, migration, tracking field, dependency or chart library was added. Filters are accessible buttons with selected state and at least 44-point targets. Text wraps, metrics use flex-wrap and the existing scroll/safe-area layout is retained. No new animation was added.

Account Analytics reuses `useSavedRounds` for focus refresh, storage error/retry and cache warnings. Loading/error states hide stale numerical results. Failed network sync may still show acknowledged cache values with a visible warning and cache scope. Account changes remount both Analytics and Home, resetting local selections; backend/scoped service tests remain essential to isolation. There is no new background polling or token persistence.

## Verification and limits

Fresh final mobile suite: **142 passed, zero failed/skipped**. Thirteen new tests cover source/window/exclusion math, pending-to-acknowledged transition, zero/fractional values, deterministic ties, 1,000-entry bounds and Home reconciliation; five of those render component states for preview/loading/error/empty/acknowledged/offline cases with React DOM and lightweight native stubs. Those are not native layout, gesture or VoiceOver tests.

TypeScript/lint and final iOS/Android/web exports passed; exports are not signed builds or manual device testing. Backend/frontend checks were not rerun: the Analytics stage changed only mobile source/tests/docs, while pre-existing backend security edits were preserved. Latest backend result remains the earlier 227 PostgreSQL-backed passes. No new dependency audit was run; previous 28 findings remain unresolved.

## Pending iPhone checklist

1. Restart Expo with the current backend reachable. In preview, Analytics must offer login, without shared preview numbers appearing.
2. Log in and open Analytics. With no eligible complete synced round for the selected length, expect absent averages and explicit counts, even if partial/pending history exists.
3. Compare the selected Analytics averages/sample with Home set to the same 9/18 length and Last 5 complete rounds. The default Last complete round can differ when more than one exists.
4. For a disposable account containing only two complete synced 9-hole fixtures: nine holes at 5 strokes/2 putts give 45/18; nine at 4/1 give 36/9. Expected mean is **40.5 strokes and 13.5 putts**, n=2. Do not expect these means on an account with additional eligible recent rounds.
5. A synced 3/9 round at 5/2 gives 15 strokes/six putts/+3 over played par, but must only increase the partial count. A pending round must not change averages until synced. Keep 18-hole records separate.
6. Refresh after a new acknowledgment. Switch accounts and confirm no prior metrics/filters remain; return to preview and confirm login guidance. Check large text, VoiceOver, scrolling, selected filters and error/retry states.

These are unperformed checks, not instructions to generate extra real-user scores for testing. Prefer disposable synthetic data. No approval for commits, push, deployment or the next feature is implied.
