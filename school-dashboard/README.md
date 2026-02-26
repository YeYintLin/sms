# School Dashboard Frontend

The school-dashboard folder contains the Vite + React SPA that serves as the administrative interface for the School Management System. It consumes the Express backend APIs and enforces the same role-based permissions through AuthContext, usePermissions, and API calls stored in src/utils/api.js.

## Setup & running

1. Install dependencies from within school-dashboard:
   `ash
   npm install
   `
2. Run the dev server:
   `ash
   npm run dev
   `
   The app launches on http://localhost:5173 by default and proxies API calls to http://localhost:5000/api (update src/utils/api.js if you use a different backend host).
3. Build for production:
   `ash
   npm run build
   `
   Use 
pm run preview to locally test the build output.

## Available scripts

- 
pm run dev – starts the Vite dev server with HMR.
- 
pm run build – bundles the frontend for production.
- 
pm run preview – serves the production build locally.
- 
pm run lint – runs ESLint across src.

## Architecture notes

- **State management:** The SPA relies on custom hooks (useResultsData, usePermissions, useToast) and contexts (AuthContext, theme) to keep UI state centralized. Component pages (Results, Students, Attendance, etc.) mostly delegate data fetching to these hooks.
- **API layer:** src/utils/api.js is the single HTTP client for backend calls. It automatically attaches the JWT from AuthContext, so keep it updated if the backend URL changes.
- **Permissions:** usePermissions defines access tables for dmin, 	eacher, student, and parent. UI flows (add/edit/delete buttons, filter controls) check these permissions before rendering.

## Best practices

- Keep localStorage state aligned with useResultsData to avoid duplicate logic (active grade/term, persisted filters).
- Leverage the modal components (ConfirmDialog, MessageModal) for confirm/delete flows rather than rolling new UI each time.
- Run 
pm run lint before committing changes to keep the shared ESLint config happy.
