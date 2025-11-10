import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { STORAGE_KEYS } from '../constants';

// Authentication state interface
interface AuthState {
  isAuthenticated: boolean;
  lastAuthTime: number;
  loading: boolean;
  error: string | null;
}

// Authentication actions
type AuthAction =
  | { type: 'SET_AUTHENTICATED'; payload: { isAuthenticated: boolean; timestamp: number } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  lastAuthTime: 0,
  loading: true,
  error: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload.isAuthenticated,
        lastAuthTime: action.payload.timestamp,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        lastAuthTime: 0,
        loading: false,
        error: null,
      };
    default:
      return state;
  }
}

// Context interface
interface AuthContextType {
  state: AuthState;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Simple password hash function (for demo purposes - in production use proper hashing)
function hashPassword(password: string): string {
  // Simple hash for demo - in production, use proper crypto libraries
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Expected password hash (in production, this would be stored securely)
const EXPECTED_PASSWORD_HASH = hashPassword(import.meta.env.VITE_APP_PASSWORD || 'ytassist2024');

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if user is authenticated from localStorage
  const checkAuthStatus = () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const authData = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (authData) {
        const { timestamp, hash } = JSON.parse(authData);
        const now = Date.now();
        const authAge = now - timestamp;
        
        // Check if auth is still valid (24 hours)
        const isValid = authAge < 24 * 60 * 60 * 1000 && hash === EXPECTED_PASSWORD_HASH;
        
        if (isValid) {
          dispatch({
            type: 'SET_AUTHENTICATED',
            payload: { isAuthenticated: true, timestamp },
          });
        } else {
          // Clear invalid auth data
          localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
          dispatch({
            type: 'SET_AUTHENTICATED',
            payload: { isAuthenticated: false, timestamp: 0 },
          });
        }
      } else {
        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: { isAuthenticated: false, timestamp: 0 },
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to check authentication status' });
    }
  };

  // Login function
  const login = async (password: string): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));

      const passwordHash = hashPassword(password);
      
      if (passwordHash === EXPECTED_PASSWORD_HASH) {
        const timestamp = Date.now();
        const authData = {
          timestamp,
          hash: passwordHash,
        };

        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, JSON.stringify(authData));

        dispatch({
          type: 'SET_AUTHENTICATED',
          payload: { isAuthenticated: true, timestamp },
        });

        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Invalid password' });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Login failed. Please try again.' });
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    dispatch({ type: 'LOGOUT' });
  };

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}