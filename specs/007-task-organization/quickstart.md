# Quickstart Guide: Task Organization Features

**Feature**: 007-task-organization
**Phase**: Phase 1 - Design
**Date**: 2026-01-03

## Overview

This guide provides step-by-step instructions for implementing task organization features (priorities, tags, search, filtering, sorting) for the Todo application.

**Prerequisites**:
- Basic-level Todo implementation complete (task CRUD, authentication, user isolation)
- Python 3.11+ with FastAPI and SQLModel
- Next.js 16+ with TypeScript and Tailwind CSS
- Neon PostgreSQL database connection
- Better Auth configured for JWT authentication

---

## Implementation Checklist

### Backend Implementation

#### 1. Database Schema Extension

1. **Add priority column to tasks table**
   ```sql
   ALTER TABLE tasks
   ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'medium',
   ADD CONSTRAINT tasks_priority_check
     CHECK (priority IN ('high', 'medium', 'low'));
   ```

2. **Create tag tables**
   ```sql
   CREATE TABLE task_tags (
       id SERIAL PRIMARY KEY,
       name VARCHAR(50) NOT NULL,
       user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT NOW(),
       CONSTRAINT uq_task_tags_user_name UNIQUE (user_id, name)
   );

   CREATE TABLE task_tag_assignments (
       task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
       tag_id INTEGER NOT NULL REFERENCES task_tags(id) ON DELETE CASCADE,
       created_at TIMESTAMP DEFAULT NOW(),
       PRIMARY KEY (task_id, tag_id)
   );
   ```

3. **Create indexes**
   ```sql
   CREATE INDEX idx_tasks_priority ON tasks(priority);
   CREATE INDEX idx_tasks_due_date ON tasks(due_date);
   CREATE INDEX idx_tasks_is_completed ON tasks(is_completed);
   CREATE INDEX idx_tasks_user_priority_status ON tasks(user_id, priority, is_completed);
   CREATE INDEX idx_task_tags_name_user ON task_tags(name, user_id);
   CREATE INDEX idx_task_tag_assignments_task_id ON task_tag_assignments(task_id);
   CREATE INDEX idx_task_tag_assignments_tag_id ON task_tag_assignments(tag_id);
   ```

4. **Create auto-delete trigger**
   ```sql
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

#### 2. Update SQLModel Models

Edit `backend/models.py`:

```python
from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlmodel import SQLModel, Field, Relationship

# Priority Enum
class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TaskTagBase(SQLModel):
    name: str = Field(max_length=50)

class TaskTag(TaskTagBase, table=True):
    __tablename__ = "task_tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    assignments: List["TaskTagAssignment"] = Relationship(back_populates="tag")

    class Config:
        table_args = (
            UniqueConstraint("user_id", "name", name="uq_task_tags_user_name"),
        )

class TaskTagAssignmentBase(SQLModel):
    task_id: int = Field(foreign_key="tasks.id", primary_key=True)
    tag_id: int = Field(foreign_key="task_tags.id", primary_key=True)

class TaskTagAssignment(TaskTagAssignmentBase, table=True):
    __tablename__ = "task_tag_assignments"

    task_id: int = Field(foreign_key="tasks.id", ondelete="CASCADE", primary_key=True)
    tag_id: int = Field(foreign_key="task_tags.id", ondelete="CASCADE", primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    task: Task = Relationship(back_populates="tags")
    tag: TaskTag = Relationship(back_populates="assignments")

# Extend existing Task model
class TaskBase(SQLModel):
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    is_completed: bool = Field(default=False)
    priority: Priority = Field(default=Priority.MEDIUM)
    due_date: Optional[datetime] = Field(default=None)

class Task(TaskBase, table=True):
    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"onupdate": datetime.utcnow})

    tags: List["TaskTagAssignment"] = Relationship(back_populates="task")
```

#### 3. Create Tag Routes

Create `backend/routes/tags.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlmodel import Session
from ..models import TaskTag, get_session
from ..auth import get_current_user

router = APIRouter(prefix="/api/v1/tags", tags=["tags"])

@router.get("", response_model=dict)
async def list_tags(
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tags = session.exec(
        select(TaskTag).where(TaskTag.user_id == current_user_id)
    ).all()
    return {
        "data": tags,
        "message": "Tags retrieved successfully"
    }

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tag = session.exec(
        select(TaskTag).where(
            TaskTag.id == tag_id,
            TaskTag.user_id == current_user_id
        )
    ).first()

    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )

    session.delete(tag)
    session.commit()
    return None
```

#### 4. Update Task Routes

Update `backend/routes/tasks.py` to handle filtering, sorting, and tags:

```python
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, and_, or_, asc, desc
from sqlmodel import Session
from ..models import Task, TaskTag, TaskTagAssignment, get_session
from ..auth import get_current_user

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])

# Helper functions
def get_date_preset_range(preset: str) -> tuple[Optional[datetime], Optional[datetime]]:
    now = datetime.utcnow()
    presets = {
        "overdue": (None, now),
        "today": (now.replace(hour=0, minute=0, second=0, microsecond=0),
                  now.replace(hour=23, minute=59, second=59, microsecond=999999)),
        "this_week": (
            (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0),
            (now + timedelta(days=6 - now.weekday())).replace(hour=23, minute=59, second=59, microsecond=999999)
        ),
        "next_week": (
            (now + timedelta(days=7 - now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0),
            (now + timedelta(days=13 - now.weekday())).replace(hour=23, minute=59, second=59, microsecond=999999)
        ),
    }
    return presets.get(preset, (None, None))

def apply_sort(stmt, sort_by: str, sort_order: str):
    sort_column_map = {
        "due_date": Task.due_date,
        "priority": {"high": 3, "medium": 2, "low": 1}[Task.priority],
        "title": Task.title,
    }

    if sort_by in sort_column_map:
        column = sort_column_map[sort_by]
        order = asc(column) if sort_order == "asc" else desc(column)
        if sort_by == "due_date":
            order = order.nulls_last()
        stmt = stmt.order_by(order)

    return stmt

# Update list_tasks endpoint
@router.get("")
async def list_tasks(
    search: Optional[str] = Query(None, description="Search term"),
    status: Optional[str] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    date_preset: Optional[str] = Query(None, description="Date preset filter"),
    date_from: Optional[datetime] = Query(None, description="Date from filter"),
    date_to: Optional[datetime] = Query(None, description="Date to filter"),
    sort_by: str = Query("due_date", description="Sort by field"),
    sort_order: str = Query("asc", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Page size"),
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    stmt = select(Task).where(Task.user_id == current_user_id)

    # Search filter
    if search:
        search_pattern = f"%{search_term}%"
        stmt = stmt.where(
            or_(
                Task.title.ilike(search_pattern),
                Task.description.ilike(search_pattern),
                Task.tags.any(TaskTag.name.ilike(search_pattern)),
            )
        )

    # Status filter
    if status:
        is_completed = status == "completed"
        stmt = stmt.where(Task.is_completed == is_completed)

    # Priority filter
    if priority:
        stmt = stmt.where(Task.priority == priority)

    # Date filters
    if date_preset:
        from_date, to_date = get_date_preset_range(date_preset)
        if from_date and to_date:
            stmt = stmt.where(Task.due_date >= from_date, Task.due_date <= to_date)
        elif to_date:  # overdue
            stmt = stmt.where(Task.due_date < to_date)
    elif date_from or date_to:
        if date_from:
            stmt = stmt.where(Task.due_date >= date_from)
        if date_to:
            stmt = stmt.where(Task.due_date <= date_to)

    # Sorting
    stmt = apply_sort(stmt, sort_by, sort_order)

    # Pagination
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    tasks = session.exec(stmt).all()

    return {
        "data": tasks,
        "message": "Tasks retrieved successfully"
    }
```

#### 5. Tag Handling in Create/Update

Add tag handling to create and update endpoints:

```python
# Helper function for tag assignments
def handle_tags(
    task: Task,
    tag_names: List[str],
    current_user_id: int,
    session: Session
):
    # Remove existing assignments
    session.exec(
        select(TaskTagAssignment).where(TaskTagAssignment.task_id == task.id)
    ).all()
    session.query(TaskTagAssignment).filter(
        TaskTagAssignment.task_id == task.id
    ).delete(synchronize_session=False)

    # Create new assignments
    for tag_name in tag_names[:10]:  # Max 10 tags
        tag = session.exec(
            select(TaskTag).where(
                TaskTag.user_id == current_user_id,
                TaskTag.name.ilike(tag_name.strip().lower())
            )
        ).first()

        if not tag:
            tag = TaskTag(name=tag_name.strip(), user_id=current_user_id)
            session.add(tag)
            session.flush()

        assignment = TaskTagAssignment(task_id=task.id, tag_id=tag.id)
        session.add(assignment)

    session.commit()

# Update create_task
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user_id: int = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    task = Task(
        title=task_data.title,
        description=task_data.description,
        is_completed=task_data.is_completed,
        priority=task_data.priority,
        due_date=task_data.due_date,
        user_id=current_user_id
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    # Handle tags
    if task_data.tags:
        handle_tags(task, task_data.tags, current_user_id, session)

    return {
        "data": task,
        "message": "Task created successfully"
    }

# Update update_task similarly
```

### Frontend Implementation

#### 1. Update TypeScript Interfaces

Edit `frontend/lib/types.ts`:

```typescript
export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface Tag {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

export interface TaskFilters {
  search?: string;
  status?: 'active' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  date_preset?: 'overdue' | 'today' | 'this_week' | 'next_week';
  date_from?: string;
  date_to?: string;
}

export interface TaskSort {
  sort_by: 'due_date' | 'priority' | 'title';
  sort_order: 'asc' | 'desc';
}
```

#### 2. Create Priority Badge Component

Create `frontend/components/PriorityBadge.tsx`:

```tsx
"use client";

interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300',
};

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full border ${priorityColors[priority]}`}>
      {priority.toUpperCase()}
    </span>
  );
}
```

#### 3. Create Tags Component

Create `frontend/components/TaskTags.tsx`:

```tsx
"use client";

interface TaskTagsProps {
  tags: { name: string }[];
}

export default function TaskTags({ tags }: TaskTagsProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {tags.map((tag) => (
        <span
          key={tag.name}
          className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
        >
          {tag.name}
        </span>
      ))}
    </div>
  );
}
```

#### 4. Create Filter Panel Component

Create `frontend/components/FilterPanel.tsx`:

```tsx
"use client";

import { useState } from 'react';
import { TaskFilters } from '@/lib/types';

interface FilterPanelProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

export default function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [search, setSearch] = useState(filters.search || '');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    onFiltersChange({ ...filters, search: value || undefined });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search tasks..."
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value === 'all' ? undefined : e.target.value as any })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="all">All Tasks</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={filters.priority || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value === 'all' ? undefined : e.target.value as any })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Date Preset Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <select
            value={filters.date_preset || 'all'}
            onChange={(e) => onFiltersChange({ ...filters, date_preset: e.target.value === 'all' ? undefined : e.target.value as any })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="all">All Dates</option>
            <option value="overdue">Overdue</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="next_week">Next Week</option>
          </select>
        </div>
      </div>
    </div>
  );
}
```

#### 5. Update Task List Page

Update `frontend/app/page.tsx` to integrate filters and sorting:

```tsx
"use client";

import { useState, useEffect } from 'react';
import { Task, TaskFilters, TaskSort } from '@/lib/types';
import FilterPanel from '@/components/FilterPanel';
import PriorityBadge from '@/components/PriorityBadge';
import TaskTags from '@/components/TaskTags';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({
    sort_by: 'due_date',
    sort_order: 'asc'
  });
  const [loading, setLoading] = useState(true);

  // Fetch tasks with filters and sort
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          ...filters,
          sort_by: sort.sort_by,
          sort_order: sort.sort_order
        });
        const response = await fetch(`/api/v1/tasks?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setTasks(data.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [filters, sort]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filter Panel */}
        <div className="md:col-span-1">
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Task List */}
        <div className="md:col-span-2">
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks found</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2">{task.title}</h2>
                      {task.description && (
                        <p className="text-gray-600 mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <PriorityBadge priority={task.priority} />
                        {task.due_date && (
                          <span className="text-sm text-gray-500">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <TaskTags tags={task.tags} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Testing

### Backend Tests

1. **Tag auto-delete test**
```python
def test_tag_auto_delete():
    # Create task with tag
    task = create_task_with_tag("work")
    # Remove tag from task
    task.tags = []
    # Verify tag is deleted from DB
    assert not tag_exists_in_db("work")
```

2. **Search functionality test**
```python
def test_search_across_fields():
    # Create tasks with search term in title, description, tag
    task1 = create_task(title="Project docs", tags=["documentation"])
    task2 = create_task(description="Write documentation", tags=["work"])

    # Search for "documentation"
    results = search_tasks("documentation")
    assert len(results) == 2  # Both tasks match
```

3. **User isolation test**
```python
def test_cross_user_access_blocked():
    user_a_token = login_user_a()
    user_b_token = login_user_b()

    # User A creates task
    task_a = create_task(token=user_a_token)

    # User B tries to access User A's task
    response = requests.get(f"/api/v1/tasks/{task_a.id}", headers={
        "Authorization": f"Bearer {user_b_token}"
    })

    assert response.status_code == 404 or 401  # Blocked
```

### Frontend Tests

1. **Filter component integration**
```typescript
test('filter panel updates filters', () => {
  const mockOnFiltersChange = jest.fn();
  render(<FilterPanel filters={{}} onFiltersChange={mockOnFiltersChange} />);

  // Select status filter
  const select = screen.getByLabelText('Status');
  fireEvent.change(select, { target: { value: 'active' }});

  expect(mockOnFiltersChange).toHaveBeenCalledWith({ status: 'active' });
});
```

2. **Priority badge renders correctly**
```typescript
test('priority badge has correct styles', () => {
  const { container } = render(<PriorityBadge priority="high" />);

  expect(container.firstChild).toHaveClass('bg-red-100', 'text-red-800');
});
```

---

## Common Issues & Solutions

### Issue: Search is slow
**Solution**: Ensure database indexes are created on title, description, and tags.name columns.

### Issue: Tags not auto-deleting
**Solution**: Verify the trigger `trigger_cleanup_tags` is created and enabled.

### Issue: Cross-user data visible
**Solution**: Check that all routes include `get_current_user` dependency and filter by `user_id`.

### Issue: Due date sorting with NULLs not working
**Solution**: Ensure `.nulls_last()` is applied to due_date column sort.

---

## Next Steps

1. ✅ Database schema extension complete
2. ✅ Backend models and routes updated
3. ✅ Frontend components created
4. ✅ Run tests to verify functionality
5. ⏭️ Deploy to staging environment
6. ⏭️ Conduct user acceptance testing
7. ⏭️ Monitor performance metrics (search latency, filter/sort response times)

---

## References

- Data model: [data-model.md](./data-model.md)
- API contracts: [contracts/openapi.yaml](./contracts/openapi.yaml)
- Research findings: [research.md](./research.md)
- Feature spec: [spec.md](./spec.md)
- Implementation plan: [plan.md](./plan.md)
