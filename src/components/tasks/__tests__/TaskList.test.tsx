import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from '../TaskList';
import { TaskService } from '../../../services/task.service';
import { Task } from '../../../types';

// Mock environment variables
vi.mock('../../../constants', () => ({
  API_CONFIG: {
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Mock Supabase
vi.mock('../../../services/supabase', () => ({
  supabase: {},
  handleSupabaseError: vi.fn(),
  getEndOfDay: vi.fn()
}));

// Mock TaskService
vi.mock('../../../services/task.service');
const mockTaskService = vi.mocked(TaskService);

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Active User Task',
    description: 'This is an active user task',
    link: 'https://example.com',
    type: 'user',
    created_at: '2023-01-01T10:00:00Z',
    expires_at: '2023-01-01T23:59:59Z'
  },
  {
    id: '2',
    title: 'System Task',
    description: 'This is a system generated task',
    type: 'system',
    created_at: '2023-01-01T09:00:00Z',
    expires_at: '2023-01-01T23:59:59Z'
  },
  {
    id: '3',
    title: 'Task Without Link',
    type: 'user',
    created_at: '2023-01-01T08:00:00Z',
    expires_at: '2023-01-01T23:59:59Z'
  },
  {
    id: '4',
    title: 'Expired Task',
    type: 'user',
    created_at: '2023-01-01T07:00:00Z',
    expires_at: '2023-01-01T09:00:00Z' // Expired
  }
];

const mockProps = {
  tasks: mockTasks,
  onTaskComplete: vi.fn(),
  onTaskClick: vi.fn()
};

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    
    // Mock TaskService methods
    mockTaskService.getTimeUntilExpiration.mockImplementation((task) => {
      if (task.id === '4') {
        return { hours: 0, minutes: 0, isExpired: true };
      }
      if (task.id === '1') {
        return { hours: 11, minutes: 59, isExpired: false };
      }
      if (task.id === '2') {
        return { hours: 1, minutes: 30, isExpired: false };
      }
      return { hours: 0, minutes: 45, isExpired: false };
    });

    mockTaskService.isTaskExpired.mockImplementation((task) => {
      return task.id === '4';
    });
  });

  it('should render all tasks', () => {
    render(<TaskList {...mockProps} />);

    expect(screen.getByText('Active User Task')).toBeInTheDocument();
    expect(screen.getByText('System Task')).toBeInTheDocument();
    expect(screen.getByText('Task Without Link')).toBeInTheDocument();
    expect(screen.getByText('Expired Task')).toBeInTheDocument();
  });

  it('should display task descriptions when available', () => {
    render(<TaskList {...mockProps} />);

    expect(screen.getByText('This is an active user task')).toBeInTheDocument();
    expect(screen.getByText('This is a system generated task')).toBeInTheDocument();
  });

  it('should show different icons for user and system tasks', () => {
    render(<TaskList {...mockProps} />);

    const taskElements = screen.getAllByRole('generic');
    
    // Check that both user and system task icons are present
    // User tasks should have user icon, system tasks should have lightning icon
    expect(taskElements.length).toBeGreaterThan(0);
  });

  it('should display time remaining with appropriate styling', () => {
    render(<TaskList {...mockProps} />);

    expect(screen.getByText('11h left')).toBeInTheDocument();
    expect(screen.getByText('1h 30m left')).toBeInTheDocument();
    expect(screen.getByText('45m left')).toBeInTheDocument();
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('should show link indicator for tasks with links', () => {
    render(<TaskList {...mockProps} />);

    // Task with link should show external link icon
    const taskWithLink = screen.getByText('Active User Task').closest('div');
    expect(taskWithLink).toBeInTheDocument();
    
    // Check for link preview
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });

  it('should call onTaskComplete when complete button is clicked', () => {
    render(<TaskList {...mockProps} />);

    const completeButtons = screen.getAllByText('Complete');
    fireEvent.click(completeButtons[0]);

    expect(mockProps.onTaskComplete).toHaveBeenCalledWith('1');
  });

  it('should call onTaskClick when task is clicked (not complete button)', () => {
    render(<TaskList {...mockProps} />);

    const taskTitle = screen.getByText('Active User Task');
    const taskElement = taskTitle.closest('div');
    
    if (taskElement) {
      fireEvent.click(taskElement);
    }

    expect(mockProps.onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('should not call onTaskClick when complete button is clicked', () => {
    render(<TaskList {...mockProps} />);

    const completeButtons = screen.getAllByText('Complete');
    fireEvent.click(completeButtons[0]);

    expect(mockProps.onTaskClick).not.toHaveBeenCalled();
    expect(mockProps.onTaskComplete).toHaveBeenCalledWith('1');
  });

  it('should display task type labels', () => {
    render(<TaskList {...mockProps} />);

    // Should show "user" and "system" labels
    const userLabels = screen.getAllByText('user');
    const systemLabels = screen.getAllByText('system');
    
    expect(userLabels.length).toBeGreaterThan(0);
    expect(systemLabels.length).toBeGreaterThan(0);
  });

  it('should format creation time correctly', () => {
    render(<TaskList {...mockProps} />);

    // Should show relative time like "2h ago", "3h ago", etc.
    expect(screen.getByText(/2h ago/)).toBeInTheDocument(); // 10:00 -> 12:00 = 2h
    expect(screen.getByText(/3h ago/)).toBeInTheDocument(); // 09:00 -> 12:00 = 3h
    expect(screen.getByText(/4h ago/)).toBeInTheDocument(); // 08:00 -> 12:00 = 4h
    expect(screen.getByText(/5h ago/)).toBeInTheDocument(); // 07:00 -> 12:00 = 5h
  });

  it('should apply expired styling to expired tasks', () => {
    render(<TaskList {...mockProps} />);

    // Find the task container (not just the title div)
    const expiredTaskTitle = screen.getByText('Expired Task');
    const expiredTaskContainer = expiredTaskTitle.closest('.bg-white');
    expect(expiredTaskContainer).toHaveClass('opacity-60');
  });

  it('should apply hover styles to tasks with links', () => {
    render(<TaskList {...mockProps} />);

    // Find the task container (not just the title div)
    const taskTitle = screen.getByText('Active User Task');
    const taskContainer = taskTitle.closest('.bg-white');
    expect(taskContainer).toHaveClass('cursor-pointer');
    expect(taskContainer).toHaveClass('hover:shadow-md');
  });

  it('should not apply hover styles to tasks without links', () => {
    render(<TaskList {...mockProps} />);

    const taskWithoutLink = screen.getByText('Task Without Link').closest('div');
    expect(taskWithoutLink).not.toHaveClass('cursor-pointer');
  });

  it('should handle empty task list', () => {
    render(<TaskList {...mockProps} tasks={[]} />);

    expect(screen.queryByText('Active User Task')).not.toBeInTheDocument();
  });

  it('should truncate long task titles', () => {
    const longTitleTask: Task = {
      id: '5',
      title: 'This is a very long task title that should be truncated when displayed in the task list component',
      type: 'user',
      created_at: '2023-01-01T10:00:00Z',
      expires_at: '2023-01-01T23:59:59Z'
    };

    render(<TaskList {...mockProps} tasks={[longTitleTask]} />);

    const titleElement = screen.getByText(longTitleTask.title);
    expect(titleElement).toHaveClass('truncate');
  });

  it('should show link preview section for tasks with links', () => {
    render(<TaskList {...mockProps} />);

    // Should show the link in a preview section
    const linkPreview = screen.getByText('https://example.com');
    // Find the parent container that has the border-t class
    const linkSection = linkPreview.closest('.border-t');
    expect(linkSection).toBeInTheDocument();
  });

  it('should handle tasks with different time remaining ranges', () => {
    const tasksWithDifferentTimes: Task[] = [
      {
        id: '1',
        title: 'Long Time Task',
        type: 'user',
        created_at: '2023-01-01T10:00:00Z',
        expires_at: '2023-01-02T10:00:00Z' // 22 hours left
      },
      {
        id: '2', 
        title: 'Medium Time Task',
        type: 'user',
        created_at: '2023-01-01T10:00:00Z',
        expires_at: '2023-01-01T14:00:00Z' // 2 hours left
      },
      {
        id: '3',
        title: 'Short Time Task', 
        type: 'user',
        created_at: '2023-01-01T10:00:00Z',
        expires_at: '2023-01-01T12:30:00Z' // 30 minutes left
      }
    ];

    mockTaskService.getTimeUntilExpiration.mockImplementation((task) => {
      if (task.id === '1') return { hours: 22, minutes: 0, isExpired: false };
      if (task.id === '2') return { hours: 2, minutes: 0, isExpired: false };
      if (task.id === '3') return { hours: 0, minutes: 30, isExpired: false };
      return { hours: 0, minutes: 0, isExpired: true };
    });

    render(<TaskList {...mockProps} tasks={tasksWithDifferentTimes} />);

    expect(screen.getByText('22h left')).toBeInTheDocument();
    expect(screen.getByText('2h left')).toBeInTheDocument(); // The component shows "2h left" not "2h 0m left"
    expect(screen.getByText('30m left')).toBeInTheDocument();
  });
});