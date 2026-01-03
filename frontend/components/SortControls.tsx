"use client";

/**
 * SortControls Component
 * Provides sorting controls for tasks
 * Allows sorting by due date, priority, or title
 */

interface SortControlsProps {
  sortBy: string;
  sortOrder: string;
  onSortByChange: (sortBy: string) => void;
  onSortOrderChange: (sortOrder: string) => void;
}

export function SortControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange
}: SortControlsProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Sort by:</span>
      
      <select
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value)}
        className="text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="created_at">Date Created</option>
        <option value="priority">Priority</option>
        <option value="title">Title (A-Z)</option>
      </select>

      <button
        onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        aria-label={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
        title={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
      >
        {sortOrder === 'asc' ? (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        )}
      </button>
    </div>
  );
}
