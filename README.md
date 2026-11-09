<div align="center">

# ⛳ FAIRWAY IQ

### Track your rounds. Understand your game. Improve with data.

**A mobile-first golf analytics project built with React Native, FastAPI, and PostgreSQL.**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?logo=expo&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

**Status:** Active development · Portfolio project · Not production-ready

[Features](#-features) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [API](#-api-overview) · [Roadmap](#-roadmap)

</div>

---

## 🎯 Overview

FAIRWAY IQ is a golf performance tracking application for amateur players. It helps golfers record rounds, review scorecards, and explore performance trends over time.

The project brings together **mobile engineering**, **secure REST APIs**, **relational databases**, and **sports analytics**. It also provides a foundation for future experimentation with iPhone motion sensors and GPS-based shot detection.

> **Project scope:** Round tracking, account-backed history, and the initial analytics foundation are implemented. Automatic shot detection and AI coaching are **not completed features**.

## ✨ Features

| Feature | Description | Status |
| :--- | :--- | :--- |
| Authentication | Registration, sign-in, authenticated profile, session refresh, and logout | ✅ Implemented |
| Round tracking | 9- and 18-hole rounds, scorecards, drafts, and early finish | ✅ Implemented |
| Round history | Account-owned round submission, listing, and details via REST APIs | ✅ Implemented |
| Sync behavior | Pending/synced state and retry handling for round submission | ✅ Implemented foundation |
| Performance analytics | Round summaries with 9/18-hole filters and exclusions for incomplete or pending data | ✅ Implemented foundation |
| Web presence | Separate React/Vite landing page and illustrative demo | ✅ Implemented |
| AutoTrack | Exploring motion-sensor and GPS-based shot detection on iPhone | 🔬 Research / prototype |
| AI Coach | Personalized recommendations based on golf performance | 🗓️ Planned |

## 🏗️ Architecture

```text
┌───────────────────────────────────────┐
│       React Native / Expo App         │
│     TypeScript · Expo Router          │
└──────────────────┬────────────────────┘
                   │ HTTPS / REST API
                   ▼
┌───────────────────────────────────────┐
│          FastAPI Backend              │
│     Auth · Sessions · Rounds          │
│     Python · Pydantic · SQLAlchemy    │
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│             PostgreSQL                │
│          Alembic migrations           │
└───────────────────────────────────────┘

React + Vite + Tailwind → Separate landing / illustrative demo
```

### Technology stack

| Layer | Technologies |
| :--- | :--- |
| Mobile | React Native, Expo, Expo Router, TypeScript, AsyncStorage, SecureStore |
| Backend | Python 3.12, FastAPI, Pydantic, SQLAlchemy |
| Database | PostgreSQL, Alembic |
| Authentication | Argon2id password hashing, session management, refresh-token rotation |
| Website | React, Vite, Tailwind CSS |
| Quality | pytest, Node.js test runner, TypeScript, ESLint, GitHub Actions |

## 🔐 Security and backend engineering

- Password hashing with **Argon2id**.
- Authenticated account access and ownership checks for rounds.
- Session refresh and logout flows, with refresh-token rotation.
- Database migrations managed with Alembic.
- Separate local configuration for development and testing; secrets should never be committed.

## 🚀 Getting Started

### Prerequisites

- Python 3.12
- Node.js and npm
- PostgreSQL
- A configured local development environment and database

See [backend database setup](docs/backend-database.md) and [architecture documentation](docs/architecture.md) before starting the backend.

### Backend

From the repository root, after configuring the database and applying migrations:

```bash
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

### Mobile app

```bash
cd mobile
npm install
npm start
```

> When testing on a physical phone, configure the API URL to point to a network-reachable development machine instead of `localhost`. Native iPhone integrations may require an Expo development build.

### Website (optional)

```bash
cd frontend
npm install
npm run dev
```

## 🔌 API Overview

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health check |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Verify credentials |
| `POST` | `/auth/token` | Sign in and obtain a session |
| `POST` | `/auth/refresh` | Refresh a session |
| `POST` | `/auth/logout` | End a session |
| `GET` | `/auth/me` | Read the authenticated profile |
| `POST` | `/rounds` | Submit a round |
| `GET` | `/rounds` | List the user's rounds |
| `GET` | `/rounds/{round_id}` | Retrieve a round's details |

## 🧪 Testing and Quality

Run these checks from the indicated directories after configuring any required test database.

**Backend — repository root**

```bash
python -m pytest -c backend/pytest.ini backend/tests -q
```

**Mobile — `mobile/`**

```bash
npm run typecheck
npm run lint
npm test
```

**Website — `frontend/`**

```bash
npm run lint
npm run build
```

**Verification note:** Historical project documentation from October 2026 records successful local runs of **227 backend tests** and **142 mobile tests**. These figures do **not** verify the latest commit. The first documented hosted CI run had backend test failures related to test configuration; see [current state](docs/CURRENT_STATE.md) and the repository's **Actions** tab for updated results.

## 🗺️ Roadmap

- [x] Account authentication and session management
- [x] 9/18-hole round entry and scorecards
- [x] Account-owned round history and persistence
- [x] Initial performance analytics
- [x] Separate landing page
- [ ] Capture and publish authentic mobile screenshots
- [ ] Validate native iPhone motion/GPS shot detection, accuracy, and battery use
- [ ] Expand actionable analytics and comparison views
- [ ] Build and validate AI coaching functionality
- [ ] Complete production deployment, device testing, and dependency remediation

More detail: [Product roadmap](docs/PRODUCT_ROADMAP.md).

## 📱 Screenshots and Demo

Authentic screenshots from a running mobile build and a verified public demo link will be added when available. The separate web demo is illustrative and should not be confused with a production mobile release.

## 👨‍💻 About the Developer

**Andrea Michelangelo Forcina**  
Cybersecurity undergraduate · Mobile & backend development · Sports technology

I started FAIRWAY IQ to turn my interest in golf into a hands-on software engineering project. Building it gives me practical experience in product thinking, mobile interfaces, secure API design, databases, testing, and the real-world tradeoffs involved in sports analytics.

[GitHub](https://github.com/andreamforcina-cpu) · [LinkedIn](https://www.linkedin.com/in/andrea-forcina-443630282/) · [Portfolio](https://personal-portfolio-builder-rho.vercel.app)

---

<div align="center">

*Built for golfers who want to learn from every round.*

</div>
