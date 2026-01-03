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
        className="md:hidden w-full bg-white/50 p-4 rounded-xl border border-primary-100 mb-3 flex items-center justify-between text-primary-700 font-medium"
        onClick={() => setShowMobileFilters(true)}
        aria-label="Open filters"
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Filters
        </span>
        {hasActiveFilters && (
          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
            Active
          </span>
        )}
      </button>

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-sea-900/30 backdrop-blur-sm"
            onClick={() => setShowMobileFilters(false)}
          ></div>
          <div className="absolute bottom-0 left-0 right-0 glass-panel rounded-t-2xl rounded-b-none p-6 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                aria-label="Close filters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {hasActiveFilters && (
              <div className="mb-6">
                <button
                  onClick={handleReset}
                  className="w-full py-2 text-sm text-primary-600 font-medium border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            )}

            {/* Filters Content */}
            <div className="space-y-6">
              {/* Status Filter */}
              <div>
                <label htmlFor="status-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status-filter"
                  value={status}
                  onChange={(e) => {
                    onStatusChange(e.target.value);
                  }}
                  className="input-luxury"
                >
                  <option value="all">All Tasks</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label htmlFor="priority-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority-filter"
                  value={priority}
                  onChange={(e) => {
                    onPriorityChange(e.target.value);
                  }}
                  className="input-luxury"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Date Preset Filter */}
              <div>
                <label htmlFor="date-filter" className="block text-sm font-semibold text-gray-700 mb-2">
                  Date
                </label>
                <select
                  id="date-filter"
                  value={datePreset}
                  onChange={(e) => {
                    onDatePresetChange(e.target.value);
                  }}
                  className="input-luxury"
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

      {/* Desktop Filter Panel */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Refine By</h3>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
            >
              Reset all
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter-desktop" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="relative">
              <select
                id="status-filter-desktop"
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="input-luxury appearance-none cursor-pointer"
              >
                <option value="all">All Tasks</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label htmlFor="priority-filter-desktop" className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="relative">
              <select
                id="priority-filter-desktop"
                value={priority}
                onChange={(e) => onPriorityChange(e.target.value)}
                className="input-luxury appearance-none cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Date Preset Filter */}
          <div>
            <label htmlFor="date-filter-desktop" className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <div className="relative">
              <select
                id="date-filter-desktop"
                value={datePreset}
                onChange={(e) => onDatePresetChange(e.target.value)}
                className="input-luxury appearance-none cursor-pointer"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="overdue">Overdue</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
