# Next session — 14 October 2026

Home Wi-Fi connectivity is resolved. The user confirmed `/health`, registration, login, Profile, closing/reopening the app with session restoration, and logout on a physical iPhone. See [mobile authentication](mobile-authentication.md) for dated evidence and limitations.

Current checks: mobile typecheck, lint and all 57 tests passed; backend pytest 70 passed and 15 skipped because no isolated `TEST_DATABASE_URL` is configured in this shell. One existing Starlette/httpx deprecation warning remains. Earlier full database and iOS export checks are historical evidence.

Next: verify automatic refresh on iPhone by staying signed in with the app active for at least 16 minutes and confirming Profile remains available, then log out and check Back cannot reopen the personal profile. Offline, deep-link, accessibility and Android checks remain pending.

Keep the backend running and restart Expo after public API configuration changes. If the network changes, recheck the Mac LAN address. Preserve private environment files; never print credentials or tokens. No migration or development database changes are needed for these checks.

The user authorized a local authentication commit. Push is not authorized. Automatic refresh is assumed working for now, explicitly not device-verified.
