# Implementation Plan: Phase II Foundation

**Branch**: `006-foundation-spec` | **Date**: 2025-12-31 | **Spec**: `/specs/006-foundation-spec/spec.md`
**Input**: Feature specification from `/specs/006-foundation-spec/spec.md`

**Note**: This plan defines the foundation for the Phase II multi-user Todo application, focusing on authentication, user isolation, and core Task CRUD.

## Summary

Implement the foundational layer for a multi-user Todo application. This includes setting up Better Auth with JWT for secure authentication, enforcing strict user-task isolation in the backend using SQLModel and FastAPI, and implementing a responsive Next.js frontend with core Task CRUD capabilities.

## Technical Context

**Language/Version**: Python 3.11+, TypeScript, Next.js 16+
**Primary Dependencies**: FastAPI, SQLModel, Better Auth, Tailwind CSS
**Storage**: Neon Serverless PostgreSQL
**Testing**: Pytest (Backend tests for user isolation)
**Target Platform**: Web (Next.js App Router)
**Performance Goals**: API responses < 200ms p95, Load list < 500ms
**Constraints**: 100 req/min rate limit per IP, JWT-based stateless auth, User-Task isolation
**Scale/Scope**: Phase II Stage 1 (Basic) features only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Spec-Driven Development**: Spec exists and is foundation-level.
- [x] **Context-7**: All tech choices (FastAPI, SQLModel, Better Auth) aligned with Context-7 recommendations.
- [x] **No Manual Coding**: This plan will be executed via Claude Code and specialized agents.
- [x] **Clean Architecture**: Separation between `/frontend` and `/backend` maintained.
- [x] **Security by Default**: JWT mandated, user isolation required for all queries.
- [x] **Tech Stack Adherence**: Next.js 16, FastAPI, SQLModel, Neon PostgreSQL, Better Auth.
- [x] **User Isolation**: Explicitly required in requirements and data model.
- [x] **Specialized Agents**:
    - Frontend implementation delegated to `secure-frontend-developer`.
    - Backend and auth logic delegated to `backend-auth-guardian`.
    - Spec enforcement delegated to `spec-authority`.

## Project Structure

### Documentation (this feature)

```text
specs/006-foundation-spec/
├── spec.md              # Requirements
├── plan.md              # This file
├── research.md          # Implementation details for Better Auth + FastAPI integration
├── data-model.md        # User and Task entity schemas
├── quickstart.md        # Setup instructions for dev environment
└── contracts/
    └── openapi.yaml     # API contract definitions (OpenAPI)
```

### Source Code (repository root)

```text
backend/
├── main.py           # FastAPI entry and rate limiting
├── models.py         # User and Task SQLModel definitions
├── routes/
│   ├── auth.py       # Better Auth integration/verification
│   └── tasks.py      # CRUD with user isolation
├── db.py             # Neon connection
└── tests/
    └── test_isolation.py # Security tests

frontend/
├── app/
│   ├── layout.tsx    # Auth provider setup
│   ├── page.tsx      # Dashboard/Task list (Server Component)
│   └── login/        # Auth pages
├── components/
│   └── TaskItem.tsx  # CRUD UI with delete confirmation (Client Component)
└── lib/
    ├── api.ts        # JWT-attached client
    └── auth.ts       # Better Auth config
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | N/A        | N/A                                 |
