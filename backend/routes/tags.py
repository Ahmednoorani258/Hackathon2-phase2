from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from models import TaskTag
from db import get_session
from routes.auth import get_current_user, UserContext

router = APIRouter(prefix="/api/tags", tags=["tags"])

@router.get("/", response_model=List[TaskTag])
def get_tags(
    current_user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Get all tags for the current user.
    Tags are automatically scoped to the user.
    """
    # Only return tags that belong to the current user (user isolation)
    statement = select(TaskTag).where(TaskTag.user_id == current_user.user_id)
    tags = session.exec(statement).all()
    return tags

@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    current_user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Delete a tag for the current user.
    Note: Tags are automatically deleted when unused via database trigger.
    This endpoint allows manual deletion if needed.
    """
    # Find the tag and ensure it belongs to the current user (user isolation)
    statement = select(TaskTag).where(
        TaskTag.id == tag_id,
        TaskTag.user_id == current_user.user_id
    )
    tag = session.exec(statement).first()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    session.delete(tag)
    session.commit()
    return {"message": "Tag deleted successfully"}
