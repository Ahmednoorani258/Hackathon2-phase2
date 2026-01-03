"use client";

/**
 * PrioritySelector Component
 * Dropdown selector for choosing task priority (high/medium/low)
 * Used in task creation and editing forms
 */

interface PrioritySelectorProps {
  value: "high" | "medium" | "low";
  onChange: (priority: "high" | "medium" | "low") => void;
  disabled?: boolean;
}

export function PrioritySelector({ value, onChange, disabled = false }: PrioritySelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="priority" className="text-sm font-medium text-gray-700">
        Priority
      </label>
      <select
        id="priority"
        value={value}
        onChange={(e) => onChange(e.target.value as "high" | "medium" | "low")}
        disabled={disabled}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
  );
}
