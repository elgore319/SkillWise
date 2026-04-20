# SkillWise

SkillWise is a full-stack app with React (frontend), Express (backend), and SQLite (database).

## Current Features

- User authentication flow:
	- Register
	- Login
	- Forgot password reset
- One-time account setup after first login:
	- New users register with email + password
	- After first login, users complete profile setup (first name + last name)
	- Once completed, setup is not shown again
- Dashboard view after authentication:
	- Account directory
	- Search users by name or email
- Persistent data with SQLite
- Passwords stored as bcrypt hashes

## Tech Stack

- Frontend: React + Vite
- Backend: Express
- Database: SQLite3
- Password hashing: bcryptjs

## Project Structure

- Root app config and dependencies: package.json
- Backend source: src/backend
- Frontend source: src/frontend

## Run the App

Use two terminals.

### Terminal 1 - Backend

```bash
cd src/backend
npm run dev
```

### Terminal 2 - Frontend

```bash
cd src/frontend
npm run dev
```

Notes:

- Backend runs on http://localhost:5000
- Frontend usually runs on http://localhost:5173
- If 5173 is in use, Vite will choose another port (for example 5174)

## Authentication Flow (Expected Behavior)

1. App opens on the login screen.
2. User can register a new account.
3. User can login with saved credentials after restarting the app.
4. New users complete one-time account setup (name fields).
5. User is taken to dashboard after setup/login.
6. User can reset password from the Forgot Password tab.

## Database

Database file: src/backend/skillwise.db

Users table includes:

- id
- firstName
- lastName
- email
- password (bcrypt hash)
- profileCompleted (boolean in app logic, stored as 0/1 in SQLite)

## API Overview

Auth routes:

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/setup-account
- POST /api/auth/reset-password

User routes:

- GET /api/users
- GET /api/users/:id
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id
