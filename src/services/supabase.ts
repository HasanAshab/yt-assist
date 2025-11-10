import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../constants';
import type { Database } from './database.types';

// Validate environment variables
if (!API_CONFIG.SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!API_CONFIG.SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with type safety
export const supabase = createClient<Database>(
  API_CONFIG.SUPABASE_URL,
  API_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // We handle auth manually with password
    },
    db: {
      schema: 'public'
    }
  }
);

// Database table names
export const TABLES = {
  CONTENTS: 'contents',
  TASKS: 'tasks',
  SETTINGS: 'settings'
} as const;

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  // Map common Supabase error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    'PGRST116': 'Record not found',
    '23505': 'A record with this value already exists',
    '23503': 'Cannot delete: record is referenced by other data',
    '23514': 'Data validation failed',
    '42P01': 'Database table not found - please check your database setup',
  };
  
  const userMessage = errorMessages[error.code] || error.message || 'An unexpected error occurred';
  throw new Error(userMessage);
};

// Utility function to check database connection
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('settings').select('key').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Utility function to get end of day timestamp for task expiration
export const getEndOfDay = (date: Date = new Date()): string => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.toISOString();
};

// Utility function to format content stage name
export const getStageDisplayName = (stageIndex: number): string => {
  const stages = [
    'Pending', 'Title', 'Thumbnail', 'ToC', 'Ordered', 'Scripted',
    'Recorded', 'Voice Edited', 'Edited', 'Revised', 'SEO Optimised', 'Published'
  ];
  return stages[stageIndex] || 'Unknown';
};

// Re-export types for convenience
export type { Database, FinalCheck, ContentFlag, TaskType, ContentCategory } from './database.types';

// Re-export services for convenience
export { DatabaseService } from './database.service';