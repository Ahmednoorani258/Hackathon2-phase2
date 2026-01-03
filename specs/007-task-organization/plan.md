# Implementation Plan: Task Organization Features

**Branch**: `007-task-organization` | **Date**: 2026-01-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-task-organization/spec.md`

## Summary

This plan implements Phase II Intermediate task organization features for the Todo application, including:
- Task prioritization (high/medium/low)
- Task tagging/categorization with automatic lifecycle management
- Keyword search (title, description, tags) with partial word matching
- Multi-criteria filtering (status, priority, date presets, custom date ranges)
- Task sorting (due date, priority, alphabetical)

The implementation extends the existing Basic-level foundation without breaking compatibility, maintaining strict user isolation through JWT authentication and database-level filtering.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript 5.x (frontend)
**Primary Dependencies**: FastAPI (backend), Next.js 16+ (frontend), SQLModel (ORM), Better Auth (JWT)
**Storage**: Neon Serverless PostgreSQL
**Testing**: pytest (backend), Jest/Playwright (frontend)
**Target Platform**: Web (desktop/tablet/mobile via responsive design)
**Project Type**: Full-stack web application with monorepo structure
**Performance Goals**:
  - Search: < 500ms for up to 1000 tasks per user
  - Filter/Sort: < 200ms UI update time
  - API endpoints: < 200ms p95 latency
**Constraints**:
  - All API endpoints require valid JWT authentication
  - All database queries MUST include user_id filtering
  - Tag names are case-insensitive and trimmed
  - Maximum 10 tags per task
  - Client-side filtering for < 100 tasks, server-side for larger datasets
**Scale/Scope**:
  - Users: Up to 10,000 tasks per user (search performance assumption)
  - Existing Basic-level features: Must be preserved without degradation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Spec-Driven Development
- ✅ Spec exists at `specs/007-task-organization/spec.md`
- ✅ Spec is complete (all requirements clarified via `/sp.clarify`)
- ✅ No manual coding permitted without spec approval
- ✅ Implementation follows spec → plan → tasks → implement workflow

### II. Context-7 Knowledge First
- ✅ Technology stack verified (Next.js 16+, FastAPI, SQLModel)
- ✅ Best practices will be validated via Context-7 during implementation
- ⚠️ **ACTION**: Use `context7-efficient` skill for:
  - Next.js 16+ App Router patterns for filter/sort UI components
  - FastAPI/SQLModel best practices for complex query patterns
  - Database indexing strategies for search performance

### III. No Manual Coding
- ✅ All code generation through Claude Code executing against spec
- ✅ No trivial manual edits anticipated (all requirements are clear)

### IV. Clean Architecture & Maintainability
- ✅ Models, routes, and components strictly separated
- ✅ Single responsibility for all modules
- ✅ Tag lifecycle (auto-create/delete) handled cleanly via database cascade

### V. Security by Default
- ✅ **CRITICAL**: All new API endpoints MUST require valid JWT authentication
- ✅ **CRITICAL**: User identity derived from JWT claims, never from request parameters
- ✅ **CRITICAL**: All database queries MUST be filtered by user_id
- ✅ Input validation via Pydantic models (backend) and TypeScript (frontend)

### VI. Modern Tech Stack Adherence
- ✅ Frontend: Next.js 16+ with App Router, TypeScript, Tailwind CSS
- ✅ Backend: FastAPI with Python 3.11+, SQLModel
- ✅ Database: Neon Serverless PostgreSQL
- ✅ Auth: Better Auth (JWT-based)

### VII. User Isolation & Data Ownership
- ✅ **CRITICAL**: Every endpoint MUST filter by `WHERE user_id = current_user_id`
- ✅ **CRITICAL**: Tags are user-isolated (unique per user)
- ⚠️ **ACTION**: Tag deletion cascade must NOT affect other users' tasks
- ✅ Tests MUST verify cross-user access is blocked

### VIII. Specialized Agent Usage
- ⚠️ **ACTION**: Use specialized agents during `/sp.implement`:
  - `backend-auth-guardian` for FastAPI/SQLModel endpoint implementation
  - `secure-frontend-developer` for Next.js UI components

### IX. Resource & Tool Discipline
- ⚠️ **ACTION**: Use `context7-efficient` for all documentation and pattern research

**GATE STATUS**: ✅ PASSED (with action items tracked)

## Project Structure

### Documentation (this feature)

```text
specs/007-task-organization/
├── spec.md              # Feature specification (approved)
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (OpenAPI specs)
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (NOT created by this command)
```

### Source Code (repository root)

```text
# Full-stack web application (existing structure)
backend/
├── main.py              # FastAPI app entry
├── models.py            # SQLModel models (extend with priority, tag relationships)
├── routes/
│   ├── tasks.py         # Task CRUD (extend with filter/sort/search)
│   └── tags.py          # Tag management endpoints
└── db.py                # Database connection

frontend/
├── app/
│   ├── page.tsx         # Main task list page (add filter/sort UI)
│   └── components/
│       ├── TaskList.tsx
│       ├── TaskItem.tsx
│       ├── PriorityBadge.tsx
│       ├── TaskTags.tsx
│       ├── SearchBar.tsx
│       ├── FilterPanel.tsx
│       └── SortControls.tsx
└── lib/
    └── api.ts           # API client (extend with filter/sort params)
```

**Structure Decision**: Full-stack monorepo with existing backend/frontend separation. This structure follows the constitution's mandatory tech stack and maintains compatibility with the Basic-level implementation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | Constitution gates passed | N/A |

## Phase 0: Research Decisions

*See `research.md` for detailed findings.*

## Phase 1: Design Artifacts

*See the following files:*
- `data-model.md` - Extended Task model with priority and tags
- `contracts/openapi.yaml` - API endpoint contracts
- `quickstart.md` - Implementation guide

## Phase 2: Implementation Plan Outline

*Phase 2 tasks are generated by `/sp.tasks` command, not this plan.*

### Backend Tasks (Phase 2)

1. **Database Schema Extension**
   - Add `priority` column to `Task` table (enum: high/medium/low, default: medium)
   - Create `TaskTag` table with user_id foreign key
   - Create `TaskTagAssignment` junction table
   - Add indexes on priority, due_date, and user_id for query performance
   - Implement cascade delete for unused tags (FR-003A)

2. **SQLModel Models**
   - Extend `Task` model with priority and tag relationships
   - Create `TaskTag` model with user isolation
   - Create `TaskTagAssignment` model for many-to-many relationship

3. **API Endpoints**
   - Update `POST /api/tasks` - accept priority and tags
   - Update `PUT /api/tasks/:id` - update priority and tags
   - `GET /api/tasks` - add query params: search, status, priority, date_preset, date_from, date_to, sort_by, sort_order
   - `GET /api/tasks/tags` - list all tags for current user
   - `DELETE /api/tasks/tags/:id` - delete tag (auto-cascade)

4. **Query Logic**
   - Implement partial word matching search across title, description, tags
   - Implement multi-criteria filtering with AND logic
   - Implement date preset logic (Overdue, Today, This Week, Next Week)
   - Implement sorting with null handling (due date nulls at bottom)
   - Optimize queries for server-side filtering (large datasets)

5. **Security & User Isolation**
   - Add JWT middleware verification to all endpoints
   - Filter all queries by user_id
   - Validate tag ownership before operations
   - Add input validation for priority values and tag limits

### Frontend Tasks (Phase 2)

1. **Task Model Extensions**
   - Extend TypeScript interfaces for priority and tags
   - Update API client methods with new parameters

2. **UI Components**
   - `PriorityBadge.tsx` - Display priority indicator (color-coded)
   - `TaskTags.tsx` - Display tags as pills/badges
   - `PrioritySelector.tsx` - Dropdown for selecting priority
   - `TagInput.tsx` - Tag input with autocomplete, limit 10 tags

3. **Search & Filter UI**
   - `SearchBar.tsx` - Search input with real-time results
   - `FilterPanel.tsx` - Multi-select filters (status, priority, date presets, custom range)
   - `SortControls.tsx` - Sort dropdown with directions
   - Update `TaskList.tsx` to integrate filter/sort/search

4. **Client-Side Filtering (Optimization)**
   - Implement filtering logic for datasets < 100 tasks
   - Debounce search input for performance
   - Show "no results" state

5. **Integration**
   - Wire up all components to API client
   - Maintain JWT token handling in API calls
   - Ensure real-time updates (< 200ms filter/sort response)

## Implementation Priorities

**P1 (Critical Path)**:
- Database schema extension (priority column)
- Update Task CRUD endpoints with priority support
- Basic filtering (status, priority) implementation
- Frontend priority badge and selector

**P2 (High Priority)**:
- Tag model and relationships
- Tag lifecycle (auto-create/delete)
- Search implementation (title, description, tags)
- Frontend tag components

**P3 (Medium Priority)**:
- Date filtering (presets + custom range)
- Sorting implementation
- Frontend filter panel and search bar

**P4 (Low Priority)**:
- Performance optimizations (indexing, server-side filtering)
- Advanced date presets (Next Week, etc.)
- Refinement and polish

## Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| Performance degradation with large datasets | Client-side filtering for < 100 tasks, server-side for larger; database indexes on filter columns |
| Tag deletion cascade affects other users' tasks | Tag lifecycle limited to user isolation; tags unique per user; cascade only affects current user's tasks |
| Search latency exceeds 500ms target | Database indexes on search columns; partial matching optimized via ILIKE; monitor and benchmark |
| Breaking existing Basic-level functionality | Extend, don't modify existing models; backward-compatible API changes; regression testing |

## Success Criteria Validation

- **SC-001** (5s priority assignment): Priority selector in task creation form
- **SC-002** (10s tag addition): Tag input with autocomplete, limit 10
- **SC-003** (500ms search): Database indexes + query optimization
- **SC-004** (200ms filter): Client-side for small datasets, efficient server-side queries
- **SC-005** (200ms sort): Sorted queries at database level with ORDER BY
- **SC-007** (Zero cross-user access): User ID from JWT in all queries; tests verify isolation
- **SC-008** (No degradation): Regression tests for existing CRUD operations

## Post-Phase 1 Constitution Re-Check

*To be completed after design artifacts are generated.*

**GATE STATUS**: Pending Phase 1 completion
