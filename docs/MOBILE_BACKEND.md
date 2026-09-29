# Mobile backend contract (apps/mobile <-> backend)

The backend is the single source of the data the mobile app used to hardcode in
`apps/mobile/src/services/mockData.ts`. All paths are under `/api/v1`. Response
shapes match `apps/mobile/src/types/index.ts` (extra fields are additive).

## Identity

Send the Clerk session JWT as `Authorization: Bearer <jwt>`. The verified token
is the trainee identity; `trainee_id` / `applicant_id` query params are still
accepted for compatibility but the **token wins when both are present**.
Anonymous calls to read endpoints get the generic catalog (no personal data).

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/demo-login` | body `{"role":"trainee"\|"trainer"}` -> `{ticket, expires_in, user}` (see Demo login) |
| GET | `/auth/demo-accounts` | `{enabled, accounts:[{role,email,name}]}` for the login screen; `enabled:false` hides the button |
| GET | `/auth/me` | local user + trainee profile (below) |
| POST | `/auth/provision` | token required; creates the local row from the caller's Clerk profile (role from Clerk `public_metadata.role`, default trainee). Call once after a normal sign-up when `/auth/me` returns `synced:false`. Idempotent |

`GET /auth/me`
```json
{"id":"<local user uuid>","clerk_user_id":"user_...","email":"demo.trainee@coopsetu.example.com",
 "full_name":"Ravindra Suresh Patil","role":"trainee","synced":true,
 "organisation":{"id":"...","name":"Vaikunth Mehta National Institute of Cooperative Management","type":"institution"},
 "trainee":{"id":"<same uuid>","name":"Ravindra Suresh Patil","email":"...","role":"Trainee",
            "enrolled_institution":"Vaikunth Mehta National Institute of Cooperative Management",
            "programme":"National Cooperative Management & Leadership Diploma","avatar_initials":"RP"}}
```
`trainee` is `null` for non-trainee roles. If the user is not synced yet:
`{"clerk_user_id":"user_...","role":"trainee","synced":false,"message":"..."}` -> call `/auth/provision`.

## Endpoints the mobile app uses

| Screen | Method + path | Response |
|---|---|---|
| Courses / Player | `GET /mobile/courses` | `{courses: Course[], total}` |
| | `GET /mobile/courses/{course_id}` | one `Course` |
| | `POST /courses/{course_id}/enroll` | `{status:"enrolled", course_id, enrollment_id}` (idempotent) |
| | `POST /mobile/courses/{course_id}/modules/{module_id}/progress` body `{"completed":true}` | `{course_id, module_id, completed, course_progress}` (progress 0-100 recomputed and stored on the enrollment) |
| Jobs | `GET /mobile/jobs` | `{jobs: JobMatch[], total}` best match first; `match_percentage` present for an identified trainee |
| | `POST /jobs/{job_id}/apply` | `{id, status:"applied", message}`; repeated apply returns the same id with `"Already applied to this job"` |
| | `GET /jobs/my-applications` | `{applications:[{id,job_title,employer,applied_at,status}]}` |
| Skill Passport | `GET /skills/my-passport` | `SkillPassportData` (`summary.avg_confidence` 1 decimal) |
| Certificates | `GET /certificates/my` | `{certificates: CertificateItem[]}`; public check: `GET /certificates/verify/{code}` |
| Attendance | `GET /attendance/my` | `{records: AttendanceRecordItem[], overall_percentage, total_sessions, present}` newest first |
| | `POST /attendance/scan` body `{"qr_token":"coopsetu:attend:<token>"}` (prefix optional; `trainee_id` optional when a token is sent) | `{status:"recorded", session, trainee_id, marked_at}`; 404 bad token, 409 duplicate |
| Offline | `GET /mobile/offline/packages` | `{packages:[{course_id,title,version,size_kb,lesson_count,downloaded,downloaded_at,course}], total}`; `course` is a full `Course` incl. modules to store locally |
| | `POST /mobile/offline/packages/{course_id}/download` | one package, `downloaded:true` (idempotent) |
| | `DELETE /mobile/offline/packages/{course_id}` | `{course_id, removed}` |
| | `POST /offline-sync/batch` body `{items:[{id,action,payload,client_timestamp}]}` | per-item `success`/`duplicate`/`error`. `MARK_LESSON_COMPLETE` with a real module uuid as `lesson_id` is persisted for the token user; `RECORD_ATTENDANCE` uses the token user (payload `qr_token`, prefix optional) |
| Career | `GET /career/recommendations` | `{target_role,current_match,recommendations:CareerRecommendation[],career_path:CareerPlanStep[]}` from the DB; anonymous -> generic default |
| | `POST /career/chat` body `{"message":"..."}` | `{response, source:"gemini"\|"deterministic_fallback", sources, suggested_actions:[{label,href,actionKey}], message}`; `message` is a `CareerChatMessage` (only when identified, and the exchange is stored) |
| | `GET /career/chat/history?limit=50` | `{messages: CareerChatMessage[]}` oldest first (401 if anonymous) |

`actionKey` values: `view_skill_gap`, `browse_courses`, `see_job_matches`.

Examples

```json
// GET /mobile/courses  (courses[0], modules trimmed)
{"id":"f31a971a-...","title":"Cooperative Management Fundamentals","category":"Management","level":"Foundation",
 "duration_hours":40,"instructor":"Dr. Ramesh Kulkarni","rating":4.8,"enrolled":1240,
 "skills":["Cooperative Management","Cooperative Governance"],"progress":75,"enrolled_by_me":true,
 "modules":[{"id":"58ebca08-...","title":"1. Introduction to Cooperative Principles & Values","duration":"18 min",
             "completed":true,"summary":"Seven Rochdale principles and legal framework under MSCS Act."}]}
// (modules also carry "video_url" when set; courses without modules return "modules":[])

// GET /mobile/jobs  (jobs[0])
{"id":"1867...","title":"Dairy Procurement Supervisor","employer":"Amul Dairy Cooperative Union","location":"Anand, Gujarat",
 "sector":"Dairy","type":"Full-time","salary":"₹4,50,000 - ₹6,00,000",
 "skills_required":["Dairy Operations","Communication","Leadership"],"applied":true,
 "openings":5,"posted_days_ago":3,"match_percentage":92}

// GET /skills/my-passport
{"skills":[{"name":"Cooperative Management","level":"Proficient","confidence":92,"verified":true,"category":"Management",
            "evidence":[{"type":"Course","title":"Cooperative Management Fundamentals","date":"2026-08-15"}]}],
 "summary":{"total_skills":5,"verified_count":3,"avg_confidence":72.0}}

// GET /certificates/my
{"certificates":[{"id":"CST-2026-DAI-00842","holder_name":"Ravindra Suresh Patil","programme_title":"Dairy Cooperative Operations",
  "issuer":"Institute of Rural Management, Anand (IRMA)","issue_date":"2026-07-15","expiry_date":"2029-07-15","status":"Valid",
  "grade":"A","skills_certified":["Dairy Operations","Cooperative Management","Quality Assurance"],
  "verification_url":"/verify-certificate/CST-2026-DAI-00842"}]}

// GET /attendance/my
{"records":[{"date":"2026-09-25","session":"Cooperative Management Fundamentals - Batch B","status":"present",
             "method":"QR Code Scan","timestamp":"09:42 AM"}],"overall_percentage":100.0,"total_sessions":4,"present":4}

// GET /career/recommendations
{"target_role":"Cooperative Development Officer","current_match":72,
 "recommendations":[{"priority":1,"type":"course","title":"Data Analytics for Cooperatives","reason":"...","duration":"6 weeks","impact":"+15% match"}],
 "career_path":[{"step":1,"title":"Current: Diploma Trainee","status":"current","timeline":"Enrolled"}]}

// POST /career/chat -> message
{"id":"...","sender":"ai","text":"...","timestamp":"2026-09-28T14:30:19+00:00",
 "suggested_actions":[{"label":"View Skill Gap","actionKey":"view_skill_gap"}]}
```

Notes for the client
- Ids are UUID strings (the old `crs-*`/`job-*` mock ids no longer exist). Match jobs to applications by `id`.
- `attendance.method` is a display string (`QR Code Scan`, `Biometric / QR`, `Manual Entry`); `timestamp` is local (IST) `HH:MM AM`.
- `progress` on a course is the enrollment progress; marking a module recomputes it as done/total modules.
- `match_percentage`: the latest stored explainable match for that trainee+job (`POST /jobs/{id}/match` refreshes it), otherwise the skill-passport overlap.
- Errors are FastAPI `{"detail": ...}`; 401 = missing/invalid token where identity is required.

## Demo accounts (emails only)

| Role | Email |
|---|---|
| trainee (primary: Ravindra Suresh Patil, VAMNICOM Pune) | `demo.trainee@coopsetu.example.com` |
| trainer (Dr. Meera Deshmukh, VAMNICOM) | `demo.trainer@coopsetu.example.com` |

`example.com` is an IANA-reserved domain: mail can never reach a third party. (Clerk rejected the `.demo` TLD.)
Accounts have no password; the only way in is a server-minted sign-in ticket.

## Demo login flow

1. App calls `POST /api/v1/auth/demo-login {"role":"trainee"}` -> `{"ticket":"...","expires_in":300,"user":{...}}`.
2. App exchanges it with Clerk: `signIn.create({ strategy: 'ticket', ticket })` then `setActive({ session: signIn.createdSessionId })` (`@clerk/clerk-expo` `useSignIn`). This is a genuine Clerk session.
3. App calls `getToken()` and uses it as the Bearer token; `GET /auth/me` returns the local trainee identity.

Verified end to end against the dev Clerk instance (ticket -> Frontend API sign-in `complete` -> session JWT -> `/auth/me` 200).

### Security trade-off

Demo login lets anyone who can reach the endpoint sign in as a demo user without credentials, by design (judges). Guard rails:
- Off unless `DEMO_LOGIN_ENABLED=true` (code default false; disabled -> 404). Enabled in the dev `backend/.env` only.
- Only the fixed allowlist in `app/demo_users.py` (trainee, trainer). Any other role (admin, institution, employer, ncct_admin, unknown) -> 403 and Clerk is never called. No user-id input exists.
- The issued ticket is single-use with a 300 s expiry (`DEMO_TICKET_TTL_SECONDS`).
- In-memory per-IP limit, `DEMO_LOGIN_RATE_LIMIT_PER_MINUTE` (default 10) -> 429. Per process, resets on restart, keyed on the socket peer address (behind a proxy every client shares one key; use a gateway limiter there).
- One audit log line per ticket (`demo_login` logger: role, last 6 chars of the Clerk id, IP, TTL); tickets and secrets are never logged.
- Residual risk: a demo session can read/write that demo user's own data (progress, applications, chat) and anything the trainee/trainer role may do. The demo users belong to the shared dev database, so **do not enable this flag on a deployment that holds real users**; set `DEMO_LOGIN_ENABLED=false` (or remove it) and delete the two Clerk demo users after the event.

## Environment variables (names only)

`DATABASE_URL`, `DATABASE_URL_PROD` (never written to by these tools), `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`,
`CLERK_JWT_ISSUER`, `GEMINI_API_KEY` (optional; deterministic fallback otherwise), `OPENROUTER_API_KEY`, `ALLOWED_ORIGINS`,
`APP_ENV`, `LOG_LEVEL`, `DEMO_LOGIN_ENABLED`, `DEMO_LOGIN_RATE_LIMIT_PER_MINUTE`, `DEMO_TICKET_TTL_SECONDS`.
Mobile: `EXPO_PUBLIC_API_BASE_URL`, and the Clerk publishable key for Expo.

## Setup / reseed

```bash
cd backend
alembic upgrade head                    # additive migration b3c1f2a9e7d4 (revises a95b84ecdefe)
python -m app.seed_mobile               # Clerk demo users + local rows + mobile data
python -m app.seed_mobile --skip-clerk  # local DB only (no network)
python -m app.seed_mobile --counts      # row counts, changes nothing
python -m app.seed_mobile --schema-snapshot .schema-before.txt   # alembic version + table names, no data
```

`app.seed_mobile` is insert-if-missing and idempotent (a re-run inserts 0 rows). It never deletes, and does not run the full web seed (`python -m app.seed`). Existing courses/jobs/programmes are reused by natural key; a course that has no modules gets the mobile lessons; new nullable `jobs.openings/posted_at` are filled only where NULL. Only the two demo users' own rows are refreshed.

Rollback of the migration: `alembic downgrade a95b84ecdefe` (drops only the objects that revision added).

## What was added (backend)

- Migration `b3c1f2a9e7d4`: new columns `modules.{position,duration_minutes,summary,video_url}`, `jobs.{openings,posted_at}`; new tables `module_progress`, `career_plans`, `career_plan_steps`, `career_recommendations`, `career_chat_messages`, `offline_packages`, `offline_downloads`.
- `app/api/v1/mobile.py`, `app/services/mobile.py`, `app/models/mobile.py`, `app/seed_mobile.py`, `app/demo_users.py`, `app/services/ratelimit.py`; Clerk Backend API helpers in `app/services/clerk.py`.
- Token identity now preferred in `/skills/my-passport`, `/certificates/my`, `/career/*`, `/offline-sync/batch`, `/attendance/scan`; `attendance/my` percentage is now per trainee (attended / sessions of the programmes they attend) instead of / all sessions in the DB.
- Tests: `backend/tests/test_mobile_backend.py` (29 tests).
