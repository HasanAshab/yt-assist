import { describe, it, expect, vi, beforeEach } from 'vitest';

// Set up environment variables before importing anything
vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

// Mock all external dependencies
vi.mock('../task.service', () => ({
  TaskService: {
    createTask: vi.fn(),
    getTasksByType: vi.fn(),
    getAllTasks: vi.fn(),
    completeTask: vi.fn(),
    cleanupExpiredTasks: vi.fn()
  }
}));

vi.mock('../content.service', () => ({
  ContentService: {
    getPublishedContents: vi.fn(),
    getContentById: vi.fn(),
    getContentByTopic: vi.fn(),
    addContentFlag: vi.fn()
  }
}));

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }))
    }))
  },
  handleSupabaseError: vi.fn(),
  getEndOfDay: vi.fn(() => new Date())
}));

import { SystemTaskService } from '../systemTask.service';
import { TaskService } from '../task.service';
import { ContentService } from '../content.service';
import type { Content, Task } from '../../types';

const mockTaskService = vi.mocked(TaskService);
const mockContentService = vi.mocked(ContentService);

describe('SystemTaskService Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContent = (overrides: Partial<Content> = {}): Content => ({
    id: 'content-1',
    topic: 'Test Content',
    category: 'Demanding',
    current_stage: 11, // Published
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

  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    type: 'system',
    created_at: '2024-01-01T00:00:00Z',
    expires_at: '2024-01-01T23:59:59Z',
    ...overrides
  });

  it('should create fans feedback task for eligible content', async () => {
    // Mock current time to be 3 days after content publication
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-04T12:00:00Z'));

    const publishedContent = createMockContent({
      updated_at: '2024-01-01T00:00:00Z', // 3 days ago
      flags: [] // No feedback analyzed yet
    });

    const expectedTask = createMockTask({
      title: 'Analyse Fans Feedback on Test Content'
    });

    mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);
    mockTaskService.getTasksByType.mockResolvedValue([]); // No existing tasks
    mockTaskService.createTask.mockResolvedValue(expectedTask);

    const result = await SystemTaskService.checkAndCreateFansFeedbackTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Analyse Fans Feedback on Test Content');
    expect(mockTaskService.createTask).toHaveBeenCalledWith({
      title: 'Analyse Fans Feedback on Test Content',
      description: expect.stringContaining('Review and analyze fan feedback'),
      link: '/content/edit/content-1'
    }, 'system');

    vi.useRealTimers();
  });

  it('should create overall feedback task for eligible content', async () => {
    // Mock current time to be 11 days after content publication
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-12T12:00:00Z'));

    const publishedContent = createMockContent({
      updated_at: '2024-01-01T00:00:00Z', // 11 days ago
      flags: [] // No feedback analyzed yet
    });

    const expectedTask = createMockTask({
      title: 'Analyse Overall Feedback on Test Content'
    });

    mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);
    mockTaskService.getTasksByType.mockResolvedValue([]); // No existing tasks
    mockTaskService.createTask.mockResolvedValue(expectedTask);

    const result = await SystemTaskService.checkAndCreateOverallFeedbackTasks();

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Analyse Overall Feedback on Test Content');
    expect(mockTaskService.createTask).toHaveBeenCalledWith({
      title: 'Analyse Overall Feedback on Test Content',
      description: expect.stringContaining('Conduct comprehensive analysis'),
      link: '/content/edit/content-1'
    }, 'system');

    vi.useRealTimers();
  });

  it('should not create duplicate tasks', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-04T12:00:00Z'));

    const publishedContent = createMockContent({
      updated_at: '2024-01-01T00:00:00Z',
      flags: []
    });

    const existingTask = createMockTask({
      title: 'Analyse Fans Feedback on Test Content'
    });

    mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);
    mockTaskService.getTasksByType.mockResolvedValue([existingTask]); // Task already exists

    const result = await SystemTaskService.checkAndCreateFansFeedbackTasks();

    expect(result).toHaveLength(0);
    expect(mockTaskService.createTask).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should run daily checks and return summary', async () => {
    const fansFeedbackTask = createMockTask({
      title: 'Analyse Fans Feedback on Content A'
    });
    const overallFeedbackTask = createMockTask({
      title: 'Analyse Overall Feedback on Content B'
    });

    vi.spyOn(SystemTaskService, 'checkAndCreateFansFeedbackTasks')
      .mockResolvedValue([fansFeedbackTask]);
    vi.spyOn(SystemTaskService, 'checkAndCreateOverallFeedbackTasks')
      .mockResolvedValue([overallFeedbackTask]);

    const result = await SystemTaskService.runDailyChecks();

    expect(result).toEqual({
      fansFeedbackTasks: [fansFeedbackTask],
      overallFeedbackTasks: [overallFeedbackTask],
      totalCreated: 2
    });
  });

  it('should handle task completion and mark content flags', async () => {
    const task = createMockTask({
      title: 'Analyse Fans Feedback on Test Content'
    });
    const content = createMockContent();

    mockTaskService.getAllTasks.mockResolvedValue([task]);
    mockContentService.getContentByTopic.mockResolvedValue(content);
    mockContentService.addContentFlag.mockResolvedValue(content);
    mockTaskService.completeTask.mockResolvedValue();

    await SystemTaskService.handleFeedbackTaskCompletion('task-1');

    expect(mockContentService.getContentByTopic).toHaveBeenCalledWith('Test Content');
    expect(mockContentService.addContentFlag).toHaveBeenCalledWith(
      'content-1',
      'fans_feedback_analysed'
    );
    expect(mockTaskService.completeTask).toHaveBeenCalledWith('task-1');
  });
});