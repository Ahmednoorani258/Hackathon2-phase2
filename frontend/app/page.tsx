'use client';

import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask, Task, apiRequest } from '@/lib/api';
import useApi from '@/lib/useApi';
import TaskItem from '@/components/TaskItem';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSession, signOut } from '@/lib/auth-client';
import Link from 'next/link';
import { PrioritySelector } from '@/components/PrioritySelector';
import { TagInput } from '@/components/TagInput';
import { SearchBar } from '@/components/SearchBar';
import { FilterPanel } from '@/components/FilterPanel';
import { SortControls } from '@/components/SortControls';
import TaskSkeleton from '@/components/TaskSkeleton';

export default function Home() {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [datePresetFilter, setDatePresetFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Use the custom API hook for better error handling
  const tasksApi = useApi<Task[]>();
  const createApi = useApi<Task>();

  // Get authentication state using the correct Better Auth client
  const { data: session, isPending } = useSession();

  // Load tasks and tags when filters change (only if authenticated)
  useEffect(() => {
    const loadData = async () => {
      if (session) {
        await tasksApi.execute(() => getTasks(searchQuery, statusFilter, priorityFilter, datePresetFilter, sortBy, sortOrder));
        // Load available tags
        try {
          const tags = await apiRequest<Array<{name: string}>>('/api/tags');
          setAvailableTags(tags.map(t => t.name));
        } catch (error) {
          console.error('Failed to load tags:', error);
        }
      }
    };

    loadData();
  }, [session, searchQuery, statusFilter, priorityFilter, datePresetFilter, sortBy, sortOrder]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTaskTitle.trim()) return;

    const newTask = await createApi.execute(() =>
      apiRequest<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          tags: newTaskTags
        }),
      })
    );

    if (newTask && !createApi.error) {
      setTasks(prevTasks => [...prevTasks, newTask]);
      setNewTaskTitle('');
      setNewTaskPriority("medium");
      setNewTaskTags([]); // Reset tags

      // Refresh available tags
      try {
        const tags = await apiRequest<Array<{name: string}>>('/api/tags');
        setAvailableTags(tags.map(t => t.name));
      } catch (error) {
        console.error('Failed to refresh tags:', error);
      }
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
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
        <div className="flex min-h-screen bg-zinc-50 font-sans">
          <main className="flex-1 max-w-3xl mx-auto py-8 px-4 sm:px-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
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
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome to Your Todo App</h2>
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
      <div className="flex min-h-screen bg-zinc-50 font-sans ">
        <main className="flex-1 max-w-3xl mx-auto py-8 px-4 sm:px-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 ">My Tasks</h1>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Welcome, {session.user?.email || session.user?.name || 'User'}
                </span>
                <button
                  onClick={async () => {
                    await signOut();
                    // Redirect to login page after signing out
                    window.location.href = '/login';
                  }}
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

            {/* Search Bar */}
            <div className="mb-4">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search tasks by title or tags..."
              />
            </div>

            {/* Filter Panel */}
            <div className="mb-4">
              <FilterPanel
                status={statusFilter}
                priority={priorityFilter}
                datePreset={datePresetFilter}
                onStatusChange={setStatusFilter}
                onPriorityChange={setPriorityFilter}
                onDatePresetChange={setDatePresetFilter}
              />
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleCreateTask} className="mb-6">
              <div className="flex flex-col gap-4">
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
                <div className="flex gap-4">
                  <div className="w-48">
                    <PrioritySelector
                      value={newTaskPriority}
                      onChange={setNewTaskPriority}
                      disabled={createApi.loading}
                    />
                  </div>
                  <div className="flex-1">
                    <TagInput
                      value={newTaskTags}
                      onChange={setNewTaskTags}
                      availableTags={availableTags}
                      disabled={createApi.loading}
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Sort Controls */}
            <div className="mb-4 flex justify-end">
              <SortControls
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortByChange={setSortBy}
                onSortOrderChange={setSortOrder}
              />
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
              {tasksApi.loading ? (
                // Show skeleton loading states during initial load
                Array.from({ length: 5 }).map((_, index) => (
                  <TaskSkeleton key={`skeleton-${index}`} />
                ))
              ) : tasks.length === 0 ? (
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