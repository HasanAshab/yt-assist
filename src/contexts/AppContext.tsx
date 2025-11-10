import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { AppState, Content, Task, Settings, ContentFilters } from '../types';

// Action types
type AppAction =
  | { type: 'SET_CONTENTS'; payload: Content[] }
  | { type: 'ADD_CONTENT'; payload: Content }
  | { type: 'UPDATE_CONTENT'; payload: Content }
  | { type: 'DELETE_CONTENT'; payload: string }
  | { type: 'SET_FILTERS'; payload: Partial<ContentFilters> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TASK_LOADING'; payload: boolean }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string };

// Initial state
const initialState: AppState = {
  contents: {
    items: [],
    filters: {},
    loading: false
  },
  tasks: {
    items: [],
    loading: false
  },
  settings: {
    defaultFinalChecks: [
      'Content reviewed for accuracy',
      'SEO optimization completed',
      'Thumbnail approved',
      'Description finalized',
      'Tags and categories set'
    ],
    taskExpiryHour: 0,
    maxSuggestions: 2
  }
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONTENTS':
      return {
        ...state,
        contents: {
          ...state.contents,
          items: action.payload,
          loading: false
        }
      };
    
    case 'ADD_CONTENT':
      return {
        ...state,
        contents: {
          ...state.contents,
          items: [...state.contents.items, action.payload]
        }
      };
    
    case 'UPDATE_CONTENT':
      return {
        ...state,
        contents: {
          ...state.contents,
          items: state.contents.items.map(item =>
            item.id === action.payload.id ? action.payload : item
          )
        }
      };
    
    case 'DELETE_CONTENT':
      return {
        ...state,
        contents: {
          ...state.contents,
          items: state.contents.items.filter(item => item.id !== action.payload)
        }
      };
    
    case 'SET_FILTERS':
      return {
        ...state,
        contents: {
          ...state.contents,
          filters: { ...state.contents.filters, ...action.payload }
        }
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        contents: {
          ...state.contents,
          loading: action.payload
        }
      };
    
    case 'SET_TASKS':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: action.payload,
          loading: false
        }
      };
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: [...state.tasks.items, action.payload]
        }
      };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: state.tasks.items.map(item =>
            item.id === action.payload.id ? action.payload : item
          )
        }
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          items: state.tasks.items.filter(item => item.id !== action.payload)
        }
      };
    
    case 'SET_TASK_LOADING':
      return {
        ...state,
        tasks: {
          ...state.tasks,
          loading: action.payload
        }
      };
    
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const contextValue: AppContextType = {
    state,
    dispatch
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Keep the old useApp for backward compatibility
export function useApp() {
  return { version: '1.0.0' };
}