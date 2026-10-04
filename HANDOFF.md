# CoopSetu AI — Handoff

State as of this session (Claude Code). Written for another AI tool / session to continue from here without re-deriving context.

## Stack
- `apps/web`: Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui (base-nova/Base UI primitives), recharts.
- `backend`: FastAPI, SQLAlchemy (async), Alembic, real Neon Postgres.
- Accounts already provisioned: Clerk app "CoopSetu AI", Neon project "CoopSetu AI" (dev + main branches, pgvector on). Credentials live in `apps/web/.env.local` / `backend/.env` — never printed to chat, treat as real.

## Frontend status
- Pages built: landing, `/programmes`, `/courses` + `/courses/[id]` (video/lesson mock), `/jobs` + `/jobs/[id]` (live match donut), `/verify-certificate/[id]`, 5 role dashboards (trainee/institution/trainer/employer/admin), `/skill-passport`.
- Red retheme is **done** (primary `#E30B1C`, sampled from reference): globals.css tokens, logo/wordmark ("CoopSetu AI"), stat-card tints, dashboard progress bars/charts, hero floating badges (4, was 2), new closing banner section, sidebar "Keep Learning" illustration (trainee only). `tsc`/`lint`/`build` all pass. Logo mark and sidebar illustration are hand-approximated (no image-gen tool available) rather than pixel-exact. Not swept: deeper sub-pages (nominations, batches, hostel, kiosk, etc.) still use old blue/violet/amber tints — not shown in any reference screenshot, left as-is. 6 pre-existing lint errors remain in unrelated offline-sync files (predate this session).
- Dark mode toggle works (`src/components/theme/theme-provider.tsx`).
- **Known unresolved conflict**: there are TWO auth systems. `/login` + `/register` are fake demo pages (client-side only, pre-date Clerk integration). Separately, real Clerk (`@clerk/nextjs`, `ClerkProvider` in `layout.tsx`) is wired in with real `/sign-in` + `/sign-up` routes that actually gate the 5 dashboards (redirect if unauthenticated). **These need reconciling**: retire/redirect `/login`+`/register` to the real `/sign-in`+`/sign-up`, update nav link hrefs in `public-nav.tsx`/`public-footer.tsx`/`app-shell.tsx`, and theme Clerk's `<SignIn>`/`<SignUp>` `appearance` prop to match the red palette via CSS vars.

## Backend status
- Real Neon DB, 23 tables migrated, `alembic upgrade head` clean.
- Real Clerk JWT verification (JWKS) implemented in `app/services/clerk.py` / `app/deps.py`, but only wired into `GET /api/v1/auth/me`. Other write endpoints (enroll, submit assessment, scan attendance, apply to job) still take `trainee_id`/`applicant_id` as a param instead of deriving identity from the verified token — wiring `require_role`/`get_current_identity` into those is the next step, straightforward given the dependency exists.
- End-to-end flow verified for real: `scripts/verify_e2e_loop.py` → 25/25 steps passing against the live DB (registration → nomination → attendance → assessment → certificate → skill passport → gap analysis → job match → application → employer feedback → NCCT aggregation).
- `Course/Module/Lesson/CourseEnrollment` (self-paced) and `Programme/Batch/Nomination/Enrollment` (cohort training) are separate, NOT cross-linked. A real ERD would tie a Programme's curriculum to Courses/Modules — currently they're independent.
- **`GEMINI_API_KEY` and `OPENROUTER_API_KEY` in `backend/.env` are placeholder/non-functional** (confirmed via live 400/401, values never printed). `POST /api/v1/career/chat` has real Gemini integration code with a deterministic fallback — put a real key in `.env` to activate it.
- `backend/Dockerfile` created; root `docker-compose.yml` wires both services.
- One oddity: during the backend pass, a file (`app/api/v1/certificates.py`) changed on disk without the agent editing it (a `datetime.now(timezone.utc)` → `datetime.utcnow()` diff). Cause unclear — check if something else (an editor extension, another tool) still has a hook into this repo before assuming the filesystem is only touched by intentional agent runs.

## Security follow-ups (not yet confirmed done)
- Rotate the Neon `coopsetu_owner` password — it was printed to a subagent's terminal transcript earlier this session (Neon console → CoopSetu AI project → development branch → Roles).
- Clerk/Neon CLIs are installed at `~/.npm-global/bin`, not on the default fish `$PATH` — run `fish_add_path ~/.npm-global/bin` if needed.
- Clerk/Neon accounts were created under `ggiridharan097@gmail.com` — confirm that's the intended account.

## Security follow-ups — COMPLETED (2026-09-27, security_pass agent)

### ✅ .env / .env.local git tracking
- Verified: `backend/.env` and `apps/web/.env.local` are NOT tracked by git (`git ls-files` returned empty).
- No `git rm --cached` was required.

### ✅ .gitignore coverage
- Created root `.gitignore` (new file — none existed) covering: `.env`, `.env.*`, `*.env`, `.env.local`, `.env.*.local`, plus Node, Python, Next.js, IDE, and Docker artifacts.
- Created `backend/.gitignore` (new file) covering `.env`, `.env.*`, `*.env`, `.env.local`, and Python/pytest artifacts.
- `apps/web/.gitignore` already had `.env*` — sufficient, left untouched.
- `apps/mobile/.gitignore` only had `.env*.local` — root `.gitignore` now provides comprehensive coverage for the whole repo.

### ✅ CORS `allowed_origins` review
- `backend/app/config.py`: the `allowed_origins` field defaults to `localhost:3000,localhost:8000,127.0.0.1:3000,127.0.0.1:8000` (localhost-only — safe).
- It reads from env var `ALLOWED_ORIGINS` if set — confirmed set to `http://localhost:3000,http://localhost:8000` in `backend/.env`.
- No wildcard (`*`) default — no change to logic needed.
- Added an inline comment in `config.py` reminding that production deployments must set `ALLOWED_ORIGINS` explicitly to the real frontend domain(s) and must never use `*`.

### ✅ backend/.env key audit (keys only — no secret values printed)
Keys present in `backend/.env`:
- `DATABASE_URL` (set)
- `DATABASE_URL_PROD` (set)
- `CLERK_SECRET_KEY` (set)
- `CLERK_PUBLISHABLE_KEY` (set)
- `CLERK_JWT_ISSUER` (set)
- `GEMINI_API_KEY` (set — placeholder value, non-functional)
- `OPENROUTER_API_KEY` (set — placeholder value, non-functional)
- `APP_ENV` (set: `development`)
- `LOG_LEVEL` (set: `info`)
- `ALLOWED_ORIGINS` (set: `http://localhost:3000,http://localhost:8000` — localhost-only, safe)

### ⚠️ Still pending (carry-over)
- **Rotate Neon `coopsetu_owner` password** — exposed in an early transcript. This is the most critical outstanding security action. Do via Neon Console → CoopSetu AI project → dev branch → Roles → Reset password, then update `DATABASE_URL` / `DATABASE_URL_PROD` in `backend/.env`.

## Correction: mobile app is further along than previously stated
`apps/mobile` (Expo) has real screens, not just a scaffold: Dashboard, CoursePlayer, QRAttendance, CareerAI, JobMatches, SkillPassport, OfflineLearning, Certificates, Profile, CoursesCatalog, plus navigation/services/theme. Status (matches web red theme? wired to real backend API or `src/services/mockData.ts`?) not yet audited — do that before assuming it needs building from scratch.

## Not started (from the original full spec, out of scope so far)
ERP/LMS integration, face-recognition attendance, offline-first PWA/service worker (web), hostel/timetable/logistics modules, S3-compatible object storage, production deployment.

## Status update
All items below through auth reconciliation, JWT-secured write endpoints, and Programme↔Course linkage are now DONE and verified (build: 57 routes/0 errors, pytest 32/32, alembic head at `d7e48ec4b5f3`, e2e 25/25). Full detail in `memory.md`. What follows is the next phase.

## Next phase roadmap, in priority order

1. **Security/cleanup pass** (cheap, do first)
   - Rotate the Neon `coopsetu_owner` password if not already done (it was exposed in an early terminal transcript this session).
   - Confirm no `.env`/`.env.local` files are tracked by git (`git status`, add to `.gitignore` if missing).
   - Verify CORS `allowed_origins` in backend config doesn't over-permit in a way that would matter for a public demo deploy.

2. **Visual consistency sweep — DONE.** Swept remaining old-scheme leftovers (found only one real one: `my-learning` stat tile). Confirmed the rest of the "old tint" usages were actually correct semantic/categorical color-coding (status pills, node-type legends, online/offline banners) and intentionally left alone. Full lint suite now 0 errors/0 warnings (was 6 errors + 33 warnings), `tsc`/`build` clean, 57 routes compile. Also found: a Clerk webhook route exists at `src/app/api/webhooks/clerk/route.ts` — not yet audited for what it does.

3. **Richer seed data — DONE.** `seed.py` rewritten (bulk idempotent inserts, ~10s runtime), 20 institutions/608 trainees/23 programmes/25 jobs/~1200 applications live in Neon. Analytics confirmed past fallback thresholds (real numbers, e.g. `trainers: 62` after also fixing 18 legacy rows with stale `role="faculty"` → `"trainer"` directly against the DB). `verify_e2e_loop.py` 25/25 and pytest 32/32 both re-confirmed after. **Known quirk, not yet fixed**: `analytics.py`'s `employment_rate` formula (`applications / trainees * 100`) can exceed 100% since one trainee can have multiple applications — currently showing 508.2%, needs redefining (e.g. distinct employed trainees / total trainees).

4. **Offline-first learning** (mandatory requirement, not yet built) — service worker + IndexedDB + sync queue for course content/progress, per the original spec's offline-mode requirement. `src/lib/offline/` already has partial scaffolding (see the lint errors above) — check what's there before building fresh.

5. **Real AI keys** — add real `GEMINI_API_KEY` or `OPENROUTER_API_KEY` to `backend/.env` so `/api/v1/career/chat` stops using its deterministic fallback.

6. **Deployment** — get a live demo URL: `apps/web` to Vercel (or similar), `backend` via the existing `Dockerfile`/`docker-compose.yml` to a host reachable by the deployed frontend. This matters a lot for hackathon judging.

7. **Kiosk/QR attendance polish** — this is the most demo-visible "hardware-adjacent" feature; make sure the QR generate → scan → record flow is smooth end-to-end in the UI, not just via API tests.

8. **Lower priority / stub is fine per the original spec's own allowance** ("integration-ready, don't let it block the main flow"): face-recognition attendance, ERP / LMS integration, mobile app (Expo/React Native), hostel/timetable/logistics depth. Build these only if time remains after 1-7; a clearly-labeled "prototype integration" placeholder is acceptable per the spec.

9. **Demo prep** — once 1-6 are solid, prepare the 30-second narrative: rural youth registers → trains → attendance → assessment → certificate → Skill Passport updates → gap identified → recommendation → employer posts job → explainable match → applies → employer feedback → NCCT sees skill demand. Walk this live end-to-end in the deployed app before presenting.

## Session 3 update (2026-09-28)

- **Item 2 (visual sweep) — confirmed done.** Verified live in browser against the reference image: landing page, login, dashboards all match (red primary, floating hero badges, closing banner, icon tints). Fixed two real bugs found during verification: a Base UI `Button`/`Link` `nativeButton` warning (fixed globally in `button.tsx`) and a `useSyncExternalStore` server-snapshot caching warning.
- **Real Clerk auth end-to-end — DONE** (by other tooling, verified working): `/sign-in`/`/sign-up` gate all 5 dashboards for real, JWT-secured write endpoints on the backend, Programme↔Course linkage. Build 57 routes/0 errors, pytest 32/32, e2e 25/25 all confirmed.
- **Seed data — DONE**: 20 institutions, 608 trainees, real computed analytics (not fallback numbers). Also fixed 18 legacy `role="faculty"` rows → `"trainer"` directly against the DB (analytics `trainers` count corrected live: 44 → 62).
- **A real app-breaking bug found and fixed**: the pre-hydration theme-init `<script>` in `layout.tsx` was crashing the entire app in this specific Next/React build (not a warning — a full render-blocking error). Fixed per the project's own vendored Next.js docs (`node_modules/next/dist/docs/.../preventing-flash-before-hydration.md`) using the `type` server/client toggle + `suppressHydrationWarning` pattern.
- **Offline model rescoped per explicit product decision**: removed the global "OFFLINE MODE" banner (misleading — implied whole-app offline capability a browser tab can't reliably deliver). Real offline support is now scoped to explicitly-downloaded content on `/my-learning` (mirrors the mobile app's Downloaded/Available model), plus the legitimate QR-attendance/assessment "record now, sync later" queue (kept, just no longer tied to a page-wide banner). Root cause of the banner's stuck-offline bug: an SSR/hydration mismatch in `useOfflineSync` (Node's SSR `navigator` stub lacks `.onLine`) — fixed at the source.
- **Sidebar-disappearing/redirect-to-signup bug — found and fixed.** Root cause: the trainee sidebar's "Courses"/"Jobs" links pointed to `/courses`/`/jobs`, which only exist as the anonymous public marketing pages (no auth-aware layout there), so signed-in users got dropped into the signed-out public chrome. Fix: `src/app/(public)/layout.tsx` now checks `auth()` and renders the real `AppShell` for signed-in users instead of the public nav. All 47 routes across all 5 roles + kiosk re-verified working (sidebar present, no unwanted redirects, no console errors).
- **Trainer sidebar nav bug fixed**: "My Classes"/"Attendance"/"Grading" all pointed to `/trainer/dashboard` (copy-paste href bug) instead of their real pages. Fixed in `src/lib/nav-config.ts`; also added missing "Trainees" and "Content" nav entries (routes existed but had no sidebar link).
- **Still open**: mobile app (`apps/mobile`) is further along than previously documented (10 real screens exist) but not yet audited against the red theme or checked for real vs. mock API wiring — do that before assuming it needs work from scratch. (A smoke-test pass on this was started and deliberately stopped mid-way at the user's request — resume later, don't assume it's done.)

## Session 4 update (2026-09-28) — full audit against official PS 26087 text

Audited all 11 "Expected Solution Features" from the official problem statement live (not from docs). Results: registration/nomination, profiles, LMS+assessments+certification, certificate verification, employer dashboard, and the centralized DB/analytics are all **PRESENT** and verified working end-to-end. Fixed since the audit:
- **Career counseling chatbot — now PRESENT (was PARTIAL/fallback-only).** Got a real `GEMINI_API_KEY` from the user, wired into `backend/.env`. Found and fixed two real bugs to make it actually work: (1) the code called the deprecated `gemini-2.0-flash` model (404s) — updated to `gemini-2.5-flash`; (2) Gemini 2.5's internal "thinking" tokens were silently consuming ~95% of the 300-token budget (`finishReason: MAX_TOKENS` after ~15 visible tokens) — fixed via `thinkingConfig: {thinkingBudget: 0}` + bumped `maxOutputTokens` to 400. Also bumped `scripts/verify_e2e_loop.py`'s HTTP timeout from 10s→20s since real Gemini calls take longer than the old instant fallback. Re-verified: 25/25 e2e, real grounded responses referencing the user's actual skill/job data.
- **`employment_rate` formula bug — fixed.** Was `total_applications / trainees` (could exceed 100%, was showing 508%). Now `distinct trainees with an "offered" application / total trainees` (33.7%, sane). Fixed in both `/api/v1/analytics/overview` and `/api/v1/analytics/employment-funnel`; funnel now also shows an "Employed" stage.

Still in progress from this audit (subagents running as of this note):
- **Timetable/Hostel/Logistics** — building real DB models/migrations/API routes + rewiring the 3 institution frontend pages off mock data (was the audit's #2 gap).
- **Mobile app real-backend wiring** — was mid-verification, stopped at user's request, resume when asked.
- **Multilingual e-learning (i18n)** — audit found the language selector is decorative only (no real translation). Not yet started — needs a scope decision (which screens, real translation infra vs. a lightweight dictionary) before building.
