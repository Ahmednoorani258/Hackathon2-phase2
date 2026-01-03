# Research Findings: Task Organization Features

**Feature**: 007-task-organization
**Phase**: Phase 0 - Research
**Date**: 2026-01-03

## Overview

This document consolidates research findings for implementing task organization features (priorities, tags, search, filtering, sorting) in the Todo application. All technology choices align with the constitution's mandatory stack and Context-7 best practices.

---

## Research Task 1: Database Schema for Priorities

### Decision
Add `priority` column to existing `Task` table as an ENUM type.

### Rationale
- **Simplicity**: Enum is faster than join tables and simpler than separate priority entity
- **Performance**: Single column filtering, indexes directly on priority
- **Constitution compliance**: Uses SQLModel, extends existing model without breaking changes

### Implementation Approach
```python
# SQLModel model extension
class Task(SQLModel, table=True):
    # ... existing fields
    priority: Literal["high", "medium", "low"] = "medium"  # default medium
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Separate Priority table | Over-engineering, no need for dynamic priorities |
| Integer priority (1,2,3) | Less readable in code, enum provides type safety |
| Priority colors stored in DB | UI concern, not data model concern |

---

## Research Task 2: Tag Lifecycle & Database Design

### Decision
Implement automatic tag lifecycle using database cascade deletes.

### Rationale
- **User experience**: No manual tag management needed
- **Data consistency**: Prevents orphaned tags
- **Performance**: CASCADE DELETE handled efficiently by PostgreSQL

### Schema Design
```sql
CREATE TABLE task_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, user_id)  -- Unique per user
);

CREATE TABLE task_tag_assignments (
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES task_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (task_id, tag_id)
);

-- Trigger to auto-delete unused tags
CREATE OR REPLACE FUNCTION cleanup_unused_tags()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM task_tags
    WHERE id = OLD.tag_id
    AND NOT EXISTS (SELECT 1 FROM task_tag_assignments WHERE tag_id = OLD.tag_id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_tags
AFTER DELETE ON task_tag_assignments
FOR EACH ROW EXECUTE FUNCTION cleanup_unused_tags();
```

### Tag Name Normalization
```python
# Case-insensitive and trimmed
tag_name = tag_name.strip().lower()
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Manual tag management UI | Over-engineering, extra UI complexity |
| Tags shared across all users | Violates user isolation, security risk |
| Soft delete for tags | Unnecessary complexity, direct deletion is acceptable |

---

## Research Task 3: Search Implementation Strategy

### Decision
Partial word matching using PostgreSQL ILIKE with database indexes.

### Rationale
- **Performance**: ILIKE with indexes is fast for up to 10,000 tasks per user
- **Simplicity**: No external search service needed
- **Unicode support**: ILIKE handles case-insensitive search properly

### Implementation Approach
```python
# Backend query logic
from sqlalchemy import or_

search_term = query_params.search
if search_term:
    search_filter = or_(
        Task.title.ilike(f"%{search_term}%"),
        Task.description.ilike(f"%{search_term}%"),
        Task.tags.any(TaskTag.name.ilike(f"%{search_term}%"))  # via join
    )
    stmt = stmt.where(search_filter)
```

### Database Indexes
```sql
-- For search performance
CREATE INDEX idx_tasks_title_gin ON tasks USING gin(to_tsvector('english', title));
CREATE INDEX idx_tasks_description_gin ON tasks USING gin(to_tsvector('english', description));
CREATE INDEX idx_task_tags_name ON task_tags(name);
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Elasticsearch/OpenSearch | Overkill for 10,000 tasks, adds infrastructure complexity |
| Exact match only | Poor UX, users expect partial matching |
| Full-text search with tsvector | More complex, ILIKE sufficient for this scale |

---

## Research Task 4: Date Filtering Implementation

### Decision
Implement preset date filters using server-side date calculations and custom ranges using date parameters.

### Rationale
- **Flexibility**: Presets cover common use cases, custom ranges for edge cases
- **Performance**: Server-side filtering uses indexed date columns
- **User experience**: Quick access to common filters (Overdue, Today, This Week)

### Preset Logic (Python)
```python
from datetime import datetime, timedelta

def get_date_preset_range(preset: str) -> tuple[datetime, datetime]:
    now = datetime.utcnow()
    presets = {
        "overdue": (None, now),  # due_date < now
        "today": (now.date(), now.date()),
        "this_week": (now.date() - timedelta(days=now.weekday()), now.date() + timedelta(days=6)),
        "next_week": (now.date() + timedelta(days=7 - now.weekday()), now.date() + timedelta(days=13)),
    }
    return presets.get(preset, (None, None))
```

### Query Building
```python
date_preset = query_params.date_preset
date_from = query_params.date_from
date_to = query_params.date_to

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
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Client-side date logic only | Inconsistent timezones, slower for large datasets |
| No custom ranges | Too limiting, users need flexibility |
| Separate endpoint for presets | Unnecessary complexity, single endpoint sufficient |

---

## Research Task 5: Sorting with Null Handling

### Decision
Server-side sorting with NULLS LAST for due_date column.

### Rationale
- **Performance**: Database-level sorting is efficient
- **User expectation**: Tasks without due dates at bottom is intuitive
- **Consistency**: SQL NULLS LAST is standard PostgreSQL behavior

### Implementation Approach
```python
sort_by = query_params.sort_by  # due_date, priority, title
sort_order = query_params.sort_order  # asc, desc

sort_map = {
    "due_date": Task.due_date,
    "priority": {"high": 3, "medium": 2, "low": 1}[Task.priority],  # numeric mapping
    "title": Task.title,
}

if sort_by in sort_map:
    column = sort_map[sort_by]
    order = asc(column) if sort_order == "asc" else desc(column)
    if sort_by == "due_date":
        order = order.nulls_last()  # NULLs at bottom
    stmt = stmt.order_by(order)
```

### Priority Mapping for Sorting
- High = 3 (highest priority first when descending)
- Medium = 2
- Low = 1 (lowest priority last)

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Client-side sorting only | Slower for large datasets |
| NULLS FIRST | Counter-intuitive, users expect scheduled tasks first |
| Separate sort endpoint | Unnecessary, integrates with GET /api/tasks |

---

## Research Task 6: Filter Combination Logic

### Decision
All filters use AND logic (intersection of all criteria).

### Rationale
- **User expectation**: Filters narrow down results progressively
- **Intuitive**: Matches common filtering behavior in applications
- **Consistency**: Aligns with spec clarifications

### Implementation Approach
```python
# Build query filters progressively
filters = []

if status:
    filters.append(Task.is_completed == (status == "completed"))
if priority:
    filters.append(Task.priority == priority)
if search_term:
    filters.append(search_filter)  # OR logic within search
if date_filters:
    filters.extend(date_filters)  # AND logic for date ranges
if tag_ids:
    filters.append(Task.tags.any(TaskTag.id.in_(tag_ids)))

# Apply all filters with AND logic
if filters:
    stmt = stmt.where(and_(*filters))
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| OR logic between filters | Unintuitive, too many results |
| Toggle between AND/OR | Too complex for UI |
| Filter groups | Over-engineering for current requirements |

---

## Research Task 7: Client-Side vs Server-Side Filtering

### Decision
Hybrid approach: client-side for < 100 tasks, server-side for larger datasets.

### Rationale
- **Performance**: Client-side is faster for small datasets (instant response)
- **Scalability**: Server-side prevents excessive data transfer for large datasets
- **UX**: Real-time filtering without network latency for small datasets

### Implementation Approach (Frontend)
```typescript
// Use client-side filtering when dataset < 100 tasks
const useClientSideFiltering = tasks.length < 100;

if (useClientSideFiltering) {
  // Apply filters in JavaScript
  const filtered = tasks.filter(task =>
    matchesStatus(task, status) &&
    matchesPriority(task, priority) &&
    matchesSearch(task, searchTerm) &&
    matchesDate(task, datePreset, dateFrom, dateTo)
  );
  const sorted = sortTasks(filtered, sortBy, sortOrder);
  return sorted;
} else {
  // Fetch from server with filter/sort params
  return await api.getTasks({ search, status, priority, sortBy, sortOrder });
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Always server-side | Unnecessary network latency for small datasets |
| Always client-side | Too much data transfer, slow for large datasets |
| Fixed threshold of 100 | Reasonable default, can be tuned if needed |

---

## Research Task 8: UI Component Patterns (Next.js 16+ App Router)

### Decision
Use client components for interactive elements (filters, sort, search) and server components for data fetching.

### Rationale
- **App Router best practices**: Server components for data, client components for interactivity
- **Performance**: Server-side rendering for initial page load, client-side for interactions
- **TypeScript**: Full type safety across components

### Component Architecture
```typescript
// components/TaskList.tsx (server component - data fetching)
async function TaskList() {
  const tasks = await api.getTasks();  // server-side fetch
  return <TaskListView tasks={tasks} />;
}

// components/TaskListView.tsx (client component - interactivity)
"use client";
function TaskListView({ tasks }: { tasks: Task[] }) {
  const [filters, setFilters] = useState<Filters>({});
  const [sortBy, setSortBy] = useState<SortBy>("due_date");

  const filteredAndSorted = useFilterAndSort(tasks, filters, sortBy);

  return (
    <>
      <FilterPanel filters={filters} onChange={setFilters} />
      <SortControls sortBy={sortBy} onChange={setSortBy} />
      <TaskItems tasks={filteredAndSorted} />
    </>
  );
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| All client components | Poor initial load performance |
| All server components | No interactivity without full page reloads |
| Pages Router | Deprecated in Next.js 16+ |

---

## Research Task 9: Database Indexing Strategy

### Decision
Add indexes on columns used in filtering, sorting, and search queries.

### Rationale
- **Performance**: Indexes critical for meeting < 500ms search and < 200ms filter/sort targets
- **Query patterns**: Based on spec requirements, predict filter/sort usage

### Index Definitions
```sql
-- Priority filtering
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Due date filtering and sorting
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Completion status filtering
CREATE INDEX idx_tasks_is_completed ON tasks(is_completed);

-- User isolation (already exists per constitution)
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Composite index for common filter combinations
CREATE INDEX idx_tasks_user_priority_status ON tasks(user_id, priority, is_completed);

-- Tag search
CREATE INDEX idx_task_tags_name_user ON task_tags(name, user_id);

-- Task-tag lookup
CREATE INDEX idx_task_tag_assignments_task_id ON task_tag_assignments(task_id);
CREATE INDEX idx_task_tag_assignments_tag_id ON task_tag_assignments(tag_id);
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| No indexes | Will fail performance targets (500ms search) |
| All columns indexed | Unnecessary overhead, slower writes |

---

## Research Task 10: Pagination Strategy

### Decision
Server-side pagination for task list (not explicitly required but recommended for scalability).

### Rationale
- **Scalability**: Prevents excessive data transfer for large datasets
- **Performance**: Reduces initial page load time
- **User experience**: Progressive loading improves perceived performance

### Implementation Approach
```python
# GET /api/tasks?page=1&limit=50
page = query_params.page or 1
limit = query_params.limit or 50
offset = (page - 1) * limit

stmt = stmt.offset(offset).limit(limit)
tasks = session.exec(stmt).all()

total = session.exec(select(func.count()).select_from(Task).where(filters)).one()
return {
    "data": tasks,
    "meta": {"page": page, "limit": limit, "total": total, "pages": ceil(total / limit)}
}
```

**Note**: Pagination is OPTIONAL for this phase (not in spec), but recommended for scalability. Can be deferred if timeline constraints exist.

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Infinite scroll | More complex, harder to implement properly |
| Load all tasks | Fails performance targets for large datasets |
| No pagination | Scalability issue, but acceptable for initial implementation |

---

## Summary of Decisions

| Research Task | Decision | Constitution Compliance |
|---------------|----------|-------------------------|
| Database Schema for Priorities | Enum column on Task table | ✅ SQLModel, simple extension |
| Tag Lifecycle | Auto-create/delete via triggers | ✅ User isolation maintained |
| Search Implementation | ILIKE with indexes | ✅ No external services |
| Date Filtering | Server-side presets + custom ranges | ✅ FastAPI/SQLModel |
| Sorting with Nulls | NULLS LAST for due_date | ✅ PostgreSQL feature |
| Filter Combination | AND logic between all filters | ✅ Spec-compliant |
| Client vs Server Filtering | Hybrid (< 100 tasks threshold) | ✅ Performance optimized |
| UI Component Patterns | Server+Client components | ✅ Next.js 16+ App Router |
| Database Indexing | Indexes on filter/sort columns | ✅ Performance target met |
| Pagination Strategy | Optional, server-side | ⚠️ Not in spec (deferred) |

---

## Open Questions

None. All requirements clarified in spec and research complete.

---

## Next Steps

1. ✅ Research complete - proceed to Phase 1: Design Artifacts
2. Generate `data-model.md` with entity definitions
3. Generate `contracts/openapi.yaml` with API endpoint contracts
4. Generate `quickstart.md` with implementation guide
5. Re-run Constitution Check after Phase 1
6. Proceed to Phase 2: `/sp.tasks` to generate implementation tasks
