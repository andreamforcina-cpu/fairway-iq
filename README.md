<div align="center">⛳ FAIRWAY IQ
Track smarter. Understand your game. Improve with data.
A mobile-first golf performance platform built with React Native, FastAPI, and PostgreSQL.


Status: Active development · Portfolio project · Not production-ready

Features · Architecture · Getting Started · API · Roadmap
</div>🎯 Overview
FAIRWAY IQ is a golf analytics application designed to help amateur golfers record rounds, review scorecards, and learn from their performance over time.

The project combines my interest in golf with practical experience in mobile development, backend APIs, relational databases, authentication, and software testing. It is also a foundation for future research into automatic shot tracking using iPhone sensors and GPS.
Project scope: The round-tracking and account-backed analytics foundation is implemented. Automatic shot detection and AI coaching are research/planned features—not finished product capabilities.

✨ Features
Area	What the project supports	Status
Accounts	Registration, sign-in, authenticated profile, session refresh, and logout	Implemented
Round tracking	9- and 18-hole rounds, scorecards, drafts, and early finish	Implemented
Round history	Account-owned round submission, listing, and detail through REST APIs	Implemented
Sync behavior	Pending/synced state and retry behavior for round submission	Implemented
Analytics	Performance summaries with 9/18-hole filtering and exclusions for incomplete/pending data	Implemented foundation
Web presence	Separate React/Vite landing page and illustrative demo	Implemented
AutoTrack	iPhone motion-sensor and GPS-based shot-detection exploration	Research / prototype
AI Coach	Personalized recommendations based on performance data	Planned


🧱 Architecture
                   ┌───────────────────────────────┐
                   │  React Native / Expo Mobile   │
                   │  TypeScript · Expo Router     │
                   └───────────────┬───────────────┘
                                   │ HTTPS / REST API
                                   ▼
                   ┌───────────────────────────────┐
                   │         FastAPI Backend       │
                   │  Auth · Sessions · Rounds     │
                   │  Python · Pydantic · SQLAlchemy│
                   └───────────────┬───────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │          PostgreSQL           │
                   │      Alembic migrations       │
                   └───────────────────────────────┘

     React + Vite + Tailwind → Separate marketing / demo website
Technology stack
Layer	Technologies
Mobile	React Native, Expo, Expo Router, TypeScript, AsyncStorage, SecureStore
Backend	Python 3.12, FastAPI, Pydantic, SQLAlchemy
Database	PostgreSQL, Alembic
Security	Argon2id password hashing, opaque sessions, refresh-token rotation
Website	React, Vite, Tailwind CSS
Quality	pytest, Node.js test runner, TypeScript, ESLint, GitHub Actions


🔐 Security and engineering decisions
- Account-scoped data: round endpoints operate on the authenticated user's records.
- Password protection: passwords are hashed using Argon2id.
- Session lifecycle: access/session handling includes refresh-token rotation and logout.
- Typed interfaces: TypeScript on mobile and validated API inputs with Pydantic.
- Database evolution: schema changes are managed with Alembic migrations.
- Testing: backend and mobile test suites are included in the repository.
These are engineering features of a developing portfolio project, not a claim of an independent security audit.
🗂️ Repository structure
fairway-iq/
├── backend/          # FastAPI application, database code, migrations, tests
├── mobile/           # Expo / React Native mobile application
├── frontend/         # React / Vite website
├── docs/             # Architecture, setup notes, current state, roadmap
└── README.md
🚀 Getting started
Requirements
- Python 3.12
- Node.js and npm
- PostgreSQL
- An Expo-compatible mobile development environment
1. Clone the repository
git clone https://github.com/andreamforcina-cpu/fairway-iq.git
cd fairway-iq
2. Configure and run the backend
Set up a local development database, environment variables, and migrations first. See the [database setup guide](docs/backend-database.md) and [architecture notes](docs/architecture.md) for project-specific configuration.
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
Never commit .env files, passwords, database URLs, or other secrets. The commands above assume database configuration and migrations have already been completed.

3. Start the mobile application
In a separate terminal:
cd mobile
npm install
npm start
When using a physical iPhone, configure the API base URL to an address reachable from the device; localhost on the phone does not refer to your computer. Native iOS modules may require an Expo development build rather than Expo Go.
4. Run the website (optional)
cd frontend
npm install
npm run dev
🔌 API overview
Method	Endpoint	Description
GET	/health	Service health
POST	/auth/register	Create account
POST	/auth/login	Verify credentials
POST	/auth/token	Create authenticated session
POST	/auth/refresh	Refresh session
POST	/auth/logout	End session
GET	/auth/me	Read authenticated user
POST	/rounds	Submit a round
GET	/rounds	List account-owned rounds
GET	/rounds/{round_id}	Read a specific round


API behavior and request bodies should be checked against the source and the local FastAPI OpenAPI documentation when the backend is running.
🧪 Testing and quality
Run checks from the indicated directories after configuring an isolated test environment.

Backend — repository root:
# PostgreSQL integration tests require a separate TEST_DATABASE_URL
python -m pytest -c backend/pytest.ini backend/tests -q
Mobile — mobile/:
npm run typecheck
npm run lint
npm test
Website — frontend/:
npm run lint
npm run build
Verification note: Historical project documentation from October 2026 records successful local test runs (227 backend tests and 142 mobile tests). Those figures are not a claim that the latest commit or hosted CI currently passes. The first documented hosted CI run had backend failures related to test configuration; consult [current state](docs/CURRENT_STATE.md) and the repository's Actions tab for up-to-date results.
🗺️ Roadmap
- [x] Authentication and account sessions
- [x] 9/18-hole round entry and scorecards
- [x] Account-owned round history and persistence
- [x] Initial performance analytics
- [x] Separate landing page
- [ ] Capture and publish genuine mobile screenshots
- [ ] Validate native iPhone motion/GPS shot detection, accuracy, and battery usage
- [ ] Expand actionable analytics and comparison views
- [ ] Develop and validate AI coaching functionality
- [ ] Complete production deployment, device testing, and dependency remediation
More detail: [Product roadmap](docs/PRODUCT_ROADMAP.md).
📱 Screenshots and demo
Screenshots and a verified public demo link will be added when available. The web demo is illustrative and should not be confused with a production mobile release.
👨‍💻 About the developer
Andrea Michelangelo Forcina
Cybersecurity undergraduate · Mobile & backend development · Sports technology

I started FAIRWAY IQ to turn my interest in golf into a hands-on software engineering project. Building it gives me experience across product thinking, mobile interfaces, secure API design, databases, testing, and the practical tradeoffs involved in sports analytics.

GitHub profile · LinkedIn · Portfolio
<div align="center">Built for golfers who want to learn from every round.
</div>
