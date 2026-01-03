'use client';

import { useState } from 'react';
import { updateTask, deleteTask, Task } from '@/lib/api';
import useApi from '@/lib/useApi';
import { taskUpdateQueue } from '@/lib/requestQueue';

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
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {updateApi.error.message}
        </div>
      )}

      {/* Error display for delete operations */}
      {deleteApi.error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {deleteApi.error.message}
        </div>
      )}

      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={handleToggleCompletion}
            disabled={isUpdating}
            className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${
              isCompleted
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-green-400'
            } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted && (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
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
              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Edit task title"
            />
          ) : (
            <span
              className={`flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}
              onClick={handleEditStart}
            >
              {task.title}
            </span>
          )}
        </div>

        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleEditSave}
                disabled={isUpdating}
                className={`px-3 py-1 bg-green-500 text-white rounded transition-colors ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
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
                className={`px-3 py-1 bg-gray-300 text-gray-700 rounded transition-colors ${
                  isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'
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
              className={`p-1 transition-colors ${
                isUpdating ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-red-500 hover:text-red-600'
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleteApi.loading}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteApi.loading}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50"
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