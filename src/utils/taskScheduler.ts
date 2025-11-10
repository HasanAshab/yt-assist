import { SystemTaskService } from '../services/systemTask.service';
import { TASK_CONFIG } from '../constants';

/**
 * Task scheduler utility for running automated system tasks
 */
export class TaskScheduler {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Start the daily task scheduler
   */
  static start(): void {
    if (this.isRunning) {
      console.warn('Task scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting task scheduler...');

    // Calculate time until next midnight
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(now.getDate() + 1);
    nextMidnight.setHours(TASK_CONFIG.TASK_EXPIRY_HOUR, 0, 0, 0);
    
    const timeUntilMidnight = nextMidnight.getTime() - now.getTime();

    // Set initial timeout to run at next midnight
    setTimeout(() => {
      this.runDailyTasks();
      
      // Then set up daily interval (24 hours)
      this.intervalId = setInterval(() => {
        this.runDailyTasks();
      }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    }, timeUntilMidnight);

    console.log(`Task scheduler will run in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes at midnight`);
  }

  /**
   * Stop the daily task scheduler
   */
  static stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Task scheduler stopped');
  }

  /**
   * Check if scheduler is running
   */
  static isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Run daily tasks manually (for testing or immediate execution)
   */
  static async runDailyTasks(): Promise<void> {
    try {
      console.log('Running daily automated tasks...');
      const startTime = Date.now();

      await SystemTaskService.scheduleDailyTaskRunner();

      const duration = Date.now() - startTime;
      console.log(`Daily tasks completed in ${duration}ms`);
    } catch (error) {
      console.error('Error running daily tasks:', error);
    }
  }

  /**
   * Get scheduler status
   */
  static getStatus(): {
    isRunning: boolean;
    nextRunTime: Date | null;
  } {
    let nextRunTime: Date | null = null;

    if (this.isRunning) {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setDate(now.getDate() + 1);
      nextMidnight.setHours(TASK_CONFIG.TASK_EXPIRY_HOUR, 0, 0, 0);
      nextRunTime = nextMidnight;
    }

    return {
      isRunning: this.isRunning,
      nextRunTime
    };
  }

  /**
   * Initialize scheduler on app startup
   */
  static initialize(): void {
    // Auto-start scheduler when app loads
    this.start();

    // Handle page visibility changes to restart scheduler if needed
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && !this.isRunning) {
          console.log('Page became visible, restarting task scheduler...');
          this.start();
        }
      });
    }

    // Handle beforeunload to clean up
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stop();
      });
    }
  }
}

/**
 * Browser-based task scheduler that uses setTimeout/setInterval
 * This is a fallback for environments where proper cron jobs aren't available
 */
export class BrowserTaskScheduler {
  private static checkInterval: NodeJS.Timeout | null = null;
  private static lastCheckDate: string | null = null;

  /**
   * Start checking for daily tasks every hour
   */
  static start(): void {
    if (this.checkInterval) {
      console.warn('Browser task scheduler is already running');
      return;
    }

    console.log('Starting browser-based task scheduler...');
    
    // Check immediately
    this.checkAndRunDailyTasks();
    
    // Then check every hour
    this.checkInterval = setInterval(() => {
      this.checkAndRunDailyTasks();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop the browser task scheduler
   */
  static stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Browser task scheduler stopped');
  }

  /**
   * Check if we need to run daily tasks
   */
  private static async checkAndRunDailyTasks(): Promise<void> {
    try {
      const today = new Date().toDateString();
      
      // Get last check date from localStorage
      const storedLastCheck = localStorage.getItem('yt_assist_last_task_check');
      
      // If we haven't checked today, run the tasks
      if (storedLastCheck !== today) {
        console.log('Running daily tasks (browser scheduler)...');
        await SystemTaskService.scheduleDailyTaskRunner();
        
        // Update last check date
        localStorage.setItem('yt_assist_last_task_check', today);
        this.lastCheckDate = today;
      }
    } catch (error) {
      console.error('Error in browser task scheduler:', error);
    }
  }

  /**
   * Initialize browser scheduler
   */
  static initialize(): void {
    // Start the scheduler
    this.start();

    // Handle page visibility changes
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          // Check for tasks when page becomes visible
          this.checkAndRunDailyTasks();
        }
      });
    }

    // Handle beforeunload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.stop();
      });
    }
  }

  /**
   * Force run daily tasks
   */
  static async forceRunDailyTasks(): Promise<void> {
    try {
      console.log('Force running daily tasks...');
      await SystemTaskService.scheduleDailyTaskRunner();
      
      // Update last check date
      const today = new Date().toDateString();
      localStorage.setItem('yt_assist_last_task_check', today);
      this.lastCheckDate = today;
    } catch (error) {
      console.error('Error force running daily tasks:', error);
      throw error;
    }
  }
}