# SkillWise

SkillWise is a full-stack app with React (frontend), Express (backend), and SQLite (database).

## Current Features

User registration and login
Password reset
One-time account setup
User dashboard with account directory and search
Secure password storage (bcrypt)

## Tech Stack

- Frontend: React + Vite
- Backend: Express
- Database: SQLite3
- Password hashing: bcryptjs

## Run the App

### Install Dependencies

```bash
npm install
```

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

- Backend runs on http://localhost:5000
- Frontend runs on http://localhost:5173

## Database

Database file: src/backend/skillwise.db

Tables:
- users
- mentors
- reviews
- messages
- payments
