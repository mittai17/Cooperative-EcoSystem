# NURVEX — Remaining Work Handoff Prompts

Paste each prompt into Antigravity, one at a time, in the order given.
Repo root: `/home/mittai/Documents/Cooperative-EcoSystem`
App root: `apps/web`

---

## SHARED CONTEXT (paste this at the top of every prompt)

```
PROJECT
Next.js 16.3.6 App Router monorepo at /home/mittai/Documents/Cooperative-EcoSystem, app root apps/web.
React 19.2.8, TypeScript, Tailwind + shadcn/ui. Brand is now NURVEX (glossy red ribbon "N" emblem at
apps/web/public/brand/nurvex-mark.png, wordmark rendered as live text by src/components/brand/logo.tsx).
Platform: Indian cooperative-sector workforce product. L5/L6 users: admin, institution, trainer, employer, trainee, kiosk.

READ FIRST
- apps/web/AGENTS.md  (states this Next.js version has breaking changes vs your training data; you must
  read the relevant guide under apps/web/node_modules/next/dist/docs/ before writing code)
- apps/web/CLAUDE.md

ARCHITECTURE YOU MUST KNOW
apps/web/src/lib/api.ts is the ONLY mock-aware HTTP layer. It exports exactly three things:
  - fetchWithAuth(path, options)  — when process.env.NEXT_PUBLIC_MOCK_API !== 'false' (the intended default)
    GETs are served by an internal mockFetch(path) and NO network call happens. mockFetch THROWS for any
    path it does not explicitly handle.
  - getApiBase()   — returns the REAL backend base URL (http://localhost:8000)
  - resolveAuthToken() — demo bearer token

ROOT PROBLEM ALREADY IDENTIFIED (do not re-diagnose)
apps/web/.env.local sets NEXT_PUBLIC_MOCK_API=false. That single line DISABLES the entire mock layer,
so every role page falls through to a real FastAPI backend on localhost:8000 that is not running, and
every page 401/403/404/422s. Several role modules also call fetch(`${getApiBase()}${path}`) directly,
which bypasses mockFetch entirely. A previous audit of 146 routes found 57 broken for this reason.

WORK ALREADY COMPLETED (do not redo)
- trainee portal: fixed (25 routes)
- trainer portal: fixed (26 routes)
- employer portal: fixed (24 routes) via a role-local mock-first gateway at src/lib/employer/employer-http.ts
  (defaults to mock unless NEXT_PUBLIC_EMPLOYER_LIVE_API === "true")
- full rebrand CoopSetu AI -> NURVEX (629 references across 102 files); zero "coopsetu" strings remain;
  tsc clean; eslint improved from a 70-error/249-warning baseline to 41 errors / 152 warnings

RULES
- Do NOT run `next build` or `next dev` while other prompts may be in flight; a full production build takes
  15-20 min on this machine (15 GB RAM, memory constrained). Verify with `npx tsc --noEmit --incremental false -p tsconfig.json`
  and `npx eslint <your changed files>` instead. The final build is run once at the end.
- Do NOT add code comments. Do NOT add emojis.
- Reuse existing components (components/ui, components/dashboard/page-header, components/trainer/states ErrorState).
  Do NOT invent new UI primitives or colour schemes.
- Keep existing visual/styling patterns. Data realism: Indian cooperative-sector context, INR, IST timestamps,
  realistic Indian names. Copy ID formats and object shapes from neighbouring fixtures — never invent a new ID scheme.
- Never leave a page in a "coming soon" / "no data" / "no results" / "0 results" state when mock data can populate it.
- Never commit secrets. apps/web/.env.local holds real Clerk keys and a Neon Postgres DSN and is gitignored — leave it that way.

VERIFICATION TOOLING THAT ALREADY EXISTS
A Playwright crawler was used to audit all routes. Pattern to reuse:
  cd /home/mittai/Documents/Cooperative-EcoSystem
  NODE_PATH=$PWD/node_modules node <script>     # script requires('playwright')
It reports per route: HTTP status, console errors, page errors, failed network requests, visible text length,
table row count, card count, and flags thin/stub/empty pages.
```

---

## PROMPT 1 — Fix the mock layer being globally disabled (do this FIRST, highest leverage)

```
TASK
Make the mock-first architecture actually engage. Right now apps/web/.env.local sets
NEXT_PUBLIC_MOCK_API=false, which makes mockFetch dead code and sends every portal to a real
backend on localhost:8000 that is not running.

WHAT TO DO
1. Read apps/web/.env.local and apps/web/src/lib/api.ts (the mock switch is around line 241 in fetchWithAuth).
2. Change the .env.local flag so mock data is used by default. Note the guard is `!== 'false'`, so the
   cleanest fix is to remove the NEXT_PUBLIC_MOCK_API=false line entirely (or set it to "true"). Keep
   NEXT_PUBLIC_API_URL as-is. Do not touch the Clerk or DATABASE_URL values.
3. Because mockFetch THROWS `API Error: 404 Not Found (mock endpoint <path> not implemented)` for any
   unhandled path, extending it is part of this task. Extend mockFetch to cover the endpoints the
   admin, institution and kiosk portals request. You will need to run those crawls yourself to enumerate
   them — see PROMPT 5 for the crawler. Build fixtures under apps/web/src/lib/mock-data/.
4. There are known defects in mockFetch to fix while you are in there:
   - `/api/v1/employer/jobs` returns a BARE ARRAY, but listEmployerJobs() expects `{ jobs: [...] }`.
     It silently falls through. Return `{ jobs: mockEmployerJobs }`.
   - The inline `mockEmployerJobs` array in api.ts (ids job-01..job-03) is a THIRD duplicate of the job set,
     with different ids than src/lib/employer/jobs-api.ts and src/lib/mock-data/employer.ts. Delete it and
     re-export from src/lib/employer/fixtures/catalog.ts so there is one source of truth.
   - The `/api/v1/trainee/ai-interview` branch near line 162 is currently unreachable dead code.
   - mockFetch has NO employer endpoint handling beyond /dashboard and /jobs (interviews, offers, feedback,
     talent-pool, candidates, applications, analytics, reports/*, company, team, settings).
     Note src/lib/employer/employer-http.ts already resolves 45+ of these — wire mockFetch to delegate:
       if (p.startsWith("/api/v1/employer/") || p === "/api/v1/jobs/mine" || p === "/api/v1/skills/demand")
         return employerRequest(path, { method: "GET" });   // import from "@/lib/employer/employer-http"
   - `useApi()` in apps/web/src/lib/use-api.ts ALWAYS hits the real backend regardless of the flag. That is
     why /trainee/assessments and /trainer/attendance 401'd. Make it respect the mock flag too.
5. Known residual failure to confirm is gone: GET /api/v1/trainer/dashboard returns 404. The trainer mock
   resolver lives in src/lib/trainer/api.ts (exported from a "use client" module, so it cannot be imported
   into api.ts). Split the pure `resolveMock` function out into src/lib/trainer/mock-resolver.ts (no "use client",
   no React imports) so api.ts can call it, then add the one-line delegation in mockFetch:
     if (p.startsWith("/api/v1/trainer/")) { const { resolveTrainerMock } = await import("@/lib/trainer/mock-resolver"); return resolveTrainerMock(path, "GET", {}); }
   Keep the existing exported names and behaviour of src/lib/trainer/api.ts unchanged for its current callers.

VERIFY
- npx tsc --noEmit --incremental false -p tsconfig.json
- npx eslint src/lib/api.ts src/lib/use-api.ts src/lib/trainer/mock-resolver.ts
- Confirm with a crawler that zero routes request http://localhost:8000 any more.

REPORT
Which endpoints you added to mockFetch, the defects you fixed, the .env.local change you made, and any
endpoint still not covered.
```

---

## PROMPT 2 — Admin portal (26 routes, never audited/fixed)

```
TASK
Audit and fix every page under apps/web/src/app/admin (26 routes). Then mock-fill anything empty.

YOU OWN (edit freely)
- apps/web/src/app/admin/**
- apps/web/src/components/admin/**
- apps/web/src/lib/admin/**
- apps/web/src/lib/mock-data/admin.ts, programmes.ts, programmes-data.ts, applications-data.ts

OFF-LIMITS (other prompts own these; report needs instead of editing)
- apps/web/src/lib/api.ts, src/lib/types.ts, src/lib/use-api.ts
- apps/web/src/i18n/**
- apps/web/src/components/ui/**, components/layout/**, components/dashboard/**
- apps/web/src/components/hostel/**, components/logistics/**
- src/lib/mock-data/{dashboards,institution,trainer,employer,kiosk,courses,skills,certificates}.ts
- any other role's app/, lib/ or components/ directory
- package.json, next.config.ts, tsconfig.json, .env.local

CURRENT STATE
`next build` succeeds, so nothing is a compile error. The failures are runtime:
- GET http://localhost:8000/api/v1/admin/dashboard -> 403 Forbidden
- GET http://localhost:8000/api/v1/admin/institutions/<id> -> 422 Unprocessable Content
  (422 because a UUID is expected and the placeholder id was not one; detail routes must degrade to a
  proper not-found state for an unknown id rather than erroring)
- src/lib/admin/admin-api.ts builds request URLs but never actually fetches through the mock layer.

ROUTE LIST
/admin/dashboard, /admin/assessments, /admin/assessments/new, /admin/audit-logs, /admin/certifications,
/admin/employment, /admin/institutions, /admin/institutions/new, /admin/institutions/[id],
/admin/institutions/[id]/edit, /admin/jobs-placements, /admin/jobs-placements/new, /admin/profile,
/admin/programmes, /admin/programmes/new, /admin/reports, /admin/settings, /admin/skill-demand,
/admin/skill-passport, /admin/trainees, /admin/trainees/new, /admin/trainers, /admin/trainers/new,
/admin/user-management, /admin/user-management/new  (plus /admin/layout.tsx)

KNOWN FALSE POSITIVE — verify, do not blindly "fix"
An earlier crawler flagged HTTP_ERROR_TEXT on /admin/dashboard, /admin/employment and /admin/reports. That
heuristic matched the standalone words 404/500/error anywhere in page text, which is probably a legend or a
status column. Check these three pages semantically and only change them if there is a real defect.

ALSO NOTE
apps/web/src/components/admin/dashboard/welcome-banner.tsx renders correctly today. Do not regress it.

DO
Every admin page must render realistic, non-empty data with NO console errors and NO failed network
requests to localhost:8000. Wire it through the mock layer established in PROMPT 1. Fill thin or empty
pages with rich fixtures. Give every list page enough rows that pagination and filters are exercised.
Confirm /admin/institutions/[id] and /admin/institutions/[id]/edit resolve ids that the list page can
actually produce, and show a clean not-found state for an unknown id.

VERIFY
npx tsc --noEmit --incremental false -p tsconfig.json
npx eslint src/app/admin src/components/admin src/lib/admin src/lib/mock-data/admin.ts

REPORT
Table of all 26 routes: route -> OK / fixed / still-broken -> what changed. Plus anything PROMPT 1 must add
to mockFetch (exact path string + response shape).
```

---

## PROMPT 3 — Institution portal + hostel/logistics lint (42 routes, never audited/fixed)

```
TASK
Audit and fix every page under apps/web/src/app/institution (42 routes), mock-fill anything empty, and
clear the 41 remaining eslint ERRORS that live in this scope. This is the largest and lint-dirtiest area.

YOU OWN (edit freely)
- apps/web/src/app/institution/**
- apps/web/src/components/institution/**
- apps/web/src/components/hostel/**
- apps/web/src/components/logistics/**
- apps/web/src/lib/hostel/**
- apps/web/src/lib/logistics/**
- apps/web/src/lib/mock-data/institution.ts
- apps/web/src/app/trainee/hostel/** and apps/web/src/app/trainer/hostel/** and
  apps/web/src/app/trainer/hostel/** (these read the same hostel fixtures you own)

OFF-LIMITS (other prompts own these; report needs instead of editing)
- apps/web/src/lib/api.ts, src/lib/types.ts, src/lib/use-api.ts
- apps/web/src/i18n/**
- apps/web/src/components/ui/**, components/layout/**, components/dashboard/**
- src/lib/mock-data/{dashboards,trainer,employer,admin,kiosk,courses,skills,certificates,programmes,programmes-data,applications-data}.ts
- apps/web/src/lib/trainee/**, apps/web/src/lib/trainer/**, apps/web/src/app/trainee/** (except hostel), apps/web/src/app/trainer/** (except hostel), apps/web/src/app/admin/**, apps/web/src/app/employer/**
- package.json, next.config.ts, tsconfig.json, .env.local

CURRENT STATE
- GET http://localhost:8000/api/v1/users/batches -> 401 (on /institution/trainees)
- GET http://localhost:8000/api/v1/users/?role=trainer&limit=100 -> 401 (on /institution/trainers)
- The hostel feature already uses a local mock store (src/lib/hostel/hostel-service.ts) and never hits the
  network, so it renders — but the trainee agent reported the hostel CONTENT is thin (e.g.
/trainee/hostel/notices renders only 5 notices). Enrich it.
- Cohort-ID mismatch: the hostel pages hardcode `PDA-02` in headings while the trainer fixture dataset uses
  `b-2026-b` / `c-cmf`. Align them to one scheme.

ESLINT ERRORS TO CLEAR (41 errors, all currently in your scope)
  src/app/institution/attendance/page.tsx                              1
  src/app/institution/certificates/page.tsx                            1
  src/app/institution/dashboard/page.tsx                               4
  src/app/institution/hostel/facilities/page.tsx                       1
  src/app/institution/logistics/page.tsx                               2
  src/app/institution/logistics/expenses/page.tsx                      1
  src/app/institution/logistics/incidents/page.tsx                     1
  src/app/institution/logistics/plans/page.tsx                         1
  src/app/institution/logistics/plans/new/page.tsx                     1
  src/app/institution/logistics/plans/[id]/page.tsx                    1
  src/app/institution/logistics/requests/page.tsx                      1
  src/app/institution/logistics/routes/page.tsx                        1
  src/app/institution/logistics/settings/page.tsx                      1
  src/app/institution/logistics/trips/page.tsx                         1
  src/app/institution/logistics/trips/[id]/page.tsx                    1
  src/app/institution/logistics/vehicles/page.tsx                      1
  src/app/institution/profile/page.tsx                                 1
  src/app/institution/programmes/page.tsx                              1
  src/app/institution/settings/page.tsx                                1
  src/components/hostel/add-hostel-modal.tsx                           1
  src/components/hostel/create-notice-modal.tsx                        1
  src/components/hostel/export-utils.ts                                1
  src/components/hostel/report-issue-modal.tsx                         2
  src/components/institution/people-roster.tsx                         1
  src/lib/hostel/hostel-service.ts                                     2
  src/lib/hostel/mock-data.ts                                          2
Known classes: `prefer-const`, `@typescript-eslint/no-explicit-any`, unused vars/imports.
Also 152 warnings remain repo-wide; clear the ones in your scope.

KNOWN CROSS-SCOPED LINT DEBT another agent already reported — fix these too since you own the files:
  src/app/trainer/hostel/page.tsx          unused imports Eye, Button
  src/app/trainer/hostel/allocations/page.tsx  unused imports Bed, CheckCircle2, Clock, Home
  src/app/trainer/hostel/notices/page.tsx  unused import Bell
  src/app/trainer/hostel/requests/page.tsx unused import FileText
  src/app/trainer/hostel/attendance/page.tsx  `setSelectedBatch` assigned but never used — the batch
  selector is non-functional; either wire it up or remove it.

DO
Every institution page must render realistic, non-empty data with NO console errors and NO failed network
requests to localhost:8000. Fill thin or empty pages with rich fixtures across all of hostel (blocks,
rooms, allocations, attendance, facilities, maintenance, occupancy, notices, requests, reports, settings),
logistics (plans, trips, routes, vehicles, expenses, incidents, requests, settings) and the core
institution pages. Make sure list pages have enough rows to exercise pagination and filters.

VERIFY
npx tsc --noEmit --incremental false -p tsconfig.json
npx eslint src/app/institution src/components/institution src/components/hostel src/components/logistics src/lib/hostel src/lib/logistics src/lib/mock-data/institution.ts src/app/trainee/hostel src/app/trainer/hostel
Target: 0 errors, 0 warnings in your scope.

REPORT
Table of all 42 routes -> OK / fixed / still-broken -> what changed. Confirm eslint is clean in your scope.
List anything PROMPT 1 must add to mockFetch (exact path + response shape).
```

---

## PROMPT 4 — Kiosk hydration crashes (3 routes)

```
TASK
Fix the two React hydration crashes in the kiosk portal and make sure all 3 kiosk routes are solid.

YOU OWN (edit freely)
- apps/web/src/app/kiosk/**
- apps/web/src/components/offline/**
- apps/web/src/lib/offline/**
- apps/web/src/lib/mock-data/kiosk.ts

OFF-LIMITS (other prompts own these; report needs instead of editing)
- apps/web/src/lib/api.ts, src/lib/types.ts, src/lib/use-api.ts
- apps/web/src/i18n/**
- apps/web/src/components/ui/**, components/layout/**, components/dashboard/**
- src/lib/mock-data/{dashboards,institution,trainer,employer,admin,courses,skills,certificates,programmes,programmes-data,applications-data}.ts
- any other role's app/, lib/ or components/ directory
- package.json, next.config.ts, tsconfig.json, .env.local

CURRENT STATE — HARD HYDRATION CRASHES
  /kiosk        -> Minified React error #418 with args[]=HTML
  /kiosk/status -> Minified React error #418 with args[]=text
React #418 is a hydration mismatch: the server-rendered HTML does not match the first client render.
Get the UNMINIFIED message by running `npx next dev -p 3100` and loading the pages, or by reasoning from
the markup. Usual causes in this codebase: rendering Date/time/Intl output that differs between server and
client, `Math.random()`, `window`/`navigator` reads during render, invalid nesting such as a <div> inside a
<p>, browser extensions injecting DOM, or a `<p>` whose child is a block element. Note the kiosk pages use
src/components/offline/pwa-provider.tsx, which currently has 2 eslint errors — check it too.

Note: args[]=HTML suggests a structural/nesting problem rather than a text mismatch, so inspect element
nesting in the kiosk page components first.

ALSO
- The kiosk renders certificate CST-2026-DAI-00842 from src/lib/mock-data/kiosk.ts. The trainee portal was
  just changed to show Ravindra Suresh Patil as the canonical trainee (src/lib/trainee/identity.ts). Keep the
  kiosk rows winning for that certificate id, and make sure kiosk certificate rows and the trainee portal do
  not contradict each other on the same certificate id.
- /kiosk and /kiosk/status should render fully offline-capable data. Confirm nothing reaches localhost:8000.

VERIFY
npx tsc --noEmit --incremental false -p tsconfig.json
npx eslint src/app/kiosk src/components/offline src/lib/offline src/lib/mock-data/kiosk.ts
Then load all 3 routes with a Playwright crawler in a production build and confirm ZERO page errors.

REPORT
The unminified React #418 message, the root cause, the fix, and confirmation that all 3 kiosk routes are clean.
```

---

## PROMPT 5 — Final verification, then deploy

```
TASK
Prove the whole app is healthy, then get it deployed. The live site is stale and serving old broken code.

YOU OWN
- everything, but this prompt is primarily verification, the shared HTTP gateway, and deployment config.

PART A — FULL CRAWL
Build once and crawl every role route with Playwright.
  cd apps/web && npx next build          # expect 0 errors; takes 15-20 min, memory constrained
  setsid nohup npx next start -p 3000 > /tmp/next.log 2>&1 < /dev/null & disown
Crawl all routes under /trainee, /trainer, /admin, /employer, /institution, /kiosk (146 routes).
For each route record: HTTP status, console errors, page errors, failed network requests, visible text
length, table row count, card count, and flag thin (<400 chars) / stub-text / zero-data pages.
Stub text to flag: "coming soon", "under construction", "no data available", "no results", "lorem ipsum",
"no records found".
Assert: zero routes request http://localhost:8000; zero console errors; zero page errors; zero routes
redirecting unintentionally; zero BROKEN images; zero occurrences of the string "coopsetu" in rendered text.
Screenshots are already written to /tmp/opencode/shots/.
Fix anything still broken, then re-crawl until clean.

PART B — I18N DEFECT (found during the trainee audit, NOT yet fixed)
apps/web/src/i18n/messages/*.json (11 locales) plus src/i18n/fragments/** contain ~202 `trainee.*` leaves whose
VALUE is a Tailwind CSS class name instead of a translatable string — identically across all 11 locales.
Confirmed examples:
  attendance.markAnother / markedAt / qrScan / modeFace = "font-semibold text-foreground"
  attendance.startFaceScan = "failed"
  assessments.*            = "outline"
  hostel.*, hostelNotices.* = "Home"     (this is why every hostel page's <h1> reads "Home")
  applications.colJob / history / colDate = "font-heading text-base"
  common.interviewing / shortlisted / applied / rejected = "${app?.title}"
  skillGraph.*  = "Proficiency Details"
  myLearning.*  = "Sync Queue" / "Offline Cache"
  wizard.*      = 51 class-name values
This is a real, visible bug: class names are being rendered as user-facing text. For each affected key, write
a proper English value in en.json, then a genuine translation in the other 10 locales (hi, mr, ta, te, ml,
bn, gu, kn, pa, or). Do not mass-rewrite t() call sites — fix the data. Keep JSON valid.
Also verify src/i18n/index.ts merges fragments/messages consistently after the rename.

PART C — BRAND CHECK
Brand is NURVEX. Confirm zero "coopsetu" strings case-insensitively across apps/web/src and apps/web/public.
Confirm the mark resolves at /brand/nurvex-mark.png, /brand/nurvex-icon-192.png, /brand/nurvex-icon-512.png,
/favicon.png and /favicon.ico, and that the Logo component's default / full / emblem variants all render on
light AND dark backgrounds. apps/web/public/sw.js CACHE_NAME is now `nurvex-cache-v2` and its activate handler
deletes other caches, so stale `coopsetu-cache-v2` entries will be purged.

PART D — LINT/TYPE GATE
npx tsc --noEmit --incremental false -p tsconfig.json   -> must be 0 errors
npx eslint src public                                    -> target 0 errors (baseline was 70 errors / 249 warnings;
                                                          last measured 41 / 152 before PROMPT 2-4)

PART E — DEPLOY (ask before pushing)
The live URL is https://coopsetuai.spadevity.tech — note the DOMAIN still contains "coopsetuai"; that is
infrastructure/DNS, not code. Confirm with the user whether they want the hostname changed too, since it
implies a DNS record and a TLS certificate.
Deployment previously succeeded (the site returns HTTP 200 and the last commits pushed cleanly to
origin/main). Confirm how this project deploys before assuming — check for a Dokploy config, CI workflow,
or deploy script in the repo, and check git log for prior deploy commits.
Do NOT commit or push until the user confirms.

REPORT
Final crawl summary table (per role: total routes, passing, failing), the i18n keys fixed, lint/type results,
and a clear recommendation on the domain rename.
```

---

## QUICK REFERENCE — what is already done vs outstanding

| Area | Routes | State |
|---|---|---|
| trainee | 25 | DONE — fixed + mock-filled |
| trainer | 26 | DONE — fixed + mock-filled; one residual 404 fixed in Prompt 1 |
| employer | 24 | DONE — fixed + mock-filled (own mock-first gateway) |
| admin | 26 | OUTSTANDING — Prompt 2 |
| institution | 42 | OUTSTANDING — Prompt 3 (+ 41 lint errors) |
| kiosk | 3 | OUTSTANDING — Prompt 4 (2 hydration crashes) |
| brand | — | DONE — NURVEX rebrand, 629 refs, verified on 10 routes |
| i18n | — | OUTSTANDING — Prompt 5B (~202 keys hold CSS class names) |
| deploy | — | OUTSTANDING — Prompt 5E (live site stale, domain still `coopsetuai`) |
