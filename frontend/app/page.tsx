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
          const tags = await apiRequest<Array<{ name: string }>>('/api/tags');
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
        const tags = await apiRequest<Array<{ name: string }>>('/api/tags');
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 font-sans">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Show auth prompt if not authenticated
  if (!session) {
    return (
      <ErrorBoundary>
        <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-300/20 blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary-300/20 blur-3xl"></div>
          </div>

          <main className="w-full max-w-4xl mx-auto">
            <div className="glass-panel p-8 sm:p-12 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-gradient mb-6">
                Master Your Day
              </h1>
              <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Experience productivity like never before with our luxury task management suite.
                Organize, prioritize, and achieve your goals in a serene, sea-inspired environment.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/login"
                  className="btn-luxury min-w-[200px] text-lg"
                >
                  Start Your Journey
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 rounded-xl border-2 border-primary-200 text-primary-700 font-semibold hover:bg-primary-50 transition-colors min-w-[200px]"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </main>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen pb-12 font-sans">
        {/* Navbar / Header */}
        <header className="glass-panel sticky top-4 mx-4 mb-8 z-10 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              T
            </div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">My Tasks</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {session.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {session.user?.email}
              </p>
            </div>
            <button
              onClick={async () => {
                await signOut();
                window.location.href = '/login';
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white/50 hover:bg-white/80 hover:text-error-600 rounded-lg transition-all border border-transparent hover:border-error-200"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Display errors from the API hooks */}
          {tasksApi.error && (
            <div className="mb-6 p-4 bg-error-50 border border-error-100 text-error-700 rounded-xl shadow-sm">
              Failed to load tasks: {tasksApi.error.message}. Please refresh the page.
            </div>
          )}

          {createApi.error && (
            <div className="mb-6 p-4 bg-error-50 border border-error-100 text-error-700 rounded-xl shadow-sm">
              Failed to create task: {createApi.error.message}. Please try again.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar / Controls */}
            <div className="lg:col-span-4 space-y-6">
              {/* Add Task Panel */}
              <div className="glass-panel p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Task
                </h2>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="input-luxury"
                    aria-label="New task title"
                    disabled={createApi.loading}
                  />

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">Priority</label>
                    <PrioritySelector
                      value={newTaskPriority}
                      onChange={setNewTaskPriority}
                      disabled={createApi.loading}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider ml-1">Tags</label>
                    <TagInput
                      value={newTaskTags}
                      onChange={setNewTaskTags}
                      availableTags={availableTags}
                      disabled={createApi.loading}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`btn-luxury w-full mt-2 flex justify-center items-center ${createApi.loading ? 'opacity-70' : ''}`}
                    disabled={createApi.loading}
                  >
                    {createApi.loading ? 'Adding...' : 'Add Task'}
                  </button>
                </form>
              </div>

              {/* Filters Panel */}
              <div className="glass-panel p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                </h2>
                <FilterPanel
                  status={statusFilter}
                  priority={priorityFilter}
                  datePreset={datePresetFilter}
                  onStatusChange={setStatusFilter}
                  onPriorityChange={setPriorityFilter}
                  onDatePresetChange={setDatePresetFilter}
                />
              </div>
            </div>

            {/* Main Content / List */}
            <div className="lg:col-span-8 space-y-6">
              {/* Search & Sort */}
              <div className="glass-panel p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="w-full sm:w-2/3">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search tasks..."
                  />
                </div>
                <div className="w-full sm:w-auto">
                  <SortControls
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortByChange={setSortBy}
                    onSortOrderChange={setSortOrder}
                  />
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-4">
                {tasksApi.loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TaskSkeleton key={`skeleton-${index}`} />
                  ))
                ) : tasks.length === 0 ? (
                  <div className="glass-panel p-12 text-center">
                    <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-gray-800 mb-2">No tasks found</h3>
                    <p className="text-gray-500">
                      {searchQuery || statusFilter !== 'all'
                        ? "Try adjusting your filters or search query"
                        : "Create a new task to get started on your journey"}
                    </p>
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
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}