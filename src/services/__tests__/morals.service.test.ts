import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MoralsService, type MoralEntry } from '../morals.service';
import { ContentService } from '../content.service';
import type { Content } from '@/types';

// Mock ContentService
vi.mock('../content.service');

const mockContentService = vi.mocked(ContentService);

describe('MoralsService', () => {
  const mockContents: Content[] = [
    {
      id: '1',
      topic: 'React Hooks',
      category: 'Demanding',
      current_stage: 5,
      title: 'Understanding React Hooks',
      script: 'Script content...',
      final_checks: [],
      morals: ['Always use hooks at the top level', 'Custom hooks should start with use'],
      flags: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      topic: 'TypeScript Basics',
      category: 'Innovative',
      current_stage: 3,
      title: 'TypeScript for Beginners',
      final_checks: [],
      morals: ['Type safety prevents runtime errors'],
      flags: [],
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z'
    },
    {
      id: '3',
      topic: 'Empty Content',
      category: 'Demanding',
      current_stage: 1,
      final_checks: [],
      morals: [],
      flags: [],
      created_at: '2024-01-03T00:00:00Z',
      updated_at: '2024-01-03T00:00:00Z'
    },
    {
      id: '4',
      topic: 'Whitespace Test',
      category: 'Innovative',
      current_stage: 2,
      final_checks: [],
      morals: ['  ', 'Valid moral with spaces  ', ''],
      flags: [],
      created_at: '2024-01-04T00:00:00Z',
      updated_at: '2024-01-04T00:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockContentService.getContents.mockResolvedValue(mockContents);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllMorals', () => {
    it('should return all morals from all content with proper formatting', async () => {
      const result = await MoralsService.getAllMorals();

      expect(result).toHaveLength(4); // 2 + 1 + 0 + 1 (excluding empty/whitespace)
      
      // Check first content morals
      expect(result[0]).toEqual({
        id: '1_0',
        text: 'Always use hooks at the top level',
        contentTopic: 'React Hooks',
        formattedText: 'Always use hooks at the top level [React Hooks]',
        contentId: '1'
      });

      expect(result[1]).toEqual({
        id: '1_1',
        text: 'Custom hooks should start with use',
        contentTopic: 'React Hooks',
        formattedText: 'Custom hooks should start with use [React Hooks]',
        contentId: '1'
      });

      // Check second content moral
      expect(result[2]).toEqual({
        id: '2_0',
        text: 'Type safety prevents runtime errors',
        contentTopic: 'TypeScript Basics',
        formattedText: 'Type safety prevents runtime errors [TypeScript Basics]',
        contentId: '2'
      });

      // Check whitespace handling
      expect(result[3]).toEqual({
        id: '4_1',
        text: 'Valid moral with spaces',
        contentTopic: 'Whitespace Test',
        formattedText: 'Valid moral with spaces [Whitespace Test]',
        contentId: '4'
      });
    });

    it('should return empty array when no content exists', async () => {
      mockContentService.getContents.mockResolvedValue([]);

      const result = await MoralsService.getAllMorals();

      expect(result).toEqual([]);
    });

    it('should handle ContentService errors gracefully', async () => {
      mockContentService.getContents.mockRejectedValue(new Error('Database error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await MoralsService.getAllMorals();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching morals:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should sort morals by content topic', async () => {
      const result = await MoralsService.getAllMorals();

      // Should be sorted: React Hooks, TypeScript Basics, Whitespace Test
      expect(result[0].contentTopic).toBe('React Hooks');
      expect(result[1].contentTopic).toBe('React Hooks');
      expect(result[2].contentTopic).toBe('TypeScript Basics');
      expect(result[3].contentTopic).toBe('Whitespace Test');
    });

    it('should filter out empty and whitespace-only morals', async () => {
      const result = await MoralsService.getAllMorals();

      // Should not include empty strings or whitespace-only strings
      expect(result.every(moral => moral.text.trim().length > 0)).toBe(true);
    });
  });

  describe('searchMorals', () => {
    it('should return all morals when search term is empty', async () => {
      const result = await MoralsService.searchMorals('');

      expect(result).toHaveLength(4);
    });

    it('should return all morals when search term is whitespace', async () => {
      const result = await MoralsService.searchMorals('   ');

      expect(result).toHaveLength(4);
    });

    it('should search morals by text content (case insensitive)', async () => {
      const result = await MoralsService.searchMorals('hooks');

      expect(result).toHaveLength(2);
      expect(result.every(moral => moral.text.toLowerCase().includes('hooks'))).toBe(true);
    });

    it('should search morals by content topic (case insensitive)', async () => {
      const result = await MoralsService.searchMorals('typescript');

      expect(result).toHaveLength(1);
      expect(result[0].contentTopic).toBe('TypeScript Basics');
    });

    it('should return empty array when no matches found', async () => {
      const result = await MoralsService.searchMorals('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle partial matches', async () => {
      const result = await MoralsService.searchMorals('type');

      expect(result).toHaveLength(1);
      expect(result[0].contentTopic).toBe('TypeScript Basics');
    });
  });

  describe('filterMoralsByTopic', () => {
    it('should filter morals by exact topic match', async () => {
      const result = await MoralsService.filterMoralsByTopic('React Hooks');

      expect(result).toHaveLength(2);
      expect(result.every(moral => moral.contentTopic === 'React Hooks')).toBe(true);
    });

    it('should filter morals by partial topic match (case insensitive)', async () => {
      const result = await MoralsService.filterMoralsByTopic('react');

      expect(result).toHaveLength(2);
      expect(result.every(moral => moral.contentTopic.toLowerCase().includes('react'))).toBe(true);
    });

    it('should return empty array when no topic matches', async () => {
      const result = await MoralsService.filterMoralsByTopic('Nonexistent Topic');

      expect(result).toEqual([]);
    });
  });

  describe('getMoralsForContent', () => {
    it('should return morals for specific content ID', async () => {
      const result = await MoralsService.getMoralsForContent('1');

      expect(result).toHaveLength(2);
      expect(result.every(moral => moral.contentId === '1')).toBe(true);
    });

    it('should return empty array for content with no morals', async () => {
      const result = await MoralsService.getMoralsForContent('3');

      expect(result).toEqual([]);
    });

    it('should return empty array for nonexistent content ID', async () => {
      const result = await MoralsService.getMoralsForContent('999');

      expect(result).toEqual([]);
    });
  });

  describe('getTopicsWithMorals', () => {
    it('should return unique topics that have morals', async () => {
      const result = await MoralsService.getTopicsWithMorals();

      expect(result).toEqual(['React Hooks', 'TypeScript Basics', 'Whitespace Test']);
    });

    it('should return sorted topics', async () => {
      const result = await MoralsService.getTopicsWithMorals();

      const sortedResult = [...result].sort();
      expect(result).toEqual(sortedResult);
    });

    it('should not include topics with no morals', async () => {
      const result = await MoralsService.getTopicsWithMorals();

      expect(result).not.toContain('Empty Content');
    });
  });

  describe('getMoralsCountByTopic', () => {
    it('should return correct count of morals by topic', async () => {
      const result = await MoralsService.getMoralsCountByTopic();

      expect(result).toEqual({
        'React Hooks': 2,
        'TypeScript Basics': 1,
        'Whitespace Test': 1
      });
    });

    it('should not include topics with zero morals', async () => {
      const result = await MoralsService.getMoralsCountByTopic();

      expect(result).not.toHaveProperty('Empty Content');
    });
  });

  describe('getTotalMoralsCount', () => {
    it('should return total count of all morals', async () => {
      const result = await MoralsService.getTotalMoralsCount();

      expect(result).toBe(4);
    });

    it('should return 0 when no morals exist', async () => {
      mockContentService.getContents.mockResolvedValue([]);

      const result = await MoralsService.getTotalMoralsCount();

      expect(result).toBe(0);
    });
  });

  describe('getMoralsStatistics', () => {
    it('should return comprehensive morals statistics', async () => {
      const result = await MoralsService.getMoralsStatistics();

      expect(result).toEqual({
        totalMorals: 4,
        totalContentsWithMorals: 3,
        averageMoralsPerContent: 1.33,
        topicsWithMorals: ['React Hooks', 'TypeScript Basics', 'Whitespace Test'],
        moralsCountByTopic: {
          'React Hooks': 2,
          'TypeScript Basics': 1,
          'Whitespace Test': 1
        }
      });
    });

    it('should handle zero morals correctly', async () => {
      mockContentService.getContents.mockResolvedValue([]);

      const result = await MoralsService.getMoralsStatistics();

      expect(result).toEqual({
        totalMorals: 0,
        totalContentsWithMorals: 0,
        averageMoralsPerContent: 0,
        topicsWithMorals: [],
        moralsCountByTopic: {}
      });
    });
  });

  describe('formatMoral', () => {
    it('should format moral with content topic', () => {
      const result = MoralsService.formatMoral('Test moral', 'Test Topic');

      expect(result).toBe('Test moral [Test Topic]');
    });

    it('should trim whitespace from moral text', () => {
      const result = MoralsService.formatMoral('  Test moral  ', 'Test Topic');

      expect(result).toBe('Test moral [Test Topic]');
    });

    it('should handle empty moral text', () => {
      const result = MoralsService.formatMoral('', 'Test Topic');

      expect(result).toBe(' [Test Topic]');
    });
  });

  describe('parseMoral', () => {
    it('should parse formatted moral text correctly', () => {
      const result = MoralsService.parseMoral('Test moral [Test Topic]');

      expect(result).toEqual({
        moral: 'Test moral',
        topic: 'Test Topic'
      });
    });

    it('should handle whitespace in parsed text', () => {
      const result = MoralsService.parseMoral('  Test moral  [  Test Topic  ]');

      expect(result).toEqual({
        moral: 'Test moral',
        topic: 'Test Topic'
      });
    });

    it('should return null for invalid format', () => {
      const result = MoralsService.parseMoral('Invalid format');

      expect(result).toBeNull();
    });

    it('should return null for missing brackets', () => {
      const result = MoralsService.parseMoral('Test moral Test Topic');

      expect(result).toBeNull();
    });

    it('should handle complex moral text with brackets', () => {
      const result = MoralsService.parseMoral('Use [brackets] carefully [Test Topic]');

      expect(result).toEqual({
        moral: 'Use [brackets] carefully',
        topic: 'Test Topic'
      });
    });
  });

  describe('getMoralsGroupedByTopic', () => {
    it('should group morals by content topic', async () => {
      const result = await MoralsService.getMoralsGroupedByTopic();

      expect(result).toHaveProperty('React Hooks');
      expect(result).toHaveProperty('TypeScript Basics');
      expect(result).toHaveProperty('Whitespace Test');
      
      expect(result['React Hooks']).toHaveLength(2);
      expect(result['TypeScript Basics']).toHaveLength(1);
      expect(result['Whitespace Test']).toHaveLength(1);
    });

    it('should not include topics with no morals', async () => {
      const result = await MoralsService.getMoralsGroupedByTopic();

      expect(result).not.toHaveProperty('Empty Content');
    });
  });

  describe('exportMoralsAsText', () => {
    it('should export morals as formatted text', async () => {
      const result = await MoralsService.exportMoralsAsText();

      const lines = result.split('\n');
      expect(lines).toHaveLength(4);
      expect(lines[0]).toBe('Always use hooks at the top level [React Hooks]');
      expect(lines[1]).toBe('Custom hooks should start with use [React Hooks]');
      expect(lines[2]).toBe('Type safety prevents runtime errors [TypeScript Basics]');
      expect(lines[3]).toBe('Valid moral with spaces [Whitespace Test]');
    });

    it('should return empty string when no morals exist', async () => {
      mockContentService.getContents.mockResolvedValue([]);

      const result = await MoralsService.exportMoralsAsText();

      expect(result).toBe('');
    });
  });

  describe('exportMoralsAsJSON', () => {
    it('should export morals as JSON string', async () => {
      const result = await MoralsService.exportMoralsAsJSON();

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(4);
      
      expect(parsed[0]).toHaveProperty('id');
      expect(parsed[0]).toHaveProperty('text');
      expect(parsed[0]).toHaveProperty('contentTopic');
      expect(parsed[0]).toHaveProperty('formattedText');
      expect(parsed[0]).toHaveProperty('contentId');
    });

    it('should return empty array JSON when no morals exist', async () => {
      mockContentService.getContents.mockResolvedValue([]);

      const result = await MoralsService.exportMoralsAsJSON();

      expect(result).toBe('[]');
    });

    it('should format JSON with proper indentation', async () => {
      const result = await MoralsService.exportMoralsAsJSON();

      // Check that it's formatted with 2-space indentation
      expect(result).toContain('  "id":');
      expect(result).toContain('  "text":');
    });
  });
});