import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ContentService } from '../content.service';
import { supabase } from '../supabase';
import { CONTENT_STAGES, DEFAULT_FINAL_CHECKS } from '@/constants';
import type { Content, ContentFormData } from '@/types';

// Mock Supabase
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
  handleSupabaseError: vi.fn((error) => {
    console.error('Supabase error:', error);
    throw new Error(error.message || 'An unexpected error occurred');
  }),
}));

const mockSupabaseQuery = supabase.from as any;

describe('ContentService', () => {
  const mockContent: Content = {
    id: '1',
    topic: 'Test Topic',
    category: 'Demanding',
    current_stage: 0,
    title: 'Test Title',
    script: 'Test script content that is long enough to meet minimum requirements',
    final_checks: [
      { id: 'check_1', description: 'Test check', completed: false }
    ],
    publish_after: undefined,
    publish_before: undefined,
    link: 'https://example.com',
    morals: ['Test moral'],
    flags: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  const mockContentRow = {
    id: '1',
    topic: 'Test Topic',
    category: 'Demanding',
    current_stage: 0,
    title: 'Test Title',
    script: 'Test script content that is long enough to meet minimum requirements',
    final_checks: [
      { id: 'check_1', description: 'Test check', completed: false }
    ],
    publish_after: null,
    publish_before: null,
    link: 'https://example.com',
    morals: ['Test moral'],
    flags: [],
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getContents', () => {
    it('should fetch all contents without filters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockContentRow], error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.getContents();

      expect(mockSupabaseQuery).toHaveBeenCalledWith('contents');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(1);
      expect(result[0].topic).toBe('Test Topic');
    });

    it('should apply category filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockContentRow], error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await ContentService.getContents({ category: 'Demanding' });

      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'Demanding');
    });

    it('should apply stage filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockContentRow], error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await ContentService.getContents({ stage: 5 });

      expect(mockQuery.eq).toHaveBeenCalledWith('current_stage', 5);
    });

    it('should apply search filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockContentRow], error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await ContentService.getContents({ search: 'test' });

      expect(mockQuery.ilike).toHaveBeenCalledWith('topic', '%test%');
    });

    it('should handle sorting options', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockContentRow], error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await ContentService.getContents(undefined, { field: 'topic', direction: 'asc' });

      expect(mockQuery.order).toHaveBeenCalledWith('topic', { ascending: true });
    });

    it('should handle errors gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      // Mock handleSupabaseError to not throw for this test
      const { handleSupabaseError } = await import('../supabase');
      vi.mocked(handleSupabaseError).mockImplementationOnce(() => {
        // Don't throw, just log
        console.error('Mocked error handling');
      });

      const result = await ContentService.getContents();

      expect(result).toEqual([]);
    });
  });

  describe('getContentById', () => {
    it('should fetch content by ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.getContentById('1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
      expect(result?.topic).toBe('Test Topic');
    });

    it('should return null when content not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.getContentById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getContentByTopic', () => {
    it('should fetch content by topic', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.getContentByTopic('Test Topic');

      expect(mockQuery.eq).toHaveBeenCalledWith('topic', 'Test Topic');
      expect(result?.topic).toBe('Test Topic');
    });
  });

  describe('createContent', () => {
    const validContentData: ContentFormData = {
      topic: 'New Topic',
      category: 'Innovative',
      title: 'New Title',
      script: 'New script content that is long enough to meet minimum requirements',
      morals: ['New moral']
    };

    it('should create content with valid data', async () => {
      // Mock topic uniqueness check
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      // Mock insert query
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };

      mockSupabaseQuery
        .mockReturnValueOnce(mockSelectQuery) // First call for uniqueness check
        .mockReturnValueOnce(mockInsertQuery); // Second call for insert

      const result = await ContentService.createContent(validContentData);

      expect(result.topic).toBe('Test Topic');
    });

    it('should reject content with duplicate topic', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await expect(ContentService.createContent(validContentData))
        .rejects.toThrow('Content with topic "New Topic" already exists');
    });

    it('should reject content with invalid data', async () => {
      const invalidData: ContentFormData = {
        topic: 'A', // Too short
        category: 'Demanding',
        morals: []
      };

      await expect(ContentService.createContent(invalidData))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('updateContent', () => {
    it('should update content with valid data', async () => {
      // Mock get existing content
      const mockGetQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };

      // Mock update query
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };

      mockSupabaseQuery
        .mockReturnValueOnce(mockGetQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const updates = { title: 'Updated Title' };
      const result = await ContentService.updateContent('1', updates);

      expect(result.topic).toBe('Test Topic');
    });

    it('should reject update for non-existent content', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await expect(ContentService.updateContent('nonexistent', { title: 'New Title' }))
        .rejects.toThrow('Content not found');
    });
  });

  describe('updateContentStage', () => {
    it('should update stage when requirements are met', async () => {
      const contentWithTitle = { ...mockContent, title: 'Valid Title' };
      
      // Mock get content
      const mockGetQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...mockContentRow, title: 'Valid Title' }, 
          error: null 
        }),
      };

      // Mock update query
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...mockContentRow, current_stage: 1 }, 
          error: null 
        }),
      };

      mockSupabaseQuery
        .mockReturnValueOnce(mockGetQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const result = await ContentService.updateContentStage('1', 1);

      expect(result.current_stage).toBe(1);
    });

    it('should reject stage update when requirements not met', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...mockContentRow, title: null }, 
          error: null 
        }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await expect(ContentService.updateContentStage('1', 1))
        .rejects.toThrow('Stage validation failed');
    });

    it('should reject backwards stage movement', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...mockContentRow, current_stage: 5 }, 
          error: null 
        }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await expect(ContentService.updateContentStage('1', 3))
        .rejects.toThrow('Cannot move to a previous stage');
    });

    it('should reject skipping stages', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await expect(ContentService.updateContentStage('1', 3))
        .rejects.toThrow('Cannot skip stages');
    });
  });

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      await expect(ContentService.deleteContent('1')).resolves.not.toThrow();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('bulkDeletePublishedContents', () => {
    it('should delete all published contents', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({ 
          data: [{ id: '1' }, { id: '2' }], 
          error: null 
        }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.bulkDeletePublishedContents();

      expect(mockQuery.eq).toHaveBeenCalledWith('current_stage', CONTENT_STAGES.length - 1);
      expect(result).toBe(2);
    });
  });

  describe('searchContents', () => {
    it('should search contents by term', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockContentRow], error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.searchContents('test');

      expect(mockQuery.ilike).toHaveBeenCalledWith('topic', '%test%');
      expect(result).toHaveLength(1);
    });

    it('should return all contents for empty search', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockContentRow], error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.searchContents('');

      expect(result).toHaveLength(1);
    });
  });

  describe('getContentDependencies', () => {
    it('should get content dependencies', async () => {
      const mockDependsOnQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { publish_after: 'dependency-topic' }, 
          error: null 
        }),
      };

      const mockDependentsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: [{ topic: 'dependent-topic' }], 
          error: null 
        }),
      };

      mockSupabaseQuery
        .mockReturnValueOnce(mockDependsOnQuery)
        .mockReturnValueOnce(mockDependentsQuery);

      const result = await ContentService.getContentDependencies('test-topic');

      expect(result.contentTopic).toBe('test-topic');
      expect(result.dependsOn).toContain('dependency-topic');
      expect(result.dependents).toContain('dependent-topic');
    });
  });

  describe('validateContentData', () => {
    it('should validate valid content data', async () => {
      const validData: ContentFormData = {
        topic: 'Valid Topic',
        category: 'Demanding',
        title: 'Valid Title',
        script: 'Valid script content that is long enough to meet minimum requirements',
        morals: ['Valid moral']
      };

      const result = await ContentService.validateContentData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short topic', async () => {
      const invalidData: ContentFormData = {
        topic: 'A',
        category: 'Demanding',
        morals: []
      };

      const result = await ContentService.validateContentData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Topic must be at least 3 characters long');
    });

    it('should require title for stage >= 1', async () => {
      const invalidData: ContentFormData = {
        topic: 'Valid Topic',
        category: 'Demanding',
        morals: []
      };

      const result = await ContentService.validateContentData(invalidData, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Title is required'))).toBe(true);
    });

    it('should require script for stage >= 5', async () => {
      const invalidData: ContentFormData = {
        topic: 'Valid Topic',
        category: 'Demanding',
        title: 'Valid Title',
        morals: []
      };

      const result = await ContentService.validateContentData(invalidData, 5);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Script is required'))).toBe(true);
    });

    it('should require link for published stage', async () => {
      const invalidData: ContentFormData = {
        topic: 'Valid Topic',
        category: 'Demanding',
        title: 'Valid Title',
        script: 'Valid script content that is long enough to meet minimum requirements',
        morals: []
      };

      const result = await ContentService.validateContentData(invalidData, 11);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Link is required'))).toBe(true);
    });

    it('should validate URL format', async () => {
      const invalidData: ContentFormData = {
        topic: 'Valid Topic',
        category: 'Demanding',
        title: 'Valid Title',
        script: 'Valid script content that is long enough to meet minimum requirements',
        link: 'invalid-url',
        morals: []
      };

      const result = await ContentService.validateContentData(invalidData, 11);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('valid URL'))).toBe(true);
    });
  });

  describe('validateStageRequirements', () => {
    it('should allow valid stage progression', () => {
      const content = { ...mockContent, title: 'Valid Title' };
      const result = ContentService.validateStageRequirements(content, 1);

      expect(result.isValid).toBe(true);
    });

    it('should reject backwards progression', () => {
      const content = { ...mockContent, current_stage: 5 };
      const result = ContentService.validateStageRequirements(content, 3);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot move to a previous stage');
    });

    it('should reject skipping stages', () => {
      const result = ContentService.validateStageRequirements(mockContent, 3);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot skip stages - must progress one stage at a time');
    });

    it('should require title for title stage', () => {
      const contentWithoutTitle = { ...mockContent, title: undefined };
      const result = ContentService.validateStageRequirements(contentWithoutTitle, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Title is required to advance to this stage');
    });

    it('should require completed final checks for published stage', () => {
      const contentWithIncompleteFinalChecks = {
        ...mockContent,
        current_stage: 10,
        title: 'Valid Title',
        script: 'Valid script',
        link: 'https://example.com',
        final_checks: [
          { id: 'check_1', description: 'Test check', completed: false }
        ]
      };

      const result = ContentService.validateStageRequirements(contentWithIncompleteFinalChecks, 11);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All final checks must be completed before publishing');
    });
  });

  describe('validatePublishDependencies', () => {
    it('should allow publishing when dependency is published', async () => {
      const content = { ...mockContent, publish_after: 'dependency-topic' };
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...mockContentRow, current_stage: 11 }, 
          error: null 
        }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.validatePublishDependencies(content);

      expect(result.isValid).toBe(true);
    });

    it('should reject publishing when dependency not published', async () => {
      const content = { ...mockContent, publish_after: 'dependency-topic' };
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { ...mockContentRow, current_stage: 5 }, 
          error: null 
        }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.validatePublishDependencies(content);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot publish until "dependency-topic" is published');
    });

    it('should reject publishing when dependency not found', async () => {
      const content = { ...mockContent, publish_after: 'nonexistent-topic' };
      
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.validatePublishDependencies(content);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dependency "nonexistent-topic" not found');
    });
  });

  describe('validateDependencies', () => {
    it('should validate valid dependencies', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.validateDependencies('existing-topic', undefined);

      expect(result.isValid).toBe(true);
    });

    it('should reject non-existent dependencies', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.validateDependencies('nonexistent-topic', undefined);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dependency "nonexistent-topic" does not exist');
    });

    it('should reject circular dependencies', async () => {
      // Mock the dependency check calls
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.validateDependencies('same-topic', 'same-topic');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot have the same content as both publish_after and publish_before');
    });

    it('should reject self-dependencies', async () => {
      // Mock the dependency check calls
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockContentRow, error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const result = await ContentService.validateDependencies('self-topic', undefined, 'self-topic');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content cannot depend on itself (publish_after)');
    });
  });

  describe('Content filtering utilities', () => {
    beforeEach(() => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [mockContentRow], error: null }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);
    });

    it('should get contents by category', async () => {
      const result = await ContentService.getContentsByCategory('Demanding');
      expect(result).toHaveLength(1);
    });

    it('should get contents by stage', async () => {
      const result = await ContentService.getContentsByStage(0);
      expect(result).toHaveLength(1);
    });

    it('should get pending contents', async () => {
      const result = await ContentService.getPendingContents();
      expect(result).toHaveLength(1);
    });

    it('should get published contents', async () => {
      const result = await ContentService.getPublishedContents();
      expect(result).toHaveLength(1);
    });
  });

  describe('Content statistics', () => {
    it('should calculate content statistics', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: [
            mockContentRow,
            { ...mockContentRow, id: '2', category: 'Innovative', current_stage: 5 },
            { ...mockContentRow, id: '3', current_stage: 11 }
          ], 
          error: null 
        }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);

      const stats = await ContentService.getContentStatistics();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.published).toBe(1);
      expect(stats.byCategory['Demanding']).toBe(2);
      expect(stats.byCategory['Innovative']).toBe(1);
    });
  });

  describe('Advanced search', () => {
    beforeEach(() => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ 
          data: [
            mockContentRow,
            { ...mockContentRow, id: '2', topic: 'Another Topic', category: 'Innovative' }
          ], 
          error: null 
        }),
      };
      mockSupabaseQuery.mockReturnValue(mockQuery);
    });

    it('should search by topic', async () => {
      const result = await ContentService.advancedSearch({ topic: 'Test' });
      expect(result).toHaveLength(1);
      expect(result[0].topic).toBe('Test Topic');
    });

    it('should search by category', async () => {
      const result = await ContentService.advancedSearch({ category: 'Innovative' });
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Innovative');
    });

    it('should search by multiple criteria', async () => {
      const result = await ContentService.advancedSearch({ 
        category: 'Demanding',
        hasTitle: true 
      });
      expect(result).toHaveLength(1);
    });
  });
});