FAIRWAY IQ
Know your game. Track your progress.
A mobile-first golf analytics project built with React Native, FastAPI, and PostgreSQL.

Features · Architecture · Tech Stack · Getting Started · Roadmap

</div>Overview
FAIRWAY IQ is a personal sports-technology project designed to help amateur golfers record rounds, review scorecards, and understand performance over time. It brings together mobile app development, REST API design, relational data modeling, and secure account management.

The project is under active development. The current repository is a portfolio prototype, not a publicly released app. Features described as planned below are not presented as working product capabilities.
Features
Area	Current functionality
Accounts	Registration, sign-in, authenticated profile, session refresh, and logout
Round tracking	Nine- and eighteen-hole scorecards, local draft persistence, and early finish
Round history	Account-owned round submission, history, and detail via REST endpoints
Sync handling	Pending/synced states and retry behavior for round submissions
Analytics	Performance summaries for acknowledged complete rounds, including 9/18-hole filtering
Web presence	Separate React/Vite landing page and illustrative demo


Design principle: Keep a reliable scorecard and data foundation before introducing automated shot tracking or coaching features.

Architecture
                  ┌───────────────────────────┐
                  │   Expo / React Native     │
                  │  TypeScript mobile app    │
                  └─────────────┬─────────────┘
                                │ HTTPS / REST API
                                ▼
                  ┌───────────────────────────┐
                  │     FastAPI backend       │
                  │  Auth · Sessions · Rounds │
                  └─────────────┬─────────────┘
                                │ SQLAlchemy
                                ▼
                  ┌───────────────────────────┐
                  │        PostgreSQL         │
                  │  Users · Sessions · Rounds│
                  └───────────────────────────┘

        React / Vite landing page (separate web experience)
Security-minded implementation
- Argon2id-based password hashing.
- Authenticated, account-scoped access to round data.
- Opaque sessions and refresh-token rotation.
- Database migrations managed with Alembic.
These are implementation choices, not a claim that the application has undergone a production security audit.
Tech Stack
Layer	Technologies
Mobile	React Native, Expo Router, TypeScript, AsyncStorage, SecureStore
Backend	Python 3.12, FastAPI, Pydantic, SQLAlchemy
Database	PostgreSQL, Alembic
Web	React, Vite, Tailwind CSS
Quality	pytest, Node.js test runner, TypeScript, ESLint, GitHub Actions


API Overview
Method	Endpoint	Description
GET	/health	Health check
POST	/auth/register	Create an account
POST	/auth/login	Verify credentials
POST	/auth/token	Create an authenticated session
POST	/auth/refresh	Rotate refresh credentials
POST	/auth/logout	End a session
GET	/auth/me	Get authenticated account
POST	/rounds	Submit a round
GET	/rounds	List the user's rounds
GET	/rounds/{round_id}	Get a round's details


Getting Started
Requirements
- Python 3.12
- Node.js and npm
- PostgreSQL
- Expo-compatible mobile development environment
1. Clone the repository
git clone https://github.com/andreamforcina-cpu/fairway-iq.git
cd fairway-iq
2. Configure the backend
Set up a local development database, environment variables, and migrations following the repository's [database setup guide](docs/backend-database.md) and [architecture notes](docs/architecture.md).
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
Never commit .env files, credentials, or private database URLs.
3. Start the mobile app
cd mobile
npm install
npm start
When testing on a physical phone, configure the API origin using a reachable development-machine address rather than localhost. Native integrations may require an Expo development build.
4. Start the website (optional)
cd frontend
npm install
npm run dev
Testing and Quality
# From repository root; configure an isolated TEST_DATABASE_URL
python -m pytest -c backend/pytest.ini backend/tests -q

# From mobile/
npm run typecheck
npm run lint
npm test

# From frontend/
npm run lint
npm run build
Verification transparency: Historical project notes dated October 16, 2026 report 227 passing local backend tests and 142 passing mobile tests. These counts have not been rerun for this README. The first documented hosted CI run reported 222 backend passes and five failures associated with test configuration; mobile and web jobs passed. A subsequent fully passing hosted CI run has not been verified here. See [project status](docs/CURRENT_STATE.md).
Roadmap
Stage	Focus	Status
1	Authentication, round tracking, round history, analytics foundation	Implemented in prototype
2	Reliability, end-to-end validation, dependency remediation	In progress
3	AutoTrack: iPhone motion/GPS-based shot detection research	Exploratory; accuracy and battery use unvalidated
4	AI-powered coaching and deeper shot analysis	Planned
5	Production deployment and broader device testing	Planned


Read the [product roadmap](docs/PRODUCT_ROADMAP.md) for additional planning context.
Screenshots and Demo
Real screenshots and a verified demo will be added after capture from a running app build. No mockup is presented here as an actual screenshot.
Why I Built It
I started FAIRWAY IQ to combine my interest in golf with hands-on work in mobile software engineering, backend APIs, data analytics, and cybersecurity. The project gives me a practical way to design a product around a sport I play while learning how its systems fit together.
<div align="center">Built by Andrea Michelangelo Forcina

Sports technology · Mobile development · Secure backend systems
</div>
