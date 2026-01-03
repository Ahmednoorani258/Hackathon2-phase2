'use client';

import { useState } from 'react';
import { updateTask, deleteTask, Task } from '@/lib/api';
import useApi from '@/lib/useApi';
import { taskUpdateQueue } from '@/lib/requestQueue';
import { PriorityBadge } from './PriorityBadge';
import { TaskTags } from './TaskTags';

interface TaskItemProps {
  task: Task;
  onTaskUpdated: (updatedTask: Task) => void;
  onTaskDeleted: (taskId: number) => void;
}

export default function TaskItem({ task, onTaskUpdated, onTaskDeleted }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isCompleted, setIsCompleted] = useState(task.is_completed);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Use the custom API hook for better error handling
  const updateApi = useApi<Task>();
  const deleteApi = useApi<void>();

  const handleToggleCompletion = async () => {
    // Prevent multiple rapid clicks
    if (isUpdating) return;

    setIsUpdating(true);
    const previousState = isCompleted;

    // Optimistic update - update UI immediately
    setIsCompleted(!isCompleted);

    try {
      // Use queue to ensure sequential updates
      const updatedTask = await taskUpdateQueue.enqueue(
        `toggle-${task.id}`,
        () => updateTask(task.id, { is_completed: !previousState })
      );

      setIsCompleted(updatedTask.is_completed);
      onTaskUpdated(updatedTask);
    } catch (error) {
      console.error('Failed to update task completion:', error);
      // Revert the UI state if the API call failed
      setIsCompleted(previousState);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditStart = () => {
    setIsEditing(true);
    setTitle(task.title);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setTitle(task.title);
  };

  const handleEditSave = async () => {
    if (isUpdating || title.trim() === '') {
      // If title is empty, revert to the original title
      setTitle(task.title);
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updatedTask = await taskUpdateQueue.enqueue(
        `edit-${task.id}`,
        () => updateTask(task.id, { title: title.trim() })
      );

      onTaskUpdated(updatedTask);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task title:', error);
      // Revert to the original title if the API call failed
      setTitle(task.title);
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await taskUpdateQueue.enqueue(
        `delete-${task.id}`,
        () => deleteTask(task.id)
      );
      onTaskDeleted(task.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div className="flex flex-col">
      {/* Error display for update operations */}
      {updateApi.error && (
        <div className="mb-2 p-3 bg-error-50 border border-error-100 rounded-xl text-error-700 text-sm">
          {updateApi.error.message}
        </div>
      )}

      {/* Error display for delete operations */}
      {deleteApi.error && (
        <div className="mb-2 p-3 bg-error-50 border border-error-100 rounded-xl text-error-700 text-sm">
          {deleteApi.error.message}
        </div>
      )}

      <div className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-2xl transition-all duration-300 ${isCompleted
        ? 'bg-primary-50/50 border border-transparent'
        : 'glass-panel hover:shadow-lg hover:-translate-y-1'
        }`}>
        <div className="flex items-start md:items-center gap-4 flex-1 w-full">
          <button
            onClick={handleToggleCompletion}
            disabled={isUpdating}
            className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 mt-1 md:mt-0 ${isCompleted
              ? 'bg-gradient-to-br from-primary-400 to-secondary-500 border-transparent shadow-md scale-110'
              : 'border-primary-200 hover:border-primary-400 bg-white'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEditCancel}
              autoFocus
              className="flex-1 input-luxury py-2 w-full"
              aria-label="Edit task title"
            />
          ) : (
            <div className="flex-1 flex flex-col gap-1.5 min-w-0 w-full">
              <div className="flex flex-wrap items-start gap-2 md:gap-3">
                <h3
                  className={`text-lg font-medium leading-snug cursor-pointer transition-colors break-words ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800 hover:text-primary-600'
                    }`}
                  onClick={handleEditStart}
                >
                  {task.title}
                </h3>
                <PriorityBadge priority={task.priority} />
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <TaskTags tags={task.tags} />
                </div>
              )}
              <p className="text-xs text-gray-400 font-medium">
                {new Date(task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 md:mt-0 md:ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 self-end md:self-auto">
          {isEditing ? (
            <>
              <button
                onClick={handleEditSave}
                disabled={isUpdating}
                className={`w-9 h-9 flex items-center justify-center bg-success-500 text-white rounded-lg transition-all duration-200 shadow-sm ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-success-600 hover:shadow-md'
                  }`}
                aria-label="Save changes"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={handleEditCancel}
                disabled={isUpdating}
                className={`w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg transition-all duration-200 ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'
                  }`}
                aria-label="Cancel edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <button
              onClick={() => !isUpdating && setShowDeleteConfirm(true)}
              disabled={isUpdating}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:text-error-600 hover:bg-error-50 transition-all duration-200 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              aria-label="Delete task"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-sea-900/20 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-panel p-8 max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Task?</h3>
              <p className="text-gray-600 mb-8">
                This action cannot be undone. Are you sure you want to remove this task?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteApi.loading}
                  className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteApi.loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-error-500 to-error-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  {deleteApi.loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}