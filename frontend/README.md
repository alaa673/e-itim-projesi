# PUSULA — Eğitim Portalı (Frontend)

Frontend for an education platform with three roles — **Yönetici (administrator)**, **Öğretmen (teacher)** and **Öğrenci (student)** — for primary, middle and high schools. It covers school administration, an exam archive built from PDFs, lessons and AI-assisted content, exams and homework, topic-based analysis with personal support exercises, exam preparation (LGS / YKS) and future guidance.

> **Status:** every menu page of every role is implemented. `npm run dev` runs it on clearly labelled **demo data**; `npm run dev:api` and the production build talk to the real backend, which is being built separately against [`docs/BACKEND_API_REQUIREMENTS.md`](docs/BACKEND_API_REQUIREMENTS.md). **Backend developers: start with [`docs/BACKEND_HANDOFF.md`](docs/BACKEND_HANDOFF.md).**

## Pages

**Shared:** sign-in with username or e-mail (password toggle, Caps Lock hint, session-expired notice, privacy notice; demo role cards in demo mode only), first-login password change, profile, password & account settings (theme, language, notification preferences), help with FAQ and problem reports, calendar, meetings, messages, announcements, 404 and "no access".

| Role | Pages |
|---|---|
| Yönetici | Overview · Teachers · Students · Bulk import (CSV with validation preview) · School years & terms · Classes & sections · Subjects & topics · Teacher assignments · PDF upload · Question review · Approved questions · Processing status · High schools · Universities & programs · Careers & skills · Data updates · Announcements · Support requests · Platform usage · AI usage · Audit log · Institution · Permissions · AI settings · Integrations & notifications · Archive & retention |
| Öğretmen | Overview · My classes · My students · Study groups · Lessons & summaries (AI summary from PDF) · Question bank (AI question drafts) · Presentations (AI slide drafts) · Class exams · Mock exams · Assignments · Activities · Rubrics · Submissions & grading · Appeals · Results & analysis (send support exercise) · Individual support · Reports (CSV / print) · Calendar · Meetings · Messages · Announcements |
| Öğrenci | Home · Subjects · Summaries & files · Exams (timed player) · Homework (submit text/file) · Activities · Results (appeal) · Topic analysis · Support exercises · Mistake notebook · Goals · Topic practice · Mock exams (LGS/YKS net rules) · Mock history · Interests & skills · Preference assistant · Program suggestions\* · Career suggestions\* · Career roadmap\* · Saved list (reorder, notes, print) · Calendar · Meetings · Messages · Announcements |

\* high school only. Primary-school students do not see exam preparation or guidance; the routes are guarded too.

Cross-cutting: Turkish (default) and English only, light and dark themes, a colour per role, responsive layout with a mobile drawer, global search, notifications (open the linked page, refreshed every minute), breadcrumbs and page titles, 20-record batches with "20 Daha Fazla Göster" on every list, server-graded exams, error pages that recover from failed page loads after an update, keyboard- and screen-reader-friendly components.

## Demo mode — what is real and what is simulated

With `VITE_API_MODE=mock` (development and the demo builds):

- The sign-in page shows **"Demo erişimi"** with one-click role cards. The form also accepts the demo-only accounts `yonetici`, `ogretmen`, `ogrenci` (middle school) and `lise` (high school) — or `<name>@demo.okul` — with the password `demo1234`.
- The header shows **"Demo verisi"**; changes last only for the browser session and every save toast says so. The "Örnek … ekranı" switch changes role or student level.
- AI features (summaries, questions, slides, PDF question extraction) are **simulated from templates** and labelled as such. Program suggestions are a transparent rule-based match, not AI.
- School, university and career figures are **fictional** and labelled as such.
- Password changes are checked but never applied; meeting links are placeholders; the AI key is never stored.

None of this exists in real mode: demo data, demo accounts and demo portraits are not even part of a real build (CI checks it).

## Tech stack

React 18 · TypeScript (strict) · Vite 6 · React Router 7 · Tailwind CSS 3 (CSS-variable tokens) · i18next · React Hook Form + Zod · lucide-react · Vitest 4 + Testing Library. Fonts (Plus Jakarta Sans, Figtree, Caveat) are self-hosted. Requires **Node.js ≥ 20.19** (`.nvmrc`: 22).

## Commands

```bash
npm ci                 # install the exact versions from package-lock.json
npm run dev            # demo mode (mock data) → http://localhost:5173
npm run dev:api        # real mode: /api is forwarded to the backend at http://localhost:3000
npm run typecheck      # TypeScript project check
npm run lint           # ESLint
npm test               # unit + integration tests (Vitest)
npm run build          # production build, REAL mode (.env.production, API at /api) → dist/
npm run build:demo     # single self-contained HTML demo → dist-demo/index.html
npm run build:firebase # demo build with clean URLs for Firebase Hosting → dist/
npm run build:artifact # demo body for hosts that add their own <html> skeleton → dist-demo/akilli-egitim-portali.html
```

If `npm ci` fails with `Cannot read properties of null (reading 'edgesOut')` (a bug in some npm 10 releases), run `npx -y npm@11 ci`.

`dist-demo/index.html` opens directly from disk (double-click) — no server needed.

## Deploy to Firebase Hosting (Google)

Publishes the demo build (demo data, demo sign-in, clean URLs) to `https://<project-id>.web.app`.

```bash
npm install -g firebase-tools   # once
firebase login                  # once, opens the browser
firebase use --add              # once, pick your Firebase project (creates .firebaserc)
npm run deploy                  # build:firebase + firebase deploy --only hosting
```

- `npm run build:firebase` uses `.env.firebase` (`VITE_API_MODE=mock`, `VITE_ROUTER_MODE=browser`) and writes `dist/`.
- `firebase.json` rewrites every path to `index.html`, caches `/assets/**` for a year and never caches `index.html`.
- No secrets are needed or shipped.

## Environment

Each command has a committed mode file (none contains secrets):

| File | Used by | Mode |
|---|---|---|
| `.env.development` | `npm run dev` | mock |
| `.env.api` | `npm run dev:api` | real, `/api` forwarded to `VITE_DEV_API_TARGET` |
| `.env.production` | `npm run build` | real, API at `/api` on the same origin |
| `.env.demo` · `.env.firebase` | demo builds | mock |
| `.env.test` | `npm test` | mock |

Personal overrides go in `.env.local` or `.env.<mode>.local` (git-ignored); see `.env.example`.

| Variable | Values | Purpose |
|---|---|---|
| `VITE_API_MODE` | `mock` \| `real` | `mock` = in-memory demo data and demo sign-in; `real` = calls the backend |
| `VITE_API_BASE_URL` | `/api` or URL | Backend base URL (real mode) |
| `VITE_DEV_API_TARGET` | URL | `npm run dev:api` only: where `/api` is forwarded (default `http://localhost:3000`) |
| `VITE_ROUTER_MODE` | `browser` \| `hash` \| `memory` | URL strategy (`browser` needs SPA rewrites on the host) |
| `VITE_API_TIMEOUT_MS` | number | Request timeout (default 15000; AI generation 120000) |
| `VITE_PRIVACY_URL` | https URL | Optional link to the school's privacy notice (KVKK); otherwise a built-in summary is shown |

Never put secrets in `VITE_` variables — they are shipped to the browser. AI provider keys live on the server only.

## Working with the backend

- Contract (every request, body and response): [`docs/BACKEND_API_REQUIREMENTS.md`](docs/BACKEND_API_REQUIREMENTS.md).
- Running the frontend against a local backend, build order, curl checks, nginx example: [`docs/BACKEND_HANDOFF.md`](docs/BACKEND_HANDOFF.md).
- Pages never call `fetch` directly; paths and shapes live in the service files (`src/services/`, `src/features/*/services/`), so contract changes stay in one place.

## Repository and continuous integration

This app lives in `frontend/` of the team repository [`alaa673/e-itim-projesi`](https://github.com/alaa673/e-itim-projesi); the backend goes next to it in `backend/`.

```bash
git clone https://github.com/alaa673/e-itim-projesi.git
cd e-itim-projesi/frontend
npm ci
```

`.github/workflows/frontend-ci.yml` (at the repository root) runs on every push to `main` and every pull request that touches `frontend/`: `npm ci`, typecheck, lint, tests, the real build (and a check that it contains no demo data) and the demo build.

`.gitignore` excludes `node_modules/`, `dist/`, `dist-demo/`, `coverage/` and `*.local` env files.

## Folder structure

```
src/
  app/            App, router (+ router.test), providers (auth, theme), guards (ProtectedRoute, RoleGuard, LevelGate)
  components/     ui · data · form · charts · quiz · slides · dashboard · layout · brand
  layouts/        DashboardLayout
  features/
    auth/         sign-in
    account/      profile, account settings, help (all roles)
    admin/        pages, services/adminApi, hooks/useSettings, components
    teacher/      pages, services/teacherApi + teacherService, components
    student/      pages, services/studentApi + studentPortalService, components
    shared/       announcements, calendar, meetings, messages, 404, no access
  services/       api.ts (HTTP client: cookies, CSRF, timeouts), resource.ts (list/CRUD helper), authService, notificationService, endpoints
  hooks/          useIncrementalList, useResourceList, useListQuery, useAction, useAsync, useOpenParam, …
  config/         constants (TABLE_BATCH_SIZE = 20), navigation, roles, catalog
  mocks/          demo data (db/*), handlers, demo accounts and portraits — lazy-loaded in mock mode only
  i18n/           i18next setup, locales/{tr,en}/*.json
  styles/         fonts, variables (light + role tokens), themes (dark), globals
  assets/         illustrations and avatars (WebP)
docs/
  BACKEND_HANDOFF.md          how to run the frontend against the backend
  BACKEND_API_REQUIREMENTS.md every request the frontend makes (proposed contract)
  FRONTEND_ARCHITECTURE.md
```

## Known limitations

- The backend is not built yet: every contract in `docs/BACKEND_API_REQUIREMENTS.md` is a **proposal** for the backend developer to confirm or change.
- AI, PDF processing, file storage, e-mail notifications and video meetings need the backend; the demo simulates them and says so.
- Guidance data (schools, programs, careers) is fictional until the administrator imports real data.
- Frontend guards are UX only; the backend must enforce every permission.
