# School Management Dashboard

This repo bundles the School Management System stack: a school-dashboard Vite/React SPA and an Express/Mongo backend. The workspace root orchestrates shared scripts (start-all, linting, CI) while each package keeps its own dependencies, configs, and lifecycle scripts.

## Project structure

- **school-dashboard/** – Frontend UI (components, hooks, context) that consumes the REST APIs and enforces the role-based permissions defined by the backend.
- **backend/** – Express app with middleware (auth, roles, locale, rate limiting), controllers, services, and MongoDB models.
- **Root tooling** – package.json wires concurrently so you can run both services in tandem.

## Running the stack

1. From the repo root, install shared tooling:
   `ash
   npm install
   `
2. Install per-service dependencies:
   `ash
   npm install --prefix backend
   npm install --prefix school-dashboard
   `
3. Configure the backend:
   - Copy ackend/.env.example to ackend/.env.
   - Supply values for PORT, MONGO_URI, JWT_SECRET, and other secrets.
4. Seed the database (first run only):
   `ash
   npm run seed --prefix backend
   `
5. Start both services simultaneously:
   `ash
   npm run start-all
   `
   That launches the backend (default port 5000) and Vite frontend (default 5173) together. Alternatively run 
pm run dev within each folder to control them individually.

## Workspace scripts

- 
pm run start-all – runs the frontend and backend dev servers concurrently.
- 
pm run lint:backend – runs eslint over ackend/src.
- 
pm run lint:frontend – forwards to the frontend lint script.
- 
pm run ci – sequentially runs backend then frontend lint checks.

Each package has additional scripts as described in its own README (frontend build/preview, backend start, dev, seed).

## Interacting with the backend APIs

All backend endpoints live under http://localhost:5000/api (update school-dashboard/src/utils/api.js if the host changes). Authenticated routes require the x-auth-token header set to the JWT value returned by /api/auth/login.

### Core endpoints

- **Authentication** (/api/auth): register/login, fetch/update session (GET/PUT /me).
- **Students** (/api/students): CRUD plus /stats for aggregates; role-checked via middleware. 
- **Teachers** (/api/teachers), **Parents** (/api/parents), **Classes** (/api/classes): CRUD operations with admin/teacher protection.
- **Results** (/api/results): create/update grading data, filterable by grade/	erm via query params; backend seeds with default subjects/terms.
- **Attendance** (/api/attendance): weekly and reports under /api/attendance (currently returns full collections; pagination is planned).
- **Files** (/api/files): upload/download attachments with rate limiting.
- **Messages** (/api/messages): conversations, participants, message CRUD.
- **AI/Admin** (/api/ai, /api/admin): helper prompts plus admin-only system tooling.

Middleware (uth, oleCheck, locale, rate limiting) guard the express routes and shape responses consistently.

## Frontend runtime notes

- The SPA stores the active grade/term in localStorage (see useResultsData) and permission logic in usePermissions + AuthContext.
- Data requests funnel through school-dashboard/src/utils/api.js. Update its base URL when pointing to deployed APIs.
- The dashboard components rely on role-based hooks so UI controls (add row, edit, delete) match the backend's access rules.

## Notes

- Keep secrets out of version control. Only .env.example is tracked.
- CI and automated tests are not yet wired up—run lint scripts or manual checks before releasing.
