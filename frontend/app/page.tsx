'use client';

import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, Task } from '@/lib/api';
import useApi from '@/lib/useApi';
import TaskItem from '@/components/TaskItem';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSession, signOut } from '@/lib/auth-client';
import Link from 'next/link';

export default function Home() {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Use the custom API hook for better error handling
  const tasksApi = useApi<Task[]>();
  const createApi = useApi<Task>();

  // Get authentication state using the correct Better Auth client
  const { data: session, isPending } = useSession();

  // Load tasks on component mount (only if authenticated)
  useEffect(() => {
    const loadTasks = async () => {
      if (session) {
        await tasksApi.execute(() => getTasks());
      }
    };

    loadTasks();
  }, [session]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTaskTitle.trim()) return;

    const newTask = await createApi.execute(() => createTask(newTaskTitle.trim()));

    if (newTask && !createApi.error) {
      setTasks(prevTasks => [...prevTasks, newTask]);
      setNewTaskTitle('');
    }
  };

  const [tasks, setTasks] = useState<Task[]>(tasksApi.data || []);

  // Update tasks when API data changes
  useEffect(() => {
    if (tasksApi.data) {
      setTasks(tasksApi.data);
    }
  }, [tasksApi.data]);

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    ));
  };

  const handleTaskDeleted = (taskId: number) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  // Show loading state while checking session
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show auth prompt if not authenticated
  if (!session) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
          <main className="flex-1 max-w-3xl mx-auto py-8 px-4 sm:px-6">
            <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-50">My Tasks</h1>
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              </div>

              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-zinc-50 mb-4">Welcome to Your Todo App</h2>
                <p className="text-gray-600 mb-6">Please sign in to access your tasks and manage your to-do list.</p>
                <div className="space-y-4">
                  <Link
                    href="/login"
                    className="block w-full max-w-xs mx-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Sign In to Continue
                  </Link>
                  <p className="text-gray-500 text-sm">
                    Don't have an account?
                    <button
                      onClick={() => window.location.href = '/login'}
                      className="text-indigo-600 hover:text-indigo-800 ml-1 underline"
                    >
                      Sign up here
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
        <main className="flex-1 max-w-3xl mx-auto py-8 px-4 sm:px-6">
          <div className="bg-white dark:bg-black rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-zinc-50">My Tasks</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Welcome, {session.user?.email || session.user?.name || 'User'}
                </span>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Display errors from the API hooks */}
            {tasksApi.error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                Failed to load tasks: {tasksApi.error.message}. Please refresh the page.
              </div>
            )}

            {createApi.error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                Failed to create task: {createApi.error.message}. Please try again.
              </div>
            )}

            {/* Add Task Form */}
            <form onSubmit={handleCreateTask} className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter a new task..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="New task title"
                  disabled={createApi.loading}
                />
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${createApi.loading ? 'bg-blue-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                  disabled={createApi.loading}
                >
                  {createApi.loading ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>

            {/* Tasks List */}
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No tasks yet. Add a new task to get started!</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onTaskUpdated={handleTaskUpdated}
                    onTaskDeleted={handleTaskDeleted}
                  />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}