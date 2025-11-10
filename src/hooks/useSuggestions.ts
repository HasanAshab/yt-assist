import { useState, useEffect, useCallback } from 'react';
import { SuggestionService } from '@/services/suggestion.service';
import type { ContentSuggestion } from '@/types';

interface UseSuggestionsReturn {
  suggestions: ContentSuggestion[];
  loading: boolean;
  error: string | null;
  refreshSuggestions: () => Promise<void>;
  getSuggestionForContent: (topic: string) => Promise<ContentSuggestion | null>;
  statistics: {
    totalEligible: number;
    readyToAdvance: number;
    blockedByDependencies: number;
    averageReadinessScore: number;
    topSuggestions: number;
  } | null;
}

/**
 * Custom hook for managing publication suggestions
 * Provides automatic refresh capabilities and statistics
 */
export const useSuggestions = (autoRefresh: boolean = false): UseSuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<UseSuggestionsReturn['statistics']>(null);

  const loadSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [newSuggestions, stats] = await Promise.all([
        SuggestionService.getPublicationSuggestions(),
        SuggestionService.getSuggestionStatistics()
      ]);
      
      setSuggestions(newSuggestions);
      setStatistics(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load suggestions';
      setError(errorMessage);
      console.error('Error loading suggestions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSuggestions = useCallback(async () => {
    await loadSuggestions();
  }, [loadSuggestions]);

  const getSuggestionForContent = useCallback(async (topic: string): Promise<ContentSuggestion | null> => {
    try {
      return await SuggestionService.getContentSuggestion(topic);
    } catch (err) {
      console.error(`Error getting suggestion for content ${topic}:`, err);
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSuggestions();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadSuggestions]);

  return {
    suggestions,
    loading,
    error,
    refreshSuggestions,
    getSuggestionForContent,
    statistics
  };
};