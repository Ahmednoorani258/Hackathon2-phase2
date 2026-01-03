// frontend/lib/api.ts - API client for backend communication with JWT support
import { getToken } from './auth-client';

interface Task {
  id: number;
  title: string;
  is_completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// API client function that can be used in client components
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // Get the JWT token from the session
  const token = await getToken();

  // Build headers as a plain object
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...((options.headers instanceof Headers || Array.isArray(options.headers)) ? {} : (options.headers || {})),
  };

  // Include the JWT token in the Authorization header if available
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${backendUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Try to get error details from the response
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch (e) {
      // If we can't parse the error response, use the default message
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

// Individual API functions
export async function getTasks(): Promise<Task[]> {
  return apiRequest<Task[]>('/api/tasks');
}

export async function createTask(title: string): Promise<Task> {
  return apiRequest<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export async function updateTask(id: number, updates: Partial<Task>): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteTask(id: number): Promise<void> {
  await apiRequest(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

export type { Task };