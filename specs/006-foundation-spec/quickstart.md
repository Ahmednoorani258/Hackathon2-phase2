# Quickstart: Phase II Foundation

Setup and development instructions for the Todo application.

## Prerequisites

- **Python**: 3.11+ with `uv`
- **Node.js**: 16+ with `npm`
- **Database**: Neon PostgreSQL connection string (`DATABASE_URL`)
- **Secret**: `BETTER_AUTH_SECRET` (Shared between frontend and backend)

## Backend Setup (FastAPI)

1. Navigate to `/backend`
2. Install dependencies:
   ```bash
   uv sync
   ```
3. Set environment variables in `.env`:
   ```env
   DATABASE_URL=postgres://...
   BETTER_AUTH_SECRET=your-secret
   FRONTEND_URL=http://localhost:3000
   ```
4. Run server:
   ```bash
   uvicorn main:app --reload
   ```

## Frontend Setup (Next.js)

1. Navigate to `/frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables in `.env.local`:
   ```env
   BETTER_AUTH_SECRET=your-secret
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
4. Run development server:
   ```bash
   npm run dev
   ```

## Local Development Workflow

1. Start both servers
2. Open `http://localhost:3000`
3. Register a new user
4. Create, edit, and delete tasks
5. Verify user isolation by creating a second account in an incognito window

## Running Tests

### Backend
```bash
cd backend
pytest
```
