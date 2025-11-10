import { Task, Content, ContentFlag } from '../types';
import { TaskService } from './task.service';
import { ContentService } from './content.service';
import { TASK_CONFIG, CONTENT_FLAGS, CONTENT_STAGES } from '../constants';
import { getEndOfDay } from './supabase';

/**
 * Service for automated system task generation based on content analysis requirements
 */
export class SystemTaskService {
  /**
   * Check and create fans feedback analysis tasks for content published 2 days ago
   */
  static async checkAndCreateFansFeedbackTasks(): Promise<Task[]> {
    try {
      const publishedContents = await ContentService.getPublishedContents();
      const createdTasks: Task[] = [];
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - (TASK_CONFIG.FANS_FEEDBACK_DAYS * 24 * 60 * 60 * 1000));

      for (const content of publishedContents) {
        // Check if content was published 2+ days ago and doesn't have fans feedback flag
        const publishedDate = new Date(content.updated_at);
        const needsFansFeedback = publishedDate <= twoDaysAgo && 
          !content.flags.includes(CONTENT_FLAGS.FANS_FEEDBACK_ANALYSED as ContentFlag);

        if (needsFansFeedback) {
          // Check if task already exists
          const existingTasks = await TaskService.getTasksByType('system');
          const taskExists = existingTasks.some(task => 
            task.title.includes(`Analyse Fans Feedback on ${content.topic}`)
          );

          if (!taskExists) {
            const task = await this.createFansFeedbackTask(content);
            createdTasks.push(task);
          }
        }
      }

      return createdTasks;
    } catch (error) {
      console.error('Error checking fans feedback tasks:', error);
      throw error;
    }
  }

  /**
   * Check and create overall feedback analysis tasks for content published 10 days ago
   */
  static async checkAndCreateOverallFeedbackTasks(): Promise<Task[]> {
    try {
      const publishedContents = await ContentService.getPublishedContents();
      const createdTasks: Task[] = [];
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - (TASK_CONFIG.OVERALL_FEEDBACK_DAYS * 24 * 60 * 60 * 1000));

      for (const content of publishedContents) {
        // Check if content was published 10+ days ago and doesn't have overall feedback flag
        const publishedDate = new Date(content.updated_at);
        const needsOverallFeedback = publishedDate <= tenDaysAgo && 
          !content.flags.includes(CONTENT_FLAGS.OVERALL_FEEDBACK_ANALYSED as ContentFlag);

        if (needsOverallFeedback) {
          // Check if task already exists
          const existingTasks = await TaskService.getTasksByType('system');
          const taskExists = existingTasks.some(task => 
            task.title.includes(`Analyse Overall Feedback on ${content.topic}`)
          );

          if (!taskExists) {
            const task = await this.createOverallFeedbackTask(content);
            createdTasks.push(task);
          }
        }
      }

      return createdTasks;
    } catch (error) {
      console.error('Error checking overall feedback tasks:', error);
      throw error;
    }
  }

  /**
   * Create a fans feedback analysis task for specific content
   */
  static async createFansFeedbackTask(content: Content): Promise<Task> {
    try {
      const taskData = {
        title: `Analyse Fans Feedback on ${content.topic}`,
        description: `Review and analyze fan feedback for "${content.topic}" content. Check comments, engagement metrics, and audience response.`,
        link: `/content/edit/${content.id}` // Redirect to content edit page
      };

      return await TaskService.createTask(taskData, 'system');
    } catch (error) {
      console.error('Error creating fans feedback task:', error);
      throw error;
    }
  }

  /**
   * Create an overall feedback analysis task for specific content
   */
  static async createOverallFeedbackTask(content: Content): Promise<Task> {
    try {
      const taskData = {
        title: `Analyse Overall Feedback on ${content.topic}`,
        description: `Conduct comprehensive analysis of overall feedback for "${content.topic}" content. Review performance metrics, audience retention, and long-term impact.`,
        link: `/content/edit/${content.id}` // Redirect to content edit page
      };

      return await TaskService.createTask(taskData, 'system');
    } catch (error) {
      console.error('Error creating overall feedback task:', error);
      throw error;
    }
  }

  /**
   * Mark fans feedback as analyzed for content
   */
  static async markFansFeedbackAnalyzed(contentId: string): Promise<Content> {
    try {
      return await ContentService.addContentFlag(contentId, CONTENT_FLAGS.FANS_FEEDBACK_ANALYSED as ContentFlag);
    } catch (error) {
      console.error('Error marking fans feedback as analyzed:', error);
      throw error;
    }
  }

  /**
   * Mark overall feedback as analyzed for content
   */
  static async markOverallFeedbackAnalyzed(contentId: string): Promise<Content> {
    try {
      return await ContentService.addContentFlag(contentId, CONTENT_FLAGS.OVERALL_FEEDBACK_ANALYSED as ContentFlag);
    } catch (error) {
      console.error('Error marking overall feedback as analyzed:', error);
      throw error;
    }
  }

  /**
   * Run daily checks for both fans and overall feedback tasks
   */
  static async runDailyChecks(): Promise<{
    fansFeedbackTasks: Task[];
    overallFeedbackTasks: Task[];
    totalCreated: number;
  }> {
    try {
      const [fansFeedbackTasks, overallFeedbackTasks] = await Promise.all([
        this.checkAndCreateFansFeedbackTasks(),
        this.checkAndCreateOverallFeedbackTasks()
      ]);

      return {
        fansFeedbackTasks,
        overallFeedbackTasks,
        totalCreated: fansFeedbackTasks.length + overallFeedbackTasks.length
      };
    } catch (error) {
      console.error('Error running daily checks:', error);
      throw error;
    }
  }

  /**
   * Get all pending feedback analysis tasks
   */
  static async getPendingFeedbackTasks(): Promise<{
    fansFeedbackTasks: Task[];
    overallFeedbackTasks: Task[];
  }> {
    try {
      const systemTasks = await TaskService.getTasksByType('system');
      
      const fansFeedbackTasks = systemTasks.filter(task => 
        task.title.includes('Analyse Fans Feedback on')
      );
      
      const overallFeedbackTasks = systemTasks.filter(task => 
        task.title.includes('Analyse Overall Feedback on')
      );

      return {
        fansFeedbackTasks,
        overallFeedbackTasks
      };
    } catch (error) {
      console.error('Error getting pending feedback tasks:', error);
      return {
        fansFeedbackTasks: [],
        overallFeedbackTasks: []
      };
    }
  }

  /**
   * Handle completion of feedback analysis tasks
   */
  static async handleFeedbackTaskCompletion(taskId: string): Promise<void> {
    try {
      // Get the task to determine which type it is
      const allTasks = await TaskService.getAllTasks();
      const task = allTasks.find(t => t.id === taskId);
      
      if (!task) {
        throw new Error('Task not found');
      }

      // Extract content topic from task title
      let contentTopic: string | null = null;
      let isFansFeedback = false;
      let isOverallFeedback = false;

      if (task.title.includes('Analyse Fans Feedback on ')) {
        contentTopic = task.title.replace('Analyse Fans Feedback on ', '');
        isFansFeedback = true;
      } else if (task.title.includes('Analyse Overall Feedback on ')) {
        contentTopic = task.title.replace('Analyse Overall Feedback on ', '');
        isOverallFeedback = true;
      }

      if (contentTopic) {
        // Find the content by topic
        const content = await ContentService.getContentByTopic(contentTopic);
        if (content) {
          // Mark the appropriate flag as analyzed
          if (isFansFeedback) {
            await this.markFansFeedbackAnalyzed(content.id);
          } else if (isOverallFeedback) {
            await this.markOverallFeedbackAnalyzed(content.id);
          }
        }
      }

      // Complete the task (delete it)
      await TaskService.completeTask(taskId);
    } catch (error) {
      console.error('Error handling feedback task completion:', error);
      throw error;
    }
  }

  /**
   * Get content that needs feedback analysis
   */
  static async getContentNeedingFeedbackAnalysis(): Promise<{
    needsFansFeedback: Content[];
    needsOverallFeedback: Content[];
  }> {
    try {
      const publishedContents = await ContentService.getPublishedContents();
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - (TASK_CONFIG.FANS_FEEDBACK_DAYS * 24 * 60 * 60 * 1000));
      const tenDaysAgo = new Date(now.getTime() - (TASK_CONFIG.OVERALL_FEEDBACK_DAYS * 24 * 60 * 60 * 1000));

      const needsFansFeedback = publishedContents.filter(content => {
        const publishedDate = new Date(content.updated_at);
        return publishedDate <= twoDaysAgo && 
          !content.flags.includes(CONTENT_FLAGS.FANS_FEEDBACK_ANALYSED as ContentFlag);
      });

      const needsOverallFeedback = publishedContents.filter(content => {
        const publishedDate = new Date(content.updated_at);
        return publishedDate <= tenDaysAgo && 
          !content.flags.includes(CONTENT_FLAGS.OVERALL_FEEDBACK_ANALYSED as ContentFlag);
      });

      return {
        needsFansFeedback,
        needsOverallFeedback
      };
    } catch (error) {
      console.error('Error getting content needing feedback analysis:', error);
      return {
        needsFansFeedback: [],
        needsOverallFeedback: []
      };
    }
  }

  /**
   * Schedule daily task runner (to be called by a scheduler)
   */
  static async scheduleDailyTaskRunner(): Promise<void> {
    try {
      // This would typically be called by a cron job or scheduler
      // For now, we'll just run the daily checks
      const result = await this.runDailyChecks();
      
      console.log(`Daily task runner completed:`, {
        fansFeedbackTasksCreated: result.fansFeedbackTasks.length,
        overallFeedbackTasksCreated: result.overallFeedbackTasks.length,
        totalTasksCreated: result.totalCreated
      });

      // Also clean up expired tasks
      const expiredTasksDeleted = await TaskService.cleanupExpiredTasks();
      console.log(`Cleaned up ${expiredTasksDeleted} expired tasks`);
    } catch (error) {
      console.error('Error in scheduled daily task runner:', error);
      throw error;
    }
  }
}