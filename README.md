# PUSULA — Eğitim Portalı

Education portal for primary, middle and high schools with three roles: **Yönetici** (administrator), **Öğretmen** (teacher) and **Öğrenci** (student).

| Folder | What | Owner |
|---|---|---|
| [`frontend/`](frontend) | React + TypeScript web app (every page of every role) | Abdulrahman Mandil |
| `backend/` | API the frontend calls (to be added) | backend developer |

## Start here

- **Frontend:** [`frontend/README.md`](frontend/README.md)
- **Backend developer:** [`frontend/docs/BACKEND_HANDOFF.md`](frontend/docs/BACKEND_HANDOFF.md) (how to run the frontend against your API) and [`frontend/docs/BACKEND_API_REQUIREMENTS.md`](frontend/docs/BACKEND_API_REQUIREMENTS.md) (every request, body and response)

```bash
git clone https://github.com/alaa673/e-itim-projesi.git
cd e-itim-projesi/frontend
npm ci
npm run dev            # demo data, no backend needed → http://localhost:5173
npm run dev:api        # real mode: /api is forwarded to the backend on http://localhost:3000
```

Requires Node.js 20.19 or newer (`frontend/.nvmrc`: 22).

## Rules for the whole repository

- **No secrets in Git.** Backend secrets go in `backend/.env` (ignored by `.gitignore`); commit a `backend/.env.example` with empty values instead. Frontend `VITE_` variables are public by design and must never hold secrets.
- Work on a branch and open a pull request into `main`.
- `.github/workflows/frontend-ci.yml` checks every change under `frontend/` (typecheck, lint, tests, real and demo builds, no demo data in the production bundle). Add a `backend-ci.yml` next to it for the backend.
