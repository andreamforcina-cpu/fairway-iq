# PostgreSQL infrastructure — first increment

## Scope

SQLAlchemy 2.0 typed ORM, environment-based configuration, lazy sessions, and the initial Alembic users migration are implemented. Local PostgreSQL 17.11 (Homebrew) is configured with database `fairway_iq_dev`, schema `public`. Migration `0001_create_users` was explicitly applied and verified: `users` and `alembic_version` exist; columns, constraints, unique email index, updated_at trigger/function, and revision were checked with no ORM/schema drift. This records the prior verification; no migration or database operation is run by this documentation update. Existing FastAPI `/` and `/health` remain unchanged and do not require a configured database. No application startup runs migrations or creates tables. Registration and Argon2id hashing are now implemented; see [registration documentation](backend-registration.md). Login credential verification is implemented without sessions; see [login documentation](backend-login.md). JWT and mobile authentication integration remain planned.

## Dependencies and structure

New runtime dependencies in `backend/requirements.txt`: SQLAlchemy 2.0.54, Alembic 1.20.0, and psycopg 3.3.6 with its matching binary distribution. Registration and credential verification add argon2-cffi 25.1.0 and its pinned bindings/CFFI dependencies. Existing Pydantic Settings and python-dotenv are reused. `requirements-dev.txt` adds pytest 9.1.1 for tests. These packages are installed and tested locally. The previously ranged psycopg and pytest requirements are now pinned to those installed versions, without upgrading packages. Runtime requirements are exact pins; this is not a hash-locked transitive dependency manifest.

- `core/config.py`: Pydantic Settings; required `DATABASE_URL` represented as SecretStr; loads `backend/.env` regardless of working directory; environment variables take precedence. Generic PostgreSQL URLs normalize to the psycopg 3 driver. Other drivers/databases and missing database names are rejected.
- `db/base.py`: typed DeclarativeBase and named constraints.
- `db/session.py`: lazily constructed synchronous engine and session factory; pre-ping, SQL echo disabled, parameter hiding, no implicit commits.
- `models/user.py`: typed UUID User model and normalized email.
- `migrations/`: initial migration, offline/online Alembic environment, and revision template.
- `scripts/check_database.py`: explicit, read-only SELECT 1 connectivity check with safe output.
- `tests/`: configuration/metadata/SQL-generation tests, endpoint regression test, and opt-in isolated PostgreSQL tests.

Synchronous psycopg keeps this initial infrastructure small. Future async endpoints must not perform blocking DB work directly on the event loop; use synchronous FastAPI dependencies/routes or deliberately migrate to async SQLAlchemy.

## Local setup (run yourself)

The current checkout already has a working PostgreSQL 17 development database and applied migration. Do not recreate the role/database or replace its environment file. For a new development machine, install PostgreSQL 17 and start its local service. From the repository root:

```sh
backend/.venv/bin/python -m pip install -r backend/requirements-dev.txt
createuser --login --pwprompt fairway_iq_dev
createdb --owner=fairway_iq_dev fairway_iq_dev
backend/.venv/bin/python - <<'PYENV'
import os
from pathlib import Path
try:
    fd = os.open('backend/.env', os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
except FileExistsError:
    print('Existing backend/.env left unchanged.')
else:
    with os.fdopen(fd, 'w') as target:
        target.write(Path('backend/.env.example').read_text())
    print('Created backend/.env with placeholder values and owner-only permissions.')
PYENV
```

Use an administrative local PostgreSQL role for createuser/createdb if your operating-system account does not have permission. These commands create a new role/database; they do not drop/reset an existing one. If they already exist, inspect ownership/configuration instead of deleting them.

Edit `backend/.env` privately, replacing template values with your actual role/password. Percent-encode special characters in URL credentials. Never paste actual credentials into Git, documentation, chat, logs, or shell command history. `postgresql://`, `postgres://`, and `postgresql+psycopg://` are accepted and normalize to `postgresql+psycopg`. The example is only a placeholder. Local socket URLs are supported when PostgreSQL is configured for socket authentication.

Real `.env` and `.env.*` files are ignored by the repository; `.env.example` is the intentional safe exception:

```sh
git check-ignore -v backend/.env backend/.env.production
backend/.venv/bin/python -m backend.scripts.check_database
```

The connectivity command reads configured settings, prints only success/failure, and does not change schema or data. It does not validate migration readiness or TLS policy. Use verified TLS (`sslmode=verify-full`, trusted CA) and a secrets manager for remote/production deployments. Use separate least-privilege application and migration roles in production; the local dev owner is for development only.

## Migrations: existing local state and fresh-database instructions

The existing local database is already at `0001_create_users`; do not repeat an initial migration or reset its schema. For inspection or a fresh database, from the repository root:

```sh
backend/.venv/bin/alembic -c backend/alembic.ini history
backend/.venv/bin/alembic -c backend/alembic.ini upgrade head --sql
backend/.venv/bin/alembic -c backend/alembic.ini current
```

`history` inspects migration files. `upgrade head --sql` renders SQL without opening a database connection (valid environment configuration is still required). `current` connects read-only to inspect revision state. Confirm the database target privately and inspect the generated SQL before explicitly applying:

```sh
backend/.venv/bin/alembic -c backend/alembic.ini upgrade head
```

This creates `users`, its unique index/check constraints, an updated_at trigger/function, and Alembic's version table. It is not automatically run. For an existing database, back it up and review its schema/migration history before applying; do not stamp or reset it blindly. The downgrade exists for deliberate rollback and deletes the users table/data. Never invoke it casually on a populated database.

Inspect using psql without placing a credential-bearing URL in the command:

```sh
psql -h 127.0.0.1 -U fairway_iq_dev -d fairway_iq_dev -W
```

Inside psql:

```sql
\d+ users
SELECT version_num FROM alembic_version;
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'users';
SELECT column_name, data_type, is_nullable
FROM information_schema.columns WHERE table_name = 'users';
```

Do not select/log password hashes as part of inspection.

## Model constraints and timestamp semantics

- UUID primary key: application-generated uuid4 plus PostgreSQL gen_random_uuid default for direct SQL inserts; no extension installation is performed.
- Email: required varchar(254), unique indexed value, normalized lower/trim via ORM and enforced by a database check. Basic @/length checks are structural; registration schemas validate email format; ownership verification remains planned. Case-insensitive account identity is a deliberate application policy.
- Full name: required varchar(100), trimmed nonempty constraint.
- Password hash: required varchar(512), deferred ORM loading, database check requiring an Argon2id prefix. This rejects ordinary plaintext strings but cannot prove a hash is genuine. Registration generates genuine hashes through argon2-cffi; never concatenate a prefix onto plaintext.
- is_active: required, true application/server default. This requested default is not an email-verification system; separate ownership-verification state is still required before production authentication.
- created_at/updated_at: required TIMESTAMP WITH TIME ZONE, server clock defaults. ORM updates request now(); the database trigger maintains updated_at even for direct SQL updates. CURRENT_TIMESTAMP is transaction-based, so multiple changes within one transaction can share timestamps.

Settings/error text hides input values; migration/check commands suppress driver error text. Never log `settings.sqlalchemy_url`, raw driver exceptions, `ValidationError.errors()` input payloads, sessions, or ORM attribute dictionaries. Parameter hiding reduces accidental SQL logging but is not a complete logging security policy.

## Tests and integration safety

```sh
backend/.venv/bin/python -m pytest -c backend/pytest.ini backend/tests
```

Unit tests validate PostgreSQL URL acceptance/rejection, secret-safe settings repr/errors, lazy engine construction, required/type/index/check metadata, normalized email, revision graph and offline SQL. Existing endpoints have a regression test. They do not contact PostgreSQL.

PostgreSQL integration tests skip unless `TEST_DATABASE_URL` is explicitly set. Provision a disposable database separately:

```sh
createdb --owner=fairway_iq_dev fairway_iq_test
```

Set `TEST_DATABASE_URL` privately to that database (not `DATABASE_URL`), then run the same pytest command. Tests refuse database names without the `fairway_iq_test` prefix and refuse a matching configured application database name. Use a dedicated disposable database you own; the name check is a guardrail, not proof that an arbitrary server is safe. Each test creates a random schema inside a transaction, migrates only that schema, and rolls back its own transaction afterward. No existing database is reset, no public tables are migrated, and no database is dropped.

Integration tests exercise actual uniqueness/null/hash/name constraints, timezone defaults, metadata/migration agreement, the direct-SQL timestamp trigger, registration persistence/duplicates, and login credential verification. There is no SQLite stand-in for PostgreSQL behavior.

## Verification status — October 14, 2026

- All backend Python files pass in-memory syntax compilation.
- Existing `/`, `/health`, and `/openapi.json` verified through an in-memory ASGI client without database configuration.
- Git ignore rules verified for real backend environment files.
- PostgreSQL 17.11 connectivity and target `fairway_iq_dev` were previously verified. Initial migration `0001_create_users` was applied explicitly and its table, constraints/index, timezone columns, defaults, trigger/function and revision were verified. These are historical database checks; no migration was executed during this cleanup.
- Backend tests: **53 passed, none skipped**, including five PostgreSQL integration tests using the isolated `fairway_iq_test_registration` database. Test tables and temporary schemas were rolled back; the development database was not used by automated tests.
- One existing Starlette/httpx deprecation warning remains. Dependency consistency check reports no broken requirements.
- Real `backend/.env` is ignored by Git and was restricted to owner-only permissions during the security review. Its contents are not part of the commit.
- Registration and login credential verification are implemented. Manual Swagger checks confirmed registration returns 201, valid login returns 200, and incorrect passwords and unknown emails return identical generic 401 responses. The displayed API responses contained no passwords, hashes or tokens. No authenticated session or JWT is created.

Known limits: concurrency/load testing, request-size/rate/concurrency limits, email ownership verification, production TLS enforcement, authenticated sessions/tokens and connection monitoring remain outstanding. See the registration and login documents for endpoint behavior and verification details. Exact runtime/dev pins improve repeatability but do not replace a platform-specific dependency lock with artifact hashes. Previously documented mobile dependency advisories remain unresolved.

## Session infrastructure

Migration `0002_create_auth_sessions` was applied to local `fairway_iq_dev`, schema `public`, after explicit approval and preflight checks. The committed revision, new session tables and ORM metadata agreement were verified. Existing users columns, indexes, triggers and row count were unchanged. All 85 backend tests passed on the isolated test database. See [backend-sessions.md](backend-sessions.md) for verification and setup details; earlier sections describe the initial users-only checkpoint.
