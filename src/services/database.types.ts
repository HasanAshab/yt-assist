// Database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      contents: {
        Row: {
          id: string;
          topic: string;
          category: 'Demanding' | 'Innovative';
          current_stage: number;
          title: string | null;
          script: string | null;
          final_checks: FinalCheck[];
          publish_after: string | null;
          publish_before: string | null;
          link: string | null;
          morals: string[];
          flags: ContentFlag[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic: string;
          category: 'Demanding' | 'Innovative';
          current_stage?: number;
          title?: string | null;
          script?: string | null;
          final_checks?: FinalCheck[];
          publish_after?: string | null;
          publish_before?: string | null;
          link?: string | null;
          morals?: string[];
          flags?: ContentFlag[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic?: string;
          category?: 'Demanding' | 'Innovative';
          current_stage?: number;
          title?: string | null;
          script?: string | null;
          final_checks?: FinalCheck[];
          publish_after?: string | null;
          publish_before?: string | null;
          link?: string | null;
          morals?: string[];
          flags?: ContentFlag[];
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          link: string | null;
          type: 'user' | 'system';
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          link?: string | null;
          type: 'user' | 'system';
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          link?: string | null;
          type?: 'user' | 'system';
          created_at?: string;
          expires_at?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: any;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: any;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: any;
          updated_at?: string;
        };
      };
    };
    Functions: {
      create_feedback_tasks: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
      cleanup_expired_tasks: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
  };
}

// Supporting types
export interface FinalCheck {
  id: string;
  description: string;
  completed: boolean;
}

export type ContentFlag = 
  | 'fans_feedback_analysed'
  | 'overall_feedback_analysed';

export type TaskType = 'user' | 'system';
export type ContentCategory = 'Demanding' | 'Innovative';