# PUSULA — Backend handoff

The frontend lives in `frontend/` of the team repository; your API goes in `backend/`. Every screen already works with labelled demo data (`npm run dev`) and switches to your API with one setting. You build the API described in [`BACKEND_API_REQUIREMENTS.md`](BACKEND_API_REQUIREMENTS.md); the frontend does not need to change unless you change a path or a shape (then only the service files listed there change).

## 1. Run the frontend

Requirements: **Node.js 20.19 or newer** (`.nvmrc` says 22; `nvm use` picks it up) and npm.

```bash
git clone https://github.com/alaa673/e-itim-projesi.git
cd e-itim-projesi/frontend
npm ci                 # exact versions from package-lock.json
npm run dev            # demo mode → http://localhost:5173 (no backend needed)
```

Demo sign-in in `npm run dev`: the role cards on the sign-in page, or `yonetici` / `ogretmen` / `ogrenci` / `lise` with the password `demo1234`. These accounts exist only in demo mode.

## 2. Point it at your backend

```bash
npm run dev:api        # real mode → http://localhost:5173, /api is forwarded to http://localhost:3000
```

- Serve your routes **under `/api`** (`/api/auth/login`, `/api/student/dashboard` …). The dev server forwards the path unchanged.
- Another port or host? Create `.env.api.local` (git-ignored) with `VITE_DEV_API_TARGET=http://localhost:8080` and restart.
- The browser only talks to `localhost:5173`, so the session cookie is first-party and **no CORS setup is needed** while developing. `Domain` attributes on your cookies are removed by the proxy.
- Plain-`http` cookies with `Secure` work on `localhost` in current browsers; keep `Secure` in production.
- Real mode never falls back to demo data: a missing endpoint shows the page's error state with a retry button, and 401 sends the user to the sign-in page.

## 3. What to build first

Each step makes a part of the app usable end to end:

| Step | Endpoints | Unlocks |
|---|---|---|
| 1 | `POST /auth/login` · `GET /auth/me` · `POST /auth/logout` | sign-in, reload keeps the session, sign-out |
| 2 | `POST /me/password` (+ `mustChangePassword` on `User`) | first-login password change |
| 3 | `GET /notifications` · `POST /notifications/:id/read` · `POST /notifications/read-all` | the bell in the header (on every page) |
| 4 | `GET /student/dashboard` · `GET /teacher/dashboard` · `GET /admin/dashboard` | the three home pages |
| 5 | `GET /teacher/scope` | class and topic pickers on every teacher page |
| 6 | the rest, area by area (§4–§9 of the requirements) | everything else |

A route with no endpoint yet simply shows its error state; nothing else breaks.

## 4. Contract essentials (details in the requirements)

- **Session:** httpOnly cookie set by `POST /auth/login`; restored with `GET /auth/me` (401 when signed out). The frontend never sees a token.
- **CSRF:** a readable `XSRF-TOKEN` cookie; the frontend echoes it as `X-XSRF-TOKEN` on POST/PUT/PATCH/DELETE. Issue it on `GET /auth/me` (also on 401).
- **Login body:** `{ identifier, password, remember? }` — `identifier` is a username **or** an e-mail.
- **Errors:** HTTP status + optional JSON `{ "message": "...", "fieldErrors": { "<field>": "<code>" } }` with `Content-Type: application/json`. The UI shows its own text per status; `fieldErrors` codes appear under the matching form field (`duplicate`, `wrongPassword`, …).
- **Lists:** `?offset=&limit=20&search=&sort=&order=asc|desc&<filter>=` → `{ items, total, offset, limit }`, stable order.
- **Graded exams:** questions come **without** answers; the submit response returns `answerKey` (and optional `explanations`).
- **Files:** `fileUrl` / `attachmentUrl` / `avatarUrl` are `https://` URLs or server paths like `/api/files/…`.
- **Permissions:** the frontend hides what a role cannot use, but **the server must check every request** (role, assigned classes, own data, student level).
- Types: `src/types/*.ts` and `src/features/<area>/types.ts`.

## 5. Check your endpoints with curl

```bash
API=http://localhost:3000/api
JAR=$(mktemp)

# CSRF cookie + "not signed in"
curl -s -c $JAR -b $JAR -o /dev/null -w "%{http_code}\n" $API/auth/me          # 401
XSRF=$(awk '$6=="XSRF-TOKEN"{print $7}' $JAR)

# sign in with a username or an e-mail
curl -s -c $JAR -b $JAR -H "Content-Type: application/json" -H "X-XSRF-TOKEN: $XSRF" \
     -d '{"identifier":"ogrenci1","password":"<password>"}' $API/auth/login

curl -s -b $JAR $API/auth/me                                                   # the User
curl -s -b $JAR "$API/student/dashboard?lang=tr"
curl -s -b $JAR -X POST -H "X-XSRF-TOKEN: $(awk '$6=="XSRF-TOKEN"{print $7}' $JAR)" \
     -o /dev/null -w "%{http_code}\n" $API/auth/logout                          # 204
```

The same logout request without the `X-XSRF-TOKEN` header must fail with 403.

## 6. Production

```bash
npm run build          # real mode (.env.production) → dist/
```

`dist/` is static files. Serve it from the same origin as the API, with every unknown path falling back to `index.html` (the app uses clean URLs). Example nginx site:

```nginx
server {
  listen 443 ssl;
  server_name portal.okul.example;
  root /var/www/pusula/dist;

  location /api/ {
    proxy_pass http://127.0.0.1:3000;     # keeps the /api prefix
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  location /assets/ {
    add_header Cache-Control "public, max-age=31536000, immutable";
    try_files $uri =404;
  }
  location / {
    add_header Cache-Control "no-cache";
    try_files $uri /index.html;
  }
}
```

Same origin (above) is the recommended setup. API on a **subdomain of the same site** instead (`api.okul.example` next to `portal.okul.example`): build with `VITE_API_BASE_URL=https://api.okul.example/api npm run build`, enable CORS for the portal origin with credentials (`Access-Control-Allow-Credentials: true`, allowed headers `Content-Type, X-Requested-With, X-XSRF-TOKEN, Accept-Language`) and set the `XSRF-TOKEN` cookie with `Domain=okul.example` so the portal can read it. An API on an unrelated domain does not work with the double-submit CSRF cookie — use the same-origin proxy.

**Never put secrets in `VITE_` variables** — they end up in the browser. AI provider keys, database passwords and storage credentials stay on the server.

## 7. Before you push frontend changes

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

The same checks run on GitHub for every push and pull request that touches `frontend/` (`.github/workflows/frontend-ci.yml` at the repository root), plus a check that the production bundle contains no demo data. Add your own `backend-ci.yml` next to it.
