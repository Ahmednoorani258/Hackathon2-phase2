"use client";

/**
 * TaskTags Component
 * Displays tags associated with a task as small badges
 * Shows visual indicators for categorization
 */

interface TaskTagsProps {
  tags: string[];
}

export function TaskTags({ tags }: TaskTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
