> Handoff storico: per la ripresa usare [NEXT_SESSION.md](NEXT_SESSION.md), [CURRENT_STATE.md](CURRENT_STATE.md) e [project-status.md](project-status.md). Le priorità e i conteggi seguenti appartengono ai checkpoint precedenti; non costituiscono istruzioni di ripresa correnti.

# Next session — 14 October 2026

Home Wi-Fi connectivity is resolved. The user confirmed `/health`, registration, login, Profile, closing/reopening the app with session restoration, and logout on a physical iPhone. See [mobile authentication](mobile-authentication.md) for dated evidence and limitations.

Current checks: mobile typecheck, lint and all 57 tests passed; backend pytest 70 passed and 15 skipped because no isolated `TEST_DATABASE_URL` is configured in this shell. One existing Starlette/httpx deprecation warning remains. Earlier full database and iOS export checks are historical evidence.

Next: verify automatic refresh on iPhone by staying signed in with the app active for at least 16 minutes and confirming Profile remains available, then log out and check Back cannot reopen the personal profile. Offline, deep-link, accessibility and Android checks remain pending.

Keep the backend running and restart Expo after public API configuration changes. If the network changes, recheck the Mac LAN address. Preserve private environment files; never print credentials or tokens. No migration or development database changes are needed for these checks.

The user authorized a local authentication commit. Push is not authorized. Automatic refresh is assumed working for now, explicitly not device-verified.


## Local round saving increment

Implemented automatic draft/active-hole restoration and dated completed scorecards with history browsing. Storage is device-local and shared across accounts/preview, without backend sync. Typecheck, lint, all 64 mobile tests and iOS bundle export pass. See `mobile-round-tracker.md` for persistence validation, dependency audit and iPhone checks. These new changes are uncommitted; the prior authentication commit does not authorize another commit or push.

Next: restart Expo, enter scores, wait for “Saved on this device”, reload and confirm restoration; finish and reopen the completed scorecard from history after another reload. Verify opening history during a new draft preserves the new draft. Automatic authentication refresh remains assumed, not device-verified.


## Early finish follow-up

The user confirmed iPhone draft saving and completed history. They then reported inability to end at hole 3. Added explicit early-finish confirmation, played-prefix scoring and partial scorecard persistence. Typecheck/lint and all 69 tests pass; early-finish iPhone verification is pending. In the reported screenshot hole 3 is blank, so two completed holes should produce a 2/9 confirmation. See `mobile-round-tracker.md`. No new commit or push authorization.
