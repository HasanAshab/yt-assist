import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Task, TaskFormData, TaskFilters } from '../../types';
import { TaskService } from '../../services/task.service';
import { useTasks } from '../../hooks/useTasks';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { TaskList } from './TaskList';
import { TaskForm } from './TaskForm';
import { TaskFiltersComponent } from './TaskFilters';

interface TaskManagerProps {
  className?: string;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ className = '' }) => {
  const { tasks, loading, setTasks, addTask, deleteTask, setLoading } = useTasks();
  const { handleError } = useErrorHandler();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    expired: 0,
    userTasks: 0,
    systemTasks: 0,
    todaysTasks: 0
  });

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
    loadStatistics();
  }, []);

  // Set up automatic cleanup of expired tasks
  useEffect(() => {
    const checkExpiredTasks = async () => {
      try {
        await TaskService.cleanupExpiredTasks();
        await loadTasks();
        await loadStatistics();
      } catch (error) {
        console.error('Error during automatic cleanup:', error);
      }
    };

    // Check for expired tasks every minute
    const interval = setInterval(checkExpiredTasks, 60000);
    
    // Also check at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const midnightTimeout = setTimeout(() => {
      checkExpiredTasks();
      // Set up daily interval after first midnight cleanup
      setInterval(checkExpiredTasks, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const activeTasks = await TaskService.getActiveTasks();
      setTasks(activeTasks);
    } catch (error) {
      handleError(error, 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await TaskService.getTaskStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading task statistics:', error);
    }
  };

  const handleCreateTask = async (taskData: TaskFormData) => {
    try {
      const validation = TaskService.validateTaskData(taskData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const newTask = await TaskService.createTask(taskData, 'user');
      addTask(newTask);
      setShowCreateForm(false);
      await loadStatistics();
    } catch (error) {
      handleError(error, 'Failed to create task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await TaskService.completeTask(taskId);
      deleteTask(taskId);
      await loadStatistics();
    } catch (error) {
      handleError(error, 'Failed to complete task');
    }
  };

  const handleTaskClick = (task: Task) => {
    if (task.link) {
      TaskService.handleTaskRedirection(task);
    }
  };

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(filters.assigned_to || filters.type || filters.search);
  }, [filters]);

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter - search only in title and description
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase().trim();
        if (searchTerm) {
          const matchesSearch = 
            task.title.toLowerCase().includes(searchTerm) ||
            (task.description && task.description.toLowerCase().includes(searchTerm));
          
          if (!matchesSearch) return false;
        }
      }

      // Assigned to filter
      if (filters.assigned_to) {
        if (filters.assigned_to === '__unassigned__') {
          if (task.assigned_to && task.assigned_to.trim()) return false;
        } else {
          if (task.assigned_to !== filters.assigned_to) return false;
        }
      }

      // Type filter
      if (filters.type && task.type !== filters.type) {
        return false;
      }

      return true;
    });
  }, [tasks, filters]);

  const userTasks = filteredTasks.filter(task => task.type === 'user');
  const systemTasks = filteredTasks.filter(task => task.type === 'system');

  return (
    <div className={`task-manager ${className}`}>
      {/* Header with statistics */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Task Manager</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Task
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{statistics.active}</div>
            <div className="text-sm text-gray-600">Active Tasks</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{statistics.todaysTasks}</div>
            <div className="text-sm text-gray-600">Today's Tasks</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-purple-600">{statistics.userTasks}</div>
            <div className="text-sm text-gray-600">User Tasks</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-orange-600">{statistics.systemTasks}</div>
            <div className="text-sm text-gray-600">System Tasks</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-red-600">{statistics.expired}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-gray-600">{statistics.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {/* Task Filters */}
      <div className="mb-6">
        <TaskFiltersComponent
          tasks={tasks}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Create Task Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Task</h3>
            <TaskForm
              onSubmit={handleCreateTask}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading tasks...</span>
        </div>
      )}

      {/* Task Lists */}
      {!loading && (
        <div className="space-y-8">
          {/* User Tasks */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              My Tasks ({userTasks.length}{hasActiveFilters ? ` of ${tasks.filter(t => t.type === 'user').length}` : ''})
            </h3>
            {userTasks.length > 0 ? (
              <TaskList
                tasks={userTasks}
                onTaskComplete={handleCompleteTask}
                onTaskClick={handleTaskClick}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No user tasks found.</p>
                <p className="text-sm mt-1">Create a new task to get started!</p>
              </div>
            )}
          </div>

          {/* System Tasks */}
          {systemTasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                System Tasks ({systemTasks.length}{hasActiveFilters ? ` of ${tasks.filter(t => t.type === 'system').length}` : ''})
              </h3>
              <TaskList
                tasks={systemTasks}
                onTaskComplete={handleCompleteTask}
                onTaskClick={handleTaskClick}
              />
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first task.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Task
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};