"use client";

/**
 * PriorityBadge Component
 * Displays a visual indicator for task priority levels (high/medium/low)
 * Uses semantic color-coded badges for quick visual identification
 * Follows design system with rounded-full pill shape and ring styling
 */

interface PriorityBadgeProps {
  priority: "high" | "medium" | "low";
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = {
    high: "bg-error-100 text-error-700 ring-error-200",
    medium: "bg-warning-100 text-warning-700 ring-warning-200",
    low: "bg-gray-100 text-gray-700 ring-gray-200",
  };

  const labels = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${styles[priority]}`}
    >
      {labels[priority]}
    </span>
  );
}
