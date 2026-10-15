# Mobile authentication

The account forms call the existing backend: registration creates an account without signing in; login uses `/auth/token` and validates the returned access token with `/auth/me`. `/auth/login` remains the backend's credential-only endpoint and is not used by mobile. Profile displays only the current user's allowlisted name and email. Sample performance data and the local round tracker remain independent of account data.

## Session lifecycle

- Native devices persist only the refresh token, together with the configured API address, in Expo SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Access tokens and profile data stay in memory. Invalid stored data or data belonging to another API is removed.
- Web sessions use memory only. Reloading requires another login; there is no localStorage, AsyncStorage or cookie token fallback.
- Startup rotates the saved refresh and checks `/auth/me` before allowing authenticated navigation. Expo Router protected routes remove account forms when signed in and deny direct tab entry unless signed in or the user explicitly selected sample preview. Preview never provides a personal profile.
- The app rechecks the profile on foreground and every minute while active. It refreshes when access has less than 30 seconds remaining or after one 401, then retries the profile once. These checks detect remote revocation; the UI is not a substitute for backend authorization.
- All session operations share one queue. Refresh deletes the persisted credential before making the request, then saves the replacement. A crash or lost refresh response requires login again, avoiding automatic replay of a consumed token. Temporary connectivity errors during validation also sign out locally.
- Logout clears local credentials and calls `/auth/logout`. If the network fails it reports that server revocation was not confirmed. If storage deletion fails, the welcome screen provides a clear-saved-session retry; until deletion succeeds a saved credential may remain on the device. Server expiry/revocation still applies.
- Auth requests use a ten-second timeout, disable redirects and cookies, and never render backend error bodies or log credentials. Production requires HTTPS; local development permits HTTP. Passwords are cleared on submission completion and when leaving the form.

SecureStore was already installed/configured; no dependencies or native configuration were changed. The SDK 57 SecureStore documentation URL was unavailable during implementation; the [current Expo documentation](https://docs.expo.dev/versions/latest/sdk/securestore/) reports the installed `~57.0.4` version and was checked alongside the installed TypeScript source. Navigation follows [SDK 57 Router](https://docs.expo.dev/versions/v57.0.0/sdk/router/).

## Local preview

1. Set the public `EXPO_PUBLIC_API_URL` configuration for mobile, using the Mac's LAN address for a physical iPhone. Follow `mobile/.env.example`; preserve existing private environment files. Never put credentials in public Expo variables.
2. Start the backend from the repository root: `backend/.venv/bin/python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --no-proxy-headers`. The documented local database migration must already be applied; this increment does not run migrations.
3. From `mobile/`, run `npm start`, then open on a compatible Expo Go or development build.
4. With a disposable test account, verify registration, incorrect login, successful login and Profile. Close/reopen the app and verify restored session. Wait through access expiry and verify refresh. Log out and verify Back/deep links cannot reveal the profile.
5. Verify sample preview without an API; separately test offline restore/logout, foreground revalidation, large text, keyboard, VoiceOver and reduced motion. Do not share token responses or real credentials.

Web requests also need an explicitly allowed backend CORS origin. This work does not expand CORS or expose the service publicly. Initial iPhone verification is recorded below; remaining device scenarios still need manual verification. Existing backend production gaps (distributed limits, ownership verification, recovery, telemetry and deployment hardening) remain in `backend-sessions.md`.


## Verification — 14 October 2026

The user confirmed on a physical iPhone over home Wi-Fi that `/health`, registration, login, Profile, session restoration after closing/reopening the app, and logout work. This is user-reported manual evidence, not an automated device test. Automatic refresh after access expiry, logout Back/deep-link protection, offline behavior, accessibility and Android remain unverified on a device.

Current automated checks: mobile typecheck and lint passed; all 57 mobile tests passed. Backend pytest: 70 passed, 15 skipped because this shell has no isolated `TEST_DATABASE_URL`; one existing Starlette/httpx deprecation warning. The earlier 85-pass isolated-database result in `backend-sessions.md` was not reproduced in this run. `git diff --check` passed. iOS export was not rerun; its preceding successful result remains historical evidence.

Next device check: log in, keep the app active for at least 16 minutes with the backend running, and confirm Profile remains available through automatic refresh. Then log out and verify Back cannot reopen the personal profile. Do not share credentials or token responses.
