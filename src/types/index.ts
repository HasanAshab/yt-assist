// Content types
export interface Content {
  id: string;
  topic: string;
  title?: string;
  category: 'Demanding' | 'Innovative';
  current_stage: number;
  script?: string;
  link?: string;
  final_checks?: Array<{ id: string; text: string; completed: boolean }>;
  created_at: string;
  updated_at: string;
  publish_after?: string;
  publish_before?: string;
  morals?: string[];
  flags?: ContentFlag[];
}

export interface ContentFilters {
  category?: 'Demanding' | 'Innovative';
  stage?: number;
  search?: string;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  type?: 'user' | 'system';
  link?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  due_date?: string;
  link?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  preferences?: UserPreferences;
  isAuthenticated: boolean;
  lastAuthTime: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  notifications?: boolean;
  defaultCategory?: 'Demanding' | 'Innovative';
}

// Settings types
export interface Settings {
  defaultFinalChecks: string[];
  taskExpiryHour: number;
  maxSuggestions: number;
}

// Moral types
export interface Moral {
  id: string;
  title: string;
  description: string;
  category: string;
  active: boolean;
  created_at: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

// Form types
export interface ContentFormData {
  topic: string;
  category: 'Demanding' | 'Innovative';
  title?: string;
  script?: string;
  link?: string;
  morals?: string[];
  publish_after?: string;
  publish_before?: string;
}

export interface FinalCheck {
  id: string;
  text: string;
  description?: string; // For compatibility with database
  completed: boolean;
}

// State types
export interface ContentState {
  items: Content[];
  filters: ContentFilters;
  loading: boolean;
  error?: string;
}

export interface TaskState {
  items: Task[];
  loading: boolean;
  error?: string;
}

export interface AppState {
  contents: ContentState;
  tasks: TaskState;
  user?: User;
  settings: Settings;
}

// Additional types
export type ContentFlag = 
  | 'fans_feedback_analysed'
  | 'overall_feedback_analysed';

export interface ContentSuggestion {
  id: string;
  type: 'dependency' | 'moral' | 'stage';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  contentId?: string;
  content?: Content; // For backward compatibility
  score?: number;
  blockedBy?: string[];
  remainingSteps?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ContentDependency {
  id: string;
  contentTopic: string;
  dependsOn: string[];
  dependent: string;
}

// Action types for reducers
export interface ContentAction {
  type: 'SET_CONTENTS' | 'ADD_CONTENT' | 'UPDATE_CONTENT' | 'DELETE_CONTENT' | 'SET_LOADING' | 'SET_ERROR' | 'SET_FILTERS';
  payload?: any;
}

export interface TaskAction {
  type: 'SET_TASKS' | 'ADD_TASK' | 'UPDATE_TASK' | 'DELETE_TASK' | 'SET_LOADING' | 'SET_ERROR';
  payload?: any;
}

export interface UserAction {
  type: 'SET_AUTHENTICATED' | 'SET_LAST_AUTH_TIME' | 'LOGOUT' | 'SET_USER_PREFERENCES';
  payload?: any;
}

export interface SettingsAction {
  type: 'SET_SETTINGS' | 'UPDATE_SETTING' | 'SET_DEFAULT_FINAL_CHECKS' | 'UPDATE_SETTINGS';
  payload?: any;
}