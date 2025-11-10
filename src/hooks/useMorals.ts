import { useState, useEffect, useCallback } from 'react';
import { MoralsService, type MoralEntry } from '@/services/morals.service';

interface UseMoralsReturn {
  morals: MoralEntry[];
  loading: boolean;
  error: string | null;
  statistics: {
    totalMorals: number;
    totalContentsWithMorals: number;
    averageMoralsPerContent: number;
    topicsWithMorals: string[];
    moralsCountByTopic: Record<string, number>;
  } | null;
  refetch: () => Promise<void>;
  searchMorals: (searchTerm: string) => Promise<MoralEntry[]>;
  filterByTopic: (topic: string) => Promise<MoralEntry[]>;
  exportAsText: () => Promise<string>;
  exportAsJSON: () => Promise<string>;
}

/**
 * Custom hook for managing morals data and operations
 */
export const useMorals = (): UseMoralsReturn => {
  const [morals, setMorals] = useState<MoralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<UseMoralsReturn['statistics']>(null);

  const fetchMorals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [moralsData, statsData] = await Promise.all([
        MoralsService.getAllMorals(),
        MoralsService.getMoralsStatistics()
      ]);
      
      setMorals(moralsData);
      setStatistics(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch morals';
      setError(errorMessage);
      console.error('Error fetching morals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchMorals();
  }, [fetchMorals]);

  const searchMorals = useCallback(async (searchTerm: string): Promise<MoralEntry[]> => {
    try {
      return await MoralsService.searchMorals(searchTerm);
    } catch (err) {
      console.error('Error searching morals:', err);
      return [];
    }
  }, []);

  const filterByTopic = useCallback(async (topic: string): Promise<MoralEntry[]> => {
    try {
      return await MoralsService.filterMoralsByTopic(topic);
    } catch (err) {
      console.error('Error filtering morals by topic:', err);
      return [];
    }
  }, []);

  const exportAsText = useCallback(async (): Promise<string> => {
    try {
      return await MoralsService.exportMoralsAsText();
    } catch (err) {
      console.error('Error exporting morals as text:', err);
      return '';
    }
  }, []);

  const exportAsJSON = useCallback(async (): Promise<string> => {
    try {
      return await MoralsService.exportMoralsAsJSON();
    } catch (err) {
      console.error('Error exporting morals as JSON:', err);
      return '';
    }
  }, []);

  // Load morals on mount
  useEffect(() => {
    fetchMorals();
  }, [fetchMorals]);

  return {
    morals,
    loading,
    error,
    statistics,
    refetch,
    searchMorals,
    filterByTopic,
    exportAsText,
    exportAsJSON
  };
};

/**
 * Hook for getting morals for a specific content
 */
export const useContentMorals = (contentId: string) => {
  const [morals, setMorals] = useState<MoralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContentMorals = useCallback(async () => {
    if (!contentId) {
      setMorals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const contentMorals = await MoralsService.getMoralsForContent(contentId);
      setMorals(contentMorals);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content morals';
      setError(errorMessage);
      console.error('Error fetching content morals:', err);
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  useEffect(() => {
    fetchContentMorals();
  }, [fetchContentMorals]);

  return {
    morals,
    loading,
    error,
    refetch: fetchContentMorals
  };
};

/**
 * Hook for morals statistics only
 */
export const useMoralsStatistics = () => {
  const [statistics, setStatistics] = useState<{
    totalMorals: number;
    totalContentsWithMorals: number;
    averageMoralsPerContent: number;
    topicsWithMorals: string[];
    moralsCountByTopic: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await MoralsService.getMoralsStatistics();
      setStatistics(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch morals statistics';
      setError(errorMessage);
      console.error('Error fetching morals statistics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics
  };
};