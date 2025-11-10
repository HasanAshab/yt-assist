import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SystemTaskManager } from '../SystemTaskManager';
import { useSystemTasks, useSystemTaskStats } from '../../../hooks/useSystemTasks';
import type { Task, Content } from '../../../types';

// Mock the hooks
vi.mock('../../../hooks/useSystemTasks');

const mockUseSystemTasks = vi.mocked(useSystemTasks);
const mockUseSystemTaskStats = vi.mocked(useSystemTaskStats);

describe('SystemTaskManager', () => {
  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    title: 'Analyse Fans Feedback on Test Content',
    description: 'Test Description',
    type: 'system',
    link: '/content/edit/content-1',
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

  const defaultSystemTasksReturn = {
    pendingFeedbackTasks: {
      fansFeedbackTasks: [],
      overallFeedbackTasks: []
    },
    contentNeedingAnalysis: {
      needsFansFeedback: [],
      needsOverallFeedback: []
    },
    loading: false,
    lastCheckTime: new Date('2024-01-01T12:00:00Z'),
    runDailyChecks: vi.fn(),
    handleFeedbackTaskCompletion: vi.fn(),
    markFansFeedbackAnalyzed: vi.fn(),
    markOverallFeedbackAnalyzed: vi.fn(),
    refreshPendingTasks: vi.fn(),
    startScheduler: vi.fn(),
    stopScheduler: vi.fn(),
    getSchedulerStatus: vi.fn(() => ({
      isRunning: true,
      nextRunTime: new Date('2024-01-02T00:00:00Z')
    })),
    forceRunDailyTasks: vi.fn()
  };

  const defaultStatsReturn = {
    totalPendingFeedbackTasks: 0,
    fansFeedbackTasksCount: 0,
    overallFeedbackTasksCount: 0,
    contentNeedingFansAnalysis: 0,
    contentNeedingOverallAnalysis: 0,
    loading: false,
    refreshStats: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSystemTasks.mockReturnValue(defaultSystemTasksReturn);
    mockUseSystemTaskStats.mockReturnValue(defaultStatsReturn);
  });

  it('should render system task manager with default state', () => {
    render(<SystemTaskManager />);

    expect(screen.getByText('System Task Manager')).toBeInTheDocument();
    expect(screen.getByText('Scheduler Status')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('All caught up!')).toBeInTheDocument();
  });

  it('should display statistics correctly', () => {
    mockUseSystemTaskStats.mockReturnValue({
      ...defaultStatsReturn,
      totalPendingFeedbackTasks: 5,
      fansFeedbackTasksCount: 3,
      overallFeedbackTasksCount: 2,
      contentNeedingFansAnalysis: 4,
      contentNeedingOverallAnalysis: 1
    });

    render(<SystemTaskManager />);

    expect(screen.getByText('5')).toBeInTheDocument(); // Total pending
    expect(screen.getByText('3')).toBeInTheDocument(); // Fans feedback
    expect(screen.getByText('2')).toBeInTheDocument(); // Overall feedback
    expect(screen.getByText('4')).toBeInTheDocument(); // Need fans analysis
    expect(screen.getByText('1')).toBeInTheDocument(); // Need overall analysis
  });

  it('should display fans feedback tasks', () => {
    const fansFeedbackTask = createMockTask({
      title: 'Analyse Fans Feedback on Content A'
    });

    mockUseSystemTasks.mockReturnValue({
      ...defaultSystemTasksReturn,
      pendingFeedbackTasks: {
        fansFeedbackTasks: [fansFeedbackTask],
        overallFeedbackTasks: []
      }
    });

    render(<SystemTaskManager />);

    expect(screen.getByText('Fans Feedback Tasks (1)')).toBeInTheDocument();
    expect(screen.getByText('Analyse Fans Feedback on Content A')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should display overall feedback tasks', () => {
    const overallFeedbackTask = createMockTask({
      title: 'Analyse Overall Feedback on Content B'
    });

    mockUseSystemTasks.mockReturnValue({
      ...defaultSystemTasksReturn,
      pendingFeedbackTasks: {
        fansFeedbackTasks: [],
        overallFeedbackTasks: [overallFeedbackTask]
      }
    });

    render(<SystemTaskManager />);

    expect(screen.getByText('Overall Feedback Tasks (1)')).toBeInTheDocument();
    expect(screen.getByText('Analyse Overall Feedback on Content B')).toBeInTheDocument();
  });

  it('should display content needing analysis', () => {
    const contentNeedingFans = createMockContent({
      topic: 'Content A'
    });
    const contentNeedingOverall = createMockContent({
      topic: 'Content B'
    });

    mockUseSystemTasks.mockReturnValue({
      ...defaultSystemTasksReturn,
      contentNeedingAnalysis: {
        needsFansFeedback: [contentNeedingFans],
        needsOverallFeedback: [contentNeedingOverall]
      }
    });

    render(<SystemTaskManager />);

    expect(screen.getByText('Content Needing Analysis')).toBeInTheDocument();
    expect(screen.getByText('Needs Fans Feedback Analysis (1)')).toBeInTheDocument();
    expect(screen.getByText('Needs Overall Feedback Analysis (1)')).toBeInTheDocument();
    expect(screen.getByText('Content A')).toBeInTheDocument();
    expect(screen.getByText('Content B')).toBeInTheDocument();
  });

  it('should handle refresh button click', async () => {
    const mockRefreshPendingTasks = vi.fn();
    mockUseSystemTasks.mockReturnValue({
      ...defaultSystemTasksReturn,
      refreshPendingTasks: mockRefreshPendingTasks
    });

    render(<SystemTaskManager />);

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    expect(mockRefreshPendingTasks).toHaveBeenCalled();
  });

  it('should handle run daily checks button click', async () => {
    const mockRunDailyChecks = vi.fn();
    mockUseSystemTasks.mockReturnValue({
      ...defaultSystemTasksReturn,
      runDailyChecks: mockRunDailyChecks
    });

    render(<SystemTaskManager />);

    const runButton = screen.getByText('Run Daily Checks');
    fireEvent.click(runButton);

    expect(mockRunDailyChecks).toHaveBeenCalled();
  });

  it('should handle force run button click', async () => {
    const mockForceRunDailyTasks = vi.fn();
    mockUseSystemTasks.mockReturnValue({
      ...defaultSystemTasksReturn,
      forceRunDailyTasks: mockForceRunDailyTasks
    });

    render(<SystemTaskManager />);

    const forceRunButton = screen.getByText('Force Run');
    fireEvent.click(forceRunButton);

    expect(mockForceRunDailyTasks).toHaveBeenCalled();
  });

  it('should handle task analyze button click', async () => {
    const mockHandleFeedbackTaskCompletion = vi.fn();
    const fansFeedbackTask = createMockTask({
      id: 'task-1',
      title: 'Analyse Fans Feedback on Content A',
      link: '/content/edit/content-1'
    });

    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: '' } as any;

    mockUseSystemTasks.mockReturnValue({
      ...defaultSystemTasksReturn,
      pendingFeedbackTasks: {
        fansFeedbackTasks: [fansFeedbackTask],
        overallFeedbackTasks: []
      },
      handleFeedbackTaskCompletion: mockHandleFeedbackTaskCompletion
    });

    render(<SystemTaskManager />);

    const analyzeButton = screen.getByText('Analyze');
    fireEvent.click(analyzeButton);

    expect(window.location.href).toBe('/content/edit/content-1');
    expect(mockHandleFeedbackTaskCompletion).toHaveBeenCalledWith('task-1');
  });

  it('should show loading state', () => {
    mockUseSystemTasks.mockReturnValue({
      ...defaultSystemTasksReturn,
      loading: true
    });

    render(<SystemTaskManager />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Run Daily Checks' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Force Run' })).toBeDisabled();
  });

  it('should show scheduler stopped state', () => {
    mockUseSystemTasks.mockReturnValue({
      ...defaultSystemTasksReturn,
      getSchedulerStatus: vi.fn(() => ({
        isRunning: false,
        nextRunTime: null
      }))
    });

    render(<SystemTaskManager />);

    expect(screen.getByText('Stopped')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<SystemTaskManager className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});