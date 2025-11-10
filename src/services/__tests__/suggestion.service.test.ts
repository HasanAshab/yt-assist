import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SuggestionService } from '../suggestion.service';
import { ContentService } from '../content.service';
import { CONTENT_STAGES, TASK_CONFIG } from '@/constants';
import type { Content, ContentSuggestion } from '@/types';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
  handleSupabaseError: vi.fn(),
}));

// Mock ContentService
vi.mock('../content.service');

const mockContentService = vi.mocked(ContentService);

describe('SuggestionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockContent = (overrides: Partial<Content> = {}): Content => ({
    id: 'test-id',
    topic: 'test-topic',
    category: 'Demanding',
    current_stage: 0,
    title: undefined,
    script: undefined,
    final_checks: [
      { id: 'check1', description: 'Check 1', completed: false },
      { id: 'check2', description: 'Check 2', completed: false }
    ],
    publish_after: undefined,
    publish_before: undefined,
    link: undefined,
    morals: [],
    flags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  });

  describe('getPublicationSuggestions', () => {
    it('should return top 2 suggestions for publishable contents', async () => {
      const mockContents: Content[] = [
        createMockContent({ 
          id: '1', 
          topic: 'content-1', 
          current_stage: 10, 
          title: 'Title 1', 
          script: 'Script 1' 
        }),
        createMockContent({ 
          id: '2', 
          topic: 'content-2', 
          current_stage: 9, 
          title: 'Title 2', 
          script: 'Script 2' 
        }),
        createMockContent({ 
          id: '3', 
          topic: 'content-3', 
          current_stage: 8, 
          title: 'Title 3', 
          script: 'Script 3' 
        }),
        createMockContent({ 
          id: '4', 
          topic: 'content-4', 
          current_stage: 11 // Published - should be excluded
        })
      ];

      mockContentService.getContents.mockResolvedValue(mockContents);
      mockContentService.getContentByTopic.mockResolvedValue(null); // No dependencies

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(TASK_CONFIG.MAX_SUGGESTIONS);
      expect(suggestions[0].content.current_stage).toBe(10); // Highest stage first
      expect(suggestions[1].content.current_stage).toBe(9);
    });

    it('should exclude contents blocked by dependencies', async () => {
      const mockContents: Content[] = [
        createMockContent({ 
          id: '1', 
          topic: 'content-1', 
          current_stage: 10,
          publish_after: 'dependency-content'
        }),
        createMockContent({ 
          id: '2', 
          topic: 'content-2', 
          current_stage: 9 
        })
      ];

      const dependencyContent = createMockContent({
        topic: 'dependency-content',
        current_stage: 5 // Not published yet
      });

      mockContentService.getContents.mockResolvedValue(mockContents);
      mockContentService.getContentByTopic
        .mockResolvedValueOnce(dependencyContent) // For content-1 dependency check
        .mockResolvedValueOnce(null); // For content-2 (no dependency)

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].content.topic).toBe('content-2');
    });

    it('should handle empty content list', async () => {
      mockContentService.getContents.mockResolvedValue([]);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(0);
    });

    it('should handle service errors gracefully', async () => {
      mockContentService.getContents.mockRejectedValue(new Error('Database error'));

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('calculateReadinessScore', () => {
    it('should calculate higher scores for more advanced stages', async () => {
      const content1 = createMockContent({ current_stage: 5 });
      const content2 = createMockContent({ current_stage: 10 });

      mockContentService.getContents.mockResolvedValue([content1, content2]);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions[0].score).toBeGreaterThan(suggestions[1].score);
    });

    it('should give bonus points for completed fields', async () => {
      const contentWithFields = createMockContent({
        current_stage: 5,
        title: 'Test Title',
        script: 'Test Script',
        link: 'https://example.com'
      });

      const contentWithoutFields = createMockContent({
        current_stage: 5
      });

      mockContentService.getContents.mockResolvedValue([contentWithFields, contentWithoutFields]);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      const withFieldsScore = suggestions.find(s => s.content.title)?.score || 0;
      const withoutFieldsScore = suggestions.find(s => !s.content.title)?.score || 0;

      expect(withFieldsScore).toBeGreaterThan(withoutFieldsScore);
    });

    it('should give bonus points for completed final checks', async () => {
      const contentWithCompletedChecks = createMockContent({
        current_stage: 5,
        final_checks: [
          { id: 'check1', description: 'Check 1', completed: true },
          { id: 'check2', description: 'Check 2', completed: true }
        ]
      });

      const contentWithIncompleteChecks = createMockContent({
        current_stage: 5,
        final_checks: [
          { id: 'check1', description: 'Check 1', completed: false },
          { id: 'check2', description: 'Check 2', completed: false }
        ]
      });

      mockContentService.getContents.mockResolvedValue([
        contentWithCompletedChecks, 
        contentWithIncompleteChecks
      ]);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      const completedScore = suggestions.find(s => 
        s.content.final_checks.every(c => c.completed)
      )?.score || 0;
      const incompleteScore = suggestions.find(s => 
        s.content.final_checks.some(c => !c.completed)
      )?.score || 0;

      expect(completedScore).toBeGreaterThan(incompleteScore);
    });

    it('should apply penalties for missing required fields', async () => {
      const contentMissingTitle = createMockContent({
        current_stage: 2, // Title required at stage 1+
        title: undefined
      });

      const contentMissingScript = createMockContent({
        current_stage: 6, // Script required at stage 5+
        script: undefined
      });

      mockContentService.getContents.mockResolvedValue([
        contentMissingTitle,
        contentMissingScript
      ]);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      // Both should have penalties applied
      suggestions.forEach(suggestion => {
        expect(suggestion.score).toBeLessThan(100); // Base score would be higher without penalties
      });
    });
  });

  describe('calculateRemainingSteps', () => {
    it('should calculate correct remaining steps to publication', async () => {
      const content = createMockContent({ current_stage: 8 });
      const publishedStage = CONTENT_STAGES.length - 1; // 11
      const expectedSteps = publishedStage - 8; // 3

      mockContentService.getContents.mockResolvedValue([content]);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions[0].remainingSteps).toBe(expectedSteps);
    });

    it('should add fractional steps for missing required fields', async () => {
      const content = createMockContent({
        current_stage: 6,
        title: undefined, // Missing title
        script: undefined, // Missing script
        link: undefined // Missing link
      });

      mockContentService.getContents.mockResolvedValue([content]);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      const baseSteps = (CONTENT_STAGES.length - 1) - 6; // 5
      const additionalSteps = 0.5 + 0.5 + 0.5; // For missing title, script, link
      const expectedSteps = baseSteps + additionalSteps;

      expect(suggestions[0].remainingSteps).toBe(expectedSteps);
    });

    it('should add steps for incomplete final checks', async () => {
      const content = createMockContent({
        current_stage: 10,
        final_checks: [
          { id: 'check1', description: 'Check 1', completed: false },
          { id: 'check2', description: 'Check 2', completed: false },
          { id: 'check3', description: 'Check 3', completed: true }
        ]
      });

      mockContentService.getContents.mockResolvedValue([content]);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      const baseSteps = (CONTENT_STAGES.length - 1) - 10; // 1
      const checkSteps = 2 * 0.1; // 2 incomplete checks
      const expectedSteps = Math.round((baseSteps + checkSteps) * 10) / 10;

      expect(suggestions[0].remainingSteps).toBe(expectedSteps);
    });
  });

  describe('checkDependencyBlocks', () => {
    it('should identify missing dependencies', async () => {
      const content = createMockContent({
        publish_after: 'missing-content'
      });

      mockContentService.getContents.mockResolvedValue([content]);
      mockContentService.getContentByTopic.mockResolvedValue(null); // Dependency not found

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(0); // Should be excluded due to missing dependency
    });

    it('should identify unpublished dependencies', async () => {
      const content = createMockContent({
        publish_after: 'unpublished-content'
      });

      const unpublishedDependency = createMockContent({
        topic: 'unpublished-content',
        current_stage: 5 // Not published
      });

      mockContentService.getContents.mockResolvedValue([content]);
      mockContentService.getContentByTopic.mockResolvedValue(unpublishedDependency);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(0); // Should be excluded due to unpublished dependency
    });

    it('should allow contents with published dependencies', async () => {
      const content = createMockContent({
        publish_after: 'published-content',
        current_stage: 10
      });

      const publishedDependency = createMockContent({
        topic: 'published-content',
        current_stage: 11 // Published
      });

      mockContentService.getContents.mockResolvedValue([content]);
      mockContentService.getContentByTopic.mockResolvedValue(publishedDependency);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].blockedBy).toHaveLength(0);
    });
  });

  describe('getContentSuggestion', () => {
    it('should return suggestion for specific content', async () => {
      const content = createMockContent({
        topic: 'specific-content',
        current_stage: 8
      });

      mockContentService.getContentByTopic.mockResolvedValue(content);

      const suggestion = await SuggestionService.getContentSuggestion('specific-content');

      expect(suggestion).not.toBeNull();
      expect(suggestion?.content.topic).toBe('specific-content');
      expect(suggestion?.score).toBeGreaterThan(0);
    });

    it('should return null for non-existent content', async () => {
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestion = await SuggestionService.getContentSuggestion('non-existent');

      expect(suggestion).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockContentService.getContentByTopic.mockRejectedValue(new Error('Database error'));

      const suggestion = await SuggestionService.getContentSuggestion('error-content');

      expect(suggestion).toBeNull();
    });
  });

  describe('isContentReadyForNextStage', () => {
    it('should return true for content ready to advance', async () => {
      const content = createMockContent({
        current_stage: 5,
        title: 'Test Title',
        script: 'Test Script'
      });

      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: true,
        errors: []
      });

      const isReady = await SuggestionService.isContentReadyForNextStage(content);

      expect(isReady).toBe(true);
    });

    it('should return false for published content', async () => {
      const content = createMockContent({
        current_stage: 11 // Published
      });

      const isReady = await SuggestionService.isContentReadyForNextStage(content);

      expect(isReady).toBe(false);
    });

    it('should return false for content with validation errors', async () => {
      const content = createMockContent({
        current_stage: 5
      });

      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: false,
        errors: ['Missing required field']
      });

      const isReady = await SuggestionService.isContentReadyForNextStage(content);

      expect(isReady).toBe(false);
    });

    it('should check dependencies for content advancing to Published stage', async () => {
      const content = createMockContent({
        current_stage: 10, // One step before Published
        title: 'Test Title',
        script: 'Test Script',
        link: 'https://example.com',
        final_checks: [
          { id: 'check1', description: 'Check 1', completed: true }
        ]
      });

      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockContentService.validatePublishDependencies.mockResolvedValue({
        isValid: true,
        errors: []
      });

      const isReady = await SuggestionService.isContentReadyForNextStage(content);

      expect(isReady).toBe(true);
      expect(mockContentService.validatePublishDependencies).toHaveBeenCalledWith(content);
    });
  });

  describe('getSuggestionStatistics', () => {
    it('should calculate correct statistics', async () => {
      const mockContents: Content[] = [
        createMockContent({ current_stage: 8 }), // Eligible
        createMockContent({ current_stage: 9 }), // Eligible
        createMockContent({ current_stage: 11 }), // Published - not eligible
        createMockContent({ 
          current_stage: 10, 
          publish_after: 'dependency' 
        }) // Eligible but potentially blocked
      ];

      const dependencyContent = createMockContent({
        topic: 'dependency',
        current_stage: 5 // Not published - blocks dependent content
      });

      mockContentService.getContents.mockResolvedValue(mockContents);
      mockContentService.getContentByTopic
        .mockResolvedValueOnce(null) // content 1 - no dependency
        .mockResolvedValueOnce(null) // content 2 - no dependency  
        .mockResolvedValueOnce(dependencyContent); // content 4 - blocked by dependency

      const stats = await SuggestionService.getSuggestionStatistics();

      expect(stats.totalEligible).toBe(3); // Excludes published content
      expect(stats.readyToAdvance).toBe(2); // Contents without blocking dependencies
      expect(stats.blockedByDependencies).toBe(1); // Content blocked by unpublished dependency
      expect(stats.averageReadinessScore).toBeGreaterThan(0);
      expect(stats.topSuggestions).toBe(2); // Max suggestions returned
    });

    it('should handle empty content list', async () => {
      mockContentService.getContents.mockResolvedValue([]);

      const stats = await SuggestionService.getSuggestionStatistics();

      expect(stats.totalEligible).toBe(0);
      expect(stats.readyToAdvance).toBe(0);
      expect(stats.blockedByDependencies).toBe(0);
      expect(stats.averageReadinessScore).toBe(0);
      expect(stats.topSuggestions).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      mockContentService.getContents.mockRejectedValue(new Error('Database error'));

      const stats = await SuggestionService.getSuggestionStatistics();

      expect(stats.totalEligible).toBe(0);
      expect(stats.readyToAdvance).toBe(0);
      expect(stats.blockedByDependencies).toBe(0);
      expect(stats.averageReadinessScore).toBe(0);
      expect(stats.topSuggestions).toBe(0);
    });
  });

  describe('refreshSuggestions', () => {
    it('should return fresh suggestions', async () => {
      const mockContents: Content[] = [
        createMockContent({ current_stage: 10 })
      ];

      mockContentService.getContents.mockResolvedValue(mockContents);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.refreshSuggestions();

      expect(suggestions).toHaveLength(1);
      expect(mockContentService.getContents).toHaveBeenCalled();
    });
  });
});