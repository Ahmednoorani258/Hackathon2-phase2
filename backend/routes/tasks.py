from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional
from pydantic import BaseModel, Field
from models import Task
from db import get_session
from routes.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# Pydantic models for request/response validation
class TaskCreateRequest(BaseModel):
    title: str = Field(default="Untitled Task", min_length=1, max_length=255)

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    is_completed: Optional[bool] = None

@router.get("/", response_model=List[Task])
def get_tasks(
    current_user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all tasks for the current user.
    """
    # Only return tasks that belong to the current user (FR-006: User isolation)
    statement = select(Task).where(Task.user_id == current_user.user_id)
    tasks = session.exec(statement).all()
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

    # Create new task with the current user's ID
    task = Task(
        title=title,
        user_id=current_user.user_id,
        is_completed=False  # Default to not completed
    )

    session.add(task)
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

    task.update_timestamp()  # Update timestamp

    session.add(task)
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