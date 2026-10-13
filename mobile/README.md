# FAIRWAY IQ for iPhone

First iteration: welcome, five-tab navigation, and a sample dashboard. No authentication, AI chat, round tracking, or persistence yet. Web and backend projects are independent.

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
