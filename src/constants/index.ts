// Content pipeline stages
export const CONTENT_STAGES = [
  'Pending',      // 0
  'Title',        // 1
  'Thumbnail',    // 2
  'ToC',          // 3
  'Ordered',      // 4
  'Scripted',     // 5
  'Recorded',     // 6
  'Voice Edited', // 7
  'Edited',       // 8
  'Revised',      // 9
  'SEO Optimised',// 10
  'Published'     // 11
] as const;

// Content categories (suggestions - any string is allowed)
export const CONTENT_CATEGORIES = ['Demanding', 'Innovative', 'Farmer', 'Educational', 'Entertainment', 'Tutorial', 'Review', 'News', 'Opinion'] as const;

// Default final checks for new content
export const DEFAULT_FINAL_CHECKS = [];

// Application routes
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  CONTENT: '/content',
  CONTENT_MANAGEMENT: '/content/manage',
  TASKS: '/tasks',
  MORALS: '/morals',
  SETTINGS: '/settings'
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'yt_assist_auth',
  USER_PREFERENCES: 'yt_assist_preferences'
} as const;

// API endpoints and configuration
export const API_CONFIG = {
  SUPABASE_URL: import.meta.env.VITE_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || ''
} as const;

// Stage validation requirements
export const STAGE_REQUIREMENTS = {
  TITLE_REQUIRED_STAGE: 1,
  SCRIPT_REQUIRED_STAGE: 5,
  LINK_REQUIRED_STAGE: 11, // Published
  FINAL_CHECKS_REQUIRED_STAGE: 11
} as const;

// Task configuration
export const TASK_CONFIG = {
  FANS_FEEDBACK_DAYS: 2,
  OVERALL_FEEDBACK_DAYS: 10,
  TASK_EXPIRY_HOUR: 0, // 00:00 (midnight)
  MAX_SUGGESTIONS: 2
} as const;

// Content flags
export const CONTENT_FLAGS = {
  FANS_FEEDBACK_ANALYSED: 'fans_feedback_analysed',
  OVERALL_FEEDBACK_ANALYSED: 'overall_feedback_analysed'
} as const;

// Form validation constants
export const VALIDATION_RULES = {
  MIN_TOPIC_LENGTH: 3,
  MAX_TOPIC_LENGTH: 100,
  MIN_TITLE_LENGTH: 5,
  MAX_TITLE_LENGTH: 200,
  MIN_SCRIPT_LENGTH: 50,
  MAX_MORALS_COUNT: 10
} as const;

// UI constants
export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
  LOADING_DELAY: 200
} as const;