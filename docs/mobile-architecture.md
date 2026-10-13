# FAIRWAY IQ mobile — Sprint 2 stabilization

## Scope and architecture

An independent Expo SDK 57 / React Native / TypeScript app lives in `mobile/`. It does not import React DOM components or change the website or FastAPI backend. File-based Expo Router navigation starts at the welcome screen; Get Started replaces it with a five-tab navigator. The Home tab contains an interactive, clearly labeled sample dashboard. Other tabs show future-sprint placeholders only.

The user-requested `mobile/app/` route structure is retained instead of the generated AGENTS.md preference for `src/app/`.

- `app/_layout.tsx`: font loading, safe area provider, native stack, status bar.
- `app/index.tsx`: welcome screen.
- `app/(tabs)/`: Home, Rounds, Analytics, AI Coach, Profile.
- `components/`: accessible text, cards, buttons, screen container, placeholder screens.
- `constants/theme.ts`: requested black, charcoal, lime palette and typography.
- `constants/sampleData.ts`: isolated illustrative player and golf fixtures.
- `hooks/useEntrance.ts`: native-driver opacity entrance; respects reduced motion.
- `services/api.ts`: environment-configured, timeout-protected, validated requests for existing backend contracts.
- `assets/`: Expo starter app icons; replace with final brand artwork before distribution.

Inter and Instrument Serif Italic are packaged through Expo Google Fonts; runtime font loading does not require a Google Fonts network request. React Native Animated handles the small opacity entrance. Expo Router also brings animation-related peers; Reanimated and Worklets are explicitly pinned to SDK-compatible versions to prevent incompatible automatic peer resolution. React DOM/Web peers support the optional Expo preview independently of the existing website.

## API and security

The preview does not call the API or require credentials. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` when testing the service layer. On a physical iPhone, use the Mac's LAN IP or a reachable HTTPS endpoint; iPhone localhost is the phone itself. Development HTTP is permitted only in development builds. Production requests require HTTPS. Responses are checked against the existing `/` and `/health` contracts; requests time out after ten seconds and do not log private response data.

There is no authentication or token storage in this iteration. Expo SecureStore is installed and configured for a later authenticated integration; no passwords, tokens, or fake accounts are created. All `EXPO_PUBLIC_*` values are public bundled configuration and must never contain secrets.

## Development

Use Node 22.13 or newer (Node 24 is used for this checkout).

```sh
cd mobile
npm ci
npm run start
```

Scan the Expo QR code with a compatible Expo Go version on an iPhone on the same network. SDK 57 requires an SDK-compatible Expo Go app; if unavailable, create a development build. `npm run ios` launches a simulator when Xcode and a compatible simulator are installed. This requires the SDK-supported Xcode toolchain. Do not generate/edit native projects merely to change UI.

```sh
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo export --platform ios
```

No EAS build, signing, publishing, commit, or push was performed in Sprint 2. Dependency manifests and lockfile were not changed.

## Accessibility and responsiveness

Safe areas protect screen content. Screens scroll and use a centered maximum width on tablets. Text scales with system settings; metric rows wrap; touch targets are at least 44 points. Sample labels accompany the data. Tabs have text labels and icons; selected preview filters expose their accessibility state. Reduced motion disables the welcome/dashboard opacity entrance.

## Next sprints (require approval)

Round entry and local persistence; real analytics; AI service integration; player profile/settings; authentication backed by SecureStore; production API contracts; final branded icons; real-device and VoiceOver QA; signed development and distribution builds.

## Verification results — October 13, 2026

| Check | Evidence / result |
| --- | --- |
| Physical iPhone launch | User-reported successful launch before Sprint 2. This is device evidence, not an automated test. |
| TypeScript | `npm run typecheck` passes. |
| ESLint | `npm run lint` passes with zero errors; no rules were disabled. |
| API tests | `npm test` passes 20 independent tests. All network calls are mocked. |
| iOS export / Expo startup | Previously successful in iteration 1; not repeated in this stabilization sprint. An export is not a signed native build. |
| Native regression checks after Sprint 2 | Not repeated on an iPhone or simulator. |

The user confirmed that the app worked on a physical iPhone. Tab-by-tab navigation, dashboard filter values, layout across iPhone sizes, large accessibility text, VoiceOver, and runtime reduced-motion toggling still need individually recorded checks. Live device-to-FastAPI requests, signing, and production distribution remain unverified. Full Xcode is not selected on this Mac (Command Line Tools only).

### Stabilization changes

The entrance hook now lazily initializes its stable `Animated.Value` with `useState`, avoiding render-time ref access. The same initial opacity, timing, easing, native driver, preference listener, and cleanup remain. No screen layouts or interaction handlers were changed. The tests explicitly import Node's `Buffer`, resolving the other lint error without changing lint configuration.

The API service itself was unchanged. Tests assert request counts after calls return, so the service's catch block cannot swallow test assertions. Missing, empty, malformed, relative, credential-bearing, query-bearing, fragment-bearing, unsupported-protocol, and production-HTTP configuration all assert zero requests for both endpoints. Development HTTP and HTTPS contracts remain supported. Fake timers verify that pending fetches and response bodies are aborted at ten seconds, that completion clears the timer, and that failures do not retry. Invalid JSON, response shapes, HTTP failures, and network failures are covered. Test mocks and configuration are restored between tests. These tests validate JavaScript service behavior, not the native networking stack.

## Dependency security assessment — October 13, 2026

A fresh online `npm audit --json` reports **28 package findings: 18 high, 10 moderate, zero critical**. Its exit code is 1 because advisories remain; this is distinct from the passing lint/typecheck/test commands. These findings include propagation through parent packages and are not 28 distinct application exploits. No upgrades, overrides, `audit fix`, or lockfile changes were performed in Sprint 2.

The four root advisory packages below are **transitive**, not entries in the mobile dependency manifest. Direct dependencies `expo`, `expo-router`, `react-native`, `react-native-reanimated`, and `react-native-worklets` also appear in the audit because affected dependencies propagate through their trees.

| Package / installed version | Affected range / upstream patch | Dependency path and application exposure | Compatible remediation assessment |
| --- | --- | --- | --- |
| `braces` 3.0.3 | <=3.0.3; advisory lists no patched version | Expo → Metro → metro-file-map → micromatch → braces. Build/development pattern processing; no direct app import or user-controlled glob feature. Malicious patterns may exhaust the tooling stack. Runtime exploitability was not demonstrated. | No verified patched drop-in release. Keep development servers restricted to trusted networks and use trusted build inputs; monitor a compatible upstream fix. |
| `node-forge` 1.4.0 | <=1.4.0; advisory lists no patched version | Expo → CLI / code-signing-certificates → node-forge. Certificate/signature tooling actually calls verification functions. No direct UI/service import; no app signing or update-certificate workflow implemented. Exploitation prerequisites were not tested. | No verified patched drop-in release. Avoid accepting untrusted signing material; assess a compatible Expo tooling fix before production signing. |
| `uuid` 7.0.3 | <11.1.1 (also affected ranges in 12/13); patched 11.1.1, 12.0.1, 13.0.1 | Expo → config-plugins → xcode → uuid. The inspected xcode UUID-generation function uses `v4()`; this advisory concerns `v3/v5/v6` with caller-provided buffers. That inspected call is outside the described vulnerable operation, though the package remains flagged. | Wait for a compatible parent update. Forcing uuid 11+ would cross its declared major version and needs compatibility assessment/approval. |
| `decode-uri-component` 0.2.2 | <=0.4.2; patched 0.5.0 | Expo Router → query-string 7.1.3 → decoder. Router imports query-string in navigation helpers; crafted URI data is a potential runtime exposure. Exploit reachability through this app's linking configuration was not demonstrated. | query-string declares ^0.2.2, so 0.5.0 is outside its allowed range. Prefer an SDK-compatible Router/query-string update; an override needs dedicated navigation testing and approval. |

Sources: [braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq), [URI decoder advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). Exposure conclusions combine installed dependency paths, inspected call sites, and app source; they are not penetration-test findings.

The registry proposes Expo 44 / React Native 0.72 downgrades and Router 58 for parts of the tree, which do not preserve the chosen SDK 57 baseline. Some proposed animation-package downgrades also fall outside Expo's supported version map. They were not applied. No fully verified compatible remediation for the root findings was established in this sprint. Do not use a forced audit fix without evaluating SDK and native runtime compatibility.

SecureStore remains installed but unused because authentication is not implemented. API requests use HTTPS in production, validate response contracts, time out, and do not log private response bodies. The API service is not connected to a screen yet. Public Expo environment values must not contain secrets.

## Git and next verification step

The mobile directory and this architecture document remain untracked in Git; no staging, commits, or pushes were performed. Current source changes are limited to the entrance hook, API tests, and mobile documentation. Dependency files, web frontend, and backend were not modified.

Next: review Sprint 2, then rerun the existing app on the iPhone and record welcome entrance, all tabs, dashboard filters, and reduced-motion behavior. Address upstream dependency risks through an approved compatibility review before production distribution. CI and version-control submission remain separate follow-up work requiring authorization.
