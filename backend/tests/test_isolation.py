"""
Test suite for user isolation in the task management system.
These tests verify that users can only access their own tasks (User Story 4).
"""
import pytest
import sys
import os

# Add the backend directory to the path so we can import modules correctly
sys.path.insert(0, os.path.abspath('.'))

from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from typing import Generator
from datetime import datetime

# Import the app and models directly from the backend package
from main import app
from models import Task, User
from db import get_session
from routes.auth import UserContext, get_current_user


# Create an in-memory SQLite database for testing
@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    SQLModel.metadata.create_all(bind=engine)

    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    def get_session_override():
        return session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="user_a")
def user_a_fixture() -> UserContext:
    """Create User A for testing"""
    return UserContext(user_id="user_a_id", email="usera@example.com")


@pytest.fixture(name="user_b")
def user_b_fixture() -> UserContext:
    """Create User B for testing"""
    return UserContext(user_id="user_b_id", email="userb@example.com")


def test_user_isolation_get_tasks(client: TestClient, session: Session, user_a: UserContext, user_b: UserContext):
    """
    Test that User A cannot see User B's tasks when getting all tasks.
    """
    # Create tasks for User A
    task_a1 = Task(title="User A Task 1", user_id=user_a.user_id, is_completed=False)
    task_a2 = Task(title="User A Task 2", user_id=user_a.user_id, is_completed=True)
    session.add(task_a1)
    session.add(task_a2)
    session.commit()

    # Create tasks for User B
    task_b1 = Task(title="User B Task 1", user_id=user_b.user_id, is_completed=False)
    task_b2 = Task(title="User B Task 2", user_id=user_b.user_id, is_completed=True)
    session.add(task_b1)
    session.add(task_b2)
    session.commit()

    # Mock authentication for User A
    def get_current_user_override():
        return user_a

    app.dependency_overrides[get_current_user] = get_current_user_override

    # User A should only see their own tasks
    response = client.get("/api/tasks/")
    assert response.status_code == 200
    user_a_tasks = response.json()
    assert len(user_a_tasks) == 2
    for task in user_a_tasks:
        assert task["user_id"] == user_a.user_id

    # Mock authentication for User B
    def get_current_user_override_b():
        return user_b

    app.dependency_overrides[get_current_user] = get_current_user_override_b

    # User B should only see their own tasks
    response = client.get("/api/tasks/")
    assert response.status_code == 200
    user_b_tasks = response.json()
    assert len(user_b_tasks) == 2
    for task in user_b_tasks:
        assert task["user_id"] == user_b.user_id


def test_user_isolation_get_specific_task(client: TestClient, session: Session, user_a: UserContext, user_b: UserContext):
    """
    Test that User A cannot access User B's specific task.
    """
    # Create a task for User A
    task_a = Task(title="User A Task", user_id=user_a.user_id, is_completed=False)
    session.add(task_a)
    session.commit()

    # Create a task for User B
    task_b = Task(title="User B Task", user_id=user_b.user_id, is_completed=False)
    session.add(task_b)
    session.commit()

    # Mock authentication for User A
    def get_current_user_override():
        return user_a

    app.dependency_overrides[get_current_user] = get_current_user_override

    # User A should be able to access their own task
    response = client.get(f"/api/tasks/{task_a.id}")
    assert response.status_code == 200
    assert response.json()["id"] == task_a.id
    assert response.json()["user_id"] == user_a.user_id

    # User A should NOT be able to access User B's task (should return 404)
    response = client.get(f"/api/tasks/{task_b.id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_user_isolation_update_task(client: TestClient, session: Session, user_a: UserContext, user_b: UserContext):
    """
    Test that User A cannot update User B's task.
    """
    # Create a task for User A
    task_a = Task(title="User A Task", user_id=user_a.user_id, is_completed=False)
    session.add(task_a)
    session.commit()

    # Create a task for User B
    task_b = Task(title="User B Task", user_id=user_b.user_id, is_completed=False)
    session.add(task_b)
    session.commit()

    # Mock authentication for User A
    def get_current_user_override():
        return user_a

    app.dependency_overrides[get_current_user] = get_current_user_override

    # User A should be able to update their own task
    update_data = {"title": "Updated User A Task", "is_completed": True}
    response = client.put(f"/api/tasks/{task_a.id}", json=update_data)
    assert response.status_code == 200
    updated_task = response.json()
    assert updated_task["id"] == task_a.id
    assert updated_task["title"] == "Updated User A Task"
    assert updated_task["is_completed"] is True

    # User A should NOT be able to update User B's task (should return 404)
    update_data = {"title": "Hacked User B Task", "is_completed": True}
    response = client.put(f"/api/tasks/{task_b.id}", json=update_data)
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_user_isolation_delete_task(client: TestClient, session: Session, user_a: UserContext, user_b: UserContext):
    """
    Test that User A cannot delete User B's task.
    """
    # Create a task for User A
    task_a = Task(title="User A Task", user_id=user_a.user_id, is_completed=False)
    session.add(task_a)
    session.commit()

    # Create a task for User B
    task_b = Task(title="User B Task", user_id=user_b.user_id, is_completed=False)
    session.add(task_b)
    session.commit()

    # Mock authentication for User A
    def get_current_user_override():
        return user_a

    app.dependency_overrides[get_current_user] = get_current_user_override

    # User A should be able to delete their own task
    response = client.delete(f"/api/tasks/{task_a.id}")
    assert response.status_code == 200
    assert response.json()["message"] == "Task deleted successfully"

    # Verify User A's task is deleted
    response = client.get(f"/api/tasks/{task_a.id}")
    assert response.status_code == 404

    # User A should NOT be able to delete User B's task (should return 404)
    response = client.delete(f"/api/tasks/{task_b.id}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"

    # Verify User B's task still exists
    # Switch to User B to verify
    def get_current_user_override_b():
        return user_b

    app.dependency_overrides[get_current_user] = get_current_user_override_b

    response = client.get(f"/api/tasks/{task_b.id}")
    assert response.status_code == 200
    assert response.json()["id"] == task_b.id


def test_cross_user_access_scenarios(client: TestClient, session: Session, user_a: UserContext, user_b: UserContext):
    """
    Comprehensive test for cross-user access scenarios as specified in User Story 4.
    """
    # Create multiple tasks for both users
    user_a_tasks = []
    for i in range(3):
        task = Task(title=f"User A Task {i+1}", user_id=user_a.user_id, is_completed=False)
        session.add(task)
        user_a_tasks.append(task)

    user_b_tasks = []
    for i in range(2):
        task = Task(title=f"User B Task {i+1}", user_id=user_b.user_id, is_completed=True)
        session.add(task)
        user_b_tasks.append(task)

    session.commit()

    # Test User A's perspective
    def get_current_user_override():
        return user_a

    app.dependency_overrides[get_current_user] = get_current_user_override

    # User A should only see their 3 tasks
    response = client.get("/api/tasks/")
    assert response.status_code == 200
    user_a_visible_tasks = response.json()
    assert len(user_a_visible_tasks) == 3
    for task in user_a_visible_tasks:
        assert task["user_id"] == user_a.user_id

    # User A should get 404 for all of User B's tasks
    for task_b in user_b_tasks:
        response = client.get(f"/api/tasks/{task_b.id}")
        assert response.status_code == 404

    # User A should get 404 when trying to update any of User B's tasks
    for task_b in user_b_tasks:
        response = client.put(f"/api/tasks/{task_b.id}", json={"title": "Attempted Update"})
        assert response.status_code == 404

    # User A should get 404 when trying to delete any of User B's tasks
    for task_b in user_b_tasks:
        response = client.delete(f"/api/tasks/{task_b.id}")
        assert response.status_code == 404