/**
 * TaskSkeleton Component
 * Loading placeholder for TaskItem components
 * Uses animate-pulse with bg-gray-200 placeholders matching TaskItem layout
 */

export default function TaskSkeleton() {
  return (
    <div className="flex items-center justify-between p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-shrink-0 w-11 h-11 rounded-lg border-2 border-gray-200 bg-gray-200 animate-pulse" />

        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="h-5 w-12 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
          </div>

          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      <div className="flex gap-2">
        <div className="w-11 h-11 rounded-lg bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}