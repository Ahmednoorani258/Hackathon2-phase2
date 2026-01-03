"""
Test runner for isolation tests that handles imports properly
"""
import sys
import os
sys.path.insert(0, os.path.abspath('.'))

# Set a test database URL to avoid the error
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool
from datetime import datetime
from typing import Generator

# Import backend modules with a try-catch to handle the database issue
import models
from routes.auth import UserContext, get_current_user
from routes import tasks

def test_user_isolation():
    """Test user isolation functionality"""
    # Create an in-memory SQLite database for testing
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    SQLModel.metadata.create_all(bind=engine)

    # Create a new app instance for testing
    app = FastAPI(title="Todo App API")
    app.include_router(tasks.router)

    # Override the session dependency
    from db import get_session

    def get_test_session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_test_session_override

    client = TestClient(app)

    # Create mock users
    user_a = UserContext(user_id="user_a_id", email="usera@example.com")
    user_b = UserContext(user_id="user_b_id", email="userb@example.com")

    # Test 1: Create tasks for both users
    # Mock authentication for User A
    app.dependency_overrides[get_current_user] = lambda: user_a

    # Create tasks for User A
    response = client.post("/api/tasks/", json={"title": "User A Task 1"})
    assert response.status_code == 200, f"Failed to create User A task: {response.text}"
    task_a_id = response.json()["id"]
    print(f"Created task A with ID: {task_a_id}")

    response = client.post("/api/tasks/", json={"title": "User A Task 2"})
    assert response.status_code == 200, f"Failed to create User A task 2: {response.text}"
    task_a2_id = response.json()["id"]
    print(f"Created task A2 with ID: {task_a2_id}")

    # Mock authentication for User B
    app.dependency_overrides[get_current_user] = lambda: user_b

    # Create tasks for User B
    response = client.post("/api/tasks/", json={"title": "User B Task 1"})
    assert response.status_code == 200, f"Failed to create User B task: {response.text}"
    task_b_id = response.json()["id"]
    print(f"Created task B with ID: {task_b_id}")

    # Test 2: User isolation for GET /api/tasks/
    # User A should only see their own tasks
    app.dependency_overrides[get_current_user] = lambda: user_a
    response = client.get("/api/tasks/")
    assert response.status_code == 200, f"Failed to get User A tasks: {response.text}"
    user_a_tasks = response.json()
    assert len(user_a_tasks) == 2, f"User A should have 2 tasks, but has {len(user_a_tasks)}"
    for task in user_a_tasks:
        assert task["user_id"] == user_a.user_id, f"Task {task['id']} does not belong to User A"

    # User B should only see their own tasks
    app.dependency_overrides[get_current_user] = lambda: user_b
    response = client.get("/api/tasks/")
    assert response.status_code == 200, f"Failed to get User B tasks: {response.text}"
    user_b_tasks = response.json()
    assert len(user_b_tasks) == 1, f"User B should have 1 task, but has {len(user_b_tasks)}"
    assert user_b_tasks[0]["user_id"] == user_b.user_id, f"Task {user_b_tasks[0]['id']} does not belong to User B"

    # Test 3: User isolation for specific task access
    # User A should NOT be able to access User B's task
    app.dependency_overrides[get_current_user] = lambda: user_a
    response = client.get(f"/api/tasks/{task_b_id}")
    assert response.status_code == 404, f"User A should not be able to access User B's task, but got {response.status_code}"

    # User A should be able to access their own task
    response = client.get(f"/api/tasks/{task_a_id}")
    assert response.status_code == 200, f"User A should be able to access their own task, but got {response.status_code}"
    assert response.json()["id"] == task_a_id, f"Wrong task returned"
    assert response.json()["user_id"] == user_a.user_id, f"Task doesn't belong to User A"

    # Test 4: User isolation for updates
    # User A should NOT be able to update User B's task
    response = client.put(f"/api/tasks/{task_b_id}", json={"title": "Hacked Task"})
    assert response.status_code == 404, f"User A should not be able to update User B's task, but got {response.status_code}"

    # User A should be able to update their own task
    response = client.put(f"/api/tasks/{task_a_id}", json={"title": "Updated Task A"})
    assert response.status_code == 200, f"User A should be able to update their own task, but got {response.status_code}"
    assert response.json()["title"] == "Updated Task A", f"Task title not updated correctly"

    # Test 5: User isolation for deletes
    # User A should NOT be able to delete User B's task
    response = client.delete(f"/api/tasks/{task_b_id}")
    assert response.status_code == 404, f"User A should not be able to delete User B's task, but got {response.status_code}"

    # User A should be able to delete their own task
    response = client.delete(f"/api/tasks/{task_a2_id}")
    assert response.status_code == 200, f"User A should be able to delete their own task, but got {response.status_code}"
    assert response.json()["message"] == "Task deleted successfully", f"Delete message incorrect"

    print("✅ All user isolation tests passed!")

if __name__ == "__main__":
    test_user_isolation()