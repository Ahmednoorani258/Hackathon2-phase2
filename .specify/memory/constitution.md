<!--
SYNC IMPACT REPORT
Version Change: 1.1.0 → 1.1.1
Added Principles:
- None
Modified Principles:
- None
Added Sections:
- None
Removed Sections:
- None
Modified Sections:
- Feature Progression (simplified scope to focused feature set)
Templates Status:
✅ spec-template.md - Aligned with spec-driven principles (no changes needed)
✅ plan-template.md - Constitution check section matches (no changes needed)
✅ tasks-template.md - Reflects task categorization (no changes needed)
✅ phr-template.prompt.md - PHR workflow preserved (no changes needed)
Follow-up TODOs: None
-->

# Todo Application Constitution (Phase II)

## Purpose & Authority

This constitution is supreme authority in the repository. All specifications, plans, agents, and generated code MUST comply with these principles. No code, spec, or plan may violate this document without explicit amendment.

**Scope**: Full-stack, multi-user Todo web application with authentication, data persistence, and responsive web frontend.

**Authority Hierarchy**:
1. Constitution (this document) - SUPREME
2. Spec-Kit Plus specifications (/specs/*.md)
3. Implementation plans (/specs/*/plan.md)
4. Generated code (enforced by Claude Code)

## Development Philosophy

### I. Spec-Driven Development (NON-NEGOTIABLE)

**Rule**: Every feature, bug fix, and architectural change MUST be specified and approved before implementation.

**Requirements**:
- All work starts with `/sp.specify` to create or update specs
- Specs MUST be complete, consistent, and approved via `/sp.checklist` or `/sp.validate` before any code generation
- Code generation is ONLY permitted through approved specs and Claude Code execution
- Manual coding is PROHIBITED without explicit spec approval
- All specs live under `/specs` using Spec-Kit Plus structure

**Rationale**: Spec-driven development ensures requirements are clear, testable, and traceable. It prevents feature creep, technical debt, and misalignment between stakeholders and implementation.

### II. Context-7 Knowledge First

**Rule**: All technology decisions, patterns, and implementations MUST leverage Context-7 MCP/skill to ensure up-to-date technologies, best practices, and modern code patterns.

**Requirements**:
- Technology choices MUST be verified via Context-7 before adoption
- Code patterns MUST reference current best practices via Context-7
- Deprecation warnings and modern alternatives MUST be checked via Context-7
- Library documentation MUST be fetched via Context-7 for accurate API usage
- If information about any code or library is needed, the `context7-efficient` skill MUST be used

**Rationale**: Technology evolves rapidly. Context-7 ensures we use current, supported, and optimal patterns, not outdated practices.

### III. No Manual Coding

**Rule**: All code changes MUST be generated via Claude Code executing against approved specs. Direct manual coding is PROHIBITED.

**Requirements**:
- Code changes require: spec → plan → tasks → implementation workflow
- Manual edits are ONLY allowed for trivial fixes (typos, one-line adjustments) and MUST be tracked
- Any significant manual coding requires immediate spec update and plan amendment
- All agents MUST invoke Claude Code for implementation tasks

**Rationale**: Ensures traceability, consistency, and alignment with specs. Prevents drift between specifications and codebase.

### IV. Clean Architecture & Maintainability

**Rule**: Code MUST follow clean architecture principles with clear separation of concerns, testability, and maintainability.

**Requirements**:
- Models, services, routes, and components MUST be strictly separated
- No circular dependencies between layers
- All modules MUST have single responsibility
- Code MUST be readable, well-documented, and follow language-specific conventions
- Refactoring is REQUIRED when code complexity exceeds threshold (e.g., function > 50 lines, class > 300 lines)

**Rationale**: Clean architecture reduces cognitive load, enables testing, and supports long-term maintainability.

### V. Security by Default (NON-NEGOTIABLE)

**Rule**: All user-facing and API code MUST implement security measures by default. Security is never optional.

**Requirements**:
- All API endpoints MUST require valid JWT authentication
- User identity MUST be derived from JWT claims, never from request parameters
- All database queries MUST be filtered by authenticated user ID (user isolation)
- Unauthorized access attempts MUST return 401 Unauthorized
- Input validation is MANDATORY at all system boundaries
- Secrets MUST be stored in environment variables, never committed
- SQL injection, XSS, and CSRF protections are REQUIRED

**Rationale**: Multi-user applications with persistent data are high-risk. Security defaults prevent data leaks, cross-user access, and common vulnerabilities.

### VI. Modern Tech Stack Adherence

**Rule**: The mandatory technology stack is NON-NEGOTIABLE. All code must use these specified technologies.

**Mandatory Stack**:
- **Frontend**: Next.js 16+ (App Router) with TypeScript and Tailwind CSS
- **Backend**: Python with FastAPI and UV package manager
- **ORM**: SQLModel
- **Database**: Neon Serverless PostgreSQL
- **Authentication**: Better Auth (JWT-based) running on frontend
- **Spec System**: GitHub Spec-Kit + Spec-Kit Plus

**Requirements**:
- No alternative frameworks or databases without constitutional amendment
- All frontend MUST use App Router (not Pages Router)
- All backend MUST use SQLModel (not raw SQL, SQLAlchemy, or other ORMs)
- All auth MUST be JWT-based via Better Auth

**Rationale**: Consistency, interoperability, and operational excellence. A unified stack reduces complexity and improves velocity.

### VII. User Isolation & Data Ownership

**Rule**: Every user MUST only access their own data. Cross-user data access is a CRITICAL security violation.

**Requirements**:
- Every database query MUST include `WHERE user_id = current_user_id`
- Every API endpoint MUST extract user ID from JWT, never from request body/params
- Task ownership MUST be enforced on create, read, update, delete operations
- Tests MUST verify cross-user access is blocked
- Data ownership is strictly tied to authenticated user ID

**Rationale**: Multi-user applications require strict data isolation. Any breach allows one user to access another's data—a critical security failure.

### VIII. Specialized Agent Usage (MANDATORY)

**Rule**: Tasks MUST be delegated to the appropriate specialized agents provided in the environment.

**Requirements**:
- **Backend Tasks**: Use `backend-auth-guardian` for all FastAPI, SQLModel, and authentication logic.
- **Frontend Tasks**: Use `secure-frontend-developer` for all Next.js, Tailwind, and UI implementation.
- **Specification Tasks**: Use `spec-authority` for all spec validation, creation, and SDD enforcement.
- Agents MUST be invoked proactively when a task falls within their specialized domain.

**Rationale**: Specialization ensures that security, architectural patterns, and domain-specific best practices are strictly followed by agents optimized for those tasks.

### IX. Resource & Tool Discipline

**Rule**: Agents MUST prefer project-specific tools and skills over generic tool use or manual execution.

**Requirements**:
- **Browser Use**: If browser interaction is required, use skills provided in the project's `.claude` folder and authorized MCP tools.
- **Code Reasoning**: Use `context7-efficient` for all documentation and code pattern research.

**Rationale**: Using project-optimized tools preserves context, reduces token usage, and ensures consistency with the repo's environment.

## Spec Governance Rules

### Specification Requirements

**Spec Structure**:
- `/specs/overview.md` - Project overview (REQUIRED)
- `/specs/features/<feature>/spec.md` - Feature specifications
- `/specs/api/` - API endpoint specifications
- `/specs/database/` - Schema and model specifications
- `/specs/ui/` - Component and page specifications

**Spec Content** (mandatory for all feature specs):
- User stories with priorities (P1, P2, P3...)
- Acceptance scenarios (Given/When/Then)
- Functional requirements
- Key entities and relationships
- Success criteria (measurable)

### Approval Gates

Before implementation begins:
1. Spec created via `/sp.specify`
2. Validated via `/sp.checklist` or `/sp.validate`
3. Questions resolved via `/sp.clarify`
4. All placeholders resolved (NO "NEEDS CLARIFICATION" markers)
5. Spec marked as "Approved" status

**Code generation is BLOCKED until spec approval.**

### Amendment Process

**Constitutional Amendments**:
1. Document rationale for change
2. Update constitution version (semantic versioning: MAJOR.MINOR.PATCH)
3. Sync impact report updated at top of file
4. Dependent templates validated for consistency
5. Team review and commit with clear message

**Spec Amendments**:
1. Create PHR documenting change request
2. Update spec.md with changes
3. Re-validate via `/sp.validate`
4. Plan updated if implementation in progress
5. Tasks re-generated if needed

## Security & Authentication Rules

### JWT Authentication Flow

**Frontend (Better Auth)**:
- Better Auth runs on Next.js frontend
- Issues JWT tokens on successful authentication
- Sends tokens in API requests via `Authorization: Bearer <token>` header
- Refresh tokens supported for extended sessions

**Backend (FastAPI)**:
- Verifies JWT on every API request using shared `BETTER_AUTH_SECRET`
- Extracts user ID from JWT claims (typically `sub` field)
- Rejects invalid/missing tokens with 401 Unauthorized
- Never trusts user ID from request parameters, body, or cookies

**Requirements**:
- `BETTER_AUTH_SECRET` MUST be stored in environment variables
- Same secret used by both frontend and backend
- JWT expiration MUST be enforced (short-lived access token, longer-lived refresh token)

### API Endpoint Security

**All API endpoints MUST**:
- Require valid JWT in Authorization header
- Extract user_id from JWT claims
- Filter all database queries by `user_id`
- Return 401 for unauthorized access
- Return 403 for insufficient permissions (if roles implemented)

**Protected Endpoints**:
- `GET /api/tasks` - Return only tasks owned by user
- `POST /api/tasks` - Auto-assign task to authenticated user
- `PUT /api/tasks/:id` - Verify user owns task before update
- `DELETE /api/tasks/:id` - Verify user owns task before delete

**Public Endpoints** (if any):
- Health checks
- Documentation
- Auth endpoints (login, register)

### Data Security

**Database**:
- All tables MUST have `user_id` foreign key
- All queries MUST filter by `user_id`
- Cascade delete on user deletion (or archive)
- Index on `user_id` for performance

**Input Validation**:
- Pydantic models validate all request bodies
- SQL injection prevented by SQLModel parameterized queries
- XSS prevented by React/Next.js auto-escaping
- CSRF prevented by JWT-based authentication

## API & Data Ownership Rules

### API Design Principles

**RESTful Endpoints**:
- Resource-oriented URLs (`/api/tasks`, `/api/tasks/:id`)
- Standard HTTP methods (GET, POST, PUT, DELETE)
- JSON request/response bodies
- Consistent error responses
- HTTP status codes (200, 201, 400, 401, 403, 404, 500)

**Response Format**:
- Success: `{ "data": {...}, "message": "..." }`
- Error: `{ "error": "error_code", "message": "...", "details": {...} }`

**Versioning**:
- All endpoints under `/api/v1/` initially
- Breaking changes require new version (`/api/v2/`)
- Deprecation timeline communicated in documentation

### Data Ownership Enforcement

**Every database operation MUST**:
1. Extract `user_id` from JWT
2. Append `WHERE user_id = <user_id>` to queries
3. Validate ownership before updates/deletes
4. Auto-assign `user_id` on creates

**Prohibited Patterns**:
```python
# BAD: User ID from request body
user_id = request.json()["user_id"]

# BAD: No user filter
tasks = session.exec(select(Task).all())

# BAD: Trusting query params
task = session.get(Task, task_id)  # Might belong to another user

# GOOD: User ID from JWT
user_id = jwt_decode(token)["sub"]
tasks = session.exec(select(Task).where(Task.user_id == user_id))
```

### Cross-User Access Prevention

**Tests MUST verify**:
- User A cannot access User B's tasks via GET
- User A cannot modify User B's tasks via PUT
- User A cannot delete User B's tasks via DELETE
- User A cannot create tasks for User B
- Unauthorized requests (no token) return 401
- Invalid tokens return 401

**Failure to pass these tests is a CRITICAL bug.**

## Tech Stack Mandates

### Frontend (Next.js 16+)

**Framework**: Next.js 16+ with App Router (NOT Pages Router)
**Language**: TypeScript (strict mode enabled)
**Styling**: Tailwind CSS (no inline styles)
**State**: React hooks for local state, API for server state
**Auth**: Better Auth (JWT-based)
**Structure**:
```
frontend/
├── app/              # App Router pages
├── components/       # Reusable UI components
├── lib/              # Utilities, API client
└── public/           # Static assets
```

**Patterns**:
- Server components by default
- Client components only for interactivity
- API calls through `/lib/api.ts`
- No manual fetch calls in components

### Backend (FastAPI + Python)

**Framework**: FastAPI with Python 3.11+
**Package Manager**: UV (NOT pip, pipenv, poetry)
**ORM**: SQLModel (NOT SQLAlchemy, raw SQL)
**Database**: Neon Serverless PostgreSQL
**Auth**: JWT verification via shared secret
**Structure**:
```
backend/
├── main.py           # FastAPI app entry
├── models.py         # SQLModel models
├── routes/           # API route handlers
├── db.py             # Database connection
└── tests/            # Pytest tests
```

**API Conventions**:
- All routes under `/api/`
- Return JSON responses
- Use Pydantic models for request/response
- Handle errors with HTTPException

### Database (Neon PostgreSQL)

**Provider**: Neon Serverless PostgreSQL
**ORM**: SQLModel (type-safe, Pydantic-based)
**Connection**: `DATABASE_URL` environment variable
**Features**:
- Serverless scaling
- Automatic migrations
- Backup included
- Branch support for dev/staging

**Schema Requirements**:
- All tables have `user_id` foreign key
- Indexes on foreign keys
- Cascade deletes where appropriate
- Timestamps (created_at, updated_at)

### Authentication (Better Auth)

**Frontend Auth**:
- Better Auth library on Next.js
- JWT token issuance on login
- Token storage in httpOnly cookies or secure storage
- Refresh token rotation supported

**Backend Auth**:
- JWT verification using `BETTER_AUTH_SECRET`
- User ID extraction from JWT `sub` claim
- Middleware for endpoint protection
- Token validation before any operation

**Integration**:
- Same `BETTER_AUTH_SECRET` in frontend and backend
- Token passed via `Authorization: Bearer <token>` header
- Shared user ID reference (email or UUID)

### Spec System (Spec-Kit Plus)

**Framework**: GitHub Spec-Kit + Spec-Kit Plus
**Location**: `/specs/` directory
**Commands**:
- `/sp.specify` - Create/update spec
- `/sp.clarify` - Resolve unclear requirements
- `/sp.plan` - Create implementation plan
- `/sp.tasks` - Generate actionable tasks
- `/sp.implement` - Execute implementation
- `/sp.validate` - Validate spec quality
- `/sp.checklist` - Generate validation checklist
- `/sp.adr` - Create architectural decision record

**Structure**:
```
specs/
├── overview.md               # Project overview
├── features/
│   └── <feature>/
│       ├── spec.md           # Requirements
│       ├── plan.md           # Architecture
│       └── tasks.md          # Tasks
├── api/                      # API contracts
├── database/                 # Schema specs
└── ui/                       # UI components
```

## Monorepo Structure & Governance

### Repository Structure

**Root Level**:
```
Hackathon2-Phase2/
├── CLAUDE.md                 # Project instructions (supreme authority)
├── frontend/                 # Next.js application
├── backend/                  # FastAPI application
├── specs/                    # All specifications
├── .specify/                 # Spec-Kit Plus configuration
│   └── memory/
│       └── constitution.md   # This document
└── history/
    ├── prompts/              # PHR records
    └── adr/                  # Architecture decisions
```

**Governance Hierarchy**:
1. Root `CLAUDE.md` - Project-level rules (supersedes sub-projects)
2. `frontend/CLAUDE.md` - Frontend-specific rules
3. `backend/CLAUDE.md` - Backend-specific rules
4. `.specify/memory/constitution.md` - Constitutional rules (supreme)

### Development Workflow

**Full Feature Lifecycle**:
1. User describes feature
2. `/sp.specify` creates `/specs/features/<feature>/spec.md`
3. `/sp.validate` ensures spec completeness
4. `/sp.plan` creates `/specs/features/<feature>/plan.md`
5. `/sp.tasks` creates `/specs/features/<feature>/tasks.md`
6. `/sp.implement` executes all tasks
7. Tests run and pass
8. Code committed and deployed

**Commands**:
```
# Frontend dev
cd frontend && npm run dev

# Backend dev
cd backend && uvicorn main:app --reload

# Both services
docker-compose up

# Spec workflow
/sp.specify <feature>    # Create spec
/sp.plan <feature>       # Create plan
/sp.tasks <feature>      # Generate tasks
/sp.implement <feature>  # Execute tasks
```

### Spec Authority

**Specs are the source of truth**:
- All code MUST implement specs exactly
- Any deviation requires spec amendment first
- Spec changes trigger plan and task updates
- Code reviews verify spec compliance

**Spec Overrides Code**:
- If code diverges from spec, code is wrong
- Update spec first, then code
- Never implement "by convention" without spec
- No "implicit requirements" in code

## Feature Progression

This section defines the phased approach to building the Todo application, ensuring incremental value delivery while maintaining quality and security standards.

### Overview

**Philosophy**: Build in stages (Basic → Intermediate → Advanced) where each stage delivers a complete, working product that can be deployed and demonstrated.

**Progression Rules**:
1. **Basic stage MUST be complete before Intermediate features begin**
2. **Intermediate stage MUST be complete before Advanced features begin**
3. **Each stage MUST be independently testable and deployable**
4. **Security and user isolation enforced at all stages**
5. **Spec-driven workflow applies to features within each stage**

### Stage 1: Basic (Core Essentials)

**Definition**: Core Todo functionality forming the foundation—quick to build, essential for any MVP.

**Scope**:
- User registration and login (Better Auth with JWT)
- Add Task – Create new todo items
- Delete Task – Remove tasks from list
- Update Task – Modify existing task details
- View Task List – Display all tasks
- Mark as Complete – Toggle task completion status
- User isolation enforced (all data filtered by user_id)
- Responsive web interface (desktop and mobile)
- RESTful API with JWT authentication
- Persistent data storage (Neon PostgreSQL)

**Acceptance Criteria**:
- Users can register and authenticate
- Authenticated users see only their own tasks
- Users can add new tasks
- Users can delete tasks they own
- Users can update/edit task details
- Users can view all their tasks in a list
- Users can toggle task completion status
- API endpoints protected by JWT (401 on unauthorized access)
- Cross-user access is blocked and tested

**Out of Scope for Basic**:
- Task filtering, sorting, searching
- Due dates, priorities, labels/categories
- Collaboration features (sharing, comments)
- Batch operations
- Advanced UI patterns

**Technical Requirements**:
- Frontend: Next.js 16+ App Router, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLModel, Neon PostgreSQL
- Auth: Better Auth (JWT-based) on frontend, JWT verification on backend
- All API endpoints require valid JWT
- All database queries include `WHERE user_id = current_user_id`

### Stage 2: Intermediate (Organization & Usability)

**Definition**: Features that make the app feel polished and practical for better task organization.

**Scope**:
- Priorities & Tags/Categories – Assign levels (high/medium/low) or labels (work/home)
- Search & Filter – Search by keyword; filter by status, priority, or date
- Sort Tasks – Reorder by due date, priority, or alphabetically

**Acceptance Criteria**:
- Users can assign priority levels to tasks (high, medium, low)
- Users can tag or categorize tasks with labels (e.g., work, home)
- Users can search tasks by keyword
- Users can filter tasks by status, priority, or date
- Users can sort tasks by due date, priority, or alphabetically
- All features maintain user isolation

**Out of Scope for Intermediate**:
- Real-time collaboration
- Batch operations
- Dashboard/analytics
- Advanced permissions/roles

**Technical Requirements**:
- Database indexes on filter/sort columns for performance
- Search functionality with database-level optimization
- Efficient query patterns for multiple filter criteria

### Stage 3: Advanced (Intelligent Features)

**Definition**: Intelligent features for advanced task management and productivity.

**Scope**:
- Recurring Tasks – Auto-reschedule repeating tasks (e.g., "weekly meeting")
- Due Dates & Time Reminders – Set deadlines with date/time pickers; browser notifications

**Acceptance Criteria**:
- Users can create recurring tasks with repeat patterns (daily, weekly, monthly)
- System auto-creates new task instances from recurring schedule
- Users can set due dates with date/time pickers
- Users receive browser notifications for due date reminders
- All features maintain user isolation

**Out of Scope for Advanced**:
- Real-time collaboration
- File attachments
- Advanced analytics/reporting
- Multi-user task sharing
- Mobile native apps (beyond responsive web)

**Technical Requirements**:
- Background job processing for recurring task creation
- Browser notification API integration
- Date/time picker components for user input
- Efficient scheduling algorithm for recurring tasks

### Stage Progression Rules

**Completion Requirements**:
- **Stage Complete When**:
  1. All features in stage acceptance criteria are implemented
  2. All acceptance tests pass
  3. Security tests pass (user isolation, JWT validation)
  4. Code follows constitutional principles (clean architecture, no manual coding)
  5. Spec for stage features is approved and implemented

**Transition Triggers**:
- **Basic → Intermediate**:
  1. Basic stage fully deployed and tested
  2. User testing complete with positive feedback
  3. Security audit passed (user isolation, JWT)
  4. Code quality review passed

- **Intermediate → Advanced**:
  1. Intermediate stage fully deployed and tested
  2. Performance metrics meet targets (API latency, page load)
  3. User adoption and satisfaction validated
  4. Scalability tested (concurrent users, data volume)

**Backward Compatibility**:
- Adding stage features MUST NOT break existing functionality
- Database schema migrations MUST be backward compatible
- API changes MUST use versioning (/api/v1/, /api/v2/)
- Frontend changes MUST maintain existing user workflows

### Scope Management

**Feature Creep Prevention**:
- Features outside defined stage scope require:
  1. Constitution amendment (if changing progression model)
  2. Spec update for the stage
  3. Impact analysis on timeline and complexity
  4. Stakeholder approval before implementation

**Deprioritization**:
- If timeline constraints exist:
  1. Prioritize Basic stage features (non-negotiable)
  2. Move lower-priority Intermediate features to Advanced
  3. Defer Advanced features until later iteration
  4. Always maintain security and user isolation

## Governance

### Amendment Process

**Amendment Types**:
- **MAJOR**: Backward incompatible governance/principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

**Amendment Workflow**:
1. Document rationale for change
2. Update constitution with new version
3. Create sync impact report (HTML comment at top)
4. Validate template consistency (spec, plan, tasks, phr templates)
5. Commit with clear message: `docs: amend constitution to vX.Y.Z (<reason>)`
6. Notify team of breaking changes (MAJOR only)

### Compliance Review

**Before Any Code Generation**:
1. Verify spec is approved (no "NEEDS CLARIFICATION")
2. Verify plan passes Constitution Check
3. Verify tech stack compliance (no unauthorized frameworks)
4. Verify security requirements are addressed

**Before Any Commit**:
1. All tests pass
2. Code matches spec exactly
3. Security review (JWT, user isolation)
4. No hardcoded secrets
5. Clean architecture maintained

**During Code Review**:
1. Spec compliance checked
2. Constitutional principles verified
3. Security practices reviewed
4. Tech stack adherence confirmed
5. No manual coding without spec approval

### Complexity Justification

**Constitutional violations require justification** in plan.md Complexity Tracking table:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., Extra library] | [specific need] | [why built-in insufficient] |

**Example**: Adding a caching layer when constitution says "keep it simple" requires justifying why the simpler alternative (no cache) is insufficient.

### Default Policies

**Unless explicitly specified otherwise**:
- Keep it simple (YAGNI - You Aren't Gonna Need It)
- Prefer existing solutions over custom implementations
- Smallest viable change > perfect architecture
- Tests optional unless spec explicitly requests them
- No premature optimization
- Refactor only when complexity is justified

### Code Standards

**All code MUST**:
- Follow language-specific conventions (PEP 8, ESLint rules)
- Use meaningful names (no abbreviations, single-letter vars)
- Document non-obvious logic
- Handle errors explicitly (no silent failures)
- Log security events (auth failures, unauthorized access)
- Be testable and maintainable

## Functional Requirements (Constitutional Mandate)

This application MUST implement the following features:

### Core Todo Features

1. **Add Task**: Users can create new tasks with title and optional description
2. **View Tasks**: Users can view their list of tasks (filtered by user)
3. **Update Task**: Users can modify task title, description, status
4. **Delete Task**: Users can remove tasks they own
5. **Toggle Complete**: Users can mark tasks as complete/incomplete

### Technical Requirements

1. **Responsive Web Frontend**: Works on desktop, tablet, mobile
2. **RESTful API Endpoints**: Clean, predictable API under `/api/`
3. **Persistent Data**: All tasks stored in Neon PostgreSQL
4. **Multi-User Authentication**: Better Auth with JWT
5. **Strict User Isolation**: Users only see their own data

### Non-Functional Requirements

1. **Performance**: API responses < 200ms p95 (typical load)
2. **Security**: All endpoints protected by JWT, user isolation enforced
3. **Reliability**: Graceful error handling, no silent failures
4. **Maintainability**: Clean architecture, clear separation of concerns

## Version History

**Version**: 1.2.0 | **Ratified**: 2025-12-31 | **Last Amended**: 2025-12-31

**Initial Ratification** (v1.0.0):
- Establishes Spec-Driven Development as supreme rule
- Defines mandatory tech stack (Next.js 16+, FastAPI, SQLModel, Neon, Better Auth)
- Enforces security by default with JWT and user isolation
- Mandates no manual coding, all via approved specs
- Sets clean architecture and maintainability principles

**Changes in 1.0.0**:
- Initial constitution created
- All 7 core principles defined
- Spec governance rules established
- Security and authentication rules mandated
- API and data ownership rules enforced
- Tech stack defined and frozen
- Monorepo structure and governance specified

**Changes in 1.1.0** (MINOR - New Section Added):
- Added Feature Progression section with Basic, Intermediate, Advanced stages
- Defined scope and acceptance criteria for each stage
- Established stage transition triggers and completion requirements
- Added scope management rules to prevent feature creep
- All templates remain aligned (no changes needed)
- No principles modified or removed

**Changes in 1.1.1** (PATCH - Feature Progression Simplified):
- Simplified Stage 1 (Basic) to focus on core essentials: Add, Delete, Update, View, Complete
- Simplified Stage 2 (Intermediate) to organization features: Priorities/Tags, Search/Filter, Sort
- Simplified Stage 3 (Advanced) to intelligent features: Recurring Tasks, Due Dates with Notifications
- Removed over-engineering features (batch ops, dashboard, real-time, collaboration, file attachments, export/import, offline mode)
- Maintained three-stage progression with clear, focused scope
- All templates remain aligned (no changes needed)
- No principles modified or removed

**Changes in 1.2.0** (MINOR - Agent and Tool Mandates):
- Mandated use of specialized agents (backend-auth-guardian, secure-frontend-developer, spec-authority)
- Mandated use of Context-7 (context7-efficient) for all documentation and code intelligence
- Mandated use of project-specific browser skills from .claude folder
- Updated Development Philosophy with Principles VIII and IX
- Updated Context-7 principle (II) with explicit tool mandate
