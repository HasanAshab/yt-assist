import { useState, useEffect, useCallback } from 'react';
import { SystemTaskService } from '../services/systemTask.service';
import { TaskScheduler, BrowserTaskScheduler } from '../utils/taskScheduler';
import { useErrorHandler } from './useErrorHandler';
import type { Task, Content } from '../types';

interface SystemTasksState {
  pendingFeedbackTasks: {
    fansFeedbackTasks: Task[];
    overallFeedbackTasks: Task[];
  };
  contentNeedingAnalysis: {
    needsFansFeedback: Content[];
    needsOverallFeedback: Content[];
  };
  loading: boolean;
  lastCheckTime: Date | null;
}

interface SystemTasksActions {
  runDailyChecks: () => Promise<void>;
  handleFeedbackTaskCompletion: (taskId: string) => Promise<void>;
  markFansFeedbackAnalyzed: (contentId: string) => Promise<void>;
  markOverallFeedbackAnalyzed: (contentId: string) => Promise<void>;
  refreshPendingTasks: () => Promise<void>;
  startScheduler: () => void;
  stopScheduler: () => void;
  getSchedulerStatus: () => { isRunning: boolean; nextRunTime: Date | null };
  forceRunDailyTasks: () => Promise<void>;
}

/**
 * Custom hook for managing automated system tasks
 */
export function useSystemTasks(): SystemTasksState & SystemTasksActions {
  const [state, setState] = useState<SystemTasksState>({
    pendingFeedbackTasks: {
      fansFeedbackTasks: [],
      overallFeedbackTasks: []
    },
    contentNeedingAnalysis: {
      needsFansFeedback: [],
      needsOverallFeedback: []
    },
    loading: false,
    lastCheckTime: null
  });

  const { handleError } = useErrorHandler();

  /**
   * Load pending feedback tasks
   */
  const refreshPendingTasks = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const [pendingTasks, contentNeeding] = await Promise.all([
        SystemTaskService.getPendingFeedbackTasks(),
        SystemTaskService.getContentNeedingFeedbackAnalysis()
      ]);

      setState(prev => ({
        ...prev,
        pendingFeedbackTasks: pendingTasks,
        contentNeedingAnalysis: contentNeeding,
        loading: false,
        lastCheckTime: new Date()
      }));
    } catch (error) {
      handleError(error as Error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [handleError]);

  /**
   * Run daily checks manually
   */
  const runDailyChecks = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const result = await SystemTaskService.runDailyChecks();
      
      console.log('Daily checks completed:', {
        fansFeedbackTasksCreated: result.fansFeedbackTasks.length,
        overallFeedbackTasksCreated: result.overallFeedbackTasks.length,
        totalCreated: result.totalCreated
      });

      // Refresh pending tasks after running checks
      await refreshPendingTasks();
    } catch (error) {
      handleError(error as Error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [handleError, refreshPendingTasks]);

  /**
   * Handle completion of feedback analysis tasks
   */
  const handleFeedbackTaskCompletion = useCallback(async (taskId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await SystemTaskService.handleFeedbackTaskCompletion(taskId);
      
      // Refresh pending tasks after completion
      await refreshPendingTasks();
    } catch (error) {
      handleError(error as Error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [handleError, refreshPendingTasks]);

  /**
   * Mark fans feedback as analyzed
   */
  const markFansFeedbackAnalyzed = useCallback(async (contentId: string) => {
    try {
      await SystemTaskService.markFansFeedbackAnalyzed(contentId);
      await refreshPendingTasks();
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError, refreshPendingTasks]);

  /**
   * Mark overall feedback as analyzed
   */
  const markOverallFeedbackAnalyzed = useCallback(async (contentId: string) => {
    try {
      await SystemTaskService.markOverallFeedbackAnalyzed(contentId);
      await refreshPendingTasks();
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError, refreshPendingTasks]);

  /**
   * Start the task scheduler
   */
  const startScheduler = useCallback(() => {
    try {
      // Use browser scheduler for web environment
      BrowserTaskScheduler.start();
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError]);

  /**
   * Stop the task scheduler
   */
  const stopScheduler = useCallback(() => {
    try {
      BrowserTaskScheduler.stop();
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError]);

  /**
   * Get scheduler status
   */
  const getSchedulerStatus = useCallback(() => {
    return TaskScheduler.getStatus();
  }, []);

  /**
   * Force run daily tasks
   */
  const forceRunDailyTasks = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await BrowserTaskScheduler.forceRunDailyTasks();
      await refreshPendingTasks();
    } catch (error) {
      handleError(error as Error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [handleError, refreshPendingTasks]);

  /**
   * Initialize system tasks on mount
   */
  useEffect(() => {
    // Load initial data
    refreshPendingTasks();

    // Initialize browser scheduler
    BrowserTaskScheduler.initialize();

    // Cleanup on unmount
    return () => {
      BrowserTaskScheduler.stop();
    };
  }, [refreshPendingTasks]);

  /**
   * Set up periodic refresh of pending tasks
   */
  useEffect(() => {
    // Refresh pending tasks every 5 minutes
    const interval = setInterval(() => {
      refreshPendingTasks();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshPendingTasks]);

  return {
    ...state,
    runDailyChecks,
    handleFeedbackTaskCompletion,
    markFansFeedbackAnalyzed,
    markOverallFeedbackAnalyzed,
    refreshPendingTasks,
    startScheduler,
    stopScheduler,
    getSchedulerStatus,
    forceRunDailyTasks
  };
}

/**
 * Hook for system task statistics
 */
export function useSystemTaskStats() {
  const [stats, setStats] = useState({
    totalPendingFeedbackTasks: 0,
    fansFeedbackTasksCount: 0,
    overallFeedbackTasksCount: 0,
    contentNeedingFansAnalysis: 0,
    contentNeedingOverallAnalysis: 0,
    loading: false
  });

  const { handleError } = useErrorHandler();

  const refreshStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      const [pendingTasks, contentNeeding] = await Promise.all([
        SystemTaskService.getPendingFeedbackTasks(),
        SystemTaskService.getContentNeedingFeedbackAnalysis()
      ]);

      setStats({
        totalPendingFeedbackTasks: pendingTasks.fansFeedbackTasks.length + pendingTasks.overallFeedbackTasks.length,
        fansFeedbackTasksCount: pendingTasks.fansFeedbackTasks.length,
        overallFeedbackTasksCount: pendingTasks.overallFeedbackTasks.length,
        contentNeedingFansAnalysis: contentNeeding.needsFansFeedback.length,
        contentNeedingOverallAnalysis: contentNeeding.needsOverallFeedback.length,
        loading: false
      });
    } catch (error) {
      handleError(error as Error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [handleError]);

  useEffect(() => {
    refreshStats();

    // Refresh stats every 10 minutes
    const interval = setInterval(refreshStats, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    ...stats,
    refreshStats
  };
}