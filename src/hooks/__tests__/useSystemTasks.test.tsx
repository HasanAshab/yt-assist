import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSystemTasks, useSystemTaskStats } from '../useSystemTasks';
import { SystemTaskService } from '../../services/systemTask.service';
import { BrowserTaskScheduler } from '../../utils/taskScheduler';
import type { Task, Content } from '../../types';

// Mock constants
vi.mock('../../constants', () => ({
  TASK_CONFIG: {
    FANS_FEEDBACK_DAYS: 2,
    OVERALL_FEEDBACK_DAYS: 10,
    TASK_EXPIRY_HOUR: 0,
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

// Mock the services and utilities
vi.mock('../../services/systemTask.service');
vi.mock('../../utils/taskScheduler');
vi.mock('../useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: vi.fn()
  })
}));

const mockSystemTaskService = vi.mocked(SystemTaskService);
const mockBrowserTaskScheduler = vi.mocked(BrowserTaskScheduler);

describe('useSystemTasks', () => {
  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    type: 'system',
    created_at: '2024-01-01T00:00:00Z',
    expires_at: '2024-01-01T23:59:59Z',
    ...overrides
  });

  const createMockContent = (overrides: Partial<Content> = {}): Content => ({
    id: 'content-1',
    topic: 'Test Content',
    category: 'Demanding',
    current_stage: 11,
    title: 'Test Title',
    script: 'Test Script',
    final_checks: [],
    link: 'https://example.com',
    morals: [],
    flags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSystemTasks());

    expect(result.current.pendingFeedbackTasks).toEqual({
      fansFeedbackTasks: [],
      overallFeedbackTasks: []
    });
    expect(result.current.contentNeedingAnalysis).toEqual({
      needsFansFeedback: [],
      needsOverallFeedback: []
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.lastCheckTime).toBeNull();
  });

  it('should load pending tasks on mount', async () => {
    const mockPendingTasks = {
      fansFeedbackTasks: [createMockTask({ title: 'Analyse Fans Feedback on Content A' })],
      overallFeedbackTasks: [createMockTask({ title: 'Analyse Overall Feedback on Content B' })]
    };

    const mockContentNeeding = {
      needsFansFeedback: [createMockContent({ topic: 'Content A' })],
      needsOverallFeedback: [createMockContent({ topic: 'Content B' })]
    };

    mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue(mockPendingTasks);
    mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue(mockContentNeeding);

    const { result } = renderHook(() => useSystemTasks());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pendingFeedbackTasks).toEqual(mockPendingTasks);
    expect(result.current.contentNeedingAnalysis).toEqual(mockContentNeeding);
    expect(result.current.lastCheckTime).toBeInstanceOf(Date);
  });

  it('should initialize browser scheduler on mount', () => {
    renderHook(() => useSystemTasks());

    expect(mockBrowserTaskScheduler.initialize).toHaveBeenCalled();
  });

  it('should cleanup scheduler on unmount', () => {
    const { unmount } = renderHook(() => useSystemTasks());

    unmount();

    expect(mockBrowserTaskScheduler.stop).toHaveBeenCalled();
  });

  describe('runDailyChecks', () => {
    it('should run daily checks and refresh pending tasks', async () => {
      const mockResult = {
        fansFeedbackTasks: [createMockTask()],
        overallFeedbackTasks: [createMockTask()],
        totalCreated: 2
      };

      mockSystemTaskService.runDailyChecks.mockResolvedValue(mockResult);
      mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue({
        fansFeedbackTasks: [],
        overallFeedbackTasks: []
      });
      mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue({
        needsFansFeedback: [],
        needsOverallFeedback: []
      });

      const { result } = renderHook(() => useSystemTasks());

      await act(async () => {
        await result.current.runDailyChecks();
      });

      expect(mockSystemTaskService.runDailyChecks).toHaveBeenCalled();
      expect(mockSystemTaskService.getPendingFeedbackTasks).toHaveBeenCalled();
      expect(mockSystemTaskService.getContentNeedingFeedbackAnalysis).toHaveBeenCalled();
    });
  });

  describe('handleFeedbackTaskCompletion', () => {
    it('should handle task completion and refresh pending tasks', async () => {
      mockSystemTaskService.handleFeedbackTaskCompletion.mockResolvedValue();
      mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue({
        fansFeedbackTasks: [],
        overallFeedbackTasks: []
      });
      mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue({
        needsFansFeedback: [],
        needsOverallFeedback: []
      });

      const { result } = renderHook(() => useSystemTasks());

      await act(async () => {
        await result.current.handleFeedbackTaskCompletion('task-1');
      });

      expect(mockSystemTaskService.handleFeedbackTaskCompletion).toHaveBeenCalledWith('task-1');
    });
  });

  describe('markFansFeedbackAnalyzed', () => {
    it('should mark fans feedback as analyzed and refresh tasks', async () => {
      mockSystemTaskService.markFansFeedbackAnalyzed.mockResolvedValue(createMockContent());
      mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue({
        fansFeedbackTasks: [],
        overallFeedbackTasks: []
      });
      mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue({
        needsFansFeedback: [],
        needsOverallFeedback: []
      });

      const { result } = renderHook(() => useSystemTasks());

      await act(async () => {
        await result.current.markFansFeedbackAnalyzed('content-1');
      });

      expect(mockSystemTaskService.markFansFeedbackAnalyzed).toHaveBeenCalledWith('content-1');
    });
  });

  describe('markOverallFeedbackAnalyzed', () => {
    it('should mark overall feedback as analyzed and refresh tasks', async () => {
      mockSystemTaskService.markOverallFeedbackAnalyzed.mockResolvedValue(createMockContent());
      mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue({
        fansFeedbackTasks: [],
        overallFeedbackTasks: []
      });
      mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue({
        needsFansFeedback: [],
        needsOverallFeedback: []
      });

      const { result } = renderHook(() => useSystemTasks());

      await act(async () => {
        await result.current.markOverallFeedbackAnalyzed('content-1');
      });

      expect(mockSystemTaskService.markOverallFeedbackAnalyzed).toHaveBeenCalledWith('content-1');
    });
  });

  describe('scheduler controls', () => {
    it('should start scheduler', () => {
      const { result } = renderHook(() => useSystemTasks());

      act(() => {
        result.current.startScheduler();
      });

      expect(mockBrowserTaskScheduler.start).toHaveBeenCalled();
    });

    it('should stop scheduler', () => {
      const { result } = renderHook(() => useSystemTasks());

      act(() => {
        result.current.stopScheduler();
      });

      expect(mockBrowserTaskScheduler.stop).toHaveBeenCalled();
    });

    it('should force run daily tasks', async () => {
      mockBrowserTaskScheduler.forceRunDailyTasks.mockResolvedValue();
      mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue({
        fansFeedbackTasks: [],
        overallFeedbackTasks: []
      });
      mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue({
        needsFansFeedback: [],
        needsOverallFeedback: []
      });

      const { result } = renderHook(() => useSystemTasks());

      await act(async () => {
        await result.current.forceRunDailyTasks();
      });

      expect(mockBrowserTaskScheduler.forceRunDailyTasks).toHaveBeenCalled();
    });
  });

  it('should refresh pending tasks periodically', async () => {
    mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue({
      fansFeedbackTasks: [],
      overallFeedbackTasks: []
    });
    mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue({
      needsFansFeedback: [],
      needsOverallFeedback: []
    });

    renderHook(() => useSystemTasks());

    // Fast forward 5 minutes
    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    await waitFor(() => {
      expect(mockSystemTaskService.getPendingFeedbackTasks).toHaveBeenCalledTimes(2); // Initial + periodic
    });
  });
});

describe('useSystemTaskStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default stats', () => {
    const { result } = renderHook(() => useSystemTaskStats());

    expect(result.current.totalPendingFeedbackTasks).toBe(0);
    expect(result.current.fansFeedbackTasksCount).toBe(0);
    expect(result.current.overallFeedbackTasksCount).toBe(0);
    expect(result.current.contentNeedingFansAnalysis).toBe(0);
    expect(result.current.contentNeedingOverallAnalysis).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it('should load and calculate stats on mount', async () => {
    const mockPendingTasks = {
      fansFeedbackTasks: [
        { id: '1', title: 'Task 1' },
        { id: '2', title: 'Task 2' }
      ] as Task[],
      overallFeedbackTasks: [
        { id: '3', title: 'Task 3' }
      ] as Task[]
    };

    const mockContentNeeding = {
      needsFansFeedback: [
        { id: '1', topic: 'Content 1' },
        { id: '2', topic: 'Content 2' }
      ] as Content[],
      needsOverallFeedback: [
        { id: '3', topic: 'Content 3' }
      ] as Content[]
    };

    mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue(mockPendingTasks);
    mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue(mockContentNeeding);

    const { result } = renderHook(() => useSystemTaskStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalPendingFeedbackTasks).toBe(3);
    expect(result.current.fansFeedbackTasksCount).toBe(2);
    expect(result.current.overallFeedbackTasksCount).toBe(1);
    expect(result.current.contentNeedingFansAnalysis).toBe(2);
    expect(result.current.contentNeedingOverallAnalysis).toBe(1);
  });

  it('should refresh stats periodically', async () => {
    mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue({
      fansFeedbackTasks: [],
      overallFeedbackTasks: []
    });
    mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue({
      needsFansFeedback: [],
      needsOverallFeedback: []
    });

    renderHook(() => useSystemTaskStats());

    // Fast forward 10 minutes
    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    await waitFor(() => {
      expect(mockSystemTaskService.getPendingFeedbackTasks).toHaveBeenCalledTimes(2); // Initial + periodic
    });
  });

  it('should refresh stats manually', async () => {
    mockSystemTaskService.getPendingFeedbackTasks.mockResolvedValue({
      fansFeedbackTasks: [],
      overallFeedbackTasks: []
    });
    mockSystemTaskService.getContentNeedingFeedbackAnalysis.mockResolvedValue({
      needsFansFeedback: [],
      needsOverallFeedback: []
    });

    const { result } = renderHook(() => useSystemTaskStats());

    await act(async () => {
      await result.current.refreshStats();
    });

    expect(mockSystemTaskService.getPendingFeedbackTasks).toHaveBeenCalledTimes(2); // Initial + manual
  });
});