# Mobile dependency exposure follow-up — 2026-10-16

## Result

Fresh online npm audit: **28 package findings: 18 high, 10 moderate, zero critical**. Four advisory roots propagate through their parents; this is not 28 demonstrated application exploits. No compatible dependency fix was established. No manifest, lockfile, application route, dependency override, major upgrade, downgrade or audit suppression changed.

Registry checks confirm braces latest 3.0.3, node-forge latest 1.4.0, Expo 57 latest 57.0.30 and Router 57 latest 57.0.28. The installed SDK 57 packages are already at those patches. The audit now suggests Router 58.0.23 for the decoder path; that is a major change, not an automatic compatible fix. Other propagated recommendations still include an incompatible Expo 44 downgrade. Do not run audit fix --force.

## Correction to previous runtime assessment

The previous SDK 57 report said Router's getStateFromPath calls query-string parsing. In the installed **expo-router 57.0.28**, that matched statement in `build/fork/getStateFromPath.js` is actually commented-out upstream code. Its active code calls `expo.parseQueryParams`, defined in `getStateFromPath-forks.js`, which uses WHATWG URL/searchParams. `build/link/linking.js` imports this Expo fork. Query-string is still used for outgoing stringify operations, and the package also includes `build/react-navigation/core/getStateFromPath.js`, whose active parser does call query-string.parse.

This narrows the demonstrated normal incoming-parser exposure; it does **not** prove that the decoder is unreachable across all application, platform or third-party navigation paths. The vulnerable decoder remains installed and the audit is unchanged. No native-intent hook or other speculative application workaround was added.

## Evidence and priorities

| Root | Fresh installed evidence | Remaining decision |
| --- | --- | --- |
| decode-uri-component 0.2.2 | Expo fork parses normal/repeated/malformed bounded query samples without calling a query-string parser tripwire. The bundled React Navigation fallback triggers the tripwire on an ordinary query, confirming both an alternate path and a working control. | Keep the finding open. Evaluate all fallback consumers before declaring runtime non-reachability; consider an approved SDK migration only with a dependency matrix and navigation/auth regression coverage. The previous CommonJS/ESM override experiment remains valid but is not a complete Metro result. |
| uuid 7.0.3 through xcode 3.0.1 | Actual xcode generateUuid code calls v4 with no arguments, verified with an instrumented dependency; no caller buffer or v3/v5 operation. | That specific call does not match the advisory's affected operation. Do not force a cross-major 11+ override merely to reduce audit counts; package finding remains. |
| braces 3.0.3 through Metro/micromatch | Installed tree and registry latest confirmed; advisory lists no patch. | Tooling availability risk remains. Use trusted build patterns/inputs and developer network; do not expose Metro publicly. No malicious deep-recursion input was executed. |
| node-forge 1.4.0 through Expo CLI/signing | Installed tree/imports and registry latest confirmed; latest version remains in affected range. | Signing-tool integrity risk remains. No signing/deployed-update workflow was exercised; no untrusted certificate or signature test was run. Wait for a compatible upstream fix or review signing dependencies separately. |

Advisory sources: [decoder](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), [UUID](https://github.com/advisories/GHSA-w5hq-g745-h8pq), [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv). Installed source is the evidence for the concrete consumer behavior; advisory severity does not establish application exploitability.

## Regression tests and limits

Added `mobile/tests/dependencyExposure.test.mjs`: four focused installed-dependency exposure tests. A local CommonJS loader instruments query-string.parse and loads pure parser code without native UI barrels; it substitutes only the barrel's pure validatePathConfig export. Tests use small fixed malformed-encoding strings, not a denial-of-service payload or benchmark. The xcode test loads the installed generator with an instrumented UUID dependency, without writing a native project. No node_modules files are edited.

These tests deliberately depend on the installed parser/tooling paths: if an upgrade changes them, review the exposure assessment and tests together. They are not native rendering, deep-link lifecycle, exploitability, signing, or whole-bundle reachability tests. They do not eliminate or suppress any finding.

## Fresh verification

- Online `npm audit --json`: exit 1 for the 28 findings above. Initial sandbox registry DNS denial was retried successfully with network approval.
- `npm ls braces node-forge uuid decode-uri-component query-string --all`: installed chains confirmed.
- `npx expo install --check`: dependencies up to date.
- `npm test`: **128 passed, zero failed/skipped**, including four new exposure regressions.
- Mobile typecheck and lint passed; `git diff --check` passed.
- Application/dependency artifacts did not change, so platform exports and backend/web suites were not rerun. Prior 197 backend/PostgreSQL passes, prior platform exports and user-reported iPhone acceptance remain historical.
- A first test-file write used a repository-relative path from mobile and failed without changing files; corrected to the mobile tests directory before targeted/full verification. No tests were bypassed.

## Handoff

No safe compatible dependency remediation is available from the checked releases; do not manufacture one by overriding major versions. Keep this evidence attached to the unresolved risk ledger. A major SDK/dependency migration needs explicit approval and does not guarantee that unpatched braces/forge roots disappear.

Next proposed independent security task: inspect request-size, write-rate and resource limits on authenticated round endpoints before public exposure. Define/test bounded behavior without altering ownership or score semantics. That implementation remains outside this dependency-review task until authorized.

Git main at 3b5955c, locally matching the last confirmed origin/main push. Existing four uncommitted publication-memory updates preserved; new test/report and memory updates remain unstaged/uncommitted. No commit, push, fetch, database operation, deployment or private environment inspection occurred.
