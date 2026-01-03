# Acceptance Criteria Guide

Guidelines for writing testable, measurable acceptance criteria for Phase II specs.

## Principles

### 1. Concrete and Unambiguous

**Bad:**
- The system should be fast
- The user should be able to easily search
- Performance should be good

**Good:**
- Search results return within 500ms for queries up to 1,000 records
- Users can filter results by date, category, and status
- API response time is < 200ms at p95 under normal load

### 2. Verifiable by Test or Inspection

Each criterion must be verifiable by:
- Automated test (unit, integration, e2e)
- Manual inspection (UI review, documentation check)
- Measurement (metrics, logs, benchmarks)

**Verifiable examples:**
- Error rate is < 0.1% over 1M requests
- User can create, read, update, and delete a Todo item
- All API endpoints return proper HTTP status codes (200, 201, 400, 404, 500)

**Non-verifiable examples:**
- The system should be intuitive
- Users will like the new feature
- The code should be clean

### 3. Free of Implementation Details

Acceptance criteria specify **what** and **how well**, not **how**.

**Bad (implementation details):**
- Use Redis for caching
- Implement search with Elasticsearch
- Store data in PostgreSQL with JSONB columns

**Good (behavioral requirements):**
- Search results are cached for 5 minutes
- Full-text search supports fuzzy matching
- Data persists across application restarts

### 4. Uses Measurable Language

Include specific numbers, thresholds, or constraints.

**Vague:**
- Supports many users
- Fast response time
- Secure authentication

**Measurable:**
- Supports 1,000 concurrent users with < 5% CPU utilization
- Response time < 200ms at p95
- Authentication token expires after 1 hour of inactivity

## Format

Use numbered list for clarity:

```
## Acceptance Criteria

1. [Criterion]
2. [Criterion]
3. [Criterion]
```

Each criterion should be self-contained and testable independently.

## Common Patterns

### Functional Requirements

1. User can [action] [object]
2. System validates [field] with [rules]
3. Error message [type] displays when [condition]

**Example:**
1. User can create a new Todo with title and description
2. System validates that title is 1-200 characters
3. Error "Title is required" displays when title is empty

### Performance Requirements

1. [Operation] completes within [time] under [conditions]
2. [Metric] is [threshold] at [percentile]

**Example:**
1. Todo list loads within 200ms with 100 items
2. API response time is < 500ms at p99 under 500 req/s load

### Reliability Requirements

1. [Failure scenario] handled by [mechanism]
2. [Metric] is [threshold] over [timeframe]

**Example:**
1. Database connection failures trigger automatic retry with exponential backoff
2. System uptime is 99.9% over 30-day period

### Security Requirements

1. [Resource] requires [authentication/authorization]
2. [Data] is [protected] by [mechanism]

**Example:**
1. All API endpoints require JWT authentication
2. User passwords are hashed with bcrypt (cost factor 12)

## Anti-Patterns to Avoid

### ❌ Vague Adjectives
- "fast", "responsive", "intuitive", "user-friendly", "robust"

### ❌ Subjective Judgments
- "looks good", "feels right", "users will be happy"

### ❌ Implementation Instructions
- "use X library", "call Y endpoint", "store in Z database"

### ❌ Compound Criteria
- "Users can create, update, and delete items with proper validation" (split into 3)

### ❌ Assumptions About Non-Functional Requirements
- "works on all browsers" (specify supported browsers instead)

## Examples by Category

### User Interface
1. User can search Todos by title or description
2. Search results highlight matching text
3. Clear button resets search filters
4. No results message displays when search returns empty

### API Behavior
1. POST /api/todos returns 201 with created Todo resource
2. POST /api/todos returns 400 with validation errors for invalid input
3. GET /api/todos/:id returns 404 for non-existent ID
4. All endpoints return JSON responses with Content-Type: application/json

### Data Integrity
1. Todo titles are unique per user
2. Deleted Todos are soft-deleted and retained for 30 days
3. Cascading delete removes all sub-tasks when parent Todo is deleted

### Error Handling
1. Validation errors include field-level error messages
2. Server errors return generic message and log detailed error
3. Network timeouts display user-friendly retry message
4. Rate limit exceeded returns 429 with Retry-After header

## Checklist for Each Criterion

- [ ] Is it concrete and unambiguous?
- [ ] Can it be verified by test or inspection?
- [ ] Does it avoid implementation details?
- [ ] Does it use measurable language?
- [ ] Is it testable independently?
- [ ] Does it align with feature scope?
- [ ] Can a developer implement it without asking questions?
