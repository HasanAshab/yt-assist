import { useMemo, useState, useEffect } from 'react';
import { useContent } from './useContent';
import { TaskService } from '../services/task.service';
import { ContentService } from '../services/content.service';

export interface DashboardMetrics {
  totalContent: number;
  pendingCount: number;
  inProgressCount: number;
  publishedCount: number;
  remainingTasksCount: number;
  completionRate: number;
}

export function useDashboardMetrics(): DashboardMetrics {
  const { contents, setContents } = useContent();
  const [remainingTasksCount, setRemainingTasksCount] = useState(0);

  // Load content data if not already loaded
  useEffect(() => {
    const loadContentData = async () => {
      // Only load if contents array is empty
      if (contents.length === 0) {
        try {
          const loadedContents = await ContentService.getContents();
          setContents(loadedContents);
        } catch (error) {
          console.error('Error loading content data for dashboard:', error);
        }
      }
    };

    loadContentData();
  }, [contents.length, setContents]);

  // Fetch active tasks count
  useEffect(() => {
    const fetchTaskCount = async () => {
      try {
        const activeTasks = await TaskService.getActiveTasks();
        setRemainingTasksCount(activeTasks.length);
      } catch (error) {
        console.error('Error fetching task count for dashboard:', error);
        setRemainingTasksCount(0);
      }
    };

    fetchTaskCount();
    
    // Update task count every minute
    const interval = setInterval(fetchTaskCount, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    const totalContent = contents.length;
    const pendingCount = contents.filter(c => c.current_stage === 0).length;
    const inProgressCount = contents.filter(c => c.current_stage > 0 && c.current_stage < 11).length;
    const publishedCount = contents.filter(c => c.current_stage === 11).length;
    
    const completionRate = totalContent > 0 ? (publishedCount / totalContent) * 100 : 0;

    return {
      totalContent,
      pendingCount,
      inProgressCount,
      publishedCount,
      remainingTasksCount,
      completionRate
    };
  }, [contents, remainingTasksCount]);
}