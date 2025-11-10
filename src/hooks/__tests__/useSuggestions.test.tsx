import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSuggestions } from '../useSuggestions';
import { SuggestionService } from '@/services/suggestion.service';
import type { ContentSuggestion, Content } from '@/types';

// Mock SuggestionService
vi.mock('@/services/suggestion.service');

const mockSuggestionService = vi.mocked(SuggestionService);

describe('useSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const createMockContent = (overrides: Partial<Content> = {}): Content => ({
    id: 'test-id',
    topic: 'test-topic',
    category: 'Demanding',
    current_stage: 0,
    title: 'Test Title',
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

  const createMockSuggestion = (overrides: Partial<ContentSuggestion> = {}): ContentSuggestion => ({
    content: createMockContent(),
    score: 85,
    remainingSteps: 2.5,
    blockedBy: [],
    ...overrides
  });

  const mockStatistics = {
    totalEligible: 5,
    readyToAdvance: 3,
    blockedByDependencies: 2,
    averageReadinessScore: 75.5,
    topSuggestions: 2
  };

  describe('Initial Loading', () => {
    it('should start with loading state', async () => {
      mockSuggestionService.getPublicationSuggestions.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );
      mockSuggestionService.getSuggestionStatistics.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockStatistics), 100))
      );

      const { result } = renderHook(() => useSuggestions());

      expect(result.current.loading).toBe(true);
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.error).toBeNull();
      expect(result.current.statistics).toBeNull();
    });

    it('should load suggestions and statistics on mount', async () => {
      const mockSuggestions = [createMockSuggestion()];
      
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);
      mockSuggestionService.getSuggestionStatistics.mockResolvedValue(mockStatistics);

      const { result } = renderHook(() => useSuggestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.suggestions).toEqual(mockSuggestions);
      expect(result.current.statistics).toEqual(mockStatistics);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading errors', async () => {
      const errorMessage = 'Failed to load suggestions';
      mockSuggestionService.getPublicationSuggestions.mockRejectedValue(
        new Error(errorMessage)
      );
      mockSuggestionService.getSuggestionStatistics.mockRejectedValue(
        new Error('Stats error')
      );

      const { result } = renderHook(() => useSuggestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.suggestions).toEqual([]);
      expect(result.current.statistics).toBeNull();
    });
  });

  describe('Manual Refresh', () => {
    it('should refresh suggestions when refreshSuggestions is called', async () => {
      const initialSuggestions = [createMockSuggestion({ content: createMockContent({ id: '1' }) })];
      const updatedSuggestions = [
        createMockSuggestion({ content: createMockContent({ id: '1' }) }),
        createMockSuggestion({ content: createMockContent({ id: '2' }) })
      ];

      mockSuggestionService.getPublicationSuggestions
        .mockResolvedValueOnce(initialSuggestions)
        .mockResolvedValueOnce(updatedSuggestions);
      
      mockSuggestionService.getSuggestionStatistics
        .mockResolvedValue(mockStatistics);

      const { result } = renderHook(() => useSuggestions());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.suggestions).toHaveLength(1);

      // Refresh suggestions
      await act(async () => {
        await result.current.refreshSuggestions();
      });

      expect(result.current.suggestions).toHaveLength(2);
      expect(mockSuggestionService.getPublicationSuggestions).toHaveBeenCalledTimes(2);
    });

    it('should handle refresh errors', async () => {
      mockSuggestionService.getPublicationSuggestions
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Refresh failed'));
      
      mockSuggestionService.getSuggestionStatistics
        .mockResolvedValueOnce(mockStatistics)
        .mockRejectedValueOnce(new Error('Stats refresh failed'));

      const { result } = renderHook(() => useSuggestions());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();

      // Refresh with error
      await act(async () => {
        await result.current.refreshSuggestions();
      });

      expect(result.current.error).toBe('Refresh failed');
    });
  });

  describe('Auto Refresh', () => {
    it('should auto-refresh when autoRefresh is enabled', async () => {
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);
      mockSuggestionService.getSuggestionStatistics.mockResolvedValue(mockStatistics);

      renderHook(() => useSuggestions(true));

      // Wait for initial load
      await waitFor(() => {
        expect(mockSuggestionService.getPublicationSuggestions).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 30 seconds to trigger auto-refresh
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(mockSuggestionService.getPublicationSuggestions).toHaveBeenCalledTimes(2);
      });
    });

    it('should not auto-refresh when autoRefresh is disabled', async () => {
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);
      mockSuggestionService.getSuggestionStatistics.mockResolvedValue(mockStatistics);

      renderHook(() => useSuggestions(false));

      // Wait for initial load
      await waitFor(() => {
        expect(mockSuggestionService.getPublicationSuggestions).toHaveBeenCalledTimes(1);
      });

      // Fast-forward 30 seconds
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Should not have called again
      expect(mockSuggestionService.getPublicationSuggestions).toHaveBeenCalledTimes(1);
    });

    it('should clean up auto-refresh interval on unmount', async () => {
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);
      mockSuggestionService.getSuggestionStatistics.mockResolvedValue(mockStatistics);

      const { unmount } = renderHook(() => useSuggestions(true));

      // Wait for initial load
      await waitFor(() => {
        expect(mockSuggestionService.getPublicationSuggestions).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Fast-forward 30 seconds after unmount
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // Should not have called again after unmount
      expect(mockSuggestionService.getPublicationSuggestions).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSuggestionForContent', () => {
    it('should get suggestion for specific content', async () => {
      const mockSuggestion = createMockSuggestion();
      
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);
      mockSuggestionService.getSuggestionStatistics.mockResolvedValue(mockStatistics);
      mockSuggestionService.getContentSuggestion.mockResolvedValue(mockSuggestion);

      const { result } = renderHook(() => useSuggestions());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let suggestion: any;
      await act(async () => {
        suggestion = await result.current.getSuggestionForContent('test-topic');
      });

      expect(suggestion).toEqual(mockSuggestion);
      expect(mockSuggestionService.getContentSuggestion).toHaveBeenCalledWith('test-topic');
    });

    it('should handle errors when getting content suggestion', async () => {
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);
      mockSuggestionService.getSuggestionStatistics.mockResolvedValue(mockStatistics);
      mockSuggestionService.getContentSuggestion.mockRejectedValue(
        new Error('Content not found')
      );

      const { result } = renderHook(() => useSuggestions());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      let suggestion: any;
      await act(async () => {
        suggestion = await result.current.getSuggestionForContent('non-existent');
      });

      expect(suggestion).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should load statistics alongside suggestions', async () => {
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);
      mockSuggestionService.getSuggestionStatistics.mockResolvedValue(mockStatistics);

      const { result } = renderHook(() => useSuggestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.statistics).toEqual(mockStatistics);
    });

    it('should update statistics on refresh', async () => {
      const initialStats = { ...mockStatistics, totalEligible: 3 };
      const updatedStats = { ...mockStatistics, totalEligible: 5 };

      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);
      mockSuggestionService.getSuggestionStatistics
        .mockResolvedValueOnce(initialStats)
        .mockResolvedValueOnce(updatedStats);

      const { result } = renderHook(() => useSuggestions());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.statistics?.totalEligible).toBe(3);

      // Refresh
      await act(async () => {
        await result.current.refreshSuggestions();
      });

      expect(result.current.statistics?.totalEligible).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle partial failures gracefully', async () => {
      const mockSuggestions = [createMockSuggestion()];
      
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue(mockSuggestions);
      mockSuggestionService.getSuggestionStatistics.mockRejectedValue(
        new Error('Stats failed')
      );

      const { result } = renderHook(() => useSuggestions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still have suggestions even if stats failed
      expect(result.current.suggestions).toEqual(mockSuggestions);
      expect(result.current.error).toBe('Stats failed');
      expect(result.current.statistics).toBeNull();
    });

    it('should clear error on successful refresh', async () => {
      mockSuggestionService.getPublicationSuggestions
        .mockRejectedValueOnce(new Error('Initial error'))
        .mockResolvedValueOnce([]);
      
      mockSuggestionService.getSuggestionStatistics
        .mockRejectedValueOnce(new Error('Stats error'))
        .mockResolvedValueOnce(mockStatistics);

      const { result } = renderHook(() => useSuggestions());

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toBe('Initial error');
      });

      // Refresh successfully
      await act(async () => {
        await result.current.refreshSuggestions();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.statistics).toEqual(mockStatistics);
    });
  });

  describe('Loading States', () => {
    it('should show loading during refresh', async () => {
      mockSuggestionService.getPublicationSuggestions.mockResolvedValue([]);
      mockSuggestionService.getSuggestionStatistics.mockResolvedValue(mockStatistics);

      const { result } = renderHook(() => useSuggestions());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Start refresh
      const refreshPromise = act(async () => {
        await result.current.refreshSuggestions();
      });

      // Should be loading during refresh
      expect(result.current.loading).toBe(true);

      await refreshPromise;

      expect(result.current.loading).toBe(false);
    });
  });
});