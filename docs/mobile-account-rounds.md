# Mobile account-owned round integration

> Analytics follow-up, 2026-10-16: authenticated Home and the new Analytics screen now exclude pending copies from performance metrics; pending records remain visible in Rounds with separate counts. See [current Analytics contract](mobile-analytics.md). Earlier pending-inclusive Home descriptions below are historical.

> User-reported verification, 2026-10-16: the principal guided iPhone save/totals/Synced/refresh/relaunch flow was reported working. The conditional second-account step and broader edge-case checklist are not individually confirmed. Historical statements below saying all device acceptance is pending are superseded only for that principal flow.

Implemented on 2026-10-16 after backend PostgreSQL acceptance and the approved development migration. Manual iPhone end-to-end acceptance is still pending.

## Behavior

Signed-in Rounds and Home share a store bound to the authenticated UUID and normalized API origin. Completed full or early-finished rounds receive a UUID using `expo-crypto` before the React state update. The completed scorecard and its UUID are written locally before POST. Identical retries reuse the same payload/key; acknowledgments record the server UUID. History rows show Synced or Pending sync.

The existing session manager serializes account requests with refresh/login/logout. It checks the expected account before giving the transport an access token, rotates near-expiry tokens, and retries one 401 once. Stale account work cannot borrow another account's token. Tokens remain out of React state and AsyncStorage; the existing SecureStore refresh-token policy is unchanged.

`POST /rounds` uploads completions. `GET /rounds?limit=100&cursor=...` retrieves full scorecards across bounded pages, up to 1,000 records. Server totals/status, identifiers, timestamps and score shapes are validated before acceptance. The history response already includes hole scores, so opening a cached scorecard does not require a separate detail request. Home continues to compute its existing metrics from the selected account's history, including locally pending completions; the 9/18 and complete/partial rules remain intact.

Drafts stay local. Retry saving retries the current snapshot before uploading; it does not reload an older draft over unsaved scores. Focus/explicit refresh retry pending submissions and retrieve server history. Failed uploads retain durable local copies and display a warning; they are not retried on every score keystroke. There is no network-monitor listener or background synchronization service. Existing session restoration requires connectivity, so this is not a fully offline application.

## Legacy policy and isolation

The old `fairway-iq.rounds.v1` key remains available only in sample preview. No legacy round or draft is automatically assigned or uploaded to an account. Account cache keys include API origin and owner UUID and are never read by preview. Signing out/account switching remounts tracker and dashboard state, clearing the displayed summary, draft, errors and filters from the prior scope. Re-login to the same account can restore its local draft and pending submissions.

Cache data is not encrypted, is retained after logout, and is accessible to someone with device/storage-level access. Namespace isolation and server authorization protect application account separation; they are not device encryption. Tokens are never stored with scores.

History is a bounded cache: pending entries are never evicted; older acknowledged copies can be removed locally, remaining on the server. Backend pages use receipt time/UUID; the mobile library/dashboard sorts cached records by completion time. A fresh fetch obtains at most the latest 1,000 records by server receipt, not the complete lifetime history. If more exist, a visible notice explains the bound. Future large-history browsing, editing/deletion and legacy import require separate work. A conflicting submission is retained without overwriting the server and requires investigation; the UI does not silently mint a replacement key.

## Dependency and verification

Added SDK-compatible `expo-crypto ~57.0.4` with `npx expo install expo-crypto` for native/web UUID generation, avoiding ad-hoc random identifiers. Existing SDK 57 patches were preserved. See [Expo SDK 57 Crypto](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/). Expo Go includes Crypto; an existing custom development client may need rebuilding when adding native modules. Web UUID generation requires a secure context. No major upgrade or token-storage dependency change occurred.

Fresh checks: mobile TypeScript/lint passed, 124 tests passed with no skips/failures, Expo install compatibility passed, and final Metro export for iOS/Android/web passed. Unit tests cover storage and transport with fakes; hook tests use a lightweight hook harness, not a native React renderer. They verify retry durability, stale snapshot merges, account/origin separation, corruption handling, bounded pagination, strict responses, token refresh and logout ordering, and unsaved-state protection. Prior backend PostgreSQL evidence is 197 passed/zero skipped; backend was not rerun for this mobile-only change. No new manual device test or visual layout acceptance is claimed.

## iPhone acceptance checklist

Start/restart the backend with the existing private development configuration. Restart Expo to load the new module and bundle; use the existing `mobile/.env` public API URL, with phone and Mac on reachable Wi-Fi. For a custom native development client, rebuild if Crypto is absent.

1. Log in as account A. Shared old rounds must not appear in the account history. Preview should still show its original local library after logout.
2. Save an early-finished 3/9 round, then complete 9- and 18-hole rounds as practical. Wait for Synced, refresh, open scorecards and compare totals with Home. Relaunch online and confirm they return.
3. Switch to account B: A's history, summary and draft must disappear. Return to A and confirm its own history/draft returns.
4. While already authenticated, interrupt connectivity and finish a round. Wait for Pending sync. Restore connectivity and use Retry saving and sync or Refresh account rounds. Expect one Synced record with unchanged scores, including after a relaunch once the session can restore online.
5. Edit a draft while refreshing history; input must survive. Check early-finish cancellation, normal navigation, VoiceOver labels/status and touch layout.

Do not use real credentials in screenshots/logs. These checks are pending user/device participation; successful exports do not replace them.
