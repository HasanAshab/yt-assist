import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskService } from '../task.service';
import { DatabaseService } from '../database.service';
import { Task, TaskFormData } from '../../types';

// Mock environment variables
vi.mock('../../constants', () => ({
  API_CONFIG: {
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {},
  handleSupabaseError: vi.fn(),
  getEndOfDay: vi.fn((date = new Date()) => {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay.toISOString();
  })
}));

// Mock DatabaseService
vi.mock('../database.service');
const mockDatabaseService = vi.mocked(DatabaseService);

// Mock window object for redirection tests
const mockWindow = {
  location: { href: '' },
  open: vi.fn()
};
Object.defineProperty(window, 'location', {
  value: mockWindow.location,
  writable: true
});
Object.defineProperty(window, 'open', {
  value: mockWindow.open,
  writable: true
});

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  link: 'https://example.com',
  type: 'user',
  created_at: '2023-01-01T10:00:00Z',
  expires_at: '2023-01-01T23:59:59Z'
};

const mockExpiredTask: Task = {
  ...mockTask,
  id: '2',
  expires_at: '2023-01-01T09:00:00Z' // Expired
};

const mockSystemTask: Task = {
  ...mockTask,
  id: '3',
  type: 'system',
  title: 'System Generated Task'
};

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current time to be 2023-01-01T12:00:00Z
    vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getActiveTasks', () => {
    it('should return only non-expired tasks', async () => {
      mockDatabaseService.getTasks.mockResolvedValue([mockTask, mockExpiredTask]);

      const result = await TaskService.getActiveTasks();

      expect(result).toEqual([mockTask]);
      expect(mockDatabaseService.getTasks).toHaveBeenCalledOnce();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database error');
      mockDatabaseService.getTasks.mockRejectedValue(error);

      await expect(TaskService.getActiveTasks()).rejects.toThrow('Database error');
    });
  });

  describe('getAllTasks', () => {
    it('should return all tasks including expired ones', async () => {
      const allTasks = [mockTask, mockExpiredTask, mockSystemTask];
      mockDatabaseService.getTasks.mockResolvedValue(allTasks);

      const result = await TaskService.getAllTasks();

      expect(result).toEqual(allTasks);
      expect(mockDatabaseService.getTasks).toHaveBeenCalledOnce();
    });
  });

  describe('getTasksByType', () => {
    it('should return only user tasks', async () => {
      mockDatabaseService.getTasks.mockResolvedValue([mockTask, mockSystemTask]);

      const result = await TaskService.getTasksByType('user');

      expect(result).toEqual([mockTask]);
    });

    it('should return only system tasks', async () => {
      mockDatabaseService.getTasks.mockResolvedValue([mockTask, mockSystemTask]);

      const result = await TaskService.getTasksByType('system');

      expect(result).toEqual([mockSystemTask]);
    });
  });

  describe('getTodaysRemainingTasks', () => {
    it('should return tasks created today that are not expired', async () => {
      const todayTask = {
        ...mockTask,
        created_at: '2023-01-01T08:00:00Z', // Today
        expires_at: '2023-01-01T23:59:59Z'   // Not expired
      };
      const yesterdayTask = {
        ...mockTask,
        id: '4',
        created_at: '2022-12-31T10:00:00Z', // Yesterday
        expires_at: '2023-01-01T23:59:59Z'
      };

      mockDatabaseService.getTasks.mockResolvedValue([todayTask, yesterdayTask]);

      const result = await TaskService.getTodaysRemainingTasks();

      expect(result).toEqual([todayTask]);
    });
  });

  describe('createTask', () => {
    const taskData: TaskFormData = {
      title: 'New Task',
      description: 'New Description',
      link: 'https://example.com'
    };

    it('should create a user task with correct expiration', async () => {
      const createdTask = { ...mockTask, ...taskData };
      mockDatabaseService.createTask.mockResolvedValue(createdTask);

      const result = await TaskService.createTask(taskData, 'user');

      expect(mockDatabaseService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          description: 'New Description',
          link: 'https://example.com',
          type: 'user',
          expires_at: expect.stringMatching(/2023-01-01T\d{2}:59:59\.999Z/)
        })
      );
      expect(result).toEqual(createdTask);
    });

    it('should create a system task when type is specified', async () => {
      const createdTask = { ...mockTask, ...taskData, type: 'system' };
      mockDatabaseService.createTask.mockResolvedValue(createdTask);

      await TaskService.createTask(taskData, 'system');

      expect(mockDatabaseService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'system' })
      );
    });

    it('should trim whitespace from task data', async () => {
      const taskDataWithSpaces: TaskFormData = {
        title: '  Spaced Task  ',
        description: '  Spaced Description  ',
        link: '  https://example.com  '
      };

      mockDatabaseService.createTask.mockResolvedValue(mockTask);

      await TaskService.createTask(taskDataWithSpaces);

      expect(mockDatabaseService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Spaced Task',
          description: 'Spaced Description',
          link: 'https://example.com'
        })
      );
    });

    it('should handle null description and link', async () => {
      const minimalTaskData: TaskFormData = {
        title: 'Minimal Task'
      };

      mockDatabaseService.createTask.mockResolvedValue(mockTask);

      await TaskService.createTask(minimalTaskData);

      expect(mockDatabaseService.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          link: null
        })
      );
    });
  });

  describe('completeTask', () => {
    it('should call DatabaseService.completeTask', async () => {
      mockDatabaseService.completeTask.mockResolvedValue();

      await TaskService.completeTask('task-id');

      expect(mockDatabaseService.completeTask).toHaveBeenCalledWith('task-id');
    });

    it('should handle completion errors', async () => {
      const error = new Error('Completion failed');
      mockDatabaseService.completeTask.mockRejectedValue(error);

      await expect(TaskService.completeTask('task-id')).rejects.toThrow('Completion failed');
    });
  });

  describe('handleTaskRedirection', () => {
    beforeEach(() => {
      mockWindow.location.href = '';
      mockWindow.open.mockClear();
    });

    it('should redirect to internal path in same window', () => {
      const taskWithInternalLink = { ...mockTask, link: '/internal-path' };

      TaskService.handleTaskRedirection(taskWithInternalLink);

      expect(mockWindow.location.href).toBe('/internal-path');
      expect(mockWindow.open).not.toHaveBeenCalled();
    });

    it('should open external URL in new tab', () => {
      const taskWithExternalLink = { ...mockTask, link: 'https://external.com' };

      TaskService.handleTaskRedirection(taskWithExternalLink);

      expect(mockWindow.open).toHaveBeenCalledWith(
        'https://external.com',
        '_blank',
        'noopener,noreferrer'
      );
      expect(mockWindow.location.href).toBe('');
    });

    it('should do nothing if task has no link', () => {
      const taskWithoutLink = { ...mockTask, link: undefined };

      TaskService.handleTaskRedirection(taskWithoutLink);

      expect(mockWindow.location.href).toBe('');
      expect(mockWindow.open).not.toHaveBeenCalled();
    });

    it('should fallback to current window if window.open fails', () => {
      const taskWithExternalLink = { ...mockTask, link: 'https://external.com' };
      mockWindow.open.mockImplementation(() => {
        throw new Error('Popup blocked');
      });

      TaskService.handleTaskRedirection(taskWithExternalLink);

      expect(mockWindow.location.href).toBe('https://external.com');
    });
  });

  describe('cleanupExpiredTasks', () => {
    it('should delete expired tasks and return count', async () => {
      const tasks = [mockTask, mockExpiredTask, mockSystemTask];
      mockDatabaseService.getTasks.mockResolvedValue(tasks);
      mockDatabaseService.completeTask.mockResolvedValue();

      const result = await TaskService.cleanupExpiredTasks();

      expect(result).toBe(1); // Only mockExpiredTask should be deleted
      expect(mockDatabaseService.completeTask).toHaveBeenCalledWith('2');
      expect(mockDatabaseService.completeTask).toHaveBeenCalledTimes(1);
    });

    it('should handle cleanup errors', async () => {
      const error = new Error('Cleanup failed');
      mockDatabaseService.getTasks.mockRejectedValue(error);

      await expect(TaskService.cleanupExpiredTasks()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('isTaskExpired', () => {
    it('should return true for expired task', () => {
      const result = TaskService.isTaskExpired(mockExpiredTask);
      expect(result).toBe(true);
    });

    it('should return false for active task', () => {
      const result = TaskService.isTaskExpired(mockTask);
      expect(result).toBe(false);
    });
  });

  describe('getTimeUntilExpiration', () => {
    it('should return correct time for active task', () => {
      // Current time: 2023-01-01T12:00:00Z
      // Expires at: 2023-01-01T23:59:59Z
      // Difference: ~12 hours
      const result = TaskService.getTimeUntilExpiration(mockTask);

      expect(result.isExpired).toBe(false);
      expect(result.hours).toBe(11);
      expect(result.minutes).toBe(59);
    });

    it('should return expired status for expired task', () => {
      const result = TaskService.getTimeUntilExpiration(mockExpiredTask);

      expect(result.isExpired).toBe(true);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
    });
  });

  describe('validateTaskData', () => {
    it('should validate correct task data', () => {
      const validData: TaskFormData = {
        title: 'Valid Task',
        description: 'Valid description',
        link: 'https://example.com'
      };

      const result = TaskService.validateTaskData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject empty title', () => {
      const invalidData: TaskFormData = {
        title: '',
        description: 'Valid description'
      };

      const result = TaskService.validateTaskData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task title is required');
    });

    it('should reject title that is too long', () => {
      const invalidData: TaskFormData = {
        title: 'a'.repeat(201),
        description: 'Valid description'
      };

      const result = TaskService.validateTaskData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task title must be less than 200 characters');
    });

    it('should reject description that is too long', () => {
      const invalidData: TaskFormData = {
        title: 'Valid title',
        description: 'a'.repeat(1001)
      };

      const result = TaskService.validateTaskData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Task description must be less than 1000 characters');
    });

    it('should reject invalid URL format', () => {
      const invalidData: TaskFormData = {
        title: 'Valid title',
        link: 'invalid-url'
      };

      const result = TaskService.validateTaskData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    it('should accept relative URLs', () => {
      const validData: TaskFormData = {
        title: 'Valid title',
        link: '/internal-path'
      };

      const result = TaskService.validateTaskData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept empty optional fields', () => {
      const validData: TaskFormData = {
        title: 'Valid title'
      };

      const result = TaskService.validateTaskData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('getTaskStatistics', () => {
    it('should return correct statistics', async () => {
      const allTasks = [mockTask, mockExpiredTask, mockSystemTask];
      mockDatabaseService.getTasks.mockResolvedValue(allTasks);

      const result = await TaskService.getTaskStatistics();

      expect(result).toEqual({
        total: 3,
        active: 2, // mockTask and mockSystemTask are active
        expired: 1, // mockExpiredTask is expired
        userTasks: 1, // mockTask is user type
        systemTasks: 1, // mockSystemTask is system type
        todaysTasks: 2 // mockTask and mockSystemTask were created today
      });
    });

    it('should handle statistics errors gracefully', async () => {
      mockDatabaseService.getTasks.mockRejectedValue(new Error('Stats error'));

      const result = await TaskService.getTaskStatistics();

      expect(result).toEqual({
        total: 0,
        active: 0,
        expired: 0,
        userTasks: 0,
        systemTasks: 0,
        todaysTasks: 0
      });
    });
  });
});