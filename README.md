FAIRWAY IQ
Golf performance tracking, built with React Native, FastAPI, and PostgreSQL.

FAIRWAY IQ is a mobile-first sports technology portfolio project for amateur golfers. It combines scorecard tracking, account-owned round history, performance analytics, and secure backend engineering.
Status: Active development. This is a portfolio prototype, not a production-hosted product or completed AI coach.

Implemented features
- Account registration, login, session refresh, logout, and authenticated profile.
- Nine- and eighteen-hole round tracking, scorecards, draft persistence, and early finish.
- Account-owned round submission, history and detail through REST APIs; pending/synced status and retry behavior.
- Performance summaries for acknowledged complete rounds, with 9/18-hole filters and partial/pending exclusions.
- Separate React/Vite landing and illustrative web demo.
Technology
Component	Stack
Mobile	React Native, Expo Router, TypeScript, AsyncStorage, SecureStore
API	Python 3.12, FastAPI, Pydantic, SQLAlchemy
Database	PostgreSQL, Alembic
Security	Argon2id password hashing, opaque sessions, refresh-token rotation
Web	React, Vite, Tailwind CSS
Testing	pytest, Node test runner, TypeScript, ESLint, GitHub Actions


Architecture
Expo / React Native app
      | REST API
      v
FastAPI: auth, sessions, rounds
      |
      v
PostgreSQL / SQLAlchemy

React / Vite landing site (separate illustrative demo)
Backend API
Method	Path	Purpose
GET	/health	Health check
POST	/auth/register	Register
POST	/auth/login	Credential verification
POST	/auth/token	Sign in
POST	/auth/refresh	Refresh session
POST	/auth/logout	Logout
GET	/auth/me	Current user
POST	/rounds	Submit round
GET	/rounds	List owned rounds
GET	/rounds/{round_id}	Round detail


Local development
Prerequisites: Node.js/npm, Python 3.12, PostgreSQL, and development environment configuration. Follow [database setup](docs/backend-database.md) and [architecture](docs/architecture.md) for safe environment and migration procedures. Never commit .env or secrets.
# repository root — after configuring a development database and migrations
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload

# mobile/
npm install
npm start

# frontend/ (optional website)
npm install
npm run dev
On a physical phone, configure the API origin to a reachable machine address rather than localhost. Native features may require an Expo development build.
Quality checks
# repository root; PostgreSQL integration requires an isolated TEST_DATABASE_URL
python -m pytest -c backend/pytest.ini backend/tests -q

# mobile/
npm run typecheck
npm run lint
npm test

# frontend/
npm run lint
npm run build
Historical verification (October 16, 2026): project documentation records 227 local backend tests passed with an isolated PostgreSQL database and 142 mobile tests passed, plus typecheck/lint. These are documented historical results, not tests rerun for this README. The first documented GitHub-hosted CI run had 222 backend passes and five failures related to missing private database configuration in tests; mobile and web jobs passed. A local correction was documented, but successful subsequent hosted CI is not yet confirmed. See [current state](docs/CURRENT_STATE.md).
In progress / planned
- AutoTrack: exploration of iPhone motion sensors and GPS for shot detection; accuracy and battery behavior remain unvalidated.
- AI coaching: planned, not currently a functioning coach.
- Production release: hosting, native/two-device validation, and dependency remediation remain open.
See [product roadmap](docs/PRODUCT_ROADMAP.md).
Screenshots
Authentic application screenshots will be added after capture from a running build. No generated or illustrative screenshots are represented as actual product UI.
About
Created by Andrea Michelangelo Forcina to connect a personal interest in golf with mobile engineering, analytics, backend systems, and cybersecurity.
