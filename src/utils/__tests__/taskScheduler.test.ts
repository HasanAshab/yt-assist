import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskScheduler, BrowserTaskScheduler } from '../taskScheduler';
import { SystemTaskService } from '../../services/systemTask.service';

// Mock constants
vi.mock('../../constants', () => ({
  TASK_CONFIG: {
    TASK_EXPIRY_HOUR: 0,
    FANS_FEEDBACK_DAYS: 2,
    OVERALL_FEEDBACK_DAYS: 10,
    MAX_SUGGESTIONS: 2
  },
  API_CONFIG: {
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-key'
  },
  CONTENT_FLAGS: {
    FANS_FEEDBACK_ANALYSED: 'fans_feedback_analysed',
    OVERALL_FEEDBACK_ANALYSED: 'overall_feedback_analysed'
  }
}));

// Mock SystemTaskService
vi.mock('../../services/systemTask.service');
const mockSystemTaskService = vi.mocked(SystemTaskService);

// Mock DOM APIs
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('TaskScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    TaskScheduler.stop(); // Ensure clean state
  });

  afterEach(() => {
    vi.useRealTimers();
    TaskScheduler.stop();
  });

  describe('start', () => {
    it('should start the scheduler and calculate time until midnight', () => {
      const now = new Date('2024-01-15T14:30:00Z');
      vi.setSystemTime(now);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      TaskScheduler.start();

      expect(TaskScheduler.isSchedulerRunning()).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Starting task scheduler...');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Task scheduler will run in')
      );

      consoleSpy.mockRestore();
    });

    it('should not start if already running', () => {
      TaskScheduler.start();
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      TaskScheduler.start(); // Try to start again

      expect(consoleSpy).toHaveBeenCalledWith('Task scheduler is already running');
      
      consoleSpy.mockRestore();
    });

    it('should run daily tasks at midnight', async () => {
      const now = new Date('2024-01-15T23:59:00Z'); // 1 minute before midnight
      vi.setSystemTime(now);

      mockSystemTaskService.scheduleDailyTaskRunner.mockResolvedValue();

      TaskScheduler.start();

      // Fast forward to midnight
      vi.advanceTimersByTime(60 * 1000); // 1 minute

      await vi.runAllTimersAsync();

      expect(mockSystemTaskService.scheduleDailyTaskRunner).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should stop the scheduler', () => {
      TaskScheduler.start();
      expect(TaskScheduler.isSchedulerRunning()).toBe(true);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      TaskScheduler.stop();

      expect(TaskScheduler.isSchedulerRunning()).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Task scheduler stopped');

      consoleSpy.mockRestore();
    });
  });

  describe('runDailyTasks', () => {
    it('should run daily tasks and log completion', async () => {
      mockSystemTaskService.scheduleDailyTaskRunner.mockResolvedValue();
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await TaskScheduler.runDailyTasks();

      expect(mockSystemTaskService.scheduleDailyTaskRunner).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Running daily automated tasks...');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Daily tasks completed in')
      );

      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Task failed');
      mockSystemTaskService.scheduleDailyTaskRunner.mockRejectedValue(error);
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await TaskScheduler.runDailyTasks();

      expect(consoleSpy).toHaveBeenCalledWith('Error running daily tasks:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('getStatus', () => {
    it('should return correct status when running', () => {
      TaskScheduler.start();

      const status = TaskScheduler.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.nextRunTime).toBeInstanceOf(Date);
    });

    it('should return correct status when not running', () => {
      const status = TaskScheduler.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.nextRunTime).toBeNull();
    });
  });

  describe('initialize', () => {
    it('should start scheduler and set up event listeners', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const windowAddEventListenerSpy = vi.spyOn(window, 'addEventListener');

      TaskScheduler.initialize();

      expect(TaskScheduler.isSchedulerRunning()).toBe(true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(windowAddEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

      addEventListenerSpy.mockRestore();
      windowAddEventListenerSpy.mockRestore();
    });
  });
});

describe('BrowserTaskScheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    BrowserTaskScheduler.stop(); // Ensure clean state
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
    BrowserTaskScheduler.stop();
  });

  describe('start', () => {
    it('should start the browser scheduler', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      BrowserTaskScheduler.start();

      expect(consoleSpy).toHaveBeenCalledWith('Starting browser-based task scheduler...');

      consoleSpy.mockRestore();
    });

    it('should not start if already running', () => {
      BrowserTaskScheduler.start();
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      BrowserTaskScheduler.start(); // Try to start again

      expect(consoleSpy).toHaveBeenCalledWith('Browser task scheduler is already running');
      
      consoleSpy.mockRestore();
    });

    it('should check for daily tasks every hour', async () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      mockSystemTaskService.scheduleDailyTaskRunner.mockResolvedValue();
      mockLocalStorage.getItem.mockReturnValue('2024-01-14'); // Different day

      BrowserTaskScheduler.start();

      // Fast forward 1 hour
      vi.advanceTimersByTime(60 * 60 * 1000);

      await vi.runAllTimersAsync();

      expect(mockSystemTaskService.scheduleDailyTaskRunner).toHaveBeenCalled();
    });
  });

  describe('checkAndRunDailyTasks', () => {
    it('should run tasks if not checked today', async () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      mockSystemTaskService.scheduleDailyTaskRunner.mockResolvedValue();
      mockLocalStorage.getItem.mockReturnValue('2024-01-14'); // Different day

      BrowserTaskScheduler.start();

      await vi.runAllTimersAsync();

      expect(mockSystemTaskService.scheduleDailyTaskRunner).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'yt_assist_last_task_check',
        'Mon Jan 15 2024'
      );
    });

    it('should not run tasks if already checked today', async () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      mockLocalStorage.getItem.mockReturnValue('Mon Jan 15 2024'); // Same day

      BrowserTaskScheduler.start();

      await vi.runAllTimersAsync();

      expect(mockSystemTaskService.scheduleDailyTaskRunner).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const error = new Error('Task failed');
      mockSystemTaskService.scheduleDailyTaskRunner.mockRejectedValue(error);
      mockLocalStorage.getItem.mockReturnValue('2024-01-14');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      BrowserTaskScheduler.start();

      await vi.runAllTimersAsync();

      expect(consoleSpy).toHaveBeenCalledWith('Error in browser task scheduler:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('forceRunDailyTasks', () => {
    it('should force run daily tasks and update last check date', async () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      mockSystemTaskService.scheduleDailyTaskRunner.mockResolvedValue();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await BrowserTaskScheduler.forceRunDailyTasks();

      expect(mockSystemTaskService.scheduleDailyTaskRunner).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'yt_assist_last_task_check',
        'Mon Jan 15 2024'
      );
      expect(consoleSpy).toHaveBeenCalledWith('Force running daily tasks...');

      consoleSpy.mockRestore();
    });

    it('should handle errors and rethrow', async () => {
      const error = new Error('Task failed');
      mockSystemTaskService.scheduleDailyTaskRunner.mockRejectedValue(error);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(BrowserTaskScheduler.forceRunDailyTasks()).rejects.toThrow('Task failed');

      expect(consoleSpy).toHaveBeenCalledWith('Error force running daily tasks:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('initialize', () => {
    it('should start scheduler and set up event listeners', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const windowAddEventListenerSpy = vi.spyOn(window, 'addEventListener');

      BrowserTaskScheduler.initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(windowAddEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

      addEventListenerSpy.mockRestore();
      windowAddEventListenerSpy.mockRestore();
    });
  });
});