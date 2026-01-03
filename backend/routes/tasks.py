from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional, Tuple
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from models import Task, TaskTag, TaskTagAssignment
from db import get_session
from routes.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# ============================================================================
# Helper Functions for Task Organization Features
# ============================================================================

def handle_tags(session: Session, task: Task, tag_names: List[str], user_id: str) -> None:
    """
    Handle tag assignments for a task.
    - Creates new tags if they don't exist
    - Updates task-tag associations
    - Removes old associations that are no longer needed
    - Auto-deletion of unused tags handled by database trigger

    Args:
        session: Database session
        task: Task to assign tags to
        tag_names: List of tag names to assign
        user_id: Current user ID (for user isolation)
    """
    # Remove existing tag assignments
    if task.tag_assignments:
        for assignment in task.tag_assignments:
            session.delete(assignment)
        session.flush()

    # Process new tags
    for tag_name in tag_names:
        tag_name = tag_name.strip()
        if not tag_name:
            continue

        # Find or create tag (user-scoped)
        statement = select(TaskTag).where(
            TaskTag.user_id == user_id,
            TaskTag.name == tag_name
        )
        tag = session.exec(statement).first()

        if not tag:
            tag = TaskTag(user_id=user_id, name=tag_name)
            session.add(tag)
            session.flush()

        # Create tag assignment
        assignment = TaskTagAssignment(task_id=task.id, tag_id=tag.id)
        session.add(assignment)


def get_date_preset_range(preset: str) -> Tuple[Optional[datetime], Optional[datetime]]:
    """
    Convert date preset string to datetime range.

    Args:
        preset: Preset name (today, this_week, this_month, overdue)

    Returns:
        Tuple of (date_from, date_to) or (None, None) if invalid preset
    """
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    if preset == "today":
        return (today_start, today_start + timedelta(days=1))
    elif preset == "this_week":
        # Week starts on Monday
        days_since_monday = today_start.weekday()
        week_start = today_start - timedelta(days=days_since_monday)
        week_end = week_start + timedelta(days=7)
        return (week_start, week_end)
    elif preset == "this_month":
        month_start = today_start.replace(day=1)
        # Calculate next month start
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)
        return (month_start, month_end)
    elif preset == "overdue":
        return (None, now)  # All tasks created before now

    return (None, None)


def apply_sort(query, sort_by: str, sort_order: str):
    """
    Apply sorting to a SQLModel query.
    Handles NULLS LAST for due_date sorting.

    Args:
        query: SQLModel select query
        sort_by: Field to sort by (due_date, priority, title)
        sort_order: Sort direction (asc, desc)

    Returns:
        Modified query with sorting applied
    """
    from sqlalchemy import nullslast, nullsfirst

    if sort_by == "due_date":
        # Due date sorting with nulls at bottom
        if sort_order == "asc":
            query = query.order_by(nullslast(Task.created_at.asc()))
        else:
            query = query.order_by(nullslast(Task.created_at.desc()))
    elif sort_by == "priority":
        # Priority sorting: high > medium > low
        priority_order = {"high": 1, "medium": 2, "low": 3}
        if sort_order == "asc":
            query = query.order_by(Task.priority.asc())
        else:
            query = query.order_by(Task.priority.desc())
    elif sort_by == "title":
        # Alphabetical sorting
        if sort_order == "asc":
            query = query.order_by(Task.title.asc())
        else:
            query = query.order_by(Task.title.desc())

    return query

# Pydantic models for request/response validation
class TaskCreateRequest(BaseModel):
    title: str = Field(default="Untitled Task", min_length=1, max_length=255)
    priority: Optional[str] = Field(default="medium", pattern="^(high|medium|low)$")
    tags: Optional[List[str]] = Field(default=[])

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    is_completed: Optional[bool] = None
    priority: Optional[str] = Field(default=None, pattern="^(high|medium|low)$")
    tags: Optional[List[str]] = None

@router.get("/", response_model=List[Task])
def get_tasks(
    search: Optional[str] = None,
    status: Optional[str] = None,  # completed, active, all
    priority: Optional[str] = None,  # high, medium, low
    date_preset: Optional[str] = None,  # today, this_week, this_month, overdue
    date_from: Optional[str] = None,  # Custom date range start (ISO format)
    date_to: Optional[str] = None,  # Custom date range end (ISO format)
    sort_by: Optional[str] = None,  # due_date, priority, title
    sort_order: Optional[str] = "asc",  # asc, desc
    current_user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all tasks for the current user with optional filters.
    - search: Keyword search across title and tags
    - status: Filter by completion status (completed/active/all)
    - priority: Filter by priority level (high/medium/low)
    - date_preset: Filter by date presets (today/this_week/this_month/overdue)
    - date_from/date_to: Custom date range filter
    """
    from sqlalchemy import or_, and_

    # Only return tasks that belong to the current user (FR-006: User isolation)
    query = select(Task).where(Task.user_id == current_user.user_id)

    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Task.title.ilike(search_term),
                Task.id.in_(
                    select(TaskTagAssignment.task_id)
                    .join(TaskTag)
                    .where(
                        TaskTag.user_id == current_user.user_id,
                        TaskTag.name.ilike(search_term)
                    )
                )
            )
        )

    # Apply status filter
    if status and status != "all":
        if status == "completed":
            query = query.where(Task.is_completed == True)
        elif status == "active":
            query = query.where(Task.is_completed == False)

    # Apply priority filter
    if priority:
        query = query.where(Task.priority == priority)

    # Apply date filters
    if date_preset:
        date_from_val, date_to_val = get_date_preset_range(date_preset)
        if date_from_val:
            query = query.where(Task.created_at >= date_from_val)
        if date_to_val:
            query = query.where(Task.created_at < date_to_val)
    elif date_from or date_to:
        # Custom date range
        if date_from:
            from datetime import datetime
            date_from_dt = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
            query = query.where(Task.created_at >= date_from_dt)
        if date_to:
            from datetime import datetime
            date_to_dt = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
            query = query.where(Task.created_at < date_to_dt)

    # Apply sorting
    if sort_by:
        query = apply_sort(query, sort_by, sort_order or "asc")

    tasks = session.exec(query).all()
    return tasks

@router.post("/", response_model=Task)
def create_task(
    request: TaskCreateRequest,
    current_user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create a new task for the current user.
    """
    # Apply business rule for empty titles (FR-008: Auto-title if empty)
    # The validation will ensure the title meets requirements, but we still handle the empty case
    title = request.title.strip() if request.title else "Untitled Task"
    priority = request.priority if request.priority else "medium"

    # Create new task with the current user's ID
    task = Task(
        title=title,
        user_id=current_user.user_id,
        is_completed=False,  # Default to not completed
        priority=priority
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    # Handle tags if provided
    if request.tags:
        handle_tags(session, task, request.tags, current_user.user_id)
        session.commit()
        session.refresh(task)

    return task

@router.put("/{task_id}", response_model=Task)
def update_task(
    task_id: int,  # Changed from str to int to match the model
    request: TaskUpdateRequest,
    current_user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Update a task for the current user.
    """
    # First, find the task and ensure it belongs to the current user (FR-006: User isolation)
    statement = select(Task).where(Task.id == task_id, Task.user_id == current_user.user_id)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Update task properties if provided
    if request.title is not None:
        title = request.title.strip()
        if title:  # Only update if not empty
            # Validate the title length
            if len(title) > 255:
                raise HTTPException(status_code=400, detail="Title too long (max 255 characters)")
            task.title = title
        else:
            task.title = "Untitled Task"  # Auto-title if empty (FR-008)

    if request.is_completed is not None:
        task.is_completed = request.is_completed

    if request.priority is not None:
        task.priority = request.priority

    task.update_timestamp()  # Update timestamp

    session.add(task)
    session.commit()

    # Handle tags if provided
    if request.tags is not None:
        handle_tags(session, task, request.tags, current_user.user_id)
        session.commit()

    session.refresh(task)
    return task

@router.delete("/{task_id}")
def delete_task(
    task_id: int,  # Changed from str to int to match the model
    current_user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a task for the current user.
    """
    # Find the task and ensure it belongs to the current user (FR-006: User isolation)
    statement = select(Task).where(Task.id == task_id, Task.user_id == current_user.user_id)
    task = session.exec(statement).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    session.delete(task)
    session.commit()
    return {"message": "Task deleted successfully"}