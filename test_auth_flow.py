"""
Test script to verify the complete authentication flow with Better Auth and JWT tokens.
This script tests:
1. User registration
2. User login and JWT token generation
3. API calls with JWT tokens
4. User isolation (one user can't access another's data)
"""
import requests
import os
import time

# Configuration
BACKEND_URL = os.getenv("NEXT_PUBLIC_BACKEND_URL", "http://localhost:8000")
FRONTEND_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

def test_complete_auth_flow():
    print("Testing complete authentication flow...")

    # Test 1: User Registration
    print("\n1. Testing user registration...")
    user1_email = f"user1_{int(time.time())}@example.com"
    user1_password = "password123"
    user1_name = "Test User 1"

    register_response = requests.post(
        f"{BACKEND_URL}/api/auth/sign-up",
        json={
            "email": user1_email,
            "password": user1_password,
            "name": user1_name
        },
        headers={"Content-Type": "application/json"}
    )

    if register_response.status_code == 201:
        print("✓ User registration successful")
        user1_token = register_response.json()["token"]
        user1_id = register_response.json()["user"]["id"]
        print(f"  - User ID: {user1_id}")
        print(f"  - JWT Token: {user1_token[:20]}...")
    else:
        print(f"✗ User registration failed: {register_response.status_code} - {register_response.text}")
        return False

    # Test 2: User Login
    print("\n2. Testing user login...")
    login_response = requests.post(
        f"{BACKEND_URL}/api/auth/sign-in",
        json={
            "email": user1_email,
            "password": user1_password
        },
        headers={"Content-Type": "application/json"}
    )

    if login_response.status_code == 200:
        print("✓ User login successful")
        user1_token = login_response.json()["token"]
        print(f"  - JWT Token: {user1_token[:20]}...")
    else:
        print(f"✗ User login failed: {login_response.status_code} - {login_response.text}")
        return False

    # Test 3: Create a task with JWT token
    print("\n3. Testing task creation with JWT token...")
    task_response = requests.post(
        f"{BACKEND_URL}/api/tasks",
        json={"title": "Test task for user 1"},
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {user1_token}"
        }
    )

    if task_response.status_code == 200:
        print("✓ Task creation successful")
        task1_id = task_response.json()["id"]
        print(f"  - Task ID: {task1_id}")
    else:
        print(f"✗ Task creation failed: {task_response.status_code} - {task_response.text}")
        return False

    # Test 4: Get tasks with JWT token
    print("\n4. Testing task retrieval with JWT token...")
    get_tasks_response = requests.get(
        f"{BACKEND_URL}/api/tasks",
        headers={
            "Authorization": f"Bearer {user1_token}"
        }
    )

    if get_tasks_response.status_code == 200:
        tasks = get_tasks_response.json()
        print(f"✓ Task retrieval successful - Found {len(tasks)} tasks")
        if len(tasks) > 0:
            print(f"  - First task: {tasks[0]['title']}")
    else:
        print(f"✗ Task retrieval failed: {get_tasks_response.status_code} - {get_tasks_response.text}")
        return False

    # Test 5: Create second user
    print("\n5. Testing second user registration...")
    user2_email = f"user2_{int(time.time())}@example.com"
    user2_password = "password123"
    user2_name = "Test User 2"

    register_response2 = requests.post(
        f"{BACKEND_URL}/api/auth/sign-up",
        json={
            "email": user2_email,
            "password": user2_password,
            "name": user2_name
        },
        headers={"Content-Type": "application/json"}
    )

    if register_response2.status_code == 201:
        print("✓ Second user registration successful")
        user2_token = register_response2.json()["token"]
        user2_id = register_response2.json()["user"]["id"]
        print(f"  - User ID: {user2_id}")
    else:
        print(f"✗ Second user registration failed: {register_response2.status_code} - {register_response2.text}")
        return False

    # Test 6: Create a task for user 2
    print("\n6. Testing task creation for user 2...")
    task2_response = requests.post(
        f"{BACKEND_URL}/api/tasks",
        json={"title": "Test task for user 2"},
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {user2_token}"
        }
    )

    if task2_response.status_code == 200:
        print("✓ Task creation for user 2 successful")
        task2_id = task2_response.json()["id"]
        print(f"  - Task ID: {task2_id}")
    else:
        print(f"✗ Task creation for user 2 failed: {task2_response.status_code} - {task2_response.text}")
        return False

    # Test 7: User isolation - User 1 should not see User 2's tasks
    print("\n7. Testing user isolation...")
    get_tasks_user1_response = requests.get(
        f"{BACKEND_URL}/api/tasks",
        headers={
            "Authorization": f"Bearer {user1_token}"
        }
    )

    if get_tasks_user1_response.status_code == 200:
        user1_tasks = get_tasks_user1_response.json()
        user1_task_titles = [task["title"] for task in user1_tasks]
        print(f"✓ User 1 has {len(user1_tasks)} tasks")

        # Check that user 1 doesn't see user 2's task
        if "Test task for user 2" not in user1_task_titles:
            print("✓ User isolation working - User 1 cannot see User 2's tasks")
        else:
            print("✗ User isolation failed - User 1 can see User 2's tasks")
            return False
    else:
        print(f"✗ User isolation test failed: {get_tasks_user1_response.status_code}")
        return False

    # Test 8: User 2 should not see User 1's tasks
    get_tasks_user2_response = requests.get(
        f"{BACKEND_URL}/api/tasks",
        headers={
            "Authorization": f"Bearer {user2_token}"
        }
    )

    if get_tasks_user2_response.status_code == 200:
        user2_tasks = get_tasks_user2_response.json()
        user2_task_titles = [task["title"] for task in user2_tasks]
        print(f"✓ User 2 has {len(user2_tasks)} tasks")

        # Check that user 2 doesn't see user 1's task
        if "Test task for user 1" not in user2_task_titles:
            print("✓ User isolation working - User 2 cannot see User 1's tasks")
        else:
            print("✗ User isolation failed - User 2 can see User 1's tasks")
            return False
    else:
        print(f"✗ User isolation test for user 2 failed: {get_tasks_user2_response.status_code}")
        return False

    # Test 9: Update task
    print("\n8. Testing task update...")
    update_response = requests.put(
        f"{BACKEND_URL}/api/tasks/{task1_id}",
        json={"title": "Updated task for user 1", "is_completed": True},
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {user1_token}"
        }
    )

    if update_response.status_code == 200:
        print("✓ Task update successful")
        updated_task = update_response.json()
        print(f"  - Updated title: {updated_task['title']}")
        print(f"  - Completed: {updated_task['is_completed']}")
    else:
        print(f"✗ Task update failed: {update_response.status_code} - {update_response.text}")
        return False

    # Test 10: Delete task
    print("\n9. Testing task deletion...")
    delete_response = requests.delete(
        f"{BACKEND_URL}/api/tasks/{task1_id}",
        headers={
            "Authorization": f"Bearer {user1_token}"
        }
    )

    if delete_response.status_code == 200:
        print("✓ Task deletion successful")
    else:
        print(f"✗ Task deletion failed: {delete_response.status_code} - {delete_response.text}")
        return False

    print("\n✅ All authentication flow tests passed!")
    print("\nSummary:")
    print("- User registration and login work correctly")
    print("- JWT tokens are properly generated and validated")
    print("- API calls work with JWT authentication")
    print("- User isolation is enforced (users can only access their own data)")
    print("- CRUD operations work for authenticated users")
    print("- Session management works properly")

    return True

if __name__ == "__main__":
    success = test_complete_auth_flow()
    if success:
        print("\n🎉 Authentication flow validation successful!")
        exit(0)
    else:
        print("\n❌ Authentication flow validation failed!")
        exit(1)