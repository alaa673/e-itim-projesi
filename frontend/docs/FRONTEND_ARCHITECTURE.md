# PUSULA — Frontend architecture

## Routing

- All routes are defined in `src/app/router.tsx` and generated from the central menu in `src/config/navigation.ts` (one entry = one page). Account pages (profile, settings, help) come from `ACCOUNT_PAGES` and exist under every role prefix.
- Each role has a prefix (`/admin`, `/teacher`, `/student`). Every page is lazy-loaded from `PAGES[role][id]`; `src/app/router.test.ts` fails if a menu entry has no page.
- Guards (UX only — **the backend authorises every request**):
  - `ProtectedRoute` sends anonymous users to `/login` and remembers the requested path; after sign-in the user returns there only if it belongs to their own role. Users with `mustChangePassword` are kept on `/change-password` until they set a new password.
  - `RoleGuard` shows "no access" when a user opens another role's area.
  - `LevelGate` hides level-restricted student pages (e.g. university tools for middle school) even when the URL is typed directly.
- Deep links: `?open=<id>` opens a record's dialog (`useOpenParam`), router state flags (`useStateFlag('openCreate')`) open a create dialog from a dashboard button, and `useParam` keeps simple selections (e.g. `?subject=`) in the URL.
- Router mode comes from `VITE_ROUTER_MODE` (`browser`, `hash`, `memory`).
- Errors: every role area and the top-level routes have `errorElement: <RouteErrorPage />`. A failed lazy chunk (typically a new deployment while the tab was open) shows "PUSULA güncellendi" with a reload button; other errors show a generic message with reload / home; unknown paths show the 404 page.
- Page titles: `DashboardLayout` sets `document.title` to `<page> · PUSULA` from the breadcrumbs (`useCrumbs`), and pages outside the layout use `useDocumentTitle`. The content area scrolls back to the top on navigation.

## Authentication

- `AuthProvider` exposes `useAuth()` (`status`, `user`, `isDemo`, `sessionExpired`, `login`, `loginAsDemo`, `logout`, `passwordChanged`).
- Sign-in takes an `identifier` (username **or** e-mail) and a password.
- Real mode: an httpOnly session cookie set by `POST /auth/login`; the session is restored with `GET /auth/me`. No token is stored in JavaScript. The API client sends `X-Requested-With`, `Accept-Language` and, on unsafe methods, the `XSRF-TOKEN` cookie as `X-XSRF-TOKEN` (double-submit CSRF).
- Mock mode: only the demo user id is kept in `sessionStorage` (or `localStorage` with "remember me") and resolved to a demo record (`src/mocks/mockUsers.ts`, lazy-loaded). The demo role cards (`DemoAccess`) and the header's demo switcher are lazy too, so a real build contains neither.
- Any 401 from the API client clears the session; if the user was signed in, the sign-in page explains that the session ended.
- First sign-in: `user.mustChangePassword` → `/change-password` (`ChangePasswordPage`, reusing `PasswordForm`); `passwordChanged()` clears the flag locally after `POST /me/password` succeeds.

## Role- and level-aware navigation

`getNavigation(role, level)` returns the menu for a user. Students only see sections suited to their level: primary school has no exam preparation or guidance; university tools (program suggestions, careers, roadmap) are for high school only. Labels come from `nav.<role>.<id>` and page titles always equal the menu label, so breadcrumbs and headings match.

## Visual system (PUSULA)

- Fonts (self-hosted, no third-party requests): **Plus Jakarta Sans** for headings, **Figtree** for text, **Caveat** for the hand-written notes on banners.
- Warm canvas `#FBF8F3`, white cards with 20 px radius, lime highlight `#D4F46A` (active menu item, goal card), pastel tints `violet / mint / peach / sky` with text-safe `ink` steps (`src/components/dashboard/tones.ts`).
- **One colour per role** (`[data-role]` in `src/styles/variables.css`, dark steps in `themes.css`):

| Role | Primary | Sidebar | Personality |
|---|---|---|---|
| Yönetici | `#3D5FD9` | navy `#172458` | professional, organised |
| Öğretmen | `#0B7F6B` | deep green `#0D3B35` | calm, analytical |
| Öğrenci | `#6C3BE6` | deep purple `#2A1458` | playful, motivating |

- Semantic tokens (`--primary`, `--accent-soft`, `--accent-ink`, `--ring`, `--chart-emphasis`, `--banner-*`, `--sidebar*`) resolve from the role on every `[data-role]` element. `DashboardLayout` sets `data-role` on `<body>`, so portals (dialogs, toasts) follow the role too.
- The sidebar is a dark "theme island" with a landscape illustration (`SidebarLandscape`); its components need no special styling.
- Illustrations are local WebP files in `src/assets/illustrations` (banners per role, course cards, goal flag, support book) and avatars in `src/assets/avatars`. Decorative images are `aria-hidden` with empty `alt`.
- Contrast: text pairs ≥ 4.5:1 and UI graphics ≥ 3:1 in both themes; small coloured text only uses `ink` / `accent-ink` steps.
- Dark mode: `data-theme="dark"` on `<html>`, set before first paint by an inline script in `index.html` and persisted by `ThemeProvider` (`sep.theme`).
- Motion is subtle and switched off by `prefers-reduced-motion`.
- Printing: `.no-print` hides the app chrome; reports and the saved list print cleanly (`@media print` in `globals.css`).

## Language system

- i18next namespaces: `common`, `auth`, `admin`, `teacher`, `student`, `shared`, `account` in `src/i18n/locales/{tr,en}`.
- **Turkish is the default and the only fallback; English is the only other language.** No other language or RTL support exists by design.
- The choice is stored in `localStorage` (`sep.lang`) and mirrored to `<html lang>`. Dates and numbers use `Intl` via `src/utils/format.ts`.
- `src/i18n/i18n.test.ts` fails if a key exists in one language but not the other, or if a string is empty.

## Lists and the 20-record batch rule

- `TABLE_BATCH_SIZE = 20` (`src/config/constants.ts`).
- `useIncrementalList` / `useResourceList` request `{ offset, limit: 20 }`, append the next batch on "20 Daha Fazla Göster", de-duplicate by id, keep loaded rows if a later batch fails (with retry), and restart from the first batch when search, filters or sort change. `refreshSilently` re-reads loaded rows without a loading state (live processing statuses).
- `useListQuery` keeps search (debounced), filters and sort; `FilterBar` renders them.
- `ResourceTable` → `DataTable`: semantic `<table>` with caption, `scope` headers, `aria-sort`, skeleton/empty/error states, responsive column hiding and the `LoadMoreBar` footer. Card lists use `ListFooter` for the same behaviour.

## Data layer

- `src/services/api.ts`: base URL, JSON and `FormData` bodies, `credentials: 'include'`, timeouts, abort, normalised `ApiError` kinds and `fieldErrors` for forms.
- `createResourceService(endpoint, mockSource, build)` (`src/services/resource.ts`) gives a feature list/get/create/update/remove against the real API, or against an in-memory collection in mock mode. `mockOr(real, mock)` does the same for one-off actions.
- Mock data lives in `src/mocks/db/*` and is **lazy-imported** only in mock mode, so a real build never loads demo data. Collections (`src/mocks/collection.ts`) implement the same search / filter / sort / offset contract as the backend and honour `AbortSignal`.
- Demo stores are cross-linked so actions show up elsewhere in the same session (e.g. a support exercise sent by the teacher appears on the student's page; a student appeal appears in the teacher's appeals; a help request appears in the admin's support requests).
- A failed real request is **never** replaced by mock data.
- **Teaching scope:** teacher pages never hard-code classes or topics. `useTeachingScope()` loads `GET /teacher/scope` once per signed-in teacher (shared cache) and offers `classNames`, `topicsFor(class)`, `allTopics`, `subjectOf(classes)`, loading/error and `retry`. Shared pages use `useClassNames(role)` (admin: `/admin/lookups/classes`, teacher: the scope).
- **Server grading:** exam and mock-exam questions arrive without answers. `QuizPlayer` takes a `submit(answers, seconds)` callback that resolves to `{ answerKey, explanations }` and builds the review from it; a failed submit keeps the answers on screen with a retry button, and the timer auto-submits. Practice and support exercises carry their answers for instant feedback.
- **Files:** `resolveFileUrl()` (`src/utils/fileUrl.ts`) accepts `https://` URLs and server paths only; `FileLink` renders a safe download link (or the file name with a "sample file" note in demo mode). `Avatar` shows `avatarUrl`, else initials.
- **Notifications:** `NotificationMenu` refreshes every 60 s, shows `title` or a known `titleKey`, marks one item read (`POST /notifications/:id/read`) and opens its in-app `link`.
- Nested items created in the browser get `tmp-…` ids (`src/utils/id.ts`); the server replaces them on save.

## Honesty rules in demo mode

- Header badge "Demo verisi"; every save toast adds "Demo modunda değişiklikler yalnızca bu oturumda görünür."
- Simulated AI output carries `SimulatedNote` ("Demo: Bu içerik yapay zekâ ile üretilmedi…").
- Fictional guidance data carries `DemoDataNote`.
- Password changes are verified against the demo password but never applied; meeting links are placeholders; the AI key is never stored, only a masked hint.

## State management

No global store. Auth, theme and toasts use context; server data is fetched per page with `useAsync` / `useResourceList`; actions go through `useAction` (busy state + success/error toasts); forms use React Hook Form + Zod (`FormModal` for declarative dialogs; messages are i18n keys); dialogs stack correctly (`Modal` keeps a stack so Escape closes only the top one).

## Shared building blocks

| Folder | Pieces |
|---|---|
| `components/ui` | Button (+ `buttonClass`), IconButton, Input, Textarea, Select, Checkbox, Switch, SegmentedControl, Tabs, Badge, Panel, Modal (dialog + side sheet), ConfirmDialog, DataTable, FileDrop, FileLink, DetailList, Avatar, Toast, States (Empty/Error/Skeleton/AsyncContent), DemoDataNote, SimulatedNote |
| `components/data` | ResourceTable, ListFooter |
| `components/form` | FormModal, FilterBar, shared Zod validators |
| `components/charts` | LineChart, HBars, TopicBars, Meter, score colour helpers |
| `components/quiz` | QuizPlayer (practice / exam modes, timer with auto-submit, server-graded submit with retry, LGS/YKS net rules, review, save mistakes) |
| `components/slides` | SlideDeck (presentation preview) |
| `components/dashboard` | HeroBanner, StatTile, colour tones |
| `components/layout` | Sidebar, Header, GlobalSearch, NotificationMenu, AccountCard, LanguageMenu, ThemeToggle, Breadcrumbs, PageHeader, RelativeTime |
| `config/catalog.ts` | fixed reference lists (cities, school types, score types, career fields, branches, badge tones) |

## Adding a page

1. Add the entry to `src/config/navigation.ts` (with `levels` if it is level-restricted).
2. Create `src/features/<role>/pages/MyPage.tsx` with a default export and register it in `PAGES[role][id]` in `src/app/router.tsx`.
3. Add a service (real + mock) in `src/features/<role>/services/` and document the endpoint in `docs/BACKEND_API_REQUIREMENTS.md`. Load demo data with a dynamic `import('@/mocks/…')` inside the mock branch (`mockOr`, `createResourceService`) — never a static import — so real builds stay free of it.
4. Add `tr` and `en` strings; run `npm run typecheck && npm run lint && npm test` (translation parity and router coverage) — CI runs the same.
