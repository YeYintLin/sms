# School Management System Backend

Node.js + Express + MongoDB backend for the School Management Dashboard (school-dashboard frontend).

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and configure:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/school_management
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. Ensure MongoDB is running locally (or update `MONGO_URI` for your DB).

4. Seed the database (creates admin, teacher, student test accounts):
   ```bash
   node seed.js
   ```
   Default credentials:
   - Admin: `admin@school.com` / `password`
   - Teacher: `teacher@school.com` / `password`
   - Student: `student@school.com` / `password`

5. Run the server:
   ```bash
   npm run dev
   ```

## API Routes

| Route | Description |
|-------|-------------|
| `POST /api/auth/register` | Register user |
| `POST /api/auth/login` | Login (returns token, role, name) |
| `GET /api/auth/me` | Get current user (requires x-auth-token) |
| `GET/POST/PUT/DELETE /api/students` | Student CRUD |
| `GET/POST/PUT/DELETE /api/teachers` | Teacher CRUD |
| `GET/POST/PUT/DELETE /api/classes` | Class CRUD |

All resource routes (except auth/register and auth/login) require the `x-auth-token` header.
