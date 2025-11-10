import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuggestionService } from '../suggestion.service';
import { ContentService } from '../content.service';
import { CONTENT_STAGES } from '@/constants';
import type { Content } from '@/types';

// Mock ContentService with simple implementations
vi.mock('../content.service', () => ({
  ContentService: {
    getContents: vi.fn(),
    getContentByTopic: vi.fn(),
    validateStageRequirements: vi.fn(),
    validatePublishDependencies: vi.fn(),
  },
}));

const mockContentService = vi.mocked(ContentService);

describe('SuggestionService Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockContent = (overrides: Partial<Content> = {}): Content => ({
    id: 'test-id',
    topic: 'test-topic',
    category: 'Demanding',
    current_stage: 0,
    title: undefined,
    script: undefined,
    final_checks: [],
    publish_after: undefined,
    publish_before: undefined,
    link: undefined,
    morals: [],
    flags: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  });

  describe('Basic Functionality', () => {
    it('should return empty suggestions when no contents exist', async () => {
      mockContentService.getContents.mockResolvedValue([]);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toEqual([]);
    });

    it('should exclude published contents from suggestions', async () => {
      const publishedContent = createMockContent({
        current_stage: CONTENT_STAGES.length - 1 // Published
      });

      mockContentService.getContents.mockResolvedValue([publishedContent]);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toEqual([]);
    });

    it('should include non-published contents in suggestions', async () => {
      const nonPublishedContent = createMockContent({
        current_stage: 5,
        title: 'Test Title',
        script: 'Test Script'
      });

      mockContentService.getContents.mockResolvedValue([nonPublishedContent]);
      mockContentService.getContentByTopic.mockResolvedValue(null); // No dependencies

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].content.topic).toBe('test-topic');
      expect(suggestions[0].score).toBeGreaterThan(0);
      expect(suggestions[0].remainingSteps).toBeGreaterThan(0);
      expect(suggestions[0].blockedBy).toEqual([]);
    });

    it('should limit suggestions to maximum of 2', async () => {
      const contents = Array.from({ length: 5 }, (_, i) => 
        createMockContent({
          id: `content-${i}`,
          topic: `content-${i}`,
          current_stage: 8 + i // Different stages for different scores
        })
      );

      mockContentService.getContents.mockResolvedValue(contents);
      mockContentService.getContentByTopic.mockResolvedValue(null); // No dependencies

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(2);
      // Should be sorted by score (higher stage = higher score)
      expect(suggestions[0].content.current_stage).toBeGreaterThanOrEqual(
        suggestions[1].content.current_stage
      );
    });

    it('should exclude contents blocked by dependencies', async () => {
      const blockedContent = createMockContent({
        topic: 'blocked-content',
        current_stage: 10,
        publish_after: 'dependency-content'
      });

      const dependencyContent = createMockContent({
        topic: 'dependency-content',
        current_stage: 5 // Not published yet
      });

      mockContentService.getContents.mockResolvedValue([blockedContent]);
      mockContentService.getContentByTopic.mockResolvedValue(dependencyContent);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toEqual([]); // Should be excluded due to unpublished dependency
    });

    it('should include contents with published dependencies', async () => {
      const readyContent = createMockContent({
        topic: 'ready-content',
        current_stage: 10,
        publish_after: 'published-dependency'
      });

      const publishedDependency = createMockContent({
        topic: 'published-dependency',
        current_stage: CONTENT_STAGES.length - 1 // Published
      });

      mockContentService.getContents.mockResolvedValue([readyContent]);
      mockContentService.getContentByTopic.mockResolvedValue(publishedDependency);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].content.topic).toBe('ready-content');
      expect(suggestions[0].blockedBy).toEqual([]);
    });
  });

  describe('Score Calculation', () => {
    it('should give higher scores to more advanced stages', async () => {
      const earlyStageContent = createMockContent({
        id: 'early',
        topic: 'early-content',
        current_stage: 2
      });

      const lateStageContent = createMockContent({
        id: 'late',
        topic: 'late-content',
        current_stage: 9
      });

      mockContentService.getContents.mockResolvedValue([earlyStageContent, lateStageContent]);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].content.topic).toBe('late-content'); // Should be first due to higher score
      expect(suggestions[0].score).toBeGreaterThan(suggestions[1].score);
    });

    it('should give bonus points for completed fields', async () => {
      const contentWithFields = createMockContent({
        id: 'with-fields',
        topic: 'content-with-fields',
        current_stage: 5,
        title: 'Test Title',
        script: 'Test Script',
        link: 'https://example.com'
      });

      const contentWithoutFields = createMockContent({
        id: 'without-fields',
        topic: 'content-without-fields',
        current_stage: 5 // Same stage but no fields
      });

      mockContentService.getContents.mockResolvedValue([contentWithFields, contentWithoutFields]);
      mockContentService.getContentByTopic.mockResolvedValue(null);

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toHaveLength(2);
      expect(suggestions[0].content.topic).toBe('content-with-fields'); // Should be first due to bonus points
      expect(suggestions[0].score).toBeGreaterThan(suggestions[1].score);
    });
  });

  describe('Statistics', () => {
    it('should calculate correct statistics', async () => {
      const contents = [
        createMockContent({ current_stage: 5 }), // Eligible
        createMockContent({ current_stage: 8 }), // Eligible
        createMockContent({ current_stage: CONTENT_STAGES.length - 1 }), // Published - not eligible
      ];

      mockContentService.getContents.mockResolvedValue(contents);
      mockContentService.getContentByTopic.mockResolvedValue(null); // No blocking dependencies

      const stats = await SuggestionService.getSuggestionStatistics();

      expect(stats.totalEligible).toBe(2); // Excludes published content
      expect(stats.readyToAdvance).toBe(2); // Both eligible contents are ready
      expect(stats.blockedByDependencies).toBe(0);
      expect(stats.averageReadinessScore).toBeGreaterThan(0);
      expect(stats.topSuggestions).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle ContentService errors gracefully', async () => {
      mockContentService.getContents.mockRejectedValue(new Error('Database error'));

      const suggestions = await SuggestionService.getPublicationSuggestions();

      expect(suggestions).toEqual([]);
    });

    it('should handle dependency check errors gracefully', async () => {
      const content = createMockContent({
        publish_after: 'missing-dependency'
      });

      mockContentService.getContents.mockResolvedValue([content]);
      mockContentService.getContentByTopic.mockRejectedValue(new Error('Dependency check failed'));

      const suggestions = await SuggestionService.getPublicationSuggestions();

      // Should exclude content due to dependency error
      expect(suggestions).toEqual([]);
    });
  });

  describe('Content Readiness Check', () => {
    it('should correctly identify ready content', async () => {
      const readyContent = createMockContent({
        current_stage: 5,
        title: 'Test Title',
        script: 'Test Script'
      });

      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: true,
        errors: []
      });

      const isReady = await SuggestionService.isContentReadyForNextStage(readyContent);

      expect(isReady).toBe(true);
    });

    it('should correctly identify content not ready for next stage', async () => {
      const notReadyContent = createMockContent({
        current_stage: 5
        // Missing required fields
      });

      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: false,
        errors: ['Missing required field']
      });

      const isReady = await SuggestionService.isContentReadyForNextStage(notReadyContent);

      expect(isReady).toBe(false);
    });

    it('should check dependencies for content advancing to Published stage', async () => {
      const almostPublishedContent = createMockContent({
        current_stage: CONTENT_STAGES.length - 2, // One step before Published
        title: 'Test Title',
        script: 'Test Script',
        link: 'https://example.com'
      });

      mockContentService.validateStageRequirements.mockReturnValue({
        isValid: true,
        errors: []
      });

      mockContentService.validatePublishDependencies.mockResolvedValue({
        isValid: true,
        errors: []
      });

      const isReady = await SuggestionService.isContentReadyForNextStage(almostPublishedContent);

      expect(isReady).toBe(true);
      expect(mockContentService.validatePublishDependencies).toHaveBeenCalledWith(almostPublishedContent);
    });
  });
});