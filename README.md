# CoopSetu AI

> AI-enabled cooperative training, certification, skill intelligence, and employment platform for India’s cooperative ecosystem.

[![Web](https://img.shields.io/badge/Web-Next.js%2016-000000?logo=nextdotjs)](apps/web)
[![API](https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi)](backend)
[![Mobile](https://img.shields.io/badge/Mobile-Expo%2057-000020?logo=expo)](apps/mobile)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%2B%20pgvector-4169E1?logo=postgresql)](backend/migrations)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python)](backend)

CoopSetu AI connects cooperative-sector training with verified skills and employment outcomes. Trainees move from nomination and learning through attendance, assessment, certification, Skill Passport updates, job matching, applications, and employer feedback. Institutions, trainers, employers, and national administrators operate through role-specific workspaces backed by one API and data model.

Developed for **Smart India Hackathon 2026 — Problem Statement 26087**, associated with the Ministry of Cooperation and the National Council for Cooperative Training (NCCT).

## Contents

- [Capabilities](#capabilities)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Repository structure](#repository-structure)
- [Security model](#security-model)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Database and seed data](#database-and-seed-data)
- [Testing](#testing)
- [API map](#api-map)
- [Offline support](#offline-support)
- [AI and integrations](#ai-and-integrations)
- [Deployment](#deployment)
- [Known limitations](#known-limitations)

## Capabilities

### Trainee

- Programme discovery, nomination, admission, and enrollment.
- Self-paced and cohort learning with progress tracking.
- QR attendance, NFC groundwork, and consent-based face attendance.
- Assessments, verified competency evidence, and certificates.
- Dynamic Skill Passport with confidence and evidence history.
- Role-based skill-gap analysis and learning recommendations.
- Explainable job matching, applications, and career planning.
- Offline course caches and deferred synchronization.

### Trainer and institution

- Batch, trainee, timetable, content, assignment, and assessment management.
- Attendance sessions, manual grading, and skill evaluations.
- Programme-to-course curriculum links.
- Nomination review, hostel, logistics, and institutional analytics.
- Announcements and direct messages.

### Employer

- Structured jobs with skill, proficiency, education, certificate, and experience requirements.
- Deterministic, explainable candidate scoring.
- Application, interview, offer, talent-pool, and team workflows.
- AI-assisted interviews with a constrained deterministic fallback.
- Post-hire feedback feeding national skill-demand intelligence.

### NCCT and platform administration

- Cross-institution training, certification, placement, and demand analytics.
- Institution, employer, user, programme, job, and platform management.
- Audit logs, reports, settings, and skill-demand monitoring.

## Architecture

```mermaid
flowchart LR
    subgraph Clients
        WEB[Next.js Web / PWA]
        MOBILE[Expo Mobile]
        KIOSK[Attendance Kiosk]
    end

    subgraph Platform
        API[FastAPI REST API]
        AUTH[Clerk JWT / local demo gate]
        DOMAIN[Training, Skills, Jobs, Operations]
        AI[Deterministic engines + Gemini]
        SYNC[Offline sync and notifications]
    end

    subgraph Data
        PG[(PostgreSQL)]
        VECTOR[(pgvector)]
        CACHE[IndexedDB / SQLite]
    end

    WEB --> API
    MOBILE --> API
    KIOSK --> API
    WEB <--> CACHE
    MOBILE <--> CACHE
    API --> AUTH
    API --> DOMAIN
    API --> AI
    API --> SYNC
    DOMAIN --> PG
    DOMAIN --> VECTOR
```

### Closed-loop lifecycle

```mermaid
flowchart LR
    A[Register] --> B[Nominate]
    B --> C[Learn]
    C --> D[Attendance]
    D --> E[Assessment]
    E --> F[Certificate]
    F --> G[Skill Passport]
    G --> H[Gap Analysis]
    H --> I[Job Match]
    I --> J[Application]
    J --> K[Employer Feedback]
    K --> L[Skill Demand]
    L --> C
```

## Technology stack

| Layer | Technology | Purpose |
|---|---|---|
| Web | Next.js 16.3, React 19, TypeScript 5 | App Router application and role workspaces |
| UI | Tailwind CSS 4, Base UI, shadcn, Lucide, Recharts | Responsive components, themes, and charts |
| Web offline | Service Worker, IndexedDB | PWA shell, learning cache, and deferred actions |
| Mobile | Expo 57, React Native 0.86, TypeScript 6 | Android, iOS, and mobile web |
| Mobile data | TanStack Query, Expo SQLite, Secure Store | Server state, cache, outbox, and sessions |
| Device APIs | Camera, NFC, notifications, video, audio | Attendance, media, and alerts |
| API | FastAPI 0.115, Pydantic 2, Uvicorn | Async REST API and validation |
| Persistence | SQLAlchemy 2, Asyncpg, Psycopg 3 | Runtime access and migrations |
| Database | PostgreSQL, pgvector, Alembic | Relational data, vector fields, schema history |
| Authentication | Clerk JWT, gated local demo identities | User identity and role access |
| AI | Deterministic engines, Google Gemini | Scoring, career chat, and interviews |
| Integrity | HMAC-SHA256 | Tamper-evident certificate digests |
| Quality | Pytest, E2E scripts, ESLint, TypeScript | Unit, integration, contract, and build checks |

## Repository structure

```text
Cooperative-EcoSystem/
├── apps/
│   ├── web/                  # Next.js application and PWA
│   │   ├── public/           # Manifest, service worker, brand assets
│   │   └── src/
│   │       ├── app/          # Public and role-based routes
│   │       ├── components/   # Shared UI and domain components
│   │       └── lib/          # API, navigation, and offline engine
│   └── mobile/               # Expo / React Native application
│       ├── src/
│       │   ├── api/          # API and query clients
│       │   ├── features/     # Domain screens
│       │   ├── i18n/         # en, hi, mr, gu, ta resources
│       │   └── services/     # Auth, offline, NFC, API
│       ├── app.json          # Expo configuration
│       └── eas.json          # APK and AAB profiles
├── backend/
│   ├── app/
│   │   ├── api/v1/           # Versioned REST routers
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # AI, matching, integrity, notifications
│   │   └── seeds/            # Domain seed registry
│   ├── migrations/           # Alembic migrations
│   ├── tests/                # Backend test suite
│   └── Dockerfile
├── docs/                     # Architecture and engineering docs
├── scripts/                  # E2E, hosted, scratch, hardware checks
├── docker-compose.yml
└── README.md
```

## Key engineering decisions

### Evidence-backed Skill Passport

Assessments, course completion, attendance eligibility, trainer evidence, and certificates contribute to verified skills. Each entry stores proficiency, confidence, verification state, and an evidence trail. New evidence can strengthen a skill; aggregation does not silently lower existing confidence.

### Deterministic skill and job scoring

Core eligibility and matching decisions do not require an LLM. Target roles define weighted skills and levels. Employer matching can include required skills, proficiency, education, certificates, and experience. Unspecified job criteria are removed and remaining weights are normalized.

### Tamper-evident certificates

Certificates use public verification codes like `CST-<YEAR>-<RANDOM>`. Canonical certificate fields are signed with HMAC-SHA256 using `CERTIFICATE_SIGNING_SECRET`. Verification recomputes the digest and compares it in constant time.

### Progressive integrations

Optional services degrade safely when not configured. `GET /api/v1/system/integrations` reports configuration and implementation separately, without exposing credentials.

## Security model

- Pydantic schemas validate API inputs.
- Protected endpoints derive identity from verified bearer claims.
- Roles: `trainee`, `trainer`, `institution`, `employer`, `admin`, and `ncct_admin`.
- Organization-scoped access fails closed when a non-global user lacks an organization.
- Development anonymous actors are controlled by `ALLOW_ANONYMOUS_ACTOR`.
- Demo identities require development mode, an explicit flag, and a loopback-only database.
- CORS uses an explicit allowlist.
- Server-side secrets never belong in `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` values.
- Certificate issuance requires a server-only signing secret.

> Never enable demo authentication or anonymous actors against a production or remote database.

## Local development

### Prerequisites

- Node.js 20+ and npm 10+
- Python 3.12 recommended
- PostgreSQL 15+ with the `vector` extension
- Docker for the isolated test database
- Expo Go or native Android/iOS tooling for mobile

### 1. Clone and configure

```bash
git clone <repository-url> Cooperative-EcoSystem
cd Cooperative-EcoSystem

cp backend/.env.example backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Create `apps/web/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MOCK_API=false
```

### 2. Prepare PostgreSQL

```sql
CREATE DATABASE coopsetu;
\c coopsetu
CREATE EXTENSION IF NOT EXISTS vector;
```

Example local value:

```dotenv
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/coopsetu
```

### 3. Run the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt

alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Health: <http://localhost:8000/health>
- Swagger: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- Integration state: <http://localhost:8000/api/v1/system/integrations>

### 4. Run the web application

```bash
cd apps/web
npm ci
npm run dev
```

Open <http://localhost:3000>. Setting `NEXT_PUBLIC_MOCK_API=false` routes supported calls to FastAPI. Some screens still contain local presentation data; see [Known limitations](#known-limitations).

### 5. Run the mobile application

```bash
cd apps/mobile
npm ci
npm run typecheck
npm start
```

For a physical device, use a network-reachable backend:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_me
```

The client appends `/api/v1`. On a physical device, `localhost` points to the device. NFC and some native APIs require a development build rather than Expo Go.

## Configuration

### Backend

| Variable | Required | Description |
|---|---:|---|
| `DATABASE_URL` | Yes | PostgreSQL URL used by API and Alembic |
| `DATABASE_URL_PROD` | No | Optional production database reference |
| `CLERK_SECRET_KEY` | For Clerk | Server-side Clerk key |
| `CLERK_PUBLISHABLE_KEY` | No | Clerk public key |
| `CLERK_JWT_ISSUER` | For Clerk | Expected JWT issuer |
| `APP_ENV` | Yes | Environment name |
| `LOG_LEVEL` | No | Logging level |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |
| `ALLOW_ANONYMOUS_ACTOR` | Production | Must be `false` outside isolated development |
| `DEMO_LOGIN_ENABLED` | No | Enables gated local demo identities |
| `INTERNAL_API_SECRET` | Internal routes | Shared development/internal secret |
| `CERTIFICATE_SIGNING_SECRET` | Certificates | High-entropy HMAC key |
| `GEMINI_API_KEY` | No | Gemini career and interview responses |
| `YOUTUBE_API_KEY` | No | YouTube configuration |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | No | Adzuna configuration |
| `JOOBLE_API_KEY` | No | Jooble configuration |
| `BHASHINI_USER_ID`, `BHASHINI_API_KEY` | No | Bhashini configuration |
| `FACE_MODEL_PACK` | No | Directory with YuNet/SFace ONNX files |
| `FACE_MATCH_THRESHOLD` | No | Face similarity threshold |
| `FACE_MIN_DET_SCORE` | No | Detection confidence threshold |
| `MEDIA_BASE_URL` | No | Public media origin |
| `FCM_SERVICE_ACCOUNT_FILE` | No | Firebase service-account path |
| `CRON_SECRET` | Scheduled routes | Scheduler authentication secret |

Generate local secrets with:

```bash
python -c 'import secrets; print(secrets.token_urlsafe(48))'
```

### Web

| Variable | Required | Description |
|---|---:|---|
| `NEXT_PUBLIC_API_URL` | Yes | FastAPI origin without `/api/v1` |
| `NEXT_PUBLIC_MOCK_API` | No | Use `false` for wired backend requests |

The current web package does not include `@clerk/nextjs`; do not assume web Clerk integration is complete because older environment templates mention Clerk.

### Mobile

| Variable | Required | Description |
|---|---:|---|
| `EXPO_PUBLIC_API_BASE_URL` | Native | Backend origin |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | For Clerk | Client-safe Clerk key |

Never put private keys in public client variables.

## Database and seed data

From `backend/`:

```bash
alembic current
alembic upgrade head
python -m app.seed
```

The main seed is deterministic and idempotent. It creates India-themed institutions, users, programmes, courses, assessments, skills, jobs, applications, attendance, operations, and analytics records.

Mobile-specific demo data:

```bash
# Local rows only; no Clerk network calls
python -m app.seed_mobile --skip-clerk

# Read-only counts
python -m app.seed_mobile --counts
```

Running `python -m app.seed_mobile` without `--skip-clerk` may provision allowlisted Clerk demo users. Use it only with a disposable development tenant.

Create migrations only after intentional model changes:

```bash
alembic revision --autogenerate -m "describe_change"
```

Review generated migrations before applying them.

## Testing

### Backend

Tests refuse remote databases. They expect a container named `coopsetu-scratch-pg` on `127.0.0.1:55432`.

```bash
docker run --name coopsetu-scratch-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=coopsetu_scratch \
  -p 127.0.0.1:55432:5432 \
  -d pgvector/pgvector:pg16

python scripts/scratch_backend.py alembic upgrade head
python scripts/scratch_backend.py pytest -q
```

The wrapper reads the named container, builds its URL in memory, and forces safe development settings without printing credentials.

### Web

```bash
cd apps/web
npm run lint
npx tsc --noEmit
npm run build
```

### Mobile

```bash
cd apps/mobile
npm run typecheck
npm run lint
node scripts/nfc.test.mjs
npx expo-doctor
```

### Closed-loop E2E verification

With the backend running:

```bash
API_URL=http://127.0.0.1:8000 \
INTERNAL_API_SECRET=your-development-secret \
python scripts/verify_e2e_loop.py
```

This exercises 25 steps from registration and nomination through certification, Skill Passport, matching, applications, employer feedback, and demand aggregation.

Additional scripts:

- `scripts/test_hosted_deployment.py` checks a hosted deployment.
- `scripts/physical_hardware_mobile_test.py` covers device-adjacent workflows.

## API map

All routes are under `/api/v1`.

| Prefix | Domain |
|---|---|
| `/auth` | Identity sync, provisioning, and gated demo login |
| `/users`, `/organisations` | People and organizations |
| `/programmes` | Nominations, batches, enrollment |
| `/courses`, `/learning`, `/content/diksha` | Learning and content |
| `/assessments` | Questions, attempts, grading |
| `/attendance`, `/face` | Attendance and consent-based face flows |
| `/certificates` | Issuance and public verification |
| `/skills`, `/career` | Passport, gap analysis, career AI |
| `/jobs`, `/employer` | Jobs, candidates, interviews, offers |
| `/analytics`, `/admin` | Reporting and administration |
| `/timetable`, `/hostel`, `/logistics` | Institution operations |
| `/offline-sync`, `/sync` | Deferred-action synchronization |
| `/mobile`, `/notifications` | Mobile data and notifications |
| `/system` | Secret-free integration capabilities |

The generated contract at `/openapi.json` is the canonical machine-readable API reference.

## Offline support

### Web

- PWA manifest and service worker.
- IndexedDB course and lesson cache.
- Deferred lesson, attendance, and assessment actions.
- Retry and synchronization state.

### Mobile

- Expo SQLite in WAL mode.
- Mutation outbox and cached course/user data.
- Network-aware requests and sync screens.
- Secure session storage.

Offline support is feature-scoped. Authoritative grading, fresh authorization, and some conflict resolution remain online-only.

## AI and integrations

Core skill aggregation, gap analysis, job scoring, and certificate integrity are deterministic and reproducible.

When `GEMINI_API_KEY` is configured, Gemini supplies career-advisor and interview text. Prompts are grounded in platform facts and interview outputs are validated. Provider failure returns a constrained fallback instead of blocking the workflow.

`GET /api/v1/system/integrations` distinguishes:

- whether required configuration exists;
- whether an adapter is implemented;
- whether the feature is available.

Currently, Gemini is the adapter explicitly reported as implemented. Other provider keys are configuration surfaces and must not be described as live until their adapters and functional checks are complete.

## Deployment

### Backend container

```bash
docker build -t coopsetu-api ./backend
docker run --rm -p 8000:8000 --env-file backend/.env coopsetu-api
```

Run `alembic upgrade head` as a controlled release step before routing traffic to a new API version.

### Web

```bash
cd apps/web
npm ci
npm run build
npm start
```

### Mobile

```bash
cd apps/mobile
npx eas build --profile preview --platform android
npx eas build --profile production --platform android
```

### Docker Compose status

The root Compose file defines backend and web services, but `apps/web/Dockerfile` is currently absent. The backend image works independently. Add and validate a production web Dockerfile before using Compose as a complete deployment path.

### Production checklist

- Managed PostgreSQL with pgvector.
- `ALLOW_ANONYMOUS_ACTOR=false` and `DEMO_LOGIN_ENABLED=false`.
- Explicit HTTPS CORS origins.
- Strong internal, cron, and certificate secrets in a secret manager.
- TLS for database and public traffic.
- One controlled migration job per release.
- Health probes against `/health`.
- Tested database backups and restoration.
- Physical-device validation for QR, NFC, notifications, and face workflows.

## Known limitations

- Parts of the web API layer use demo-role cookies and placeholder bearer tokens. Complete Clerk session-token integration before production use.
- Web admin GET requests use mock responses unless `NEXT_PUBLIC_MOCK_API=false`; some presentation-heavy pages still contain local data.
- The root Compose configuration references a missing web Dockerfile.
- Face processing needs separately supplied YuNet/SFace models. The deterministic fallback supports tests, not production biometrics.
- NFC needs a native development build and physical hardware for meaningful validation.
- Remote push is currently reported unavailable by the integration capability endpoint.
- Several content, jobs, translation, and notification credentials are modeled before their adapters are complete.
- AI output is advisory. Human review and deterministic evidence should remain authoritative for admission, grading, hiring, and certification.

## Documentation

| Document | Contents |
|---|---|
| [Architecture](docs/architecture.md) | Boundaries, data flows, services |
| [Database](docs/database.md) | Schema and relationships |
| [API](docs/api.md) | REST usage and examples |
| [Roles](docs/roles.md) | Permissions and role model |
| [AI](docs/ai.md) | Skill-gap and matching design |
| [Mobile API](docs/mobile-api.md) | Mobile-facing contract |
| [Mobile backend](docs/MOBILE_BACKEND.md) | Backend implementation notes |
| [Mobile completion plan](docs/MOBILE_COMPLETION_PLAN.md) | Work packages and validation |

## Contributing

1. Keep changes focused and preserve existing style.
2. Add migrations for schema changes; never edit an applied migration.
3. Validate untrusted input at the API boundary.
4. Enforce role and organization scope on protected queries and mutations.
5. Add regression tests for security controls, state transitions, and integrity.
6. Run scratch-database tests and client lint, type, and build checks.
7. Update the relevant documentation when behavior changes.

## License

No license file is currently present. Unless the maintainers add one, default copyright restrictions apply.

---

Built to demonstrate how cooperative training, verified skills, and employment feedback can operate as one measurable ecosystem.
