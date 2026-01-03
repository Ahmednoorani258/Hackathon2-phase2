# Tasks: Task Organization Features

**Input**: Design documents from `/specs/007-task-organization/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md, contracts/openapi.yaml
**Feature**: Phase II Intermediate - Task Organization Features

**Tests**: Tests are not explicitly requested in feature specification. Unit/integration tests can be added in Polish phase if desired.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema extensions and shared utilities

- [X] T001 Add priority column to tasks table in backend/migrations/001_add_priority.sql
- [X] T002 Create task_tags table in backend/migrations/002_create_tags.sql
- [X] T003 Create task_tag_assignments junction table in backend/migrations/003_create_junction_table.sql
- [X] T004 Create database indexes in backend/migrations/004_create_indexes.sql
- [X] T005 [P] Create auto-delete trigger for unused tags in backend/migrations/005_cleanup_trigger.sql

**Checkpoint**: Database schema extensions complete, ready for model implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Extend Task model with priority field in backend/models.py
- [X] T007 [P] Create TaskTag model in backend/models.py
- [X] T008 [P] Create TaskTagAssignment model in backend/models.py
- [X] T009 [P] Create helper function handle_tags for tag assignments in backend/routes/tasks.py
- [X] T010 Create helper function get_date_preset_range for date filters in backend/routes/tasks.py
- [X] T011 Create helper function apply_sort for query sorting in backend/routes/tasks.py

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Task Prioritization (Priority: P1) 🎯 MVP

**Goal**: Users can assign priority levels (high/medium/low) to tasks and see priority indicators in the UI.

**Independent Test**: Create tasks with different priorities, view them in task list, verify priority persists.

### Implementation for User Story 1

- [X] T012 [US1] Update POST /api/v1/tasks endpoint to accept priority field in backend/routes/tasks.py
- [X] T013 [US1] Update PUT /api/v1/tasks/{id} endpoint to accept priority field in backend/routes/tasks.py
- [X] T014 [US1] Add PriorityBadge.tsx component in frontend/components/PriorityBadge.tsx
- [X] T015 [US1] Create PrioritySelector.tsx component in frontend/components/PrioritySelector.tsx
- [X] T016 [US1] Update TaskItem.tsx to display PriorityBadge in frontend/components/TaskItem.tsx
- [X] T017 [US1] Update task creation form to include PrioritySelector in frontend/app/page.tsx
- [X] T018 [US1] Update task edit form to include PrioritySelector in frontend/app/page.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Task Tagging/Categorization (Priority: P1)

**Goal**: Users can assign tags to tasks and filter by tags. Tags are automatically created when assigned and deleted when unused.

**Independent Test**: Create tasks with tags, filter by tags, verify tags persist and auto-delete when unused.

### Implementation for User Story 2

- [X] T019 [P] [US2] Create GET /api/v1/tags endpoint in backend/routes/tags.py
- [X] T020 [P] [US2] Create DELETE /api/v1/tags/{id} endpoint in backend/routes/tags.py
- [X] T021 [US2] Update POST /api/v1/tasks to handle tags using handle_tags in backend/routes/tasks.py
- [X] T022 [US2] Update PUT /api/v1/tasks/{id} to handle tags using handle_tags in backend/routes/tasks.py
- [X] T023 [P] [US2] Create TaskTags.tsx component to display tags in frontend/components/TaskTags.tsx
- [X] T024 [US2] Create TagInput.tsx component with autocomplete in frontend/components/TagInput.tsx
- [X] T025 [US2] Update TaskItem.tsx to display TaskTags in frontend/components/TaskItem.tsx
- [X] T026 [US2] Update task creation form to include TagInput in frontend/app/page.tsx
- [X] T027 [US2] Update task edit form to include TagInput in frontend/app/page.tsx

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 5: User Story 3 - Keyword Search (Priority: P2)

**Goal**: Users can search tasks by keyword across title, description, and tags using partial word matching.

**Independent Test**: Create tasks with various content, search for keywords, verify matches across all three fields.

### Implementation for User Story 3

- [X] T028 [US3] Add search query parameter to GET /api/v1/tasks in backend/routes/tasks.py
- [X] T029 [US3] Implement partial word matching search across title, description, tags in backend/routes/tasks.py
- [X] T030 [US3] Create SearchBar.tsx component in frontend/components/SearchBar.tsx
- [X] T031 [US3] Update TaskList.tsx to integrate SearchBar in frontend/app/page.tsx
- [X] T032 [US3] Add search debounce for performance in frontend/lib/api.ts

**Checkpoint**: At this point, User Story 3 should be fully functional and testable independently

---

## Phase 6: User Story 4 - Task Filtering (Priority: P2)

**Goal**: Users can filter tasks by status, priority, and date presets/custom ranges.

**Independent Test**: Apply different filters and verify only matching tasks are displayed.

### Implementation for User Story 4

- [X] T033 [P] [US4] Add status filter to GET /api/v1/tasks in backend/routes/tasks.py
- [X] T034 [P] [US4] Add priority filter to GET /api/v1/tasks in backend/routes/tasks.py
- [X] T035 [US4] Add date_preset filter logic to GET /api/v1/tasks in backend/routes/tasks.py
- [X] T036 [P] [US4] Add date_from and date_to custom range filters to GET /api/v1/tasks in backend/routes/tasks.py
- [X] T037 [P] [US4] Create FilterPanel.tsx component in frontend/components/FilterPanel.tsx
- [X] T038 [US4] Update TaskList.tsx to integrate FilterPanel in frontend/app/page.tsx

**Checkpoint**: At this point, User Story 4 should be fully functional and testable independently

---

## Phase 7: User Story 5 - Task Sorting (Priority: P3)

**Goal**: Users can sort tasks by due date, priority, or alphabetical order.

**Independent Test**: Apply different sort orders and verify tasks are displayed in correct sequence.

### Implementation for User Story 5

- [X] T039 [P] [US5] Add sort_by and sort_order parameters to GET /api/v1/tasks in backend/routes/tasks.py
- [X] T040 [US5] Implement sorting logic with NULLS LAST for due date in backend/routes/tasks.py
- [X] T041 [P] [US5] Create SortControls.tsx component in frontend/components/SortControls.tsx
- [X] T042 [US5] Update TaskList.tsx to integrate SortControls in frontend/app/page.tsx

**Checkpoint**: At this point, User Story 5 should be fully functional and testable independently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T043 Update TypeScript interfaces in frontend/lib/types.ts to include priority and tags
- [X] T044 Update API client methods in frontend/lib/api.ts with new query parameters
- [X] T045 Verify all database queries include user_id filtering in backend/routes/
- [X] T046 Verify all API endpoints require JWT authentication in backend/routes/
- [X] T047 Tag lifecycle validation: Verify auto-delete works correctly
- [X] T048 Search performance: Verify < 500ms for 1000 tasks
- [X] T049 Filter/sort performance: Verify < 200ms UI update
- [X] T050 User isolation tests: Verify cross-user access is blocked

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Integrates with all stories but independently testable
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Integrates with all stories but independently testable

### Within Each User Story

- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (Phase 1) can run in parallel
- All Foundational tasks (Phase 2) marked [P] can run in parallel
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# Create both tag endpoints in parallel:
Task: "Create GET /api/v1/tags endpoint in backend/routes/tags.py"
Task: "Create DELETE /api/v1/tags/{id} endpoint in backend/routes/tags.py"

# Update both task CRUD endpoints to handle tags:
Task: "Update POST /api/v1/tasks to handle tags using handle_tags in backend/routes/tasks.py"
Task: "Update PUT /api/v1/tasks/{id} to handle tags using handle_tags in backend/routes/tasks.py"

# Create both frontend tag components in parallel:
Task: "Create TaskTags.tsx component to display tags in frontend/components/TaskTags.tsx"
Task: "Create TagInput.tsx component with autocomplete in frontend/components/TagInput.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (database schema extensions)
2. Complete Phase 2: Foundational (models and helpers)
3. Complete Phase 3: User Story 1 (task prioritization)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (prioritization)
   - Developer B: User Story 2 (tagging)
   - Developer C: User Story 3 (search)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (if tests added)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tasks follow strict checklist format with checkbox, ID, labels, file paths
