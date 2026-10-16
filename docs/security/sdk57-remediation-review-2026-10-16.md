# SDK 57 dependency remediation review — 16 October 2026

## Result

Applied four patch updates recommended by `npx expo install --check`, staying within SDK 57. The mobile registry audit remains **28 findings: 18 high, 10 moderate, zero critical**. These updates improve SDK compatibility; they do not remediate the URI decoder vulnerability or establish production readiness. No major upgrade, forced override or audit force-fix was applied.

| Direct dependency | Before | Installed |
| --- | --- | --- |
| expo | 57.0.28 | 57.0.30 |
| expo-constants | 57.0.21 | 57.0.22 |
| expo-linking | 57.0.12 | 57.0.13 |
| expo-router | 57.0.26 | 57.0.28 |

Installed using Expo's supported installer, not a generic package upgrade. The package manifest and lockfile changed, including normal transitive patch/minor updates and hoisting changes. React Native, React, SecureStore and AsyncStorage direct versions were not changed. No application source, environment file or database setting was modified.

## URI decoder investigation

Fresh registry metadata for every published stable Router 57 release through 57.0.28 still declares query-string `^7.1.3`. Query-string 7.1.3 declares decode-uri-component `^0.2.2`; its source uses a CommonJS `require` and calls that result directly during query parsing. Router's getStateFromPath code calls query-string parsing, so this remains a potential linking/runtime boundary, not solely development tooling.

The [advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) identifies affected decoder versions through 0.4.2 and a fix in 0.5.0. The [patched package metadata](https://github.com/SamVerschueren/decode-uri-component/blob/v0.5.0/package.json) declares ESM with a default export, outside the consumer's declared range. The [query-string manifest](https://github.com/sindresorhus/query-string/blob/v7.1.3/package.json) confirms its older decoder constraint. [SDK 57 Router documentation](https://docs.expo.dev/versions/v57.0.0/sdk/router/) recommends the 57.0.28 patch, not an automatic SDK 58 migration.

An isolated compatibility experiment downloaded only decoder 0.5.0 into a temporary directory with lifecycle scripts disabled. No project override or temporary project manifest edit was used. The experiment verified:

1. Installed query-string correctly parses a normal `course=Golf%20Club` query.
2. Patched decoder's default export decodes the same input correctly.
3. Loading the existing query-string source with its decoder require substituted by the patched ESM namespace makes ordinary parsing throw `decodeComponent is not a function`.

This demonstrates a CommonJS/ESM boundary mismatch under the tested Node harness. It does not prove the precise behavior of every Metro/native interop configuration and is not a device exploit test. It is sufficient to reject an unreviewed drop-in override as a verified safe fix. No exponential-decoding or denial-of-service payload was executed.

The audit suggests Router 58.0.22 as a major remediation path. That is not an approved SDK migration, and migrating it alone is not proven to resolve the other root advisories. Do not bypass the compatibility decision with a forced transitive override.

## Other advisory paths

The latest checked Expo 57.0.30 metadata uses CLI ^57.0.31 and config-plugins ~57.0.10. CLI 57.0.31 still declares node-forge ^1.3.3 and code-signing-certificates ^0.0.6. No verified security fix for the remaining roots was established by these patch updates. See [previous dependency triage](dependency-audit-2026-10-15.md) for braces, node-forge and uuid exposure limits. Audit fix recommendations involving Expo 44 or older React Native versions remain unsuitable forced downgrades.

## Fresh verification

- `npx expo install --check`: initially flagged four expected patch versions; after installation, **Dependencies are up to date**, exit 0.
- Mobile typecheck and lint: passed.
- Mobile tests: **93 passed**, zero failures/skips.
- Expo export `--platform all`: iOS, Android and web bundled successfully; output in a temporary directory outside Git. This is not a native runtime test.
- Isolated decoder compatibility experiment: assertions passed, including the expected incompatibility result.
- Online audit before update: exit 1 with 28 findings. Npm's post-install audit: same 28 findings.
- Manifest/lockfile diff reviewed; `git diff --check` passed; private environment and generated artifacts remain ignored.
- Backend/web suites were not rerun because only mobile dependencies changed. Their previous sprint results are historical evidence, not fresh checks for this task.

## Next action and limits

Restart any already running Expo CLI after installation, then run a fresh iPhone smoke test: welcome/tab navigation, direct protected links while signed out, login/restore/logout, partial/full round save, Home refresh and app reopen. If a development build is used, rebuild it to match updated native modules. Earlier user confirmations predate these dependency updates.

Evaluate an SDK 58 migration separately, including dependency/version matrix, native build requirements, linking and session regression testing, and a rollback strategy. Obtain explicit major-upgrade approval before changing versions. Alternatively, monitor a maintained SDK 57-compatible upstream fix. No such verified drop-in decoder fix was found in this review. The unresolved audit is not suppressed.

Git: main at b21af72. Manifest, lockfile, this review and persistent memory changes remain unstaged/uncommitted. Existing local push-outcome notes were preserved. No new commit, push, deploy, migration or secrets inspection occurred.
