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
  morals?: string[];
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
}

export interface FinalCheck {
  id: string;
  text: string;
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