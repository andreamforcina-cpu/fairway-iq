# FAIRWAY IQ — MOBILE ACCOUNT ROUNDS INTEGRATION REPORT

2026-10-16. Authorized scope: connect the existing mobile tracker/Home to the verified account-owned backend. Implemented and automatically checked; iPhone end-to-end acceptance remains pending.

## Behavior implemented

- Full/early completions persist locally before authenticated POST, using one native-generated UUID per submission. Server acknowledgments survive reload; lost responses retry the same key and payload.
- Account/origin-specific history and drafts share a serialized store across Rounds and Home. Server history is retrieved with bounded cursor pagination; responses and totals are runtime-validated. Scorecards use the full hole data in the history response.
- Pending/Synced history labels, safe failure messages, explicit save retry and history refresh. Failed uploads are not retried for every keystroke.
- Session-owned authenticated operations check the expected user and serialize with refresh/logout/login. Near-expiry/401 handling rotates once; cross-account queued work cannot borrow the replacement account token. Existing SecureStore policy is unchanged.
- Account/preview changes remount tracker and dashboard state. Legacy shared local data is preserved in preview, never silently imported.
- Stale UI snapshots cannot erase server acknowledgments/history. Refresh preserves edits entered in flight and unsaved input after local write failure. Saving retry writes the current snapshot without first loading an older one.
- Cache limit preserves pending rounds and permits eviction of acknowledged copies when adding another account round. Server copies remain intact. Drafts stay device-local; existing designs/routes/metric rules remain.

## Files

Created: `mobile/services/roundApi.ts`, `mobile/services/accountRoundStore.ts`, `mobile/tests/accountRounds.test.mjs`, `mobile/tests/roundLibraryHook.test.mjs`, `docs/mobile-account-rounds.md`, and this report.

Modified: `mobile/services/sessionManager.ts`, `mobile/services/roundStore.ts`, `mobile/hooks/useSession.tsx`, `mobile/hooks/useRoundLibrary.ts`, `mobile/hooks/useSavedRounds.ts`, `mobile/components/RoundTracker.tsx`, `mobile/components/RoundDashboard.tsx`, `mobile/utils/round.ts`, `mobile/tests/sessions.test.mjs`, `mobile/package.json`, `mobile/package-lock.json`, four canonical memory documents, `docs/backend-rounds.md`, and `docs/mobile-round-tracker.md`.

Pre-existing backend implementation/migration, SDK patches, audit/security reports and prior memory entries were preserved. No route files, web application or backend source were changed in this mobile stage. The original MVP assessment remains historical.

Added `expo-crypto ~57.0.4` through Expo's installer for SDK-compatible UUID generation. No major upgrade. Existing custom development builds may need a native rebuild; no EAS build/deployment was performed. The installation's audit still reported 28 findings (18 high, 10 moderate); these are not claimed resolved.

## Verification

Fresh final mobile checks:

- `npm test`: **124 passed, zero failed/skipped**, including 31 new account/transport/session/hook tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npx expo install --check`: dependencies up to date.
- `npx expo export --platform all --output-dir /private/tmp/fairway-iq-account-rounds-final-20261016`: iOS, Android and web bundles passed. Output is outside the repository.
- `git diff --check`, credential-pattern review and environment/dependency/build ignore checks: passed.

Tests use fake storage/network and a lightweight hook harness; they are not native interaction tests. No automated live handset-to-server test, visual device review, or manual iPhone verification was performed. Existing backend/PostgreSQL acceptance is **197 passed, zero skipped**, from the preceding step and not rerun for this mobile-only change. No development/production DB operation occurred during this stage. Initial npm checks attempted from repository root correctly failed because package.json lives in mobile; all actual verification commands above were then executed successfully from mobile. No failing test was bypassed.

## Remaining limits and next action

Restart backend/Expo and execute the [iPhone acceptance checklist](../mobile-account-rounds.md). Verify full/partial save, refresh/relaunch, Home totals, account A/B isolation, preview preservation, offline pending/retry without duplicates, unsaved draft refresh and accessibility. Do not claim end-to-end release readiness before this evidence.

The cache is unencrypted and retained after logout; UI namespace isolation is not device encryption. Existing session restore needs connectivity. There is no background sync, edit/delete, automatic legacy import, or browsing beyond the bounded 1,000-record cache. Conflicts retain the local copy for investigation. Existing mobile dependency findings and public-deployment protections remain open.

Branch main, HEAD b21af72, nothing staged. All changes remain uncommitted, including prior backend and dependency work. No commit, push, fetch, migration, deployment or database reset occurred in this mobile stage. The already-approved development migration remains applied from the previous step.
