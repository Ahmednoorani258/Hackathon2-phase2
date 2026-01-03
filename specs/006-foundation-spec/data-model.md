# Data Model: Phase II Foundation

Entities and relationships for the multi-user Todo application.

## Entities

### User (Mirror of Auth Provider)

Represents a registered person. In the foundation phase, we primarily store references to ensure data integrity and ownership.

| Field | Type | Description |
|-------|------|-------------|
| id | String (PK) | Better Auth `sub` claim (NanoID/UUID) |
| email | String | User's email address |
| created_at | DateTime | Account creation timestamp |

### Task

Represents a todo item owned by a user.

| Field | Type | Description |
|-------|------|-------------|
| id | Integer (PK) | Primary key (autoincrement) |
| user_id | String (FK) | Reference to User.id (Enforces ownership) |
| title | String | Task title (Auto-populated to "Untitled Task" if empty) |
| is_completed | Boolean | Completion status (Default: false) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last modification timestamp |

## Relationships

- **User (1) <-> Task (N)**: A user can own multiple tasks. A task belongs to exactly one user.
- **Enforcement**: CASCADE delete tasks when a user is removed (if supported/implemented).

## Validation Rules

- **Task Title**:
    - Frontend: Sanitized for XSS.
    - Backend: Trimmed. If empty, set to "Untitled Task" (FR-008).
- **User Ownership**:
    - All queries for tasks MUST filter by `user_id` derived from the JWT (FR-006).
- **Rate Limiting**:
    - 100 requests per minute per IP (FR-005).

## Security Constraints

- No SQL injection: Using SQLModel (parameterized queries).
- User Isolation: The `user_id` is NEVER trust from request body/params for existing records. It is always verified against the JWT sub claim.
