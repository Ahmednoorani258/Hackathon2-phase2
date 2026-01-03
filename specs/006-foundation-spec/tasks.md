# Tasks: Phase II Foundation

**Input**: Design documents from `/specs/006-foundation-spec/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Backend tests for user isolation are REQUIRED as per the implementation plan (test_isolation.py).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure for backend/ and frontend/ per plan.md
- [X] T002 Initialize backend project with `uv` and FastAPI dependencies in backend/
- [X] T003 [P] Initialize frontend project with Next.js 16+, TypeScript, and Tailwind in frontend/
- [X] T004 [P] Configure shared environment variables in root .env

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for Better Auth, Database, and API Routing

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Setup Neon PostgreSQL connection in backend/db.py
- [X] T006 Configure Better Auth on frontend lib/auth.ts
- [X] T007 [P] Implement JWT verification middleware in backend/routes/auth.py using JWKS (research.md)
- [X] T008 [P] Setup FastAPI router and base API structure in backend/main.py
- [X] T009 Implement rate limiting (100/min) in backend/main.py (FR-005)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Secure User Onboarding (Priority: P1) 🎯 MVP

**Goal**: Users can register and log in securely via Better Auth.

**Independent Test**: Register a user via the UI, verify JWT is issued, and access a protected /api/tasks route.

### Implementation for User Story 1

- [X] T010 [US1] Create User SQLModel in backend/models.py (data-model.md)
- [X] T011 [US1] Implement registration/login pages in frontend/app/login/
- [X] T012 [P] [US1] Configure Auth Provider wrapper in frontend/app/layout.tsx
- [X] T013 [US1] Verify JWT sub claim extraction in backend/routes/auth.py

**Checkpoint**: User Story 1 complete - Authentication is functional.

---

## Phase 4: User Story 2 & 3 - Basic Task Management & Toggle (Priority: P1/P2)

**Goal**: CRUD operations for tasks (create, view, delete, complete).

**Independent Test**: Create a task, mark it complete, then delete it. Verify all states in the DB.

### Implementation for User Story 2 & 3

- [X] T014 [US2] Create Task SQLModel with user_id FK in backend/models.py
- [X] T015 [US2] Implement POST /api/tasks with auto-title "(Untitled Task)" in backend/routes/tasks.py
- [X] T016 [US2] Implement GET /api/tasks list in backend/routes/tasks.py
- [X] T017 [US3] Implement PUT /api/tasks/{id} for status/title updates in backend/routes/tasks.py
- [X] T018 [US2] Implement DELETE /api/tasks/{id} in backend/routes/tasks.py
- [X] T019 [P] [US2] Create API client with JWT support in frontend/lib/api.ts
- [X] T020 [US2] Implement Task dashboard page in frontend/app/page.tsx
- [X] T021 [P] [US3] Create TaskItem component with completion toggle in frontend/components/TaskItem.tsx
- [X] T022 [US2] Add delete confirmation dialog in frontend/components/TaskItem.tsx (FR-007)

**Checkpoint**: User Stories 2 & 3 complete - Core Todo functionality is functional.

---

## Phase 5: User Story 4 - Multi-user Isolation (Priority: P1)

**Goal**: Enforce strict user-task access control.

**Independent Test**: Run security tests ensuring User A cannot access User B's data.

### Tests for User Story 4 (Security/Isolation)

- [X] T023 [US4] Implement isolation tests in backend/tests/test_isolation.py (verify 403/404 on cross-user access)

### Implementation for User Story 4

- [X] T024 [US4] Add `WHERE user_id = current_user_id` to all task queries in backend/routes/tasks.py
- [X] T025 [US4] Implement ownership validation before PUT/DELETE in backend/routes/tasks.py

**Checkpoint**: All user stories complete and secure.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T026 [P] Add input validation (Pydantic models) in backend/routes/tasks.py
- [X] T027 [P] Implement frontend error boundaries for API failures
- [X] T028 Run full validation of Success Criteria (SC-001 to SC-004)
- [X] T029 Execute final verification against quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all story implementation.
- **User Story 1 (Phase 3)**: Depends on Phase 2.
- **User Stories 2, 3, 4**: Depend on Authentication (US1) and Foundational completion.
- **Polish (Phase 6)**: Depends on all user stories.

### Parallel Opportunities

- T003 and T004 (Frontend setup vs Env config).
- T021 (UI component) can be worked on while T017 (Backend update) is in progress.
- T012 can run in parallel with US1 backend verification logic.

---

## Implementation Strategy

### MVP First (Authentication + Basic Tasks)
1. Complete Setup and Foundational.
2. Complete US1 (Auth).
3. Complete US2 (Basic CRUD).
4. **VALIDATE**: Ensure User A can manage their own tasks.

### Security Hardening
1. Complete US4 (Isolation) immediately after US2/3 to ensure the "Multi-user" promise is met before polish.
