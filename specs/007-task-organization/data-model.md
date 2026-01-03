# Data Model: Task Organization Features

**Feature**: 007-task-organization
**Phase**: Phase 1 - Design
**Date**: 2026-01-03

## Overview

This document defines the data model extensions for task organization features. All changes are backward-compatible with the existing Basic-level implementation and maintain strict user isolation as required by the constitution.

---

## Entity Definitions

### Task (Extended)

**Purpose**: Core task entity with added priority and tag support.

**SQLModel Definition**:
```python
from typing import Optional, List
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlmodel import SQLModel, Field, Relationship

# Priority Enum
class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskBase(SQLModel):
    """Base task model with common fields"""
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_completed: bool = Field(default=False)
    priority: Priority = Field(default=Priority.MEDIUM)
    due_date: Optional[datetime] = Field(default=None)

class Task(TaskBase, table=True):
    """Task table with organization features"""
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    # Relationships
    tags: List["TaskTagAssignment"] = Relationship(back_populates="task")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Complete project documentation",
                "description": "Write README and API docs",
                "is_completed": False,
                "priority": "high",
                "due_date": "2026-01-10T12:00:00Z"
            }
        }
```

**Schema Changes**:
```sql
-- Add priority column to existing tasks table
ALTER TABLE tasks
ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium',
ADD CONSTRAINT tasks_priority_check CHECK (priority IN ('high', 'medium', 'low'));

-- Ensure due_date exists (should exist from Basic level)
-- If not, add it:
ALTER TABLE tasks ADD COLUMN due_date TIMESTAMP;
```

**Indexes**:
```sql
-- Priority filtering and sorting
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Due date filtering and sorting
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Completion status filtering
CREATE INDEX idx_tasks_is_completed ON tasks(is_completed);

-- User isolation (should exist from Basic level)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Composite index for common filter combinations
CREATE INDEX idx_tasks_user_priority_status ON tasks(user_id, priority, is_completed);
```

**Validation Rules**:
- `priority` must be one of: "high", "medium", "low"
- `due_date` is optional (can be NULL)
- `title` max length: 200 characters
- `description` max length: 2000 characters

**Constraints**:
- `priority` default: "medium"
- `user_id` is mandatory (foreign key to users table)

---

### TaskTag (New)

**Purpose**: Tag entity for categorizing tasks, with automatic lifecycle and user isolation.

**SQLModel Definition**:
```python
from sqlalchemy import UniqueConstraint

class TaskTagBase(SQLModel):
    """Base tag model"""
    name: str = Field(max_length=50)

class TaskTag(TaskTagBase, table=True):
    """Tag table with user isolation"""
    __tablename__ = "task_tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    assignments: List["TaskTagAssignment"] = Relationship(back_populates="tag")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "work"
            }
        }
        # Unique constraint: tag names unique per user
        table_args = (
            UniqueConstraint("user_id", "name", name="uq_task_tags_user_name"),
        )
```

**Schema Changes**:
```sql
CREATE TABLE task_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT uq_task_tags_user_name UNIQUE (user_id, name)
);

-- Index for tag lookup and search
CREATE INDEX idx_task_tags_name_user ON task_tags(name, user_id);
```

**Validation Rules**:
- `name` max length: 50 characters
- `name` must be case-insensitively unique per user
- `name` must be trimmed of whitespace

**Constraints**:
- Tags are automatically deleted when user is deleted (CASCADE)
- Tag names are unique per user (case-insensitive)

**Auto-Delete Trigger**:
```sql
-- Trigger to automatically delete unused tags when all assignments are removed
CREATE OR REPLACE FUNCTION cleanup_unused_tags()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM task_tags
    WHERE id = OLD.tag_id
    AND NOT EXISTS (
        SELECT 1 FROM task_tag_assignments
        WHERE tag_id = OLD.tag_id
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_tags
AFTER DELETE ON task_tag_assignments
FOR EACH ROW EXECUTE FUNCTION cleanup_unused_tags();
```

---

### TaskTagAssignment (New - Junction Table)

**Purpose**: Many-to-many relationship between tasks and tags.

**SQLModel Definition**:
```python
class TaskTagAssignmentBase(SQLModel):
    """Base task-tag assignment model"""
    task_id: int = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: int = Field(foreign_key="task_tags.id", primary_key=True)

class TaskTagAssignment(TaskTagAssignmentBase, table=True):
    """Junction table for task-tag many-to-many relationship"""
    __tablename__ = "task_tag_assignments"

    task_id: int = Field(foreign_key="tasks.id", ondelete="CASCADE", primary_key=True)
    tag_id: int = Field(foreign_key="task_tags.id", ondelete="CASCADE", primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    task: Task = Relationship(back_populates="tags")
    tag: TaskTag = Relationship(back_populates="assignments")

    class Config:
        json_schema_extra = {
            "example": {
                "task_id": 123,
                "tag_id": 5
            }
        }
```

**Schema Changes**:
```sql
CREATE TABLE task_tag_assignments (
    task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES task_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (task_id, tag_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_task_tag_assignments_task_id ON task_tag_assignments(task_id);
CREATE INDEX idx_task_tag_assignments_tag_id ON task_tag_assignments(tag_id);
```

**Validation Rules**:
- Maximum 10 tags per task (enforced at application layer)
- Cannot assign same tag to same task (composite PK prevents duplicates)

**Constraints**:
- Cascade delete: When task is deleted, all assignments are deleted
- Cascade delete: When tag is deleted, all assignments are deleted (trigger cleans up unused tags)

---

## Entity Relationships

### Entity-Relationship Diagram (ERD)

```
Users (existing)
    |
    | user_id (FK)
    v
+----------------+       +---------------------+       +-----------------+
|     Tasks      |       |    TaskTagAssignments|       |    TaskTags     |
+----------------+       +---------------------+       +-----------------+
| id (PK)       |<-----| task_id (PK, FK)  |<-----| id (PK)        |
| user_id (FK)   |       | tag_id (PK, FK)   |       | user_id (FK)   |
| title          |       +---------------------+       | name           |
| description     |               |                       | created_at     |
| is_completed   |               |                       +-----------------+
| priority       |               |
| due_date       |               |
| created_at     |               |
| updated_at     |               |
+----------------+               |
        |                        |
        | back_populates           | back_populates
        v                        v
    tags (Relationship)      tag (Relationship)
```

### Relationship Descriptions

1. **Users → Tasks** (One-to-Many)
   - User has many tasks
   - Task belongs to exactly one user
   - Cascade delete: When user is deleted, all tasks are deleted

2. **Tasks → TaskTagAssignments** (One-to-Many)
   - Task has many tag assignments
   - Assignment belongs to exactly one task
   - Cascade delete: When task is deleted, all assignments are deleted

3. **TaskTags → TaskTagAssignments** (One-to-Many)
   - Tag has many assignments
   - Assignment belongs to exactly one tag
   - Cascade delete: When tag is deleted, all assignments are deleted

4. **Tasks ↔ TaskTags** (Many-to-Many)
   - Through `TaskTagAssignments` junction table
   - Task can have 0 to 10 tags
   - Tag can be assigned to many tasks
   - Automatic cleanup: Unused tags are deleted when last assignment is removed

---

## Data Lifecycle

### Tag Lifecycle

1. **Creation**
   - When user adds tag to task:
     - Check if `TaskTag` exists with same name for user (case-insensitive)
     - If not exists: Create `TaskTag`
     - Create `TaskTagAssignment` linking task and tag

2. **Deletion from Task**
   - When user removes tag from task:
     - Delete `TaskTagAssignment`
     - Trigger fires: Check if tag has remaining assignments
     - If no remaining assignments: Delete `TaskTag` (automatic cleanup)

3. **Tag Deletion (User-Initiated)**
   - User can delete tag directly:
     - Delete all `TaskTagAssignments` for this tag
     - Delete `TaskTag`
   - Triggers ensure cascade behavior

### Task Priority Lifecycle

1. **Set Priority**
   - On task creation: `priority` defaults to "medium"
   - On task update: `priority` can be changed to "high", "medium", or "low"

2. **Priority Validation**
   - Application layer validates against enum values
   - Database CHECK constraint enforces valid values

### Due Date Lifecycle

1. **Set Due Date**
   - Optional field: Can be NULL or datetime
   - Set on task creation or update

2. **Date Preset Filters**
   - Computed at query time, not stored
   - Presets: Overdue (< now), Today (= today), This Week, Next Week

---

## Query Patterns

### Get Tasks with Tags

```python
from sqlalchemy import select, and_

def get_tasks_with_tags(user_id: int, session: Session) -> List[Task]:
    stmt = (
        select(Task)
        .join(TaskTagAssignment, Task.id == TaskTagAssignment.task_id)
        .join(TaskTag, TaskTagAssignment.tag_id == TaskTag.id)
        .where(Task.user_id == user_id)
    )
    return session.exec(stmt).all()
```

### Get Tags for User

```python
def get_tags_for_user(user_id: int, session: Session) -> List[TaskTag]:
    stmt = select(TaskTag).where(TaskTag.user_id == user_id)
    return session.exec(stmt).all()
```

### Search Tasks with Multiple Criteria

```python
from sqlalchemy import or_, and_

def search_tasks(
    user_id: int,
    search_term: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    session: Session,
) -> List[Task]:
    stmt = select(Task).where(Task.user_id == user_id)

    filters = []

    # Search across title, description, tags
    if search_term:
        search_pattern = f"%{search_term}%"
        filters.append(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern),
                Task.tags.any(TaskTag.name.ilike(search_pattern)),
            )
        )

    # Status filter
    if status:
        is_completed = status == "completed"
        filters.append(Task.is_completed == is_completed)

    # Priority filter
    if priority:
        filters.append(Task.priority == priority)

    # Apply all filters with AND logic
    if filters:
        stmt = stmt.where(and_(*filters))

    return session.exec(stmt).all()
```

### Sort Tasks with Null Handling

```python
from sqlalchemy import asc, desc

def sort_tasks(stmt, sort_by: str, sort_order: str):
    sort_column_map = {
        "due_date": Task.due_date,
        "priority": {"high": 3, "medium": 2, "low": 1}[Task.priority],
        "title": Task.title,
    }

    if sort_by in sort_column_map:
        column = sort_column_map[sort_by]
        if sort_order == "asc":
            order = asc(column)
        else:
            order = desc(column)

        # NULLS LAST for due_date sorting
        if sort_by == "due_date":
            order = order.nulls_last()

        stmt = stmt.order_by(order)

    return stmt
```

---

## Migration Plan

### Phase 1: Schema Extension

**Order**:
1. Add `priority` column to `tasks` table with CHECK constraint
2. Ensure `due_date` column exists on `tasks` table
3. Create `task_tags` table
4. Create `task_tag_assignments` junction table
5. Create indexes
6. Create auto-delete trigger

**Rollback**:
```sql
DROP TRIGGER IF EXISTS trigger_cleanup_tags;
DROP FUNCTION IF EXISTS cleanup_unused_tags;
DROP TABLE IF EXISTS task_tag_assignments;
DROP TABLE IF EXISTS task_tags;
ALTER TABLE tasks DROP COLUMN IF EXISTS priority;
-- Do not drop due_date - it may have data
```

### Data Seeding (Optional)

For development/testing, seed sample tags:
```python
def seed_sample_tags(user_id: int, session: Session):
    sample_tags = ["work", "personal", "urgent", "bug", "feature"]
    for tag_name in sample_tags:
        existing = session.exec(
            select(TaskTag).where(
                TaskTag.user_id == user_id,
                TaskTag.name.ilike(tag_name)
            )
        ).first()
        if not existing:
            tag = TaskTag(name=tag_name, user_id=user_id)
            session.add(tag)
    session.commit()
```

---

## Performance Considerations

### Index Coverage

All filter and sort columns are indexed:
- `priority` - Filtering and sorting
- `due_date` - Filtering and sorting
- `is_completed` - Filtering
- `user_id` - User isolation (already exists)
- `tags.name` - Tag search
- Composite indexes for common combinations

### Query Optimization

1. **Use ILIKE for case-insensitive search** (PostgreSQL-specific)
2. **Avoid N+1 queries**: Eager load tags using joins
3. **Limit results**: Use pagination for large datasets
4. **Batch operations**: Use bulk inserts for tag assignments

### Connection Pooling

Configure SQLModel with appropriate pool size for concurrent requests:
```python
# db.py
from sqlmodel import create_engine, Session

engine = create_engine(
    DATABASE_URL,
    pool_size=10,  # Adjust based on load
    max_overflow=20,
    pool_pre_ping=True,
)
```

---

## Security & User Isolation

### User ID Enforcement

All queries MUST include `user_id` filter:
```python
# BAD: No user filter
tasks = session.exec(select(Task)).all()

# GOOD: User ID from JWT
user_id = get_user_id_from_jwt()  # Extract from JWT claims
tasks = session.exec(select(Task).where(Task.user_id == user_id)).all()
```

### Tag Isolation

Tags are unique per user:
- Query by `user_id` AND tag name
- Foreign key `user_id` on `TaskTag` table
- Cascade delete prevents orphaned tags

### Cross-User Access Prevention

Database-level constraints prevent cross-user access:
```python
# Attempting to assign other user's tag will fail FK constraint
# Attempting to access other user's task will fail user_id filter
```

---

## Testing Considerations

### Unit Tests

1. **Tag Auto-Delete**
   - Create tag, assign to task, remove from task
   - Verify tag is deleted (no remaining assignments)

2. **Tag Uniqueness**
   - Create tag "work" for user A
   - Try to create tag "work" for user B (should succeed - case-insensitive per user only)
   - Try to create tag "work" for user A (should fail - duplicate)

3. **Priority Validation**
   - Create task with invalid priority (should fail)
   - Update task priority (should succeed)

4. **Search Functionality**
   - Create tasks with various titles, descriptions, tags
   - Search by keyword
   - Verify matches across all three fields

### Integration Tests

1. **Filter Combination**
   - Apply multiple filters (status + priority + date)
   - Verify AND logic

2. **Sort with Nulls**
   - Create tasks with and without due dates
   - Sort by due date ascending/descending
   - Verify NULLs appear at bottom

3. **User Isolation**
   - Create tasks for user A
   - User B tries to access user A's tasks (should fail)
   - Verify 401 Unauthorized response

---

## Open Questions

None. All data model requirements are defined.

---

## References

- Feature spec: [spec.md](./spec.md)
- Implementation plan: [plan.md](./plan.md)
- Research findings: [research.md](./research.md)
