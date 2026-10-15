# FAIRWAY IQ project guidance

## Stack and structure

- `frontend/`: React, TypeScript, Vite, Tailwind CSS, Motion for React.
- `mobile/`: React Native, Expo, Expo Router, strict TypeScript. Preserve the existing `mobile/app/` route structure; keep reusable components and logic outside route files. Read `mobile/AGENTS.md` for additional mobile guidance.
- `backend/`: Python 3.12, FastAPI, Pydantic Settings, SQLAlchemy 2.x, psycopg, PostgreSQL, Alembic, Argon2id via argon2-cffi.
- `docs/`: architecture, setup, security proposals and verification guidance. Inspect manifests and source for current versions and capabilities; file existence does not prove functionality.

## Development workflow

- Inspect architecture, relevant components, configuration, tests and Git changes before editing. Explain the implementation plan briefly.
- Work incrementally within the requested scope. Preserve existing functionality, navigation, design tokens, animations and accessibility. Reuse components and avoid unrelated redesigns or refactors.
- Keep code maintainable and typed. Validate untrusted inputs. Add focused tests for meaningful calculations, validation and security behavior; do not globally disable lint rules.
- Preserve user changes; never discard or overwrite existing work. Merge documentation/instructions carefully.
- Avoid unnecessary dependencies. Assess advisories, direct/transitive exposure and compatible fixes; obtain approval before major dependency upgrades.
- Check responsive desktop/mobile layouts as relevant. Respect reduced motion, keyboard/focus access and touch-device limits; prefer lightweight transform/opacity motion.
- Do not stage unrelated files. Do not commit or push without explicit approval. Before an authorized commit, inspect branch and staged files, check for secrets/generated artifacts, and run the staged whitespace check.

## Security and database safety

- Never hardcode, return or log passwords, hashes, tokens, API keys, database URLs or credentials. Do not inspect or print private `.env` contents. Never overwrite an existing `.env`; use placeholder-only examples and verify real environment files remain Git-ignored.
- Hash passwords with Argon2id; never store plaintext. Use consistent email normalization, parameterized SQLAlchemy queries, explicit response allowlists and generic safe errors. Redact validation inputs and authentication payloads from logs.
- Credential verification alone is not an authenticated session. Never simulate successful authentication or imply tokens/guards exist when they do not. Add login, JWT, refresh tokens, backend/mobile connections or other authentication stages only when explicitly requested.
- Use SecureStore for mobile authentication tokens when token integration is authorized; never use AsyncStorage for tokens.
- Load database settings from environment configuration. Keep schema creation/migrations out of application startup. Confirm the target before database operations; do not apply migrations without explicit approval or reset/drop databases or unrelated tables.
- Automated integration tests must use an explicitly configured, isolated `TEST_DATABASE_URL`, never the development/production database. Preserve database-name guards and rollback-only temporary test schemas. No real user credentials in tests.
- Consider HTTPS, verified remote database TLS, least privilege, request-size/rate/concurrency limits, ownership verification and safe telemetry before public deployment. Report missing protections accurately.

## Verification

Run checks appropriate to the changed subsystem; report failures and skips accurately.

- Backend, repository root: `backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests -q`. PostgreSQL integration tests additionally require a privately configured isolated `TEST_DATABASE_URL`; never substitute the development URL.
- Mobile, from `mobile/`: `npm run typecheck`, `npm run lint`, `npm test`.
- Web, from `frontend/`: `npm run build`, `npm run lint`.
- Run `git diff --check`; inspect status and ensure secrets, dependency directories, Expo caches and generated build files are excluded.
- Distinguish automated checks, manual device verification, historical evidence and assumptions. Never claim untested interactions work.

## Completion and end-of-day reporting

Provide a concise handoff covering:

1. Files changed and concrete behavior implemented or corrected.
2. Checks executed, results, skips and checks that could not be completed.
3. Remaining bugs, security risks, limitations and blockers.
4. Current Git status, including staged/uncommitted work and whether any authorized commit/push occurred.
5. Recommended next step and practical preview/test instructions when relevant.

Keep durable instructions free of task status and secrets. Record dated verification evidence in appropriate documentation when requested. Stop at the authorized scope and wait for approval before further work.

## Persistent development memory

- SESSION START: read `docs/CURRENT_STATE.md` and `docs/NEXT_SESSION.md` before beginning development, then review `docs/project-status.md`, actual Git status and relevant source. The repository is the source of truth. Reconcile conflicts with code, explain corrections, and mark anything unverifiable as unverified. Do not repeat completed setup or restart completed work.
- SESSION END: inspect the repository and update `docs/CURRENT_STATE.md` and `docs/NEXT_SESSION.md` before generating the daily report. Record dated progress, unresolved issues, pending decisions/approvals, branch/checkpoint and staged/uncommitted status, test results and the exact next task in these files and `docs/development-log.md` / `docs/project-status.md` as appropriate. Distinguish freshly executed checks, historical results, user-reported device evidence and assumptions. Keep permanent instructions free of task status.
- MORNING RESUME PROTOCOL: when the user says “Buongiorno”, “Good morning”, “Resume FAIRWAY IQ” or “Continue development”, read `AGENTS.md`, `docs/CURRENT_STATE.md`, `docs/NEXT_SESSION.md` and `docs/project-status.md`; inspect actual Git status and relevant source; determine whether the preceding task was completed or interrupted; identify the exact next action; briefly summarize in Italian where work stopped; then resume that task within existing authorization. Do not switch features unless it is complete or the user explicitly changes scope. Device-only checks require user participation and must never be claimed as completed by assumption.
- Never store credentials, private environment contents, API keys, passwords, authentication tokens or connection strings in memory. Preserve existing work. Updating memory never authorizes a commit, push or database migration; each remains subject to the existing approval rules.
- `docs/NEXT_SESSION.md` is the canonical handoff. The legacy `docs/next-session.md` is historical context and must point to the canonical file instead of establishing competing priorities.
