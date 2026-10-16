# Dependency audit — 15 October 2026

Fresh online `npm audit --json --ignore-scripts` was run for both applications after the restricted sandbox initially failed DNS resolution. Authorized network retries succeeded. Audit operations did not install packages, run package lifecycle scripts or change manifests/lockfiles.

| Project | Current audit result | Interpretation |
| --- | --- | --- |
| Mobile | 28 package findings: 18 high, 10 moderate, zero critical; exit 1 | Four root advisory packages propagate through Expo/React Native parents. Not 28 independently demonstrated application exploits. |
| Frontend | Zero findings; exit 0 | No advisory identified by this registry snapshot, not proof of absence of vulnerabilities. |
| Backend | `pip check`: no broken requirements | Dependency consistency only. A Python advisory scanner was not installed or run; do not call this a clean security audit. |

## Mobile triage

Installed paths were verified with `npm ls`; the following are transitive packages, not newly added dependencies.

| Priority | Package/path and advisory | Exposure and safe next step |
| --- | --- | --- |
| 1 — runtime reachability review | Expo Router 57.0.26 → query-string 7.1.3 → decode-uri-component 0.2.2; [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) | Malformed URI decoding can consume excessive CPU. Router imports query-string, so linking is a potential runtime boundary; exploitability in this app has not been demonstrated. Advisory fix 0.5.0 lies outside query-string's declared ^0.2.2 range. Audit recommends Router 58, a major SDK change: do not force it. Assess upstream compatible update or a separately reviewed override with navigation/deep-link regression tests. |
| 2 — build/signing integrity | Expo CLI/code-signing-certificates → node-forge 1.4.0; [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | Signature verification weakness; code-signing tooling imports verification code. App services do not directly import forge. No deployed signing/update service was exercised; keep untrusted certificate/signing material out of the workflow pending a compatible upstream fix. Advisory lists no patched version in the checked snapshot. |
| 3 — build availability | Expo/React Native → Metro → metro-file-map → micromatch → braces 3.0.3; [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Nested malicious patterns can exhaust tooling stacks. No app-supplied user glob feature was found. Use trusted build inputs and trusted development networks; no patched version is listed in the checked advisory. No denial-of-service payload was executed. |
| 4 — constrained tooling call | Expo config-plugins → xcode 3.0.1 → uuid 7.0.3; [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | Advisory concerns v3/v5/v6 with caller-supplied buffers. Inspected xcode generation uses v4, so that call does not match the described vulnerable operation. The package remains flagged; cross-major override to uuid 11+ needs compatibility review. |

The registry suggests Expo 44 and older React Native/worklets versions for some propagated entries. These are incompatible downgrades relative to SDK 57, not a safe automatic remediation. No `audit fix --force`, override, downgrade or major upgrade was applied. Current app behavior and dependency lockfiles were preserved.

## Next review

Recheck compatible Expo/Router patch releases and root advisory status before distribution; prioritize linking reachability and signing workflows. A separate approved SDK migration requires native build, deep links, refresh/logout, tracker persistence and accessibility regression checks. An isolated Python advisory scan remains outstanding. Do not expose Metro to untrusted networks or infer production readiness from this audit.
