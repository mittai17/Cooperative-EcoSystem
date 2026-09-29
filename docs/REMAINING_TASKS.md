# Remaining tasks (handoff, 2026-09-28)

Full design: docs/MOBILE_COMPLETION_PLAN.md (work packages WP-B, WP-M0, WP1-WP12, sections C and D).
Backend contract so far: docs/MOBILE_BACKEND.md. Rules: no secrets in chat/logs, never write to Neon main from an agent, additive migrations only, do not git commit unless asked.

## Done
- Red professional mobile UI, QA pass on all screens (apps/mobile/src).
- Backend mobile API + seed + Clerk demo users + POST /auth/demo-login (backend/app/api/v1/mobile.py, seed_mobile.py). Tested on a scratch Postgres (docker coopsetu-scratch-pg, 127.0.0.1:55432).
- NFC groundwork: src/services/nfc.ts, src/hooks/useNfcScan.ts, plugins/withNfcOptional.js, package react-native-nfc-manager (not wired into the QR screen, no dev build yet).
- Mobile Clerk sign-in code written (@clerk/expo), demo login, Bearer token on API calls. tsc and lint clean. NOT run on the emulator yet.

## Backend foundation (WP-B) - DONE (finished by Codex, 2026-09-29)
pytest 100/100, tsc 0 errors, eslint 0 errors (195 pre-existing warnings), scripts/verify_e2e_loop.py 25/25 (was 0/25). Security fixes landed: /auth/sync now requires either a verified token matching the payload OR X-Internal-Secret + APP_ENV=development/test (dev-mode bypass for the web Clerk webhook, role never taken from body in prod), PATCH /users/{id}, GET /users/, /skills/gap-analysis and the programme/nomination/hostel/logistics/timetable write endpoints are gated. GET /certificates/my uses optional auth with an anonymous fallback for the legacy trainee_id param (returns [] with no token in production). Migration c4d8e1a7b2f6 is applied on scratch. Still NOT applied to Neon main (see below). API on :8000 should be restarted with the new code before further manual testing.
Not yet done from the original WP-B scope (verify before assuming): GET /system/integrations capabilities endpoint, notifications routes, 501 stub routers for not-yet-built features, app/seeds/ skeleton split, docs/mobile-api.md. Check git diff / grep before re-doing.

## You must do (user actions)
1. Apply the mobile migration + seed to Neon main (commands were given in chat): from backend/, `env -u DATABASE_URL python -m app.seed_mobile --counts; alembic upgrade head; python -m app.seed_mobile; ... --counts`.
2. Rotate the Neon coopsetu_owner password and the sudo password (both appeared in chat).
3. Keys: already in backend/.env: YOUTUBE_API_KEY, ADZUNA_APP_ID, ADZUNA_APP_KEY, GEMINI_API_KEY. Still missing: MOODLE_URL, MOODLE_TOKEN (Moodle is self-hosted, see below). DROPPED by the user: Jooble (not needed now) and Bhashini (not available to individuals): translation drafts use Gemini only (status=draft, human review), voice input is out of scope, lesson 'Listen' uses expo-speech on device and is hidden when the device has no voice for that language. Job feeds: Adzuna + Remotive + The Muse + employer-posted. Firebase: google-services.json into apps/mobile + FCM service-account file for the backend.
4. After the event: delete the 2 Clerk demo users, set DEMO_LOGIN_ENABLED=false.
5. Android SDK download (ndk;27.1.12297006, platforms;android-36) was crawling; if it fails use `npx eas-cli build --profile development --platform android`.

## Build order
1. Verify/finish WP-B (backend foundation): single migration for all new tables, require_user/require_roles/org_scope, fix security holes (POST /auth/sync role from body, PATCH /users/{id}, GET /users/ email leak, unauthenticated write endpoints), config keys for integrations, /system/integrations capabilities, notifications service, stub routers, docs/mobile-api.md.
2. Run + test the mobile Clerk sign-in on the emulator (Expo Go, exp://192.168.1.2:8081): demo login, wrong password, session persistence, logout. Fix bugs.
3. WP-M0 mobile foundation: API client, TanStack Query, deep links, role shells + tab bars (trainee, trainer, institution, employer, NCCT admin), i18n infra, install ALL native deps once (expo-sqlite, expo-notifications, expo-audio, expo-video, expo-image-picker, react-native-webview, etc.), `npx expo install --fix`, one dev build (JDK 21 at /usr/lib/jvm/java-21-openjdk, ANDROID_HOME=/home/mittai/Android/Sdk, --port 8082).
4. Feature WPs (backend + mobile per WP, disjoint dirs): WP1 programmes/nominations (+sponsor nominations), WP2 timetable/hostel/logistics/notifications, WP3 interactive lessons + translations, WP4 assessments (server-graded, online-only) + signed certificates + public verify, WP5 profiles, WP7 attendance (QR hardening + NFC wiring + InsightFace face, trainer-supervised and self-enrolment), WP8 offline engine (sqlite outbox, real downloads), WP10 employer, WP11 analytics + NCCT admin view, WP12 career/skills hardening, WP-X integrations (Moodle, YouTube, SWAYAM/NPTEL catalogue, Adzuna/Jooble/Remotive/The Muse, Bhashini, Gemini).
5. Push notifications (FCM). i18n: hi, mr, gu, ta (Bhashini + Gemini drafts, reviewed flag).
6. Final integration: role home screens, delete leftovers, web pages rewired to the new API (many still use lib/mock-data), full regression (tsc, expo lint, expo-doctor, pytest on scratch DB only, e2e script), emulator walkthrough per role.

## Known limits
- Emulator cannot tap NFC tags; face accuracy/liveness unproven; InsightFace pretrained models are non-commercial licence; YouTube videos cannot be downloaded offline; splash/icon art is still the blue Expo template.

## Moodle token (self-hosted, needs Moodle running first)
1. Run Moodle locally in Docker (add a moodle + database service to docker-compose.yml), then open http://localhost:8080 and finish install.
2. Site administration -> Server -> Web services -> Overview: enable web services, enable the REST protocol, create an external service with the functions listed in the plan (core_course_get_courses, core_course_get_contents, enrol_manual_enrol_users, core_user_create_users, core_completion_get_course_completion_status, gradereport_user_get_grade_items, mod_quiz_get_quizzes_by_courses), create a service user.
3. Token page: http://localhost:8080/admin/webservice/tokens.php -> Add -> pick the service user and service -> copy the token into backend/.env as MOODLE_TOKEN and set MOODLE_URL=http://localhost:8080.
