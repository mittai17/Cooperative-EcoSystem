# Mobile completion plan: 11 features, role-aware, real backend

Everything below comes from reading the repo: HANDOFF.md, memory.md, docs, all `backend/app/api/v1/*.py`, the models, `seed.py` (structure only), the web route tree and `apps/mobile/src`. I did not print or open any .env values.

## 0. Defects found that shape the plan

Several of these are security or integrity problems, not just missing features.

| # | Defect | Where | Consequence |
|---|---|---|---|
| 1 | Assessments have no questions. `POST /assessments/{id}/submit?score=` trusts a client-supplied score, then upserts a verified skill. | `assessments.py`, `models/assessment.py` | Anyone can self-award any score, so certification is not credible. |
| 2 | `Lesson` and `Module` hold only a title. There is no content, media, progress table, or order. | `models/course.py` | Interactive modules, multilingual content and real offline download have nothing to serve. |
| 3 | `/offline-sync/batch` has no auth and no idempotency table. Only RECORD_ATTENDANCE persists. MARK_LESSON_COMPLETE only logs, and SUBMIT_ASSESSMENT trusts the score and does not persist. | `offline_sync.py` | The offline sync is effectively simulated on the server too. |
| 4 | Attendance scan never enforces `valid_minutes`. The QR token is static per session. There is no unique constraint on (session, trainee). `/attendance/my` divides by all sessions in the system. | `attendance.py` | Replayable QR, and wrong percentages. |
| 5 | `PATCH /users/{id}` sets `role` with no auth. `POST /auth/sync` accepts `role` from the body. `GET /users/` leaks emails. Programme create, nomination PATCH, hostel, logistics, timetable and analytics endpoints are all unauthenticated. | `users.py`, `auth.py`, others | Privilege escalation. This matters more once demo login exists. |
| 6 | `resolve_actor_id` falls back to a client-supplied id when there is no token. | `deps.py` | Fine for scripts, but in production it lets any caller act as any trainee. |
| 7 | `/career/recommendations` is a static demo. `/career/chat` takes its context from the client. `/skills/my-passport` ignores identity. | `career.py`, `skills.py` | Not per-user. |
| 8 | `analytics/institution/{org}` returns hard-coded numbers. `/overview` has a fake national-scale fallback. | `analytics.py` | Fabricated analytics. |
| 9 | Certificates have a random code only. There is no signature, no revocation, and a hard-coded `DEMO_CERTS` branch that returns valid. | `certificates.py` | The "tamper-evident" claim is not backed. |
| 10 | Timetable, hostel and logistics have institution-wide views only. `TimetableSlot` uses weekly strings (`day_of_week`, `time_slot`). Nothing is trainee-scoped. | `timetable.py`, `hostel.py`, `logistics.py` | No "my schedule", "my room" or "my transport". |
| 11 | `Job` has no employer FK. `Application` has no status transitions. Nothing is employer-scoped. | `models/job.py`, `jobs.py` | An employer app cannot be built. |
| 12 | Nomination approval does not create an `Enrollment`. `GET /nominations/list` returns no names and is capped at 50. | `programmes.py` | Approval does not link a trainee to a batch, so there is no timetable for them. |
| 13 | Mobile: `fetchWithFallback` silently returns `mockData` on any failure. State is memory-only (`localStore`). OfflineLearning is simulated. `DEMO_TRAINEE_ID` is hard-coded. There is no i18n. The LAN IP is hard-coded in `app.json`. | `apps/mobile/src` | The app pretends to be live. This layer must be replaced, not extended. |
| 14 | Many web pages (employer/*, trainer/*, institution/*, admin/*, the assessments page) still use `lib/mock-data`. The kiosk face engine is mock and says "not bundled". | web | Do not claim web parity. Mobile work will be ahead of web. |
| 15 | `apps/mobile/AGENTS.md` says use Expo Router, but the app uses React Navigation. | mobile | Recommend staying on React Navigation. Migrating is churn with no feature value. |

## A. Feature coverage matrix

| # | Feature | Backend today | Web today | Mobile today | Gap to close on mobile |
|---|---|---|---|---|---|
| 1 | Programme registration and nominations | `programmes` list/detail (detail has no description, org or dates); `POST /nominations` (trainee or admin); `PATCH /nominations/{id}` (unauthenticated, reserves a seat); programme-course link; `Batch`, `Enrollment` models | `/programmes`, `/institution/programmes\|nominations\|batches`, `nominations-panel` | None | Catalog, detail, register, my nominations, withdraw, institution inbox with approve/reject and batch assignment, notifications. Backend: batch on nomination, enrollment on approval, org-scoped review, `my`, decision note. |
| 2 | Profiles (participant, institution, trainee) | `User` has name/email/role/org only; `Organisation` has name/type/state | `(trainee)/profile` (local-only form), `institution/trainees`, `trainer/trainees`, `admin/institutions` | Read-only Profile screen (mock) | Backend `user_profiles`, richer `Organisation`, `/users/me` get and patch, photo upload, completeness. Mobile: edit, org profile, trainee detail for trainer, institution and employer. |
| 3 | Interactive multilingual e-learning | Course catalog, enroll, my/enrolled; **no lesson content, no progress, no translations** | `/courses/[id]` (mock curriculum), `trainer/content`, decorative language selector | Catalog and player over mock modules with a "mark done" button | Lesson types, content JSON, progress, translations table, i18n of UI, language switch in the player. |
| 4 | Attendance: face and QR (NFC in progress) | `generate-qr`, `scan`, `my`; `AttendanceRecord.method`; sync path for offline QR; pgvector installed | `(trainee)/attendance`, `trainer/attendance`, `institution/attendance`, `kiosk/*` (mock face engine) | QR camera scan, NFC hook (agent b), no face | Harden QR (expiry, rotation, unique). Unified mark endpoint. Face enrol/verify/identify. Trainer session console. Fix percentages. |
| 5 | Timetable, hostel, logistics | Models, migration and endpoints exist and web is wired. All institution-wide, unauthenticated. `hostel/allocate`, `check-out`, `maintenance`, `logistics/tasks` exist | `/institution/timetable\|hostel\|logistics` | None | Trainee: my timetable, my room and request, my transport and joining info. Trainer: my classes. Institution: view, waitlist allocate, task toggle, cancel/reschedule (exceptions). Notifications. |
| 6 | LMS integration, assessments, certification | `Assessment` metadata, result, submit (client score), `POST /certificates/issue` | `(trainee)/assessments` (mock), `institution\|trainer/assessments`, `institution/certificates` | None (the Certificates screen exists) | Question bank, attempts with server timer and grading, results, eligibility-driven issuance from mobile. "LMS integration" is a decision (section E). |
| 7 | Skill certification repository and verification | Public `GET /certificates/verify/{code}`, my certificates, skill passport with evidence | `verify-certificate/[id]`, `(trainee)/certificates/[id]`, `skill-passport` | Certificates list and passport (mock-backed) | Signed certificates, revocation, verification log, QR on the certificate, public verify screen (scan or type), detail and share. Passport from identity. |
| 8 | Career counselling chatbot | Real Gemini chat with fallback; static recommendations | `(trainee)/career-ai`, `skill-gap` | Chat and plan screens | Server-derived context, `lang`, conversation persistence, computed recommendations, target-role setting, deep-link actions. |
| 9 | Employer and recruiter dashboard | `POST /jobs`, `/match`, `/apply`, `/feedback`, `my-applications`. No employer scoping, no application transitions | `/employer/*` (mostly mock) | Trainee-side Jobs only | Job ownership, applicant pipeline, talent search, candidate detail with verified skills and certs, placement feedback, overview KPIs. |
| 10 | Mobile-friendly and offline | `/offline-sync/*` (see defects) | `/my-learning` with IndexedDB and `lib/offline/*`, PWA manifest | Simulated | Real download (SQLite + file-system), persisted outbox, idempotent sync, conflict rules, connectivity UI. |
| 11 | Central database and analytics | Postgres/Neon with 23 tables; `skill-demand`, `employment-funnel`, `overview` (real counts); institution endpoint fake | `/admin/*`, `institution/analytics` | None | Real institution analytics, trends, league table, outreach view. Compact NCCT mobile view. |

## B. Mobile information architecture

### Decisions
- **One app, role-routed after sign-in.** The role comes from `/auth/me`, which agent (c) delivers. A role shell picks the tab set.
- **Roles supported:**
  - Trainee: full experience.
  - Trainer, institution admin, employer/recruiter: task-focused.
  - NCCT admin: a compact read-only view of 4 tabs and 4 screens. Feature 11 asks for monitoring, and leadership uses phones. It needs no forms, only aggregates.
  - Public (no login): Verify Certificate and nothing else.
- **Tab bars by role.** "Me" is the last tab for every role: profile, language, sync and storage, sign out.

| Role | Tabs |
|---|---|
| Trainee | **Home** (next class, attend, alerts, progress) / **Programme** (segments: Schedule, Programmes, Stay and Travel) / **Learn** (segments: Courses, Assessments, Downloads) / **Career** (segments: Jobs, Advisor, Plan) / **Me** (profile, credentials: Passport and Certificates, language, sync and storage, face consent) |
| Trainer | **Today** (schedule, start attendance) / **Attendance** (sessions and history) / **Trainees** (batches, roster, detail, face enrol) / **Me** |
| Institution admin | **Overview** (KPIs) / **Nominations** (inbox) / **Programmes** (programmes, batches, certification) / **Operations** (segments: Timetable changes, Hostel, Logistics) / **Me** |
| Employer/recruiter | **Overview** / **Jobs** / **Candidates** (applicants and talent search) / **Me** |
| NCCT admin | **National** / **Institutions** / **Demand** (segments: Skill demand, Outreach) / **Me** |

### Stack routes (params) added on top of the tabs

| Owner role | Route (params) |
|---|---|
| All | `Inbox`; `LanguageSettings`; `SyncStorage`; `ProfileEdit {section?}`; `VerifyCertificate {code?}` (also reachable from Login, unauthenticated) |
| Trainee | `ProgrammeDetail {programmeId}`; `NominationForm {programmeId}`; `MyNominations`; `NominationDetail {nominationId}`; `Attend {sessionId?, method?: 'qr'\|'nfc'\|'face'}`; `AttendanceHistory`; `FaceEnrol {mode:'self'\|'trainer', traineeId?}`; `HostelRequest`; `CourseDetail {courseId}`; `LessonPlayer {courseId, lessonId, lang?}`; `AssessmentIntro {assessmentId}`; `AssessmentAttempt {attemptId}`; `AssessmentResult {attemptId}`; `Certificates`; `CertificateDetail {code}`; `Passport`; `JobDetail {jobId}`; `MyApplications` |
| Trainer | `StartSession {slotId?}`; `SessionConsole {sessionId}` (QR, NFC status, face kiosk, live roster, override); `BatchRoster {batchId}`; `TraineeDetail {traineeId}` |
| Institution | `NominationReview {nominationId}`; `BatchDetail {batchId}`; `Certification {batchId}` (eligible list, issue); `ScheduleChange {slotId, date}`; `HostelWaitlist`; `LogisticsChecklist` |
| Employer | `JobEditor {jobId?}`; `JobApplicants {jobId}`; `CandidateDetail {traineeId, jobId?}`; `TalentSearch`; `PlacementFeedback {applicationId}` |
| Admin | `InstitutionAnalytics {orgId}` |

### Feature placement
- **Feature 1 (programmes and nominations):** trainee Programme tab; institution Nominations tab.
- **Feature 2 (profiles):** Me tab; trainer Trainees; employer CandidateDetail.
- **Feature 3 (e-learning):** trainee Learn tab.
- **Feature 4 (attendance):** trainee Attend route (QR, NFC and Face as one screen with a method switch); trainer SessionConsole.
- **Feature 5 (timetable, hostel, logistics):** trainee Programme tab; trainer Today; institution Operations.
- **Feature 6 (assessments and certification):** trainee Learn tab; institution Certification.
- **Feature 7 (certificates and verification):** Me (credentials); the public verify route.
- **Feature 8 (career chatbot):** trainee Career tab.
- **Feature 9 (employer dashboard):** employer tabs.
- **Feature 10 (offline):** cross-cutting. Downloads segment, SyncStorage, a slim connectivity bar.
- **Feature 11 (analytics):** admin tabs, plus the institution and employer Overview screens.

### Keep off mobile
- Programme, course and assessment authoring, question banks and translation editing (stay on web).
- Bulk trainee import.
- Logistics budget and cost.
- Certificate template design.
- User and role administration.
- Skill graph visualisation.
- The Entrepreneurship module (web-only, not in the problem statement).
- Deep report export.
- Any "settings" page whose only content is toggles that do nothing.

## C. Per-feature design

### Shared foundations (all features use these)
- **API client.** `src/api/client.ts` attaches the Clerk token, throws a typed `ApiError`, and has no mock fallback.
- **Reads.** TanStack Query with a persisted cache (stale-while-revalidate). This gives all parallel WPs one data-fetching convention and cache-first behaviour offline.
- **Types.** Generated with `openapi-typescript` from `/openapi.json` into a gitignored `src/api/schema.d.ts`. Each agent regenerates locally, so there are no merge conflicts and types cannot drift.
- **Local storage.** `expo-sqlite` for everything structured: KV, API cache, outbox, download index. `expo-file-system` for media files. **SDK 57's file-system API is new. Implementers must read the versioned docs, per `AGENTS.md`.**
- **Deep links.** Keep the `coopsetu://` scheme and add a `linking` config covering every route. This lets `adb shell am start -d coopsetu://...` open a specific screen for screenshots.
- **Dependency freeze.** Install every planned package once and rebuild the dev build once: `expo-sqlite`, `expo-secure-store`, `expo-localization`, `expo-crypto`, `expo-network`, `expo-image-picker`, `expo-image-manipulator`, `expo-video`, `expo-audio`, `expo-speech` (optional), `expo-sharing`, `expo-screen-capture`, `expo-notifications` (local reminders), `expo-calendar` (optional), `react-native-qrcode-svg`, `@tanstack/react-query`, `i18next`, `react-i18next`, `@clerk/clerk-expo`, plus dev deps `openapi-typescript` and `tsx`. Everything except the two JS-only packages is native, so the rebuild matters. Use `npx expo install` for SDK-compatible versions.
- **Notifications.** An in-app `notifications` table plus an Inbox screen (bell in the header). Remote push (FCM) is a stretch item (see E).

### 1. Programmes and nominations (WP1)
- **Trainee screens:**
  - `ProgrammeCatalog`: search, filter chips (sector, mode, open seats), cards with a seats bar.
  - `ProgrammeDetail`: overview, eligibility, dates, venue, curriculum courses, batches.
  - `NominationForm`: choose a batch, add a note, and a profile-completeness gate that routes to `ProfileEdit` if phone or district is missing.
  - `MyNominations`: timeline of Submitted, Under review, Approved or Rejected, Enrolled in batch X. Withdraw is allowed while pending.
- **Institution screens:**
  - `NominationInbox`: filters by status, programme and search.
  - `NominationReview`: trainee snapshot, batch select, decision note, Approve or Reject.
- **Employer stretch:** a "Nominate staff" action on `ProgrammeDetail` (sponsor nomination). See E for whether this is in scope.

| Method / path | Sketch |
|---|---|
| `GET /programmes?q&sector&level&mode&org_id&open_only&cursor` | Adds `organisation{id,name}`, `start_date`, `application_deadline`, `seats_available`, `my_nomination_status`. |
| `GET /programmes/{id}` | Adds `description`, `eligibility`, `venue`, `batches[]`, `courses[]`. |
| `POST /programmes/nominations` | `{programme_id, batch_id?, note?, trainee_id? (sponsor/admin only)}`. Returns 201, or 409 for a duplicate or a full batch (waitlist). Keep the route or alias it. |
| `GET /programmes/nominations/my` | Nominations with programme summary and `decision_note`. |
| `DELETE /programmes/nominations/{id}` | Withdraw while pending. |
| `GET /programmes/nominations?status&programme_id` | Institution/admin only, scoped to `user.organisation_id`, includes trainee name. Replaces the capped `/nominations/list`. |
| `PATCH /programmes/nominations/{id}` | Body `{status, decision_note, batch_id}`. Role and org check. On first approval it creates an `Enrollment`, bumps `seats_filled` idempotently, and calls `notify()`. |

- **Schema:**
  - `nominations`: add `batch_id`, `nominated_by_id`, `note`, `decision_note`.
  - `programmes`: add `eligibility`, `application_deadline`, `venue`.
- **Libraries:** none new.

### 2. Profile management (WP5)
- **Data model.**
  - New `user_profiles`, 1:1 with `users`: phone, date of birth, gender, state, district, pincode, address, education level, occupation and designation, cooperative society, years of experience, `preferred_language`, `photo_url`, `bio`, `visible_to_employers` (default false). Trainer extras: qualification, expertise[].
  - Extend `Organisation`: address, district, pincode, phone, email, website, accreditation number, logo.
  - Extend `users`: `preferred_language`, `career_target_role`.
  - Do not collect Aadhaar or other government ID.
- **Endpoints.**

| Method / path | Sketch |
|---|---|
| `GET /users/me` | User, profile, organisation, `completeness` (server-computed %). |
| `PATCH /users/me` | Profile fields only. Role, email and org are not editable. |
| `POST /users/me/photo` | Multipart upload to the media dir. Returns `photo_url`. |
| `GET/PATCH /organisations/me` | Institution and employer admins only. |
| `GET /trainees/{id}/profile` | Trainer of that batch, institution of that org, admin. Employer only if `visible_to_employers` or the trainee has applied. |

- **Also fix here:** `PATCH /users/{id}` (privilege escalation), `GET /users/` (email leak) and `POST /auth/sync` (role from body). These belong to WP5B, which owns `users.py`, but see WP-B in section D.
- **Screens:** `ProfileEdit` (sections: personal, address, education and work, language, visibility), photo picker, `OrganisationProfile`, `TraineeDetail` (read-only).
- **Libraries:** `expo-image-picker`, `expo-image-manipulator` (resize to 512 px before upload).

### 3. Interactive multilingual e-learning (WP3, with i18n in WP0-M and WP9)

**Lesson types.** Lessons hold typed blocks in JSONB, and each type renders natively. Do not use WebViews.

| Block type | Behaviour |
|---|---|
| `text` (lightweight markdown), `image`, `callout` | Static rendering. |
| `video` | Rendered with `expo-video`. |
| `audio` | Rendered with `expo-audio`. |
| `flashcards` | Swipeable cards. |
| `quiz` | Inline MCQ with immediate feedback. Advisory only, not certifying. |
| `scenario` | Branching decision cards: pick an option, see the consequence. |

- **Schema.**
  - `lessons` gets `position`, `lesson_type`, `duration_min`, `content` (blocks, English base) and `content_version`.
  - `modules` gets `position`.
  - New `lesson_progress(trainee_id, lesson_id, status, position_sec, score, completed_at, updated_at)`, unique on (trainee_id, lesson_id).
  - New `media_assets(id, lesson_id, url, sha256, size, mime)`. This is the source for the offline manifest.
- **Endpoints.**

| Method / path | Sketch |
|---|---|
| `GET /courses?has_content=true&lang=` | Hides courses with no lessons. No "coming soon" filler. |
| `GET /courses/{id}/content?lang=` | Modules, lessons, blocks, `lang_served`, `langs_available`, `content_version`. |
| `GET /courses/{id}/manifest?lang=` | Asset list with url, size, sha256, plus the content version. |
| `POST /lessons/{id}/progress` | `{status, position_sec, client_id, occurred_at}`. Recomputes `course_enrollments.progress` server-side. |
| `GET /courses/{id}/progress` | Per-lesson status. |
| `POST /lessons/{id}/quiz/check` | Optional. Practice grading. |

**Multilingual approach.**
- **UI strings** are bundled JSON in the app (works offline). Use `i18next` and `react-i18next` with `expo-localization` for the device default.
- **Languages:** English, Hindi, Marathi, Gujarati.
  - Reasoning: VAMNICOM is in Pune (Marathi). The Amul/IRMA cooperative base is in Anand (Gujarati). Hindi is the national link language. Together they cover the main cooperative states.
  - Tamil is the natural fifth if the user wants southern coverage. The design is data-driven: add a `ta/` locale folder and one registry entry.
- **Content translations** use a single generic table `content_translations(entity_type, entity_id, lang, fields JSONB, status draft|reviewed, updated_at)`, unique on (entity_type, entity_id, lang).
  - It covers course, module, lesson (title and blocks), assessment question (prompt, options, explanation) and programme.
  - A shared `resolve_translations(rows, lang)` helper overlays the translation onto the English row, with fallback to English.
  - A generic table means one migration and one helper, versus per-entity translation tables.
- **Translation production:** `backend/scripts/translate_content.py` drafts translations with Gemini and marks them `draft`. A native-speaker reviewer marks them `reviewed`. The app should show "machine translated" on draft content.
- **Indic script rendering:** theme line heights are tight (14 px text on 20 px line height). Devanagari matras and Tamil marks can clip. Add a per-language line-height multiplier in the theme.
- **Avoiding a whole-app string-edit conflict:**
  1. WP0-M builds the i18n infra, the language picker and a pre-declared namespace per WP (`common`, `programmes`, `schedule`, `learning`, `assessments`, `profile`, `attendance`, `employer`, `analytics`, `career`).
  2. Each feature WP writes English only, in its own `src/i18n/locales/en/<ns>.json`, and uses `useTranslation('<ns>')` in its own screens from day one.
  3. WP9 later adds `hi`, `mr` and `gu` files per namespace without touching any screen, and adds `scripts/i18n-check.mjs` (key parity across languages, no orphan keys).
  4. Existing screens in `src/screens/*` get their `t()` sweep last, one screen per commit, after the QA agent (a) finishes.

**Optional:** `expo-speech` "Listen" on text blocks. It depends on device voices for Marathi and Gujarati, which are not guaranteed.

### 4. Digital attendance: QR, NFC, face (WP7)

**Common contract.** QR, NFC and face all end in one server function, `mark_attendance(session, trainee, method, confidence, captured_at, client_id)`, which writes an `AttendanceRecord`.
- Add to `attendance_sessions`: `batch_id`, `timetable_slot_id`, `opens_at`, `closes_at`, `allowed_methods` (JSONB), `created_by`, `room`.
- Add to `attendance_records`: `confidence`, `client_id`, `offline` (bool), `needs_review` (bool), `override_by`, `override_reason`. Add a unique constraint on (session_id, trainee_id).
- NFC (agent b) plugs in as `method=nfc`. A physical tag maps to a room, and the server resolves the open session for that room. I have not designed that mapping; it is agent (b)'s groundwork.

**QR hardening.**
- Enforce `closes_at`.
- Make the token rotate: `session_id.window.hmac` with a 30-second window. The trainer console renders it with `react-native-qrcode-svg`.
- Fix `/attendance/my` so the denominator is sessions for the trainee's batches.
- Offline QR scans are queued with `captured_at`. The server accepts them only if `captured_at` is inside the session window, allowing for measured clock skew. Otherwise it returns `rejected` and the trainer can override manually. Accepted offline scans are flagged `offline=true` and `needs_review=true`.

**Face recognition design.**
- **Capture:** `expo-camera` front camera, `takePictureAsync` at quality about 0.5, 3 frames at roughly 480 px, sent as multipart. Frames are processed in memory and never persisted.
- **Server:** `opencv-python-headless` with YuNet detection and SFace recognition (ONNX models from OpenCV Zoo, Apache 2.0, 128-d embeddings).
  - **Do not use InsightFace buffalo_l.** The web mock names it, but its pretrained models are non-commercial research only.
  - Models are downloaded in the Docker build and are not committed to git (SFace is about 37 MB).
- **Storage:** `face_templates(user_id unique, embedding vector(128), model_version, enrolled_at, enrolled_by, consent_version, consent_at, revoked_at)`. Matching is 1:N with the pgvector cosine operator within the session roster. `face_events` logs outcome, score and timestamp with no images.
- **Threshold:** configurable (`FACE_MATCH_THRESHOLD`), starting from the SFace documented cosine threshold (about 0.363). Calibrate it against a small team-collected set with `scripts/face_eval.py`. Rate-limit attempts per user.
- **Enrolment (default, supervised):**
  1. A trainer or institution user opens Trainees, picks the trainee, and starts `FaceEnrol {mode:'trainer'}`.
  2. The trainee reads and accepts the consent screen.
  3. The app captures 3 poses (centre, left, right) with framing guidance.
  4. The app calls `POST /face/enroll`.
  Self-enrolment on the trainee's own phone is optional and off by default. It lets someone enrol another person's face.
- **Verification modes:**
  - (A) Trainer kiosk, 1:N: the trainer's device shows the camera, `POST /attendance/face/identify` returns the top candidates, and the trainer taps to confirm. Auto-mark only above a high threshold.
  - (B) Trainee self, 1:1: on the trainee's own phone during an open session, with liveness.
- **Liveness (feasible vs not):** the server issues a challenge (`POST /face/challenge` returns a random pose sequence). It estimates head yaw from YuNet's 5 landmarks and checks that it follows the sequence. This defeats a static photo. It does not defeat replayed video or a 3D mask. Passive anti-spoofing (for example MiniFASNet, Apache 2.0) is a stretch item. **Do not claim ISO 30107 PAD or any FAR/FRR figure.**
- **Privacy (DPDP Act 2023):**
  - Explicit, versioned consent, with purpose stated.
  - Only embeddings are stored, never images.
  - `DELETE /face/me` revokes consent and deletes the template. Institution or admin can also delete on programme exit.
  - QR and NFC always remain as a no-penalty alternative.
  - An audit trail is kept.
- **Endpoints:**

| Method / path | Sketch |
|---|---|
| `POST /face/consent` | `{granted, version}`. |
| `GET /face/status/me` | `{enrolled, enrolled_at, model_version, consent}`. |
| `POST /face/enroll` | Multipart: `trainee_id`, 3 frames. Trainer, institution or admin only. |
| `DELETE /face/me` | Revoke and delete. |
| `POST /face/challenge` | Returns `{challenge_id, sequence[], expires_in}`. |
| `POST /attendance/face/verify` | Trainee 1:1: `session_id`, frames, `challenge_id`. Returns `{matched, score, liveness, record}`. |
| `POST /attendance/face/identify` | Trainer kiosk: `session_id`, frame. Returns `{candidates[], decision}`. |

**Other attendance endpoints.**

| Method / path | Sketch |
|---|---|
| `POST /attendance/sessions` | Replaces `generate-qr` (keep it for the e2e script). |
| `GET /attendance/sessions/active` | For the trainee: open sessions for their batches. |
| `GET /attendance/sessions/{id}` | Live roster for the trainer (poll every 5 s). |
| `POST /attendance/mark` | Unified. `{session_id, method, credential, client_id, captured_at}`. |
| `PATCH /attendance/records/{id}` | Trainer override with reason. |

**Screens:** `Attend` (trainee, QR/NFC/Face switch), `StartSession`, `SessionConsole`, `FaceEnrol`, `AttendanceHistory`.

### 5. Timetable, hostel, logistics (WP2)

**Timetable.**
- Add `start_time` and `end_time` TIME columns to `timetable_slots`, backfilled by parsing the existing `time_slot` string. Add `timetable_exceptions(slot_id, date, status cancelled|moved, new_room, note)`.
- Endpoints:

| Method / path | Sketch |
|---|---|
| `GET /timetable/my?from&to` | Role-aware. Trainees via Enrollment to Batch to slots. Trainers via `trainer_id`. Expands weekly slots into dated occurrences between batch start and end, applies exceptions. |
| `POST /timetable/exceptions` | Institution: cancel or move a class on a date. Notifies enrolled trainees. |

- Institution mobile does not edit the recurring grid (web does). Mobile is view plus cancel or reschedule.

**Hostel.** The tables exist but nothing is trainee-scoped.

| Method / path | Sketch |
|---|---|
| `GET /hostel/my` | `{status: allocated\|waitlisted\|none, room, block, check_in/out, waitlist_position}`. |
| `POST /hostel/requests` | Trainee: dates and preference. Creates a waitlist entry with `trainee_id` from identity. |
| `DELETE /hostel/requests/{id}` | Withdraw. |
| Existing `GET /hostel/`, `POST /hostel/allocate` | Add role and org scoping. Institution mobile uses a waitlist-allocate screen. |

**Logistics.**
- Add to `batches`: `venue`, `reporting_instructions`, `contact_phone`, `min_attendance_pct`.
- `GET /logistics/my` returns the batch vehicle (route, pickup, departure, driver, tap-to-call via Linking) and the joining instructions.
- Institution mobile: the checklist toggle uses the existing `PATCH /logistics/tasks/{id}`. Budget and cost stay on web.

**Notifications.** `notifications(user_id, kind, payload, read_at, created_at)`, `GET /notifications`, `POST /notifications/{id}/read`. Events: nomination decision, timetable change, hostel allocation, certificate issued, application status. A shared `services/notifications.py::notify()` is created in WP0-B. Local class reminders use `expo-notifications` (local, works offline).

### 6. LMS, assessments, certification (WP4)

**Schema.**
- New `assessment_questions(assessment_id, position, type mcq_single|mcq_multi|true_false, prompt, options JSONB, correct JSONB, explanation, marks, topic)`.
- New `assessment_attempts(assessment_id, trainee_id, started_at, expires_at, submitted_at, answers JSONB, score, passed, status)`.
- Extend `assessments`: `max_attempts`, `shuffle`, `show_answers` (`after_submit|never`).
- Keep writing an `AssessmentResult` row on submit for compatibility with web and analytics.

**Endpoints.**

| Method / path | Sketch |
|---|---|
| `GET /assessments/my` | Upcoming / in progress / completed, best score, attempts left. |
| `POST /assessments/{id}/attempts` | Starts an attempt. Returns questions without the `correct` field, plus `expires_at` and server time. 409 if attempts are exhausted or an attempt is open. |
| `PUT /assessments/attempts/{id}/answers` | Autosave per answer. |
| `POST /assessments/attempts/{id}/submit` | Server-grades. Rejects late submits (server clock). Runs the skill upsert as today. Returns score, pass, per-topic breakdown, review per `show_answers`. |

The `?score=` parameter on the old submit route is removed. `scripts/verify_e2e_loop.py` must be updated in the same WP. Certifying assessments are online-only. See E for the alternative.

**Screens.**
- `AssessmentIntro`: rules, duration, passing score, attempts left. Offline shows "requires connection".
- `AssessmentAttempt`: one question per screen, progress dots, flag for review, timer counting down from server `expires_at` minus measured clock offset (it does not pause when the app is backgrounded), auto-submit at expiry, a review-unanswered step, and `expo-screen-capture` to block screenshots.
- `AssessmentResult`: score, pass or fail, per-topic breakdown, review, "skill added to passport" chip, retry.

**Certification issuance (institution).**
- `GET /certificates/eligibility?programme_id&batch_id` returns per trainee: attendance % against `min_attendance_pct`, mandatory courses completed, assessments passed.
- `POST /certificates/issue-batch` `{programme_id, batch_id, trainee_ids[]}`. The existing single `issue` route stays.
- `Certification {batchId}` shows the eligible list with a checklist per trainee and an Issue button. A notification goes to the trainee.

### 7. Certificate repository and verification (WP4, with the public route in WP0-M)
- **Signed certificates.** Add to `certificates`: `content_hash` (HMAC-SHA256 of canonical fields with a server secret), `revoked_at`, `revoked_reason`. Verify recomputes the hash, so a tampered DB row fails. Add `certificate_verifications(code, verified_at, ip_hash)` and the counts to the issuer view.
- **Verify endpoint.** Keep `GET /certificates/verify/{code}` public. Return `valid`, `status` (valid, revoked, expired), the snapshot, and `integrity: ok|failed`. Remove the `DEMO_CERTS` branch outside development.
- **Screens.**
  - `Certificates` (existing) gets status badges.
  - `CertificateDetail`: holder, programme, issuer, dates, grade, skills, code, a QR encoding the public URL `<web-origin>/verify-certificate/<code>` (so any phone camera can verify via the existing web page), and Share (`expo-sharing`). A PDF via server rendering is a stretch item.
  - `VerifyCertificate`: `expo-camera` QR scan or typed code, shows a green/red result with the details. Reachable pre-login, from the employer's candidate view, and from Certificates.
- **Repository.**
  - The passport (verified skills with evidence) plus the certificates form the repository. `GET /skills/my-passport` must use identity.
  - Stretch: `POST /skills/passport/share` returns a time-limited read-only link.

### 8. Career counselling chatbot (WP12)
- **Server-derived context.** `POST /career/chat` `{message, conversation_id?, lang}`. The server builds the context from identity (passport, target role, enrolments) and ignores client-sent context. It replies in `lang`.
- **Persistence.** `chat_messages` (or local-only). Recommend server-side, capped, so the conversation survives a reinstall.
- **Recommendations.** `GET /career/recommendations` computes from the trainee's gap analysis against `career_target_role`. `PUT /users/me/career-goal` sets the role, from `/skills/roles`. Actions returned as `actionKey` values (`skill_gap`, `browse_courses`, `job_matches`) that the app maps to routes, not web hrefs.
- **Mobile.** Set-target-role sheet, "AI-generated advice" disclosure, a typing indicator (no streaming), saved history readable offline with the input disabled and a reason shown.
- **Not planned:** voice input (`expo-speech-recognition` needs native work and Indic accuracy is unproven).

### 9. Employer and recruiter (WP10)

**Schema.**
- `jobs`: add `organisation_id`, `status draft|open|closed`, `openings`, `deadline`.
- `applications`: add `employer_note`, `interview_at`. Status flow: applied, shortlisted, interview, offered, hired, rejected. Keep `offered` counting toward the employment-rate definition already in analytics.

**Endpoints.**

| Method / path | Sketch |
|---|---|
| `GET /employer/overview` | Open jobs, new applicants, shortlisted, hires, funnel. |
| `GET /jobs/mine`, `PATCH /jobs/{id}` | Own jobs, close or reopen, edit. |
| `GET /jobs/{id}/applications` | Ranked with match score, matched and missing skills, verified-skill count. Owner only. |
| `PATCH /applications/{id}` | `{status, note, interview_at}`. Owner only, and notifies the trainee. |
| `GET /employer/candidates?skill&location&min_match&verified_only&q` | Talent pool, limited to trainees with `visible_to_employers`. |
| `GET /employer/candidates/{traineeId}` | Passport summary and certificates with verification state. Contact details only after apply or shortlist. |
| Existing `POST /jobs/feedback` | Placement feedback at 30/60/90 days, keeps feeding `skill_demand`. |

**Screens:** `EmployerOverview`, jobs list, `JobEditor`, `JobApplicants`, `CandidateDetail` (with Shortlist, Reject, Schedule), `TalentSearch`, `PlacementFeedback`, `VerifyCertificate`. Trainee side: `MyApplications` shows the status tracker.

### 10. Offline-accessible learning (WP8)

**Store (`expo-sqlite`).** `api_cache(key, etag, body, fetched_at)`, `outbox(client_id pk, action, payload, created_at, attempts, last_error, status)`, `downloads(course_id, lang, version, bytes, status, downloaded_at)`, `asset_files(url, local_path, sha256, size)`. Media goes in `expo-file-system` under `courses/<id>/<lang>/`.

**Download flow.**
- Fetch the manifest and the content JSON, download assets with progress and resume, and verify sha256 with `expo-crypto`.
- Check free space first, and offer a per-language download and delete.
- Show an "update available" badge when `content_version` changes.
- Screens read the download store first, then the network. Media resolves to local file URIs.

**Outbox.**

| Queueable | Not queueable (online-only) |
|---|---|
| lesson progress, attendance (QR and NFC), practice quiz result, profile update, nomination create, job apply | certifying assessment, face verify/enrol, career chat, certificate verify, hostel request |

**Sync.**
- Triggers: app foreground, connectivity regained (`expo-network`), manual "Sync now".
- Use backoff and a max attempt count. A rejected item is shown with its reason and can be discarded.
- Server: rewrite `POST /offline-sync/batch`.
  - Auth required. Identity comes from the token, not the payload.
  - Persist `sync_receipts(client_id unique, user_id, action, status)` for idempotency.
  - Per-item result `applied|duplicate|conflict|rejected` plus a reason. A batch limit of 50. Return `server_time` so the client can measure clock skew.
  - MARK_LESSON_COMPLETE persists to `lesson_progress`.

**Conflict rules.**
- **Lesson progress:** completed always wins and never un-completes. Position uses the latest client timestamp.
- **Attendance:** first write wins. A duplicate is returned as `duplicate`, not an error. Offline records follow the window rule in feature 4.
- **Profile:** field-level last write wins by client timestamp.
- **Nomination:** unique on (trainee, programme).
- **Certifying assessment:** never queued.

**UI.** A slim connectivity bar when `expo-network` reports offline. It says offline, and does not claim the whole app works offline. Each screen shows "Available offline" or "Requires connection". `SyncStorage` lists pending actions, downloads with sizes, and free space. This matches the offline rescoping decision already recorded in HANDOFF.md.

**Low bandwidth.** Gzip, language-scoped payloads, paginated lists, and server-side thumbnail sizes for images.

### 11. Central database and analytics (WP11)
- **Central DB:** already present. The work is real queries and honest numbers.
- **Backend.**
  - Replace the hard-coded `analytics/institution/{org_id}` with real queries.
  - Remove the fake national fallback in `/overview`.
  - Add `GET /analytics/national/trends?metric&months`, `GET /analytics/institutions?sort` (league table: trainees, completion, attendance, certificates, placement), and `GET /analytics/outreach` (trainees and certificates by state and district from `user_profiles`, and skill-gap against seats offered, as a ranked "where to run the next programme" list).
  - Suppress any cell with fewer than 5 people (small-cell rule).
- **Mobile.**
  - NCCT admin: `NationalOverview` (KPI grid, 6-month trend, employment funnel), `Institutions` (league, then `InstitutionAnalytics`), `Demand` (skill-demand bars and outreach).
  - Institution and employer `Overview` screens reuse the same components.
  - Charts are hand-drawn `react-native-svg` (`Sparkline`, `BarRow`), no chart library. This keeps the single-red, restrained look.

## D. Work packages

### Ground rules for all WPs
- **Worktrees.** Each WP works in its own git worktree or branch and is merged by an integration step. The main tree already has many uncommitted modifications from the QA and NFC agents.
- **Shared files are touched only by WP-B and WP-M0:** `AppNavigator`, `navigation/registry`, `navigation/types`, `api/client`, `theme.ts`, `components/*`, `i18n/index`, `backend/app/deps.py`, `main.py`, `api/v1/router.py`, `models/__init__`, `migrations/*`.
- **Backend migrations are created only by WP-B**, in one migration for all new tables and columns. Separate migration authors would create multiple Alembic heads. If a WP later needs a schema change it asks the WP-B owner, or uses `alembic merge`.
- **Feature WPs** own exactly one mobile directory (`src/features/<name>/`), one locale file per language (`src/i18n/locales/<lng>/<ns>.json`), one backend router (plus service and tests), and one seed module (`app/seeds/<domain>.py`).
- **A shared component a WP needs** goes into its own feature `components/` directory. It is promoted to shared only in the final integration step.
- **`seed.py`** is being edited by agent (c). WP-B starts after (c) finishes. It then splits `seed.py` into `app/seeds/*.py` with one call per domain pre-wired.
- **The QA agent (a) and NFC agent (b)** own the existing `src/screens/*`, `src/components/*`, `services/nfc.ts` and `hooks/useNfcScan.ts` until they finish. WP-M0 should start from their finished state.

### Ordering

| Wave | Work | Depends on |
|---|---|---|
| 0 (serial, in flight) | (d) mobile Clerk sign-in; (c) seed and demo-login and `/auth/me`; (a) QA; (b) NFC groundwork | none |
| 1 (parallel, disjoint dirs) | **WP-B** (backend foundation); **WP-M0** (mobile foundation) | (d), (c), (a) done |
| 2 (backend, parallel) | Backend halves of WP1, WP2, WP3, WP4, WP5, WP7, WP8, WP10, WP11, WP12 | WP-B |
| 3 (mobile, parallel) | Mobile halves of WP1, WP2, WP3, WP4, WP5, WP10, WP11, WP12. WP8 mobile can start right after WP-M0, since it needs only the sync contract. WP7 mobile after the WP7 backend and the NFC agent's work. | WP-M0 plus that WP's backend |
| 4 (serial integration) | Role Home screens; WP9 (translations); migrate `src/screens/*` into `features/*` and delete `mockData.ts`; QA sweep; demo script; dev-build regression | all of the above |

### WP-B: backend foundation (1 agent, first)
- **Owns:** `backend/app/models/*` (new and altered), `backend/migrations/versions/<one new file>`, `deps.py`, `main.py`, `api/v1/router.py` (pre-registers stub routers for every new module), `services/notifications.py`, `app/seeds/` skeleton, `docs/mobile-api.md` (the contract).
- **Backend pieces:**
  - The single migration with everything listed in features 1 to 11.
  - Auth helpers: `require_user`, `require_roles`, `org_scope`. New endpoints must not use the anonymous fallback.
  - Gate `resolve_actor_id`'s fallback behind a setting that is off in production.
  - Fix defect 5: `PATCH /users/{id}`, `POST /auth/sync` role, and the `GET /users/` leak.
  - Gate the demo-login endpoint behind an env flag, restricted to the demo users, rate-limited and disabled in production.
- **Acceptance:**
  - `alembic upgrade head` gives a single head.
  - `alembic downgrade -1` then `upgrade head` round-trips.
  - Existing pytest (32) and `verify_e2e_loop.py` (25/25) still pass.
  - A test proves a trainee cannot set their own role.
- **Verify:** `pytest`, `alembic heads` shows one row, `alembic upgrade head` on a scratch Neon branch (not the main data).

### WP-M0: mobile foundation and role shells (1 agent, parallel with WP-B)
- **Owns:** `src/api/*`, `src/navigation/*` (registry, types, linking, per-role tab files), `src/i18n/index.ts` and language picker plumbing, theme additions, `app.json` plugins, `package.json`, the `src/features/*` skeleton with a stub screen per route.
- **Pieces:**
  - The API client and Clerk token injection, query client with persistence, generated types script.
  - All routes pre-declared with stubs and param types, plus the deep-link config.
  - Role router and the five tab bars. English-only namespaces.
  - The one dependency install and the one dev-build rebuild.
  - Delete the silent `fetchWithFallback` path. Screens temporarily show an `ErrorState` instead of mock data, until each WP replaces its stub.
- **Acceptance:**
  - `tsc --noEmit` and `expo lint` are clean, and `expo-doctor` passes.
  - Signing in as each demo role lands on the right tab bar.
  - Every route opens via `adb shell am start -d coopsetu://<route>` without a crash.
- **Verify:** `npx expo run:android` on `Pixel_10_Pro`. For each role, take a screenshot with `adb -s emulator-5554 exec-out screencap -p`, and check the layout with `adb shell uiautomator dump`.

### WP1: programmes and nominations
- **Owns (mobile):** `src/features/programmes/**`, `locales/*/programmes.json`.
- **Owns (backend):** `api/v1/programmes.py`, `schemas/programme.py`, `tests/test_programmes_nominations.py`, `seeds/programmes.py`.
- **Backend:** as in feature 1.
- **Acceptance:**
  - A trainee registers and sees status Submitted.
  - The institution approves. The trainee sees Enrolled in batch X, an `Enrollment` row exists, and `seats_filled` changes by exactly 1.
  - A duplicate returns 409. Withdraw works.
  - An unauthorised approve returns 403.
- **Verify:** pytest for those cases. On the emulator, run the trainee flow and then the institution flow with two demo logins, with screenshots of each state.

### WP2: schedule, hostel, logistics, notifications
- **Owns (mobile):** `src/features/schedule/**` (timetable, hostel, logistics, inbox, trainer Today, institution Operations), `locales/*/schedule.json`.
- **Owns (backend):** `timetable.py`, `hostel.py`, `logistics.py`, `notifications.py` (router), `tests/test_schedule_stay.py`, `seeds/schedule.py`.
- **Acceptance:**
  - `GET /timetable/my` returns dated occurrences for an enrolled trainee and applies a cancel exception.
  - Hostel request goes to the waitlist and allocation shows `allocated`.
  - `/logistics/my` returns the batch vehicle.
  - The trainee receives a notification on cancel.
- **Verify:** pytest. On the emulator, screenshot Schedule, Stay and Travel, Inbox, and the trainer Today.

### WP3: learning content (interactive lessons)
- **Owns (mobile):** `src/features/learning/**` (CourseDetail, LessonPlayer, block renderers, Learn tab segments other than Assessments and Downloads), `locales/*/learning.json`.
- **Owns (backend):** `courses.py`, `services/translations.py` (the `resolve_translations` helper), `tests/test_learning_content.py`, `seeds/learning.py` (authored lessons for at least 2 courses, all block types, in English).
- **Acceptance:**
  - Each block type renders.
  - Marking a lesson complete persists and the course progress % changes on the server.
  - The language switch changes lesson text when a translation exists, and falls back to English otherwise.
  - Courses with no lessons are hidden.
- **Verify:** pytest on content, progress and translation fallback. Emulator screenshots of each block type.

### WP4: assessments, certification, verification
- **Owns (mobile):** `src/features/assessments/**`, `src/features/certificates/**` (Certificates, CertificateDetail, VerifyCertificate, institution Certification), `locales/*/assessments.json`.
- **Owns (backend):** `assessments.py`, `certificates.py`, `services/certificate_service.py`, `tests/test_assessments_attempts.py`, `tests/test_certificate_integrity.py`, `seeds/assessments.py` (a real question bank), `scripts/verify_e2e_loop.py` (update).
- **Acceptance:**
  - The correct answers never appear in the start-attempt response.
  - A late submit is rejected. Attempts are limited.
  - Passing feeds the passport.
  - Issuing a certificate produces a code whose verify returns `integrity: ok`, and altering a DB row makes it fail.
  - Revocation is reflected in verify.
  - `verify_e2e_loop.py` still passes 25/25.
- **Verify:** pytest, the e2e script, emulator screenshots of the attempt (with a shortened timer), result, certificate QR and verify flows. Scan the QR by displaying it in the emulator's camera scene.

### WP5: profiles
- **Owns (mobile):** `src/features/profile/**` (Me tab, ProfileEdit, OrganisationProfile, TraineeDetail, BatchRoster), `locales/*/profile.json`. The existing `ProfileScreen.tsx` moves here in the final step.
- **Owns (backend):** `users.py`, `organisations.py`, `tests/test_profiles.py`, `seeds/profiles.py`.
- **Acceptance:**
  - `PATCH /users/me` cannot change role, email or org.
  - Completeness updates on save.
  - Photo upload works.
  - Employer sees a trainee only when `visible_to_employers` or the trainee applied.
- **Verify:** pytest. Emulator: edit a profile, screenshot, then cold restart and confirm persistence.

### WP7: attendance (QR hardening, face, session console)
- **Owns (mobile):** `src/features/attendance/**` (Attend, AttendanceHistory, StartSession, SessionConsole, FaceEnrol), `locales/*/attendance.json`. The NFC agent's `services/nfc.ts` and `hooks/useNfcScan.ts` are consumed, not moved.
- **Owns (backend):** `attendance.py`, `face.py`, `services/face.py`, `requirements.txt` (opencv addition), `Dockerfile` (model download), `tests/test_attendance.py`, `tests/test_face.py`, `scripts/face_eval.py`, `seeds/attendance.py`.
- **Acceptance:**
  - An expired QR is rejected and a duplicate returns 409 (unique constraint).
  - `/attendance/my` percentage is correct for a known fixture.
  - Enrolled face: the same person verifies and a different person is rejected at the configured threshold on the fixture set.
  - A static photo fails the pose challenge in a test.
  - `DELETE /face/me` removes the embedding.
  - Consent is required before enrol.
- **Verify:** pytest with licensed face fixtures (see E). Emulator with the camera fed from the virtual scene or a webcam: enrolment and verify screenshots. NFC cannot be verified on the emulator.

### WP8: offline engine
- **Owns (mobile):** `src/offline/**` (store, outbox, downloader, sync runner, `useConnectivity`), `src/features/offline/**` (Downloads segment, SyncStorage screen, connectivity bar), `locales/*/offline.json`. Pure-logic modules (outbox, conflict rules) must have no React Native imports so they can be tested with `node --test` and `tsx`.
- **Owns (backend):** `offline_sync.py`, `tests/test_offline_sync.py` (extend), `seeds/` none.
- **Acceptance:**
  - Download a course with media and open it in airplane mode.
  - Complete a lesson offline, reconnect, and progress appears on the server exactly once (replay the same `client_id` and confirm `duplicate`).
  - An offline QR scan outside the window comes back `rejected` and is shown to the user with the reason.
  - Killing the app with a queued item keeps it.
  - The sync endpoint returns 401 without a token.
- **Verify:** pytest plus `node --test`. Emulator: `adb shell cmd connectivity airplane-mode enable` (or `svc wifi disable; svc data disable`), perform actions, re-enable, screenshot the sync result. Also test partial connectivity by stopping the backend process.

### WP9: i18n translations and content translation pipeline
- **Owns:** `src/i18n/locales/{hi,mr,gu}/*.json`, `scripts/i18n-check.mjs`, `backend/scripts/translate_content.py`, `backend/app/seeds/translations.py`, `docs/i18n.md`. Runs after the feature WPs finish their English strings.
- **Acceptance:**
  - `i18n-check` passes: key parity and no missing keys in any namespace.
  - At least the Learn, Programme, Attend and Assessment flows are fully switchable.
  - Seeded content translations exist for the 2 authored courses in `hi`, `mr` and `gu`, marked `draft`.
  - The line-height multiplier does not clip Devanagari or Gujarati.
- **Verify:** switch language at runtime on the emulator and screenshot the main flows in each language. Check clipping visually. Run `i18n-check`.

### WP10: employer/recruiter
- **Owns (mobile):** `src/features/employer/**`, `locales/*/employer.json`.
- **Owns (backend):** `jobs.py`, `employer.py`, `tests/test_employer.py`, `seeds/employer.py`.
- **Acceptance:**
  - An employer sees only their own jobs and applicants (403 on another employer's).
  - The status transition notifies the trainee.
  - Talent search returns only opted-in trainees.
  - A hire counts in the employment rate.
- **Verify:** pytest. Emulator: employer demo login, screenshots of each screen, then the trainee login showing the updated status.

### WP11: analytics
- **Owns (mobile):** `src/features/analytics/**` (NCCT screens, chart components, institution and employer Overview data hooks), `locales/*/analytics.json`.
- **Owns (backend):** `analytics.py`, `tests/test_analytics.py`.
- **Acceptance:**
  - No hard-coded numbers remain in `analytics.py`.
  - Values match direct DB counts in a test.
  - Small-cell suppression works.
  - Employment rate stays within 0 to 100.
- **Verify:** pytest against known seeded counts. Emulator screenshots of the four NCCT screens.

### WP12: career and skills hardening (after QA agent (a))
- **Owns (mobile):** `src/features/career/**` (Jobs, Advisor, Plan, Passport, JobDetail, MyApplications), `locales/*/career.json`.
- **Owns (backend):** `career.py`, `skills.py`, `services/career_ai.py`, `tests/test_career_skills.py`.
- **Acceptance:**
  - The passport and recommendations differ between two demo users.
  - Client-sent context is ignored.
  - The reply follows `lang`.
  - Chat history persists.
- **Verify:** pytest with the Gemini call mocked. Emulator: two logins, screenshots.

### Final integration step (one agent)
- Compose role Home screens from each feature's exported hooks, migrate remaining `src/screens/*` into `features/*`, delete `mockData.ts`, promote shared components, and run the full regression. Confirm no screen still references mock data.
- **Verify:** `tsc --noEmit`, `expo lint`, `expo-doctor`, `node --test`, full pytest, `verify_e2e_loop.py`, and a scripted emulator walkthrough of each role with screenshots.

## E. Decisions for the user, and what cannot be proven without hardware

### Decisions that need your call
1. **Content authoring and translation review.** Who writes lesson content and who reviews Hindi, Marathi and Gujarati text? Machine drafts will be labelled "machine translated" until a native speaker reviews them. Is Tamil needed?
2. **Video and media hosting.** Backend-served static files are fine for the demo. Object storage (S3 or R2) is a separate account and cost. Real video needs real recordings, since redistributing NCCT or Ministry videos is not something I can assume.
3. **Face recognition.**
   - Are you comfortable storing embeddings server-side under DPDP consent?
   - Is trainer-supervised enrolment (default) acceptable, or do you want self-enrolment?
   - It must be presented as pilot-grade, with no accuracy or anti-spoofing claims.
   - The web mock's "97.5% TAR at 0.1% FAR" and "InsightFace buffalo_l" text should be removed or qualified. That model has a non-commercial licence.
4. **Certifying assessments online-only.** I recommend this, because offline answers cannot be timed or trusted. The alternative is to allow offline attempts with a downloaded question set, which needs answers on the device and accepts client timestamps.
5. **Anonymous fallback and demo login in production.** The optional-auth fallback in `resolve_actor_id` and the demo-login endpoint are both auth bypasses by design. I recommend they are env-gated and off in production. Do you agree?
6. **"LMS integration" and "cloud ERP" wording.** The platform is its own LMS and its own ERP-style modules (timetable, hostel, logistics). There is no external LMS or ERP adapter, so the native modules are described as the integrated LMS and ERP.
7. **Sponsor nominations.** Should a cooperative society (employer role) nominate staff on mobile, or is trainee self-nomination with institution review enough?
8. **NCCT admin mobile view.** Included (4 screens, read-only). Cut it if you want less scope.
9. **Push notifications.** In-app inbox plus local reminders need nothing extra. Remote push needs a Firebase project and `google-services.json`, which is your account.
10. **Web parity.** Many web pages still use mock data. Should web be rewired to the new endpoints, or is that out of scope? Mobile work does not include it.
11. **Rotate the Neon owner password.** HANDOFF.md still lists this as pending.
12. **Isolation.** I recommend git worktrees per WP. Working in the shared tree with many concurrent agents risks overwritten edits.
13. **Self sign-up on mobile.** Only demo sign-in is planned. Do you want Clerk email sign-up on mobile too?

### Risks
- **Dev build churn.** Any native module added after WP-M0 forces a rebuild for everyone. Hence the dependency freeze.
- **New SDK.** Expo SDK 57 and RN 0.86 are recent. Verify libraries such as `react-native-qrcode-svg` and the new file-system API against the versioned Expo docs before use.
- **Face fixtures.** Tests need legally usable face images, so the team's own consented photos. I cannot fetch licensed fixtures.
- **Server cost.** OpenCV plus a 37 MB model increases image size and CPU use on the backend host.
- **Timer and clock.** The assessment timer uses server time and a measured client offset. Offline QR windows depend on device clock accuracy, so they can be manipulated. That is why they are flagged for review.
- **Cleartext HTTP.** Release builds block it. The hard-coded LAN IP in `app.json` is dev-only, so deployment needs HTTPS.

### Cannot be fully proven without hardware or real users
- **Physical NFC tags.** The Android emulator has no NFC. Tag read behaviour, tag write format and the room mapping need a real phone and tags.
- **Face accuracy.** Real FAR/FRR across skin tones, lighting and low-end front cameras cannot be established. A small-sample threshold calibration is not an accuracy claim.
- **Liveness.** Pose-challenge resistance to video replay and masks is unproven. Only static-photo rejection can be tested.
- **Real device performance.** The `Pixel_10_Pro` emulator is high-end. Low-RAM devices and slow cameras, storage limits for downloads, and battery use are untested.
- **Indic fonts and TTS.** OEM fonts (Samsung, Xiaomi) may render differently from the emulator's Noto fonts. Marathi and Gujarati TTS voices may be missing on real devices.
- **Real network conditions.** Airplane mode gives a clean cut. Flaky or slow rural networks, and captive portals, behave differently.
- **Push delivery.** Not testable without a Firebase project and real devices.
- **Gemini quality** in Marathi and Gujarati: depends on the live model and is not deterministic.

### Critical Files for Implementation
- /home/mittai/Documents/Cooperative-EcoSystem/apps/mobile/src/navigation/AppNavigator.tsx
- /home/mittai/Documents/Cooperative-EcoSystem/apps/mobile/src/services/api.ts
- /home/mittai/Documents/Cooperative-EcoSystem/backend/app/deps.py
- /home/mittai/Documents/Cooperative-EcoSystem/backend/app/api/v1/offline_sync.py
- /home/mittai/Documents/Cooperative-EcoSystem/backend/app/seed.py