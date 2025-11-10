import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskManager } from '../TaskManager';
import { TaskService } from '../../../services/task.service';
import { useTasks } from '../../../hooks/useTasks';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { Task } from '../../../types';

// Mock environment variables
vi.mock('../../../constants', () => ({
  API_CONFIG: {
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-key'
  },
  DEFAULT_FINAL_CHECKS: [
    'Content reviewed for accuracy',
    'SEO optimization completed',
    'Thumbnail approved'
  ],
  CONTENT_STAGES: [
    'Pending', 'Title', 'Thumbnail', 'ToC', 'Ordered', 'Scripted',
    'Recorded', 'Voice Edited', 'Edited', 'Revised', 'SEO Optimised', 'Published'
  ]
}));

// Mock Supabase
vi.mock('../../../services/supabase', () => ({
  supabase: {},
  handleSupabaseError: vi.fn(),
  getEndOfDay: vi.fn()
}));

// Mock dependencies
vi.mock('../../../services/task.service');
vi.mock('../../../hooks/useTasks');
vi.mock('../../../hooks/useErrorHandler');

const mockTaskService = vi.mocked(TaskService);
const mockUseTasks = vi.mocked(useTasks);
const mockUseErrorHandler = vi.mocked(useErrorHandler);

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'User Task 1',
    description: 'User task description',
    type: 'user',
    created_at: '2023-01-01T10:00:00Z',
    expires_at: '2023-01-01T23:59:59Z'
  },
  {
    id: '2',
    title: 'System Task 1',
    description: 'System task description',
    type: 'system',
    created_at: '2023-01-01T11:00:00Z',
    expires_at: '2023-01-01T23:59:59Z'
  }
];

const mockTasksHook = {
  tasks: mockTasks,
  loading: false,
  setTasks: vi.fn(),
  addTask: vi.fn(),
  deleteTask: vi.fn(),
  setLoading: vi.fn(),
  userTasks: mockTasks.filter(t => t.type === 'user'),
  systemTasks: mockTasks.filter(t => t.type === 'system'),
  activeTasks: mockTasks,
  expiredTasks: [],
  todaysTasks: mockTasks,
  remainingTasksCount: mockTasks.length
};

const mockErrorHandler = {
  handleError: vi.fn()
};

describe('TaskManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTasks.mockReturnValue(mockTasksHook);
    mockUseErrorHandler.mockReturnValue(mockErrorHandler);
    
    // Mock TaskService methods
    mockTaskService.getActiveTasks.mockResolvedValue(mockTasks);
    mockTaskService.getTaskStatistics.mockResolvedValue({
      total: 2,
      active: 2,
      expired: 0,
      userTasks: 1,
      systemTasks: 1,
      todaysTasks: 2
    });
    mockTaskService.createTask.mockResolvedValue(mockTasks[0]);
    mockTaskService.completeTask.mockResolvedValue();
    mockTaskService.cleanupExpiredTasks.mockResolvedValue(0);
    mockTaskService.validateTaskData.mockReturnValue({ isValid: true, errors: [] });
    mockTaskService.handleTaskRedirection.mockImplementation(() => {});
    
    // Mock TaskService methods used by TaskList component
    mockTaskService.getTimeUntilExpiration.mockImplementation((task) => ({
      hours: 2,
      minutes: 30,
      isExpired: false
    }));
    mockTaskService.isTaskExpired.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should render task manager with statistics', async () => {
    render(<TaskManager />);

    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    expect(screen.getByText('Create Task')).toBeInTheDocument();
    
    // Wait for statistics to load
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Active tasks
      expect(screen.getByText('Active Tasks')).toBeInTheDocument();
    });
  });

  it('should load tasks on mount', async () => {
    render(<TaskManager />);

    await waitFor(() => {
      expect(mockTaskService.getActiveTasks).toHaveBeenCalled();
      expect(mockTaskService.getTaskStatistics).toHaveBeenCalled();
      expect(mockTasksHook.setTasks).toHaveBeenCalledWith(mockTasks);
    });
  });

  it('should show loading state', () => {
    mockUseTasks.mockReturnValue({
      ...mockTasksHook,
      loading: true
    });

    render(<TaskManager />);

    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('should display user and system tasks separately', async () => {
    render(<TaskManager />);

    await waitFor(() => {
      expect(screen.getByText('My Tasks (1)')).toBeInTheDocument();
      expect(screen.getByText('System Tasks (1)')).toBeInTheDocument();
      expect(screen.getByText('User Task 1')).toBeInTheDocument();
      expect(screen.getByText('System Task 1')).toBeInTheDocument();
    });
  });

  it('should open create task form when button is clicked', async () => {
    render(<TaskManager />);

    const createButton = screen.getByText('Create Task');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });
  });

  it('should handle task creation', async () => {
    render(<TaskManager />);

    // Open create form
    fireEvent.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    // Fill form
    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    // Submit form
    const submitButtons = screen.getAllByText('Create Task');
    const formSubmitButton = submitButtons.find(button => button.type === 'submit');
    fireEvent.click(formSubmitButton!);

    await waitFor(() => {
      expect(mockTaskService.validateTaskData).toHaveBeenCalled();
      expect(mockTaskService.createTask).toHaveBeenCalled();
      expect(mockTasksHook.addTask).toHaveBeenCalled();
    });
  });

  it('should handle task completion', async () => {
    render(<TaskManager />);

    await waitFor(() => {
      expect(screen.getByText('User Task 1')).toBeInTheDocument();
    });

    const completeButtons = screen.getAllByText('Complete');
    fireEvent.click(completeButtons[0]);

    await waitFor(() => {
      expect(mockTaskService.completeTask).toHaveBeenCalledWith('1');
      expect(mockTasksHook.deleteTask).toHaveBeenCalledWith('1');
    });
  });

  it('should handle task click for redirection', async () => {
    const taskWithLink = {
      ...mockTasks[0],
      link: 'https://example.com'
    };

    mockUseTasks.mockReturnValue({
      ...mockTasksHook,
      tasks: [taskWithLink]
    });

    render(<TaskManager />);

    await waitFor(() => {
      expect(screen.getByText('User Task 1')).toBeInTheDocument();
    });

    // Click on task (not the complete button)
    const taskElement = screen.getByText('User Task 1').closest('.task-list > div');
    if (taskElement) {
      fireEvent.click(taskElement);
    }

    expect(mockTaskService.handleTaskRedirection).toHaveBeenCalledWith(taskWithLink);
  });

  it('should show empty state when no tasks exist', () => {
    mockUseTasks.mockReturnValue({
      ...mockTasksHook,
      tasks: [],
      userTasks: [],
      systemTasks: []
    });

    render(<TaskManager />);

    expect(screen.getByText('No tasks found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first task.')).toBeInTheDocument();
  });

  it('should show empty state for user tasks only', async () => {
    mockUseTasks.mockReturnValue({
      ...mockTasksHook,
      tasks: mockTasks.filter(t => t.type === 'system'),
      userTasks: [],
      systemTasks: mockTasks.filter(t => t.type === 'system')
    });

    render(<TaskManager />);

    await waitFor(() => {
      expect(screen.getByText('My Tasks (0)')).toBeInTheDocument();
      expect(screen.getByText('No user tasks found.')).toBeInTheDocument();
      expect(screen.getByText('Create a new task to get started!')).toBeInTheDocument();
    });
  });

  it('should handle errors during task loading', async () => {
    const error = new Error('Failed to load tasks');
    mockTaskService.getActiveTasks.mockRejectedValue(error);

    render(<TaskManager />);

    await waitFor(() => {
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        'Failed to load tasks'
      );
    });
  });

  it('should handle errors during task creation', async () => {
    const error = new Error('Failed to create task');
    mockTaskService.createTask.mockRejectedValue(error);

    render(<TaskManager />);

    // Open create form
    fireEvent.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    // Fill and submit form
    const titleInput = screen.getByLabelText(/Task Title/);
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    const submitButtons = screen.getAllByText('Create Task');
    const formSubmitButton = submitButtons.find(button => button.type === 'submit');
    fireEvent.click(formSubmitButton!);

    await waitFor(() => {
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        'Failed to create task'
      );
    });
  });

  it('should handle validation errors during task creation', async () => {
    mockTaskService.validateTaskData.mockReturnValue({
      isValid: false,
      errors: ['Task title is required']
    });

    render(<TaskManager />);

    // Open create form
    fireEvent.click(screen.getByText('Create Task'));

    await waitFor(() => {
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    // Submit form without filling title
    const submitButtons = screen.getAllByText('Create Task');
    const formSubmitButton = submitButtons.find(button => button.type === 'submit');
    fireEvent.click(formSubmitButton!);

    await waitFor(() => {
      expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'Failed to create task'
      );
    });
  });

  it('should set up automatic cleanup intervals', () => {
    vi.useFakeTimers();
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    render(<TaskManager />);

    // Should set up minute interval for cleanup checks
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60000);
    
    // Should set up timeout for midnight cleanup
    expect(setTimeoutSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should cleanup intervals on unmount', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = render(<TaskManager />);
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should display statistics correctly', async () => {
    render(<TaskManager />);

    await waitFor(() => {
      // Check all statistics are displayed
      expect(screen.getByText('Active Tasks')).toBeInTheDocument();
      expect(screen.getByText('Today\'s Tasks')).toBeInTheDocument();
      expect(screen.getByText('User Tasks')).toBeInTheDocument();
      expect(screen.getByText('System Tasks')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });
});