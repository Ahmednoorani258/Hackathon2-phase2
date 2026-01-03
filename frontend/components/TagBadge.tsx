"use client";

/**
 * TagBadge Component
 * Displays a pill-shaped chip for task tags
 * Follows design system with bg-primary-50, hover states, and rounded-full shape
 */

interface TagBadgeProps {
  name: string;
  onRemove?: () => void;
}

export default function TagBadge({ name, onRemove }: TagBadgeProps) {
  return (
    <span
      className="
        inline-flex items-center gap-1 px-3 py-1 rounded-full
        bg-primary-50 text-primary-700 text-sm font-medium
        ring-1 ring-inset ring-primary-200
        hover:bg-primary-100 transition-colors duration-200
      "
    >
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-primary-900 transition-colors duration-200"
          aria-label={`Remove ${name} tag`}
        >
          ×
        </button>
      )}
    </span>
  );
}
