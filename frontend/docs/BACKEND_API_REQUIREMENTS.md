# PUSULA — Backend API requirements (PROPOSED — needs backend confirmation)

Nothing in this file is a confirmed contract. It lists every request the frontend makes in **real mode** (`VITE_API_MODE=real`) and the shapes it expects. To run the frontend against your backend while you build it, see [`BACKEND_HANDOFF.md`](BACKEND_HANDOFF.md). Request/response types live in `src/types/*.ts` and `src/features/<area>/types.ts` (or next to the service). If the backend team changes a path or shape, only the service files in `src/features/*/services/` and `src/services/` need to change — pages do not call the network directly.

Service files (the source of truth for this list):

| Area | File |
|---|---|
| Auth | `src/services/authService.ts`, `src/services/endpoints.ts` |
| Account ("me") | `src/features/account/services/accountApi.ts` |
| Communication | `src/features/shared/services/commsApi.ts` |
| Admin | `src/features/admin/services/adminApi.ts`, `adminService.ts` |
| Teacher | `src/features/teacher/services/teacherApi.ts`, `teacherService.ts` |
| Student | `src/features/student/services/studentApi.ts`, `studentPortalService.ts` |
| Generic CRUD helper | `src/services/resource.ts` |

---

## 1. General

- Base URL: `VITE_API_BASE_URL`. The production build uses **`/api` on the same origin** (a reverse proxy in front of the backend), so cookies are first-party and no CORS is needed. All paths below are relative to it (`/auth/login` → `/api/auth/login`).
- If the API lives on another origin instead, set `VITE_API_BASE_URL=https://api.okul.example/api` at build time and enable CORS for the frontend origin with `Access-Control-Allow-Credentials: true` and the request headers listed below.
- JSON everywhere, except file uploads, which are `multipart/form-data` (noted per endpoint).
- **Session:** an httpOnly, Secure, SameSite=Lax cookie. The frontend sends `credentials: 'include'` and never reads or stores tokens. No user id is sent from the browser for "me" endpoints: the server takes the user from the session.
- **Headers on every request:**

  | Header | Value | Use |
  |---|---|---|
  | `Accept` | `application/json` | |
  | `X-Requested-With` | `XMLHttpRequest` | tells API calls from page loads; forces a CORS preflight cross-site |
  | `Accept-Language` | `tr` or `en` (the UI language) | language of any text the server writes |
  | `Content-Type` | `application/json` | JSON bodies only (the browser sets the multipart boundary itself) |
  | `X-XSRF-TOKEN` | value of the `XSRF-TOKEN` cookie | POST · PUT · PATCH · DELETE, when the cookie exists |

- **CSRF (double submit):** set a **readable** (not httpOnly) `XSRF-TOKEN` cookie (Secure, SameSite=Lax, `Path=/`) and reject unsafe requests whose `X-XSRF-TOKEN` header does not match it. Issue the cookie on `GET /auth/me` — also when it answers 401 — and rotate it at login; `POST /auth/login` may be exempt because no session exists yet.
- Localised content: endpoints that return display text receive `?lang=tr|en`.
- **File links:** fields named `fileUrl` / `attachmentUrl` / `avatarUrl` may be an absolute `https://` URL (e.g. a signed storage URL) or a server path such as `/files/abc.pdf` (resolved against the API origin). Anything else (`http:` outside localhost, `javascript:`, `data:`, `//host`) is ignored by the frontend. Files must only be served to users allowed to see them.
- **Temporary ids:** nested items created in the browser (subject units and topics, rubric criteria) carry ids starting with `tmp-`. Replace them with permanent ids when the parent record is saved and return the saved record.
- Ids are opaque strings; dates are ISO 8601 strings in UTC (`2026-10-18T09:30:00Z`).
- Errors: HTTP status plus an optional body `{ "message": "...", "fieldErrors": { "<field>": "<code>" } }`.
  - The frontend never shows `message`; it maps the status to its own text.
  - `fieldErrors` codes are shown under the matching form field as `validation.<code>` (e.g. `duplicate`, `wrongPassword`).
  - 400/422 validation · 401 session expired (the app signs out) · 403 forbidden · 404 not found · 409 conflict · 429 rate limited · 5xx server.
- Timeouts: 15 s by default (`VITE_API_TIMEOUT_MS`). The AI generation endpoints use 120 s.

## 2. Lists, pagination and the generic resource convention

Every table and card list loads **20 records per batch** ("20 Daha Fazla Göster").

Request: `GET <resource>?offset=<n>&limit=20&search=<text>&sort=<key>&order=asc|desc&<filter>=<value>…`

Response:
```json
{ "items": [ ... ], "total": 143, "offset": 20, "limit": 20 }
```
- `total` is the number of records matching the current search and filters.
- Ordering must be **stable** (use the id as a tiebreaker) so consecutive batches never repeat or skip rows.
- Filters are exact-match query parameters; empty filters are not sent.

Many areas use `createResourceService(endpoint)` (`src/services/resource.ts`). For such a **resource** the frontend may call:

| Method | Path | Body → Response |
|---|---|---|
| GET | `<endpoint>` | list query above → `PaginatedResponse<T>` |
| GET | `<endpoint>/:id` | → `T` |
| POST | `<endpoint>` | `Input` → `T` |
| PATCH | `<endpoint>/:id` | `Partial<Input>` → `T` |
| DELETE | `<endpoint>/:id` | → 204 |

The tables below say which of these each resource needs ("CRUD", "read + PATCH", "read only").

## 3. Auth

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/auth/login` | `{ identifier, password, remember? }` | `User` and sets the session cookie · 401 on wrong credentials · 429 when rate limited |
| GET | `/auth/me` | — | `User` · 401 if there is no session (also issues the `XSRF-TOKEN` cookie) |
| POST | `/auth/logout` | — | 204, clears the cookie |

- `identifier` is exactly what the user typed (trimmed): a **username** (e.g. a school number) **or an e-mail address**. Match either; compare e-mails case-insensitively.
- `remember: true` → a persistent cookie (e.g. 30 days); otherwise a browser-session cookie.
- Return the same 401 for an unknown user and a wrong password (no account enumeration); rate-limit by IP and identifier.

`User` (`src/types/auth.types.ts`):

```ts
{
  id: string;
  role: "admin" | "teacher" | "student";
  firstName: string; lastName: string; email: string;
  username?: string;
  avatarUrl?: string | null;        // see "File links"; initials are shown without it
  mustChangePassword?: boolean;     // true → the app shows only the "set your new password" screen
  level?: "primary" | "middle" | "high"; grade?: number; section?: string;   // students
  subjects?: string[];                                                      // teachers
}
```

**First sign-in:** accounts created or reset by an administrator get `mustChangePassword: true`. The frontend then keeps the user on `/change-password` until `POST /me/password` succeeds. The server must enforce it too: while the flag is set, refuse every endpoint except `/auth/me`, `/auth/logout` and `POST /me/password` with 403.

There is no self-service password reset: accounts are created and reset by the school administrator (the sign-in screen says so).

## 4. Account — every role (`/me`)

| Method | Path | Notes |
|---|---|---|
| GET | `/me/profile` | `AccountProfile` (`src/features/account/types.ts`) |
| PATCH | `/me/profile` | `{ phone, about }` → `AccountProfile`. Name, e-mail, role and class are **not** editable by the user. |
| POST | `/me/password` | `{ currentPassword, newPassword }` → 204. 422 with `fieldErrors.currentPassword = "wrongPassword"` when the current password is wrong. Enforce the password policy (≥ 8 chars, letters + digits), clear `mustChangePassword`, keep the current session and invalidate the others. |
| GET | `/me/notification-preferences` | `NotificationPrefs` `{ email: boolean, topics: { announcements, messages, deadlines, results, meetings, weeklySummary } }` |
| PUT | `/me/notification-preferences` | same shape → saved value |
| GET | `/support-requests/mine` | `SupportRequest[]` created by the current user, newest first |
| POST | `/support-requests` | `{ subject, category: "account"|"file"|"exam"|"content"|"other", priority: "low"|"normal"|"urgent", message }` → `SupportRequest` (teachers and students only) |

## 5. Notifications

| Method | Path | Notes |
|---|---|---|
| GET | `/notifications` | `NotificationItem[]` for the current user, newest first (the latest 20 are enough). Polled every 60 s while the app is open. |
| POST | `/notifications/:id/read` | 204 — sent when the user opens one notification |
| POST | `/notifications/read-all` | 204 |

`NotificationItem` (`src/types/domain.types.ts`):

```ts
{
  id: string;
  kind: "exam" | "assignment" | "result" | "system" | "meeting";
  title?: string;                       // ready-to-show text in the user's language (Accept-Language)
  titleKey?: string;                    // or a frontend message key, e.g. "notifications.resultReady" …
  params?: Record<string, string | number>;   // … with its values ({ exam: "8-B · 2. Ünite" })
  link?: string | null;                 // in-app path to open, e.g. "/student/results" (must start with "/")
  createdAt: string; read: boolean;
}
```

Send `title` (simplest) or `titleKey` + `params`; the keys the frontend knows are under `notifications.*` in `src/i18n/locales/tr/common.json`. Links must be paths of the app (see the menu in `src/config/navigation.ts`); other values are ignored.

## 6. Communication — role-scoped (`/:role` = `admin` · `teacher` · `student`)

The server decides what each user may see (role, level, class). Filters sent by the browser only narrow the view.

Class pickers on these pages use `GET /admin/lookups/classes` for administrators and `GET /teacher/scope` for teachers (see §8) — nothing is hard-coded in the frontend.

| Method | Path | Notes |
|---|---|---|
| resource | `/announcements` | CRUD. `AnnouncementInput` = `{ title, body, audience, audienceLabel, status: "published"|"scheduled"|"draft", pinned, publishedAt, author, authorRole }`. Students read only; teachers may write only to their own classes; scheduled items are hidden from readers until `publishedAt`. Pinned items first. |
| GET | `/:role/calendar?offset&limit&search` | `PaginatedResponse<CalendarEvent>` |
| POST | `/:role/calendar` | personal event → `CalendarEvent` (`editable: true`) |
| DELETE | `/:role/calendar/:id` | only events the user created |
| resource | `/:role/meetings` | CRUD for teachers (own meetings); students read only. The meeting link is generated by the server. |
| resource | `/:role/conversations` | list + create (`{ name, subtitle }`) |
| POST | `/:role/conversations/:id/messages` | `{ text }` → `Conversation` |
| POST | `/:role/conversations/:id/read` | → `Conversation` |
| GET | `/:role/contacts` | `{ name, subtitle }[]` the user is allowed to message |

## 7. Admin (`/admin/**`, administrators only)

**Dashboard and people**

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/dashboard?lang=` | `AdminDashboardData` |
| GET | `/admin/students?offset&limit&search&level&grade&status&sort&order` | `PaginatedResponse<Student>`; `sort ∈ name, schoolNumber, grade, enrolledAt` |
| POST / PATCH | `/admin/students`, `/admin/students/:id` | `StudentInput` → `Student`; 409 + `fieldErrors.schoolNumber = "duplicate"` |
| POST | `/admin/students/:id/archive` | → `Student` (`status: "archived"`); results are kept |
| POST | `/admin/students/:id/transfer` | body: target class → `Student` |
| resource | `/admin/teachers` | CRUD (`TeacherInput`); 409 on duplicate e-mail |
| POST | `/admin/import/:kind` | `kind ∈ students, teachers`; `{ rows }` → `{ created }`. Re-validate every row on the server. |
| GET | `/admin/import/:kind/existing-keys` | `{ emails: string[], numbers: string[] }` used to flag duplicates before import |
| GET | `/admin/lookups/teachers` · `/classes` · `/subjects` | small unpaginated lists for selects |

**Academic**

| Method | Path | Notes |
|---|---|---|
| resource | `/admin/terms` | CRUD (`TermInput`) |
| POST | `/admin/terms/:id/activate` | makes this the active term (only one active) |
| resource | `/admin/classes` | CRUD (`ClassInput`) |
| GET | `/admin/classes/:className/students` | `Student[]` |
| resource | `/admin/subjects` | CRUD (`SubjectInput`) |
| resource | `/admin/assignments` | list only |
| PATCH | `/admin/assignments/:id` | `{ teacherId: string | null }` |

**Exam archive** (PDF → questions)

| Method | Path | Notes |
|---|---|---|
| resource | `/admin/archive/files` | list; `status` moves `waiting → running → review → done`, or `failed`; `fileUrl` links to the original PDF. The processing page re-reads loaded rows every few seconds while something is running. |
| POST | `/admin/archive/files` | **multipart**: `file` (PDF ≤ 25 MB), `examType`, `year`, `kind` → `ArchiveFile`. Processing (text extraction, AI question splitting) runs on the server. |
| POST | `/admin/archive/files/:id/retry` | → `ArchiveFile` |
| resource | `/admin/archive/review` | list of extracted questions waiting for review |
| POST | `/admin/archive/review/:id/approve` | optional edits → `ReviewQuestion` (also added to the approved bank) |
| POST | `/admin/archive/review/:id/reject` | → `ReviewQuestion` |
| resource | `/admin/archive/questions` | approved bank; list + PATCH + DELETE |
| GET | `/admin/archive/subjects` | `Record<ExamType, string[]>` |

**Guidance data** (fictional in the demo; real data is imported by the administrator)

| Method | Path | Notes |
|---|---|---|
| resource | `/admin/guidance/schools` · `/programs` · `/careers` | CRUD (`SchoolInput`, `ProgramInput`, `CareerInput`) |
| resource | `/admin/guidance/sources` | list of imported datasets |
| POST | `/admin/guidance/:dataset/import` | **multipart** `file`; `dataset ∈ schools, universities, careers` → `DataSource` |

**Communication, reports, settings**

| Method | Path | Notes |
|---|---|---|
| resource | `/admin/support-requests` | list + PATCH `{ status }` |
| POST | `/admin/support-requests/:id/messages` | `{ text }` → `SupportRequest` |
| GET | `/admin/reports/usage` | `UsageReport` |
| GET | `/admin/reports/ai` | `AiReport` (requests, tokens, cost per feature/role) |
| resource | `/admin/reports/audit` | read only |
| GET / PUT | `/admin/settings/:key` | `key ∈ institution, permissions, ai, integrations, retention` → `SettingsMap[key]` |
| POST | `/admin/settings/ai/key` | `{ key }` → `AiSettings`. Store the key **encrypted on the server**; respond with a masked hint only (`keyHint: "••••7Q2c"`). The key is never returned. |
| POST | `/admin/settings/ai/test` | → `{ ok, latencyMs }` |
| POST | `/admin/settings/retention/backups` | starts a backup → `RetentionSettings` |

## 8. Teacher (`/teacher/**`, only the classes assigned to the signed-in teacher)

| Method | Path | Notes |
|---|---|---|
| GET | `/teacher/scope` | `TeachingScope` — the classes and topics the teacher works with. **Every teacher page builds its class and topic pickers from this** (one request per session). |
| GET | `/teacher/dashboard?lang=` | `TeacherDashboardData` |
| GET | `/teacher/classes` | `TeacherClassRow[]` |
| GET | `/teacher/classes/:className/students` | `string[]` (roster names) |
| resource | `/teacher/students` | read only; filter `needsSupport` |
| resource | `/teacher/groups` | CRUD study groups |
| resource | `/teacher/lessons` | CRUD lessons / summaries (`LessonInput`). The body carries `fileId` from `/teacher/ai/summary` when a PDF was uploaded; return `fileUrl` for it. |
| resource | `/teacher/questions` | CRUD question bank (`BankInput`) |
| resource | `/teacher/presentations` | CRUD (`PresentationInput`) |
| resource | `/teacher/exams` | CRUD class exams (`ExamInput`) |
| resource | `/teacher/mock-exams` | CRUD (`MockExamInput`) |
| resource | `/teacher/homework` | CRUD (`HomeworkInput`) |
| resource | `/teacher/activities` | CRUD (`ActivityInput`) |
| resource | `/teacher/rubrics` | CRUD (`RubricInput`) |
| resource | `/teacher/submissions` | list + PATCH `{ score, feedback, status }`; `attachmentUrl` links to the student's uploaded file |
| resource | `/teacher/appeals` | list + PATCH `{ status, response }` |
| GET | `/teacher/exams?lang=&status=graded` | `ExamSummary[]` |
| GET | `/teacher/exams/:examId/results/summary?lang=` | `ExamAnalysis` |
| GET | `/teacher/exams/:examId/results?offset&limit&search&weakTopic&sort&order` | `PaginatedResponse<ExamResult>` |
| POST | `/teacher/support-exercises` | `SupportExerciseRequest` `{ studentId, topicId, difficulty, questionCount (3–30), dueDate, includeSummary }` → `{ id }`. The server picks approved questions without repeats; 422 if there are not enough. |
| resource | `/teacher/support-exercises` | list of sent exercises (read only) |
| GET | `/teacher/reports/classes/:className` | `ClassReport` |

**AI generation** — always returns a **draft**; nothing is published without the teacher's approval. Responses include `simulated: boolean`; the UI labels the result as simulated when it is `true` (demo mode always sets it).

| Method | Path | Body |
|---|---|---|
| POST | `/teacher/ai/summary` | **multipart**: `file?` (PDF), `topic`, `title` → `SummaryResult` `{ summary, simulated, fileId? }` — store the PDF and return its `fileId` |
| POST | `/teacher/ai/questions` | `{ topic, count, difficulty }` → `GeneratedQuestions` |
| POST | `/teacher/ai/presentation` | `{ title, summary }` → `{ slides, simulated }` |

Apply the per-role daily limits and monthly budget from `/admin/settings/ai` on the server.

`TeachingScope` (`src/features/teacher/types.ts`):

```ts
{
  classes: { name: "8-A", grade: 8, subject: "Matematik", studentCount: 28 }[];
  topicsByClass: { "8-A": ["Çarpanlar ve Katlar", "Üslü İfadeler", …] };   // curriculum order
}
```

Build it from the teacher assignments (`/admin/assignments`) and the subject topics (`/admin/subjects`). An empty `classes` list is valid (the pages then explain that no class is assigned yet).

## 9. Student (`/student/**`, only the signed-in student's own data)

**Home and learning**

| Method | Path | Notes |
|---|---|---|
| GET | `/student/dashboard?lang=` | `StudentHomeData` (courses, today's plan, exam prep, support item, weekly goal) |
| GET | `/student/progress?lang=` | `StudentProgressData` |
| GET | `/student/subjects` | `StudentSubject[]` with units/topics and progress |
| resource | `/student/materials` | list + PATCH `{ read }`; `fileUrl` links to the PDF |
| resource | `/student/exams` | read only (`StudentExam`) |
| GET | `/student/exams/:id/questions` | `QuizQuestion[]` **without** `answer` and `explanation` — only while the exam is open for this student |
| POST | `/student/exams/:id/submit` | `{ answers: (number \| null)[], durationSeconds }` → `ExamSubmission` (graded on the server, see below). Accept one submission per student; 409 for a second one. |
| resource | `/student/homework` | read only; `submission.fileUrl` links to the uploaded file |
| POST | `/student/homework/:id/submission` | **multipart**: `text`, `file?` (PDF/JPG/PNG/DOCX ≤ 10 MB) → `StudentHomework` |
| resource | `/student/activities` | list + PATCH `{ status: "joined"|"upcoming" }` |
| resource | `/student/results` | read only |
| POST | `/student/appeals` | `{ resultId, kind: "score"|"question", questionNo, message }` → `{ id }` (appears in the teacher's appeals) |
| GET | `/student/support-exercises` | `SupportExerciseItem[]` |
| GET | `/student/support-exercises/:id/questions` | `QuizQuestion[]` **with** `answer` and `explanation` (practice: feedback after each question) |
| POST | `/student/support-exercises/:id/submit` | `{ answers }` → updated item with `after` score |
| GET | `/student/summaries?topic=` | summary text or `null` |
| resource | `/student/mistakes` | list + PATCH `{ learned }` |
| POST | `/student/mistakes` | `{ questionIds, answers }` → number saved |
| resource | `/student/goals` | CRUD `{ label, done }` (max 10) |

**Exam preparation** (middle and high school only)

| Method | Path | Notes |
|---|---|---|
| GET | `/student/practice/questions?subject&topic&count` | `QuizQuestion[]` **with** `answer` and `explanation` (practice) |
| resource | `/student/mock-exams` | read only (`AvailableMock`) |
| GET | `/student/mock-exams/:id/questions` | `QuizQuestion[]` **without** `answer` and `explanation`, in booklet order (`subject` / `topic` are optional and shown in the player) |
| POST | `/student/mock-exams/:id/submit` | `{ answers, durationSeconds }` → `MockSubmission` (net: LGS 3 wrong = 1 correct, YKS 4 wrong = 1 correct) |
| resource | `/student/mock-exams/attempts` | read only, `sort=date` |

**Questions and server grading** (`src/components/quiz/QuizPlayer.tsx`, `src/features/student/services/studentApi.ts`):

```ts
QuizQuestion   { id, stem, options: string[], answer?: number, explanation?: string, subject?, topic? }
ExamSubmission { exam: StudentExam;   answerKey: number[]; explanations?: (string | null)[] }
MockSubmission { attempt: MockAttempt; answerKey: number[]; explanations?: (string | null)[] }
```

- `answers[i]` is the chosen option index for question `i` of the list you returned (`null` = blank).
- `answerKey[i]` is the index of the correct option for the same question; `explanations[i]` is optional.
- The answer key is sent **only in the submit response**, never with the questions of an exam or mock exam. If the timer runs out, the frontend submits automatically; if the submit fails, the answers stay on screen with a retry button.
- `POST /student/mistakes` receives `{ questionIds, answers }` of the questions the student chose to save.

**Guidance** (middle and high school; majors, careers and roadmap are high school only — the server must refuse other levels)

| Method | Path | Notes |
|---|---|---|
| GET / PUT | `/student/guidance/interests` | `InterestProfile` `{ interests: string[], skills: { key, level 1–5 }[], updatedAt }` |
| GET | `/student/guidance/major-suggestions` | `MajorSuggestion[]` — a transparent rule-based score (60 % interest overlap, 40 % self-rated skills), with `reasons: { kind: "interest"|"skill", key }[]` so the UI can explain it. Not an AI prediction. |
| resource | `/student/guidance/schools` | read only; filters `city`, `type`; `sort=score` |
| resource | `/student/guidance/programs` | read only; filters `city`, `kind`, `scoreType`; `sort=baseRank` |
| resource | `/student/guidance/careers` | read only; filters `field`, `outlook` |
| resource | `/student/guidance/roadmap` | CRUD `{ phase: "now"|"thisYear"|"university"|"career", title, description, done }` (max 40) |
| resource | `/student/guidance/saved` | CRUD personal shortlist (`SavedChoice`; max 20 schools / 24 programs) |
| PUT | `/student/guidance/saved/order` | `{ ids: string[] }` in the new order |

## 10. Permission rules the backend must enforce

- Every request is checked against the session's role. Hidden menu items and frontend route guards are UX only.
- Teachers only see classes, students, exams and submissions assigned to them.
- Students only see their own data. Level-restricted pages (exam preparation, guidance, university tools) must be refused for other levels on the server too.
- Answer keys are never sent while an exam is open (§9).
- While `mustChangePassword` is set, only the password change is allowed (§3).
- Unsafe requests without a matching `X-XSRF-TOKEN` header are rejected (§1).
- AI provider keys and settings are stored and used server-side only; the browser only ever receives a masked hint.
- Uploaded files are validated on the server (type, size, malware scanning) — the browser checks are only a convenience.
- Audit-log every administrative change (who, what, when).

## 11. What exists only in demo mode

In mock mode (`VITE_API_MODE=mock`) all of the above is simulated in memory (`src/mocks/**`): data resets on reload, AI output comes from templates and is labelled as simulated, meeting links are placeholders, passwords are never changed, and guidance figures are fictional. None of this code is loaded in a real build.
