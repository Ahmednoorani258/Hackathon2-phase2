from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
import uuid


class User(SQLModel, table=True):
    """
    User model representing registered users in the system.
    Each user can only access their own tasks due to user isolation.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str = Field(default="")
    password_hash: str  # Hashed password stored securely
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to tasks - each user has many tasks
    tasks: List["Task"] = Relationship(back_populates="user", cascade_delete=True)


class Task(SQLModel, table=True):
    """
    Task model representing todo items.
    Each task belongs to a single user and can only be accessed by that user.
    The user_id foreign key enforces user isolation at the database level.
    """
    id: int = Field(default=None, primary_key=True)
    user_id: str = Field(foreign_key="user.id", index=True)  # Enforces user isolation
    title: str = Field(max_length=255, default="Untitled Task")
    is_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to user
    user: Optional[User] = Relationship(back_populates="tasks")

    def update_timestamp(self):
        """Update the updated_at timestamp"""
        self.updated_at = datetime.utcnow()
