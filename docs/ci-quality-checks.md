# CI quality checks and demo handoff

Implemented 2026-10-16 in `.github/workflows/ci.yml`; not yet committed, published or executed on GitHub. This is a quality lane, not a deployment or signed native build.

## Workflow

Pull requests, pushes to main and manual dispatch run three independent, time-bounded Ubuntu 24.04 jobs. Token permissions are contents-read only; checkout does not retain credentials. No repository secrets, production environment, deployment action or artifact publication is configured. Concurrency cancels superseded checks for the same ref. Actions use upstream major tags; immutable reviewed SHA pins, runner/image digests and a dependency update process remain supply-chain hardening opportunities. Pinned Python requirements and npm lockfiles constrain packages, but runners, action tags, PostgreSQL 17 image and Python 3.12 patch selection are not bit-for-bit immutable.

- Backend: Python 3.12, pinned development requirements, ephemeral PostgreSQL 17 service and explicit `fairway_iq_test_ci` target. The service uses trust authentication on a loopback-bound published port only within the disposable CI runner. No real credentials are required. This configuration must never be copied to a deployed database. Existing test guards and temporary schema isolation are preserved; no application/development schema migration command is added. Tests perform their existing isolated migration exercises. A JUnit gate fails if zero tests execute or any are skipped. Pytest itself fails on errors/failures before that gate.
- Mobile: Node 24.13.0, `npm ci`, typecheck, lint, tests and all-platform Expo export. Dotenv loading and Expo telemetry are disabled. No API URL is supplied: the export is a preview compilation check, not an authenticated hosted demo. No EAS credentials or native signing required. Output stays in temporary storage and is not uploaded.
- Web: Node 24.13.0, `npm ci`, lint and build. This remains the separate illustrative frontend, not another authenticated client.

## Fresh local evidence

2026-10-16: backend **227 passed**, no skips; JUnit no-skip gate passed. Existing Starlette/httpx deprecation remains. Mobile **142 passed**, no skips; TypeScript/lint and iOS/Android/web export passed with dotenv disabled. Web lint/build passed. Workflow YAML parsed and checked for expected jobs, read-only permissions and separate test DB environment. Whitespace passed. `actionlint` is not installed, so its validation was not performed. Local checks used existing dependency installations, macOS and the previously approved isolated test database; they do not prove `npm ci`, pip installation, Linux service networking or GitHub workflow execution. No clean-install or hosted-run success is claimed.

## Reproduce and accept

After a separately authorized commit/push, open Actions → Quality checks and inspect all three job results. The workflow must be present on the default branch for manual dispatch. Require successful installs, no skipped backend cases, mobile export and web build; capture the commit and run link here before considering the CI gate accepted. Repository branch protection is a separate setting and has not been changed. Do not bypass failures or treat historical local results as hosted evidence.

For local verification use the commands in AGENTS.md. Supply only an explicitly approved isolated TEST_DATABASE_URL to backend pytest; never substitute DATABASE_URL. Mobile export can use `CI=1 EXPO_NO_DOTENV=1 EXPO_NO_TELEMETRY=1 npx --no-install expo export --platform all --output-dir /private/tmp/fairway-iq-preview-export` from mobile. Keep private env files and generated outputs ignored.

## Next demo decision

Select a controlled invited-demo host/region and mobile distribution target before creating vendor-specific configuration. Record expected costs, public HTTPS API origin, PostgreSQL verified TLS and separate least-privilege runtime/migration roles, secret storage, trusted proxies/edge quotas, readiness/schema checks, backup/restore, rollback and explicit migration approval. Choose signed internal native distribution versus LAN Expo acceptance; an export is not an installable signed app. No hosting purchase, account creation, remote service provisioning, migration, deployment or signing is authorized by this workflow implementation.

Keep the 28 previously reported dependency findings and native/two-device acceptance gaps visible. This lane neither remediates advisories nor establishes release readiness. See PRODUCT_ROADMAP.md and MVP_SUCCESS_CRITERIA.md.

Sources reviewed: [GitHub PostgreSQL services](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers), [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [Expo CLI](https://docs.expo.dev/more/expo-cli/) and [dotenv controls](https://docs.expo.dev/guides/environment-variables/).
