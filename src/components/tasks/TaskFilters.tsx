import React, { useMemo } from 'react';
import type { Task, TaskFilters } from '../../types';

interface TaskFiltersProps {
  tasks: Task[];
  filters: TaskFilters;
  onFilterChange: (filters: Partial<TaskFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  tasks,
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
  className = ''
}) => {
  // Get unique assignees from tasks
  const assigneeOptions = useMemo(() => {
    const assignees = new Set<string>();
    tasks.forEach(task => {
      if (task.assigned_to && task.assigned_to.trim()) {
        assignees.add(task.assigned_to.trim());
      }
    });
    return Array.from(assignees).sort();
  }, [tasks]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search Filter */}
          <div className="flex-1 min-w-0">
            <label htmlFor="task-search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <input
                id="task-search"
                type="text"
                value={filters.search || ''}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                placeholder="Search by title or description..."
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Assigned To Filter */}
          <div className="min-w-0 sm:w-48">
            <label htmlFor="task-assigned-to-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <select
              id="task-assigned-to-filter"
              value={filters.assigned_to || ''}
              onChange={(e) => onFilterChange({ assigned_to: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All assignees</option>
              <option value="__unassigned__">Unassigned</option>
              {assigneeOptions.map(assignee => (
                <option key={assignee} value={assignee}>
                  {assignee}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="min-w-0 sm:w-32">
            <label htmlFor="task-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              id="task-type-filter"
              value={filters.type || ''}
              onChange={(e) => onFilterChange({ type: e.target.value as 'user' | 'system' || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">All types</option>
              <option value="user">User</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-gray-600">Active filters:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded">
                Search: "{filters.search}"
                <button
                  onClick={() => onFilterChange({ search: undefined })}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.assigned_to && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded">
                Assigned to: {filters.assigned_to === '__unassigned__' ? 'Unassigned' : filters.assigned_to}
                <button
                  onClick={() => onFilterChange({ assigned_to: undefined })}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            )}
            {filters.type && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded">
                Type: {filters.type}
                <button
                  onClick={() => onFilterChange({ type: undefined })}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};