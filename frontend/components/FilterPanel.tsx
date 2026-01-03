"use client";

/**
 * FilterPanel Component
 * Provides filtering controls for tasks
 * Filters by status, priority, and date ranges
 */

interface FilterPanelProps {
  status: string;
  priority: string;
  datePreset: string;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onDatePresetChange: (preset: string) => void;
}

import { useState } from 'react';

export function FilterPanel({
  status,
  priority,
  datePreset,
  onStatusChange,
  onPriorityChange,
  onDatePresetChange
}: FilterPanelProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const handleReset = () => {
    onStatusChange("all");
    onPriorityChange("all");
    onDatePresetChange("all");
  };

  const hasActiveFilters = status !== "all" || priority !== "all" || datePreset !== "all";

  return (
    <>
      {/* Mobile Filter Button */}
      <button
        className="md:hidden w-full bg-gray-50 p-4 rounded-lg border border-gray-200 mb-3 flex items-center justify-between"
        onClick={() => setShowMobileFilters(true)}
        aria-label="Open filters"
      >
        <span className="text-sm font-semibold text-gray-700">Filters</span>
        {hasActiveFilters && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleReset();
            }}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Reset all
          </button>
        )}
      </button>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowMobileFilters(false)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 bg-white p-4 rounded-t-xl max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-500"
                aria-label="Close filters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {hasActiveFilters && (
              <div className="mb-4">
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reset all
                </button>
              </div>
            )}

            {/* Filters Content */}
            <div className="space-y-4">
              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={status}
                  onChange={(e) => {
                    onStatusChange(e.target.value);
                  }}
                  className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
                >
                  <option value="all">All Tasks</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority-filter"
                  value={priority}
                  onChange={(e) => {
                    onPriorityChange(e.target.value);
                  }}
                  className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Date Preset Filter */}
              <div>
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <select
                  id="date-filter"
                  value={datePreset}
                  onChange={(e) => {
                    onDatePresetChange(e.target.value);
                  }}
                  className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500 p-2"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Filter Panel - Hidden on mobile when modal is active */}
      <div className="hidden md:block bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Reset all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-xs font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority-filter" className="block text-xs font-medium text-gray-600 mb-1">
              Priority
            </label>
            <select
              id="priority-filter"
              value={priority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Date Preset Filter */}
          <div>
            <label htmlFor="date-filter" className="block text-xs font-medium text-gray-600 mb-1">
              Date
            </label>
            <select
              id="date-filter"
              value={datePreset}
              onChange={(e) => onDatePresetChange(e.target.value)}
              className="w-full text-sm rounded border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
