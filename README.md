# School Management Dashboard

This repository hosts the School Management System stack: a Vite/React `school-dashboard` frontend and an Express/MongoDB `backend`. A root workspace manifest provides `npm run start-all` to boot both sides together locally.

## Workspace scripts

- `npm run start-all`: runs `school-dashboard` and `backend` dev servers side by side via `concurrently`.

Each package also has its own scripts:

- `school-dashboard`: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`.
- `backend`: `npm run start`, `npm run dev` (`nodemon`), `npm run seed`.

## Setup

1. From the repo root, install shared dev dependencies (`concurrently`):
   ```bash
   npm install
   ```
2. Install per-project dependencies (from each subdirectory if needed):
   ```bash
   npm install --prefix backend
   npm install --prefix school-dashboard
   ```
3. Copy backend `.env.example` and adjust variables (`PORT`, `MONGO_URI`, `JWT_SECRET`). Make sure MongoDB is running on the specified URI.
4. Seed the database once:
   ```bash
   npm run seed --prefix backend
   ```

## Running locally

1. Start both services with `npm run start-all` from the workspace root.
2. Alternatively, run frontend/backends individually from their folders (`npm run dev`).

## API surface (partial)

- Authentication
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `PUT /api/auth/me`
- Students: `GET/POST/PUT/DELETE /api/students`, plus `/api/students/stats`
- Teachers: `GET/POST/PUT/DELETE /api/teachers`
- Parents: CRUD under `/api/parents`
- Classes, Results, Attendance, Files, Messages, Admin, AI — each exposed under `/api/{resource}`

Routes require `x-auth-token` except for login/register. Files and upload routes use additional rate limiting.

## Notes

- No automated tests or CI are configured yet; rely on manual verification for now.
- Environment-specific configuration is still inferred from the backend `.env` and frontend hardcoded `http://localhost:5000/api`. Update `school-dashboard/src/utils/api.js` when deploying elsewhere.
