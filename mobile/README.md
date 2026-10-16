# FAIRWAY IQ for iPhone

Welcome, five-tab navigation, dashboard from locally saved rounds and local round tracker. Registration and login connect to backend sessions; native refresh tokens use SecureStore and access tokens stay in memory. Browser sessions stay in memory and do not survive reload. Home separates complete 9/18-hole averages and lists partial rounds; fairways, greens and handicap are not recorded or calculated. See [mobile authentication](../docs/mobile-authentication.md) for setup, verification and limitations.

```sh
npm ci
npm start
```

Use an Expo Go version compatible with this app's SDK, or a development build. Scan the terminal QR code on an iPhone connected to the same network. Full Xcode is required to run an iOS simulator locally.

```sh
npm run typecheck
npm run lint
npm test
npx expo export --platform ios
```

See `../docs/mobile-architecture.md` for architecture, API setup, and verification limits. Environment variables are public configuration; never add secrets to `EXPO_PUBLIC_*` values.

Sprint 2 stabilization: TypeScript and lint pass, with 20 passing mocked API tests. The user confirmed a successful physical iPhone launch before this sprint; post-change native regression checks, VoiceOver, large-text layouts, and live API integration are not yet recorded.

The online dependency audit reports 28 findings (18 high, 10 moderate), rooted in four transitive packages. Versions were not upgraded. See the architecture document's security assessment for dependency paths, affected versions, exposure limitations, and remediation options.
