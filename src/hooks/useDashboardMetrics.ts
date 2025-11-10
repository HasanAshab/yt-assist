import { useMemo } from 'react';
import { useContent } from './useContent';

export interface DashboardMetrics {
  totalContent: number;
  pendingCount: number;
  inProgressCount: number;
  publishedCount: number;
  remainingTasksCount: number;
  completionRate: number;
}

export function useDashboardMetrics(): DashboardMetrics {
  const { contents } = useContent();

  return useMemo(() => {
    const totalContent = contents.length;
    const pendingCount = contents.filter(c => c.current_stage === 0).length;
    const inProgressCount = contents.filter(c => c.current_stage > 0 && c.current_stage < 11).length;
    const publishedCount = contents.filter(c => c.current_stage === 11).length;
    
    // Mock task count for now
    const remainingTasksCount = 0;
    
    const completionRate = totalContent > 0 ? (publishedCount / totalContent) * 100 : 0;

    return {
      totalContent,
      pendingCount,
      inProgressCount,
      publishedCount,
      remainingTasksCount,
      completionRate
    };
  }, [contents]);
}