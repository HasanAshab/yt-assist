import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { STORAGE_KEYS } from '../constants';

export const useAuth = () => {
  const { state, dispatch } = useAppContext();

  const login = useCallback((password: string) => {
    // Simple password validation - in a real app, this would be more secure
    const isValid = password === import.meta.env.VITE_APP_PASSWORD;
    
    if (isValid) {
      const authTime = Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, authTime.toString());
      
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      dispatch({ type: 'SET_LAST_AUTH_TIME', payload: authTime });
    }
    
    return isValid;
  }, [dispatch]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    dispatch({ type: 'LOGOUT' });
  }, [dispatch]);

  const checkAuthStatus = useCallback(() => {
    const authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    
    if (authToken) {
      const authTime = parseInt(authToken, 10);
      const isValid = !isNaN(authTime) && authTime > 0;
      
      if (isValid) {
        dispatch({ type: 'SET_AUTHENTICATED', payload: true });
        dispatch({ type: 'SET_LAST_AUTH_TIME', payload: authTime });
        return true;
      }
    }
    
    return false;
  }, [dispatch]);

  const isSessionValid = useCallback(() => {
    const { isAuthenticated, lastAuthTime } = state.user;
    
    if (!isAuthenticated || !lastAuthTime) {
      return false;
    }
    
    // Check if session is still valid (24 hours)
    const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();
    
    return (now - lastAuthTime) < sessionDuration;
  }, [state.user]);

  return {
    // State
    isAuthenticated: state.user.isAuthenticated,
    lastAuthTime: state.user.lastAuthTime,
    
    // Actions
    login,
    logout,
    checkAuthStatus,
    
    // Computed values
    isSessionValid: isSessionValid(),
  };
};