import type { Task, TaskFormData } from '../types';
import { supabase, TABLES, handleSupabaseError, checkDatabaseConnection } from './supabase';

export class TaskService {
  static async getActiveTasks(): Promise<Task[]> {
    try {
      // Check database connection first
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database. Please check your connection and try again.');
      }

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error);
      }

      // Transform database rows to Task objects
      return (data || []).map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        completed: false, // Tasks are removed when completed, so active tasks are not completed
        created_at: row.created_at,
        updated_at: row.created_at, // Use created_at as updated_at since we don't track updates
        expires_at: row.expires_at,
        due_date: row.expires_at,
        type: row.type,
        link: row.link || undefined
      }));
    } catch (error) {
      console.error('Error fetching active tasks:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch tasks from database');
    }
  }

  static async createTask(taskData: TaskFormData, type: 'user' | 'system'): Promise<Task> {
    try {
      // Check database connection first
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database. Please check your connection and try again.');
      }

      const expiresAt = taskData.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .insert({
          title: taskData.title,
          description: taskData.description || null,
          type,
          expires_at: expiresAt,
          link: taskData.link || null
        })
        .select()
        .single();

      if (error) {
        handleSupabaseError(error);
      }

      if (!data) {
        throw new Error('Failed to create task - no data returned');
      }

      // Transform database row to Task object
      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        completed: false,
        created_at: data.created_at,
        updated_at: data.created_at,
        expires_at: data.expires_at,
        due_date: data.expires_at,
        type: data.type,
        link: data.link || undefined
      };
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create task in database');
    }
  }

  static async completeTask(taskId: string): Promise<void> {
    try {
      // Check database connection first
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database. Please check your connection and try again.');
      }

      const { error } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .eq('id', taskId);

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to complete task in database');
    }
  }

  static async cleanupExpiredTasks(): Promise<void> {
    try {
      // Check database connection first
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database. Please check your connection and try again.');
      }

      const { error } = await supabase
        .from(TABLES.TASKS)
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        handleSupabaseError(error);
      }
    } catch (error) {
      console.error('Error cleaning up expired tasks:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to cleanup expired tasks in database');
    }
  }

  static async getTaskStatistics() {
    try {
      // Check database connection first
      const isConnected = await checkDatabaseConnection();
      if (!isConnected) {
        throw new Error('Failed to connect to database. Please check your connection and try again.');
      }

      const now = new Date().toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Get all tasks
      const { data: allTasks, error: allError } = await supabase
        .from(TABLES.TASKS)
        .select('type, expires_at, created_at');

      if (allError) {
        handleSupabaseError(allError);
      }

      const tasks = allTasks || [];
      const activeTasks = tasks.filter(task => task.expires_at > now);
      const expiredTasks = tasks.filter(task => task.expires_at <= now);
      const userTasks = activeTasks.filter(task => task.type === 'user');
      const systemTasks = activeTasks.filter(task => task.type === 'system');
      const todaysTasks = activeTasks.filter(task => {
        const expiresAt = new Date(task.expires_at);
        return expiresAt >= todayStart && expiresAt <= todayEnd;
      });

      return {
        total: tasks.length,
        active: activeTasks.length,
        expired: expiredTasks.length,
        userTasks: userTasks.length,
        systemTasks: systemTasks.length,
        todaysTasks: todaysTasks.length
      };
    } catch (error) {
      console.error('Error getting task statistics:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get task statistics from database');
    }
  }

  static validateTaskData(taskData: TaskFormData) {
    const errors: string[] = [];

    if (!taskData.title?.trim()) {
      errors.push('Title is required');
    }

    if (taskData.title && taskData.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static handleTaskRedirection(task: Task) {
    if (task.link) {
      window.open(task.link, '_blank');
    }
  }

  static getTimeUntilExpiration(task: Task) {
    const now = new Date();
    const expirationDate = new Date(task.expires_at || task.due_date || now);
    const timeDiff = expirationDate.getTime() - now.getTime();

    if (timeDiff <= 0) {
      return {
        isExpired: true,
        hours: 0,
        minutes: 0,
        totalMinutes: 0
      };
    }

    const totalMinutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      isExpired: false,
      hours,
      minutes,
      totalMinutes
    };
  }

  static isTaskExpired(task: Task): boolean {
    const now = new Date();
    const expirationDate = new Date(task.expires_at || task.due_date || now);
    return expirationDate.getTime() <= now.getTime();
  }
}