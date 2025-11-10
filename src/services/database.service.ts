import { supabase, handleSupabaseError } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type ContentRow = Tables['contents']['Row'];
type TaskRow = Tables['tasks']['Row'];
type SettingRow = Tables['settings']['Row'];

/**
 * Database service for managing Supabase operations
 */
export class DatabaseService {
  /**
   * Initialize database with required data
   */
  static async initialize(): Promise<void> {
    try {
      // Check if default settings exist, create if not
      const { data: settings, error } = await supabase
        .from('settings')
        .select('key')
        .eq('key', 'default_final_checks')
        .single();

      if (error && error.code === 'PGRST116') {
        // Setting doesn't exist, create it
        await supabase
          .from('settings')
          .insert({
            key: 'default_final_checks',
            value: [
              'Content reviewed for accuracy',
              'SEO optimization completed', 
              'Thumbnail approved',
              'Description finalized',
              'Tags and categories set'
            ]
          });
      }
    } catch (error) {
      console.warn('Database initialization warning:', error);
    }
  }

  /**
   * Run automated task generation function
   */
  static async createFeedbackTasks(): Promise<void> {
    try {
      const { error } = await supabase.rpc('create_feedback_tasks');
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Clean up expired tasks
   */
  static async cleanupExpiredTasks(): Promise<void> {
    try {
      const { error } = await supabase.rpc('cleanup_expired_tasks');
      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Get all contents with optional filtering
   */
  static async getContents(filters?: {
    category?: string;
    stage?: number;
    search?: string;
  }): Promise<ContentRow[]> {
    try {
      let query = supabase
        .from('contents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.stage !== undefined) {
        query = query.eq('current_stage', filters.stage);
      }

      if (filters?.search) {
        query = query.ilike('topic', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  /**
   * Get content by ID
   */
  static async getContentById(id: string): Promise<ContentRow | null> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      handleSupabaseError(error);
      return null;
    }
  }

  /**
   * Get content by topic
   */
  static async getContentByTopic(topic: string): Promise<ContentRow | null> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .eq('topic', topic)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      handleSupabaseError(error);
      return null;
    }
  }

  /**
   * Create new content
   */
  static async createContent(content: Tables['contents']['Insert']): Promise<ContentRow> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .insert(content)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Update content
   */
  static async updateContent(id: string, updates: Tables['contents']['Update']): Promise<ContentRow> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Delete content
   */
  static async deleteContent(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Bulk delete published contents
   */
  static async bulkDeletePublishedContents(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .delete()
        .eq('current_stage', 11) // Published stage
        .select('id');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      handleSupabaseError(error);
      return 0;
    }
  }

  /**
   * Get all tasks
   */
  static async getTasks(): Promise<TaskRow[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  /**
   * Create new task
   */
  static async createTask(task: Tables['tasks']['Insert']): Promise<TaskRow> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleSupabaseError(error);
      throw error;
    }
  }

  /**
   * Complete task (delete it)
   */
  static async completeTask(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Get setting by key
   */
  static async getSetting(key: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data?.value || null;
    } catch (error) {
      handleSupabaseError(error);
      return null;
    }
  }

  /**
   * Update setting
   */
  static async updateSetting(key: string, value: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value })
        .select()
        .single();

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error);
    }
  }

  /**
   * Get dashboard metrics
   */
  static async getDashboardMetrics(): Promise<{
    pendingCount: number;
    inProgressCount: number;
    publishedCount: number;
    todayTasksCount: number;
  }> {
    try {
      const [contentsResult, tasksResult] = await Promise.all([
        supabase.from('contents').select('current_stage'),
        supabase.from('tasks').select('id').gte('expires_at', new Date().toISOString())
      ]);

      const contents = contentsResult.data || [];
      const tasks = tasksResult.data || [];

      return {
        pendingCount: contents.filter(c => c.current_stage === 0).length,
        inProgressCount: contents.filter(c => c.current_stage > 0 && c.current_stage < 11).length,
        publishedCount: contents.filter(c => c.current_stage === 11).length,
        todayTasksCount: tasks.length
      };
    } catch (error) {
      handleSupabaseError(error);
      return {
        pendingCount: 0,
        inProgressCount: 0,
        publishedCount: 0,
        todayTasksCount: 0
      };
    }
  }

  /**
   * Get publication suggestions (top 2 contents closest to published)
   */
  static async getPublicationSuggestions(): Promise<ContentRow[]> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('*')
        .lt('current_stage', 11) // Not yet published
        .order('current_stage', { ascending: false })
        .limit(2);

      if (error) throw error;

      // Filter out contents with unmet publish_after dependencies
      const suggestions = [];
      for (const content of data || []) {
        if (content.publish_after) {
          const dependency = await this.getContentByTopic(content.publish_after);
          if (!dependency || dependency.current_stage !== 11) {
            continue; // Skip if dependency not published
          }
        }
        suggestions.push(content);
      }

      return suggestions.slice(0, 2);
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }

  /**
   * Get all morals from all content
   */
  static async getAllMorals(): Promise<Array<{ moral: string; topic: string }>> {
    try {
      const { data, error } = await supabase
        .from('contents')
        .select('topic, morals')
        .not('morals', 'eq', '{}');

      if (error) throw error;

      const morals: Array<{ moral: string; topic: string }> = [];
      
      for (const content of data || []) {
        for (const moral of content.morals) {
          morals.push({ moral, topic: content.topic });
        }
      }

      return morals;
    } catch (error) {
      handleSupabaseError(error);
      return [];
    }
  }
}