import React from 'react';
import type { Task } from '../../types';
import { TaskService } from '../../services/task.service';

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onTaskClick: (task: Task) => void;
  className?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onTaskComplete,
  onTaskClick,
  className = ''
}) => {


  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    
    return date.toLocaleDateString();
  };

  const getTaskTypeIcon = (type: 'user' | 'system') => {
    if (type === 'system') {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  };

  const handleTaskItemClick = (task: Task, event: React.MouseEvent) => {
    // Don't trigger click if user clicked on the complete button
    if ((event.target as HTMLElement).closest('.complete-button')) {
      return;
    }
    
    onTaskClick(task);
  };

  return (
    <div className={`task-list space-y-3 ${className}`}>
      {tasks.map((task) => {
        const isExpired = TaskService.isTaskExpired(task);
        
        return (
          <div
            key={task.id}
            className={`
              bg-white border rounded-lg p-4 shadow-sm transition-all duration-200
              ${task.link ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}
              ${isExpired ? 'opacity-60' : ''}
            `}
            onClick={(e) => handleTaskItemClick(task, e)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {/* Task Header */}
                <div className="flex items-center gap-2 mb-2">
                  {getTaskTypeIcon(task.type)}
                  <h4 className="font-medium text-gray-900 truncate">
                    {task.title}
                  </h4>
                  {task.link && (
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </div>

                {/* Task Description */}
                {task.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* Task Meta Information */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    Created {formatCreatedAt(task.created_at)}
                  </span>
                  
                  <span className="flex items-center gap-1 capitalize">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    {task.type}
                  </span>
                </div>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center">
                {/* Complete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskComplete(task.id);
                  }}
                  className="complete-button px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  title="Mark as complete"
                >
                  Complete
                </button>
              </div>
            </div>

            {/* Link Preview */}
            {task.link && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="truncate">{task.link}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};