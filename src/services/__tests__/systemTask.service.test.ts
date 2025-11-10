import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SystemTaskService } from '../systemTask.service';
import { TaskService } from '../task.service';
import { ContentService } from '../content.service';
import { TASK_CONFIG, CONTENT_FLAGS } from '../../constants';
import type { Content, Task, ContentFlag } from '../../types';

// Mock environment variables
vi.mock('../../constants', () => ({
  TASK_CONFIG: {
    FANS_FEEDBACK_DAYS: 2,
    OVERALL_FEEDBACK_DAYS: 10,
    TASK_EXPIRY_HOUR: 0,
    MAX_SUGGESTIONS: 2
  },
  CONTENT_FLAGS: {
    FANS_FEEDBACK_ANALYSED: 'fans_feedback_analysed',
    OVERALL_FEEDBACK_ANALYSED: 'overall_feedback_analysed'
  },
  CONTENT_STAGES: [
    'Pending', 'Title', 'Thumbnail', 'ToC', 'Ordered', 'Scripted',
    'Recorded', 'Voice Edited', 'Edited', 'Revised', 'SEO Optimised', 'Published'
  ],
  API_CONFIG: {
    SUPABASE_URL: 'http://localhost:54321',
    SUPABASE_ANON_KEY: 'test-key'
  }
}));

// Mock the services
vi.mock('../task.service');
vi.mock('../content.service');
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn()
          }))
        }))
      }))
    }))
  },
  handleSupabaseError: vi.fn(),
  getEndOfDay: vi.fn(() => new Date())
}));

const mockTaskService = vi.mocked(TaskService);
const mockContentService = vi.mocked(ContentService);

describe('SystemTaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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

  describe('checkAndCreateFansFeedbackTasks', () => {
    it('should create fans feedback tasks for content published 2+ days ago without flag', async () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const publishedContent = createMockContent({
        updated_at: '2024-01-08T00:00:00Z', // 2+ days ago
        flags: []
      });

      mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);
      mockTaskService.getTasksByType.mockResolvedValue([]);
      mockTaskService.createTask.mockResolvedValue(createMockTask({
        title: 'Analyse Fans Feedback on Test Content'
      }));

      const result = await SystemTaskService.checkAndCreateFansFeedbackTasks();

      expect(result).toHaveLength(1);
      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'Analyse Fans Feedback on Test Content',
        description: expect.stringContaining('Review and analyze fan feedback'),
        link: '/content/edit/content-1'
      }, 'system');
    });

    it('should not create task if content already has fans feedback flag', async () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const publishedContent = createMockContent({
        updated_at: '2024-01-08T00:00:00Z',
        flags: [CONTENT_FLAGS.FANS_FEEDBACK_ANALYSED as ContentFlag]
      });

      mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);

      const result = await SystemTaskService.checkAndCreateFansFeedbackTasks();

      expect(result).toHaveLength(0);
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
    });

    it('should not create task if content was published less than 2 days ago', async () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const publishedContent = createMockContent({
        updated_at: '2024-01-09T00:00:00Z', // 1 day ago
        flags: []
      });

      mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);

      const result = await SystemTaskService.checkAndCreateFansFeedbackTasks();

      expect(result).toHaveLength(0);
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
    });

    it('should not create duplicate task if one already exists', async () => {
      const now = new Date('2024-01-10T12:00:00Z');
      vi.setSystemTime(now);

      const publishedContent = createMockContent({
        updated_at: '2024-01-08T00:00:00Z',
        flags: []
      });

      const existingTask = createMockTask({
        title: 'Analyse Fans Feedback on Test Content'
      });

      mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);
      mockTaskService.getTasksByType.mockResolvedValue([existingTask]);

      const result = await SystemTaskService.checkAndCreateFansFeedbackTasks();

      expect(result).toHaveLength(0);
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
    });
  });

  describe('checkAndCreateOverallFeedbackTasks', () => {
    it('should create overall feedback tasks for content published 10+ days ago without flag', async () => {
      const now = new Date('2024-01-20T12:00:00Z');
      vi.setSystemTime(now);

      const publishedContent = createMockContent({
        updated_at: '2024-01-10T00:00:00Z', // 10+ days ago
        flags: []
      });

      mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);
      mockTaskService.getTasksByType.mockResolvedValue([]);
      mockTaskService.createTask.mockResolvedValue(createMockTask({
        title: 'Analyse Overall Feedback on Test Content'
      }));

      const result = await SystemTaskService.checkAndCreateOverallFeedbackTasks();

      expect(result).toHaveLength(1);
      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'Analyse Overall Feedback on Test Content',
        description: expect.stringContaining('Conduct comprehensive analysis'),
        link: '/content/edit/content-1'
      }, 'system');
    });

    it('should not create task if content already has overall feedback flag', async () => {
      const now = new Date('2024-01-20T12:00:00Z');
      vi.setSystemTime(now);

      const publishedContent = createMockContent({
        updated_at: '2024-01-10T00:00:00Z',
        flags: [CONTENT_FLAGS.OVERALL_FEEDBACK_ANALYSED as ContentFlag]
      });

      mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);

      const result = await SystemTaskService.checkAndCreateOverallFeedbackTasks();

      expect(result).toHaveLength(0);
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
    });

    it('should not create task if content was published less than 10 days ago', async () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const publishedContent = createMockContent({
        updated_at: '2024-01-10T00:00:00Z', // 5 days ago
        flags: []
      });

      mockContentService.getPublishedContents.mockResolvedValue([publishedContent]);

      const result = await SystemTaskService.checkAndCreateOverallFeedbackTasks();

      expect(result).toHaveLength(0);
      expect(mockTaskService.createTask).not.toHaveBeenCalled();
    });
  });

  describe('createFansFeedbackTask', () => {
    it('should create a fans feedback task with correct data', async () => {
      const content = createMockContent();
      const expectedTask = createMockTask({
        title: 'Analyse Fans Feedback on Test Content'
      });

      mockTaskService.createTask.mockResolvedValue(expectedTask);

      const result = await SystemTaskService.createFansFeedbackTask(content);

      expect(result).toEqual(expectedTask);
      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'Analyse Fans Feedback on Test Content',
        description: expect.stringContaining('Review and analyze fan feedback'),
        link: '/content/edit/content-1'
      }, 'system');
    });
  });

  describe('createOverallFeedbackTask', () => {
    it('should create an overall feedback task with correct data', async () => {
      const content = createMockContent();
      const expectedTask = createMockTask({
        title: 'Analyse Overall Feedback on Test Content'
      });

      mockTaskService.createTask.mockResolvedValue(expectedTask);

      const result = await SystemTaskService.createOverallFeedbackTask(content);

      expect(result).toEqual(expectedTask);
      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'Analyse Overall Feedback on Test Content',
        description: expect.stringContaining('Conduct comprehensive analysis'),
        link: '/content/edit/content-1'
      }, 'system');
    });
  });

  describe('markFansFeedbackAnalyzed', () => {
    it('should add fans feedback analyzed flag to content', async () => {
      const content = createMockContent();
      const updatedContent = createMockContent({
        flags: [CONTENT_FLAGS.FANS_FEEDBACK_ANALYSED as ContentFlag]
      });

      mockContentService.addContentFlag.mockResolvedValue(updatedContent);

      const result = await SystemTaskService.markFansFeedbackAnalyzed('content-1');

      expect(result).toEqual(updatedContent);
      expect(mockContentService.addContentFlag).toHaveBeenCalledWith(
        'content-1',
        CONTENT_FLAGS.FANS_FEEDBACK_ANALYSED
      );
    });
  });

  describe('markOverallFeedbackAnalyzed', () => {
    it('should add overall feedback analyzed flag to content', async () => {
      const content = createMockContent();
      const updatedContent = createMockContent({
        flags: [CONTENT_FLAGS.OVERALL_FEEDBACK_ANALYSED as ContentFlag]
      });

      mockContentService.addContentFlag.mockResolvedValue(updatedContent);

      const result = await SystemTaskService.markOverallFeedbackAnalyzed('content-1');

      expect(result).toEqual(updatedContent);
      expect(mockContentService.addContentFlag).toHaveBeenCalledWith(
        'content-1',
        CONTENT_FLAGS.OVERALL_FEEDBACK_ANALYSED
      );
    });
  });

  describe('runDailyChecks', () => {
    it('should run both fans and overall feedback checks', async () => {
      const fansFeedbackTask = createMockTask({
        title: 'Analyse Fans Feedback on Test Content'
      });
      const overallFeedbackTask = createMockTask({
        title: 'Analyse Overall Feedback on Test Content'
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
  });

  describe('getPendingFeedbackTasks', () => {
    it('should categorize system tasks by type', async () => {
      const fansFeedbackTask = createMockTask({
        title: 'Analyse Fans Feedback on Content A'
      });
      const overallFeedbackTask = createMockTask({
        title: 'Analyse Overall Feedback on Content B'
      });
      const otherTask = createMockTask({
        title: 'Some other task'
      });

      mockTaskService.getTasksByType.mockResolvedValue([
        fansFeedbackTask,
        overallFeedbackTask,
        otherTask
      ]);

      const result = await SystemTaskService.getPendingFeedbackTasks();

      expect(result).toEqual({
        fansFeedbackTasks: [fansFeedbackTask],
        overallFeedbackTasks: [overallFeedbackTask]
      });
    });
  });

  describe('handleFeedbackTaskCompletion', () => {
    it('should mark fans feedback as analyzed and complete task', async () => {
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
        CONTENT_FLAGS.FANS_FEEDBACK_ANALYSED
      );
      expect(mockTaskService.completeTask).toHaveBeenCalledWith('task-1');
    });

    it('should mark overall feedback as analyzed and complete task', async () => {
      const task = createMockTask({
        title: 'Analyse Overall Feedback on Test Content'
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
        CONTENT_FLAGS.OVERALL_FEEDBACK_ANALYSED
      );
      expect(mockTaskService.completeTask).toHaveBeenCalledWith('task-1');
    });

    it('should handle task not found', async () => {
      mockTaskService.getAllTasks.mockResolvedValue([]);

      await expect(SystemTaskService.handleFeedbackTaskCompletion('nonexistent'))
        .rejects.toThrow('Task not found');
    });

    it('should handle content not found', async () => {
      const task = createMockTask({
        title: 'Analyse Fans Feedback on Nonexistent Content'
      });

      mockTaskService.getAllTasks.mockResolvedValue([task]);
      mockContentService.getContentByTopic.mockResolvedValue(null);
      mockTaskService.completeTask.mockResolvedValue();

      // Should not throw error, just complete the task
      await SystemTaskService.handleFeedbackTaskCompletion('task-1');

      expect(mockTaskService.completeTask).toHaveBeenCalledWith('task-1');
    });
  });

  describe('getContentNeedingFeedbackAnalysis', () => {
    it('should identify content needing feedback analysis', async () => {
      const now = new Date('2024-01-20T12:00:00Z');
      vi.setSystemTime(now);

      const needsFansContent = createMockContent({
        id: 'content-1',
        topic: 'Content 1',
        updated_at: '2024-01-18T00:00:00Z', // 2+ days ago
        flags: []
      });

      const needsOverallContent = createMockContent({
        id: 'content-2',
        topic: 'Content 2',
        updated_at: '2024-01-10T00:00:00Z', // 10+ days ago
        flags: []
      });

      const recentContent = createMockContent({
        id: 'content-3',
        topic: 'Content 3',
        updated_at: '2024-01-19T00:00:00Z', // 1 day ago
        flags: []
      });

      mockContentService.getPublishedContents.mockResolvedValue([
        needsFansContent,
        needsOverallContent,
        recentContent
      ]);

      const result = await SystemTaskService.getContentNeedingFeedbackAnalysis();

      expect(result.needsFansFeedback).toEqual([needsFansContent, needsOverallContent]);
      expect(result.needsOverallFeedback).toEqual([needsOverallContent]);
    });
  });

  describe('scheduleDailyTaskRunner', () => {
    it('should run daily checks and cleanup expired tasks', async () => {
      const dailyResult = {
        fansFeedbackTasks: [createMockTask()],
        overallFeedbackTasks: [createMockTask()],
        totalCreated: 2
      };

      vi.spyOn(SystemTaskService, 'runDailyChecks').mockResolvedValue(dailyResult);
      mockTaskService.cleanupExpiredTasks.mockResolvedValue(3);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await SystemTaskService.scheduleDailyTaskRunner();

      expect(SystemTaskService.runDailyChecks).toHaveBeenCalled();
      expect(mockTaskService.cleanupExpiredTasks).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Daily task runner completed'),
        expect.objectContaining({
          fansFeedbackTasksCreated: 1,
          overallFeedbackTasksCreated: 1,
          totalTasksCreated: 2
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith('Cleaned up 3 expired tasks');

      consoleSpy.mockRestore();
    });
  });
});