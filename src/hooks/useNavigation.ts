import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationState {
  currentRoute: string;
  previousRoute: string | null;
  isNavigating: boolean;
  canGoBack: boolean;
}

interface NavigationHistory {
  path: string;
  timestamp: number;
  title?: string;
}

export const useNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentRoute: location.pathname,
    previousRoute: null,
    isNavigating: false,
    canGoBack: false
  });

  const [history, setHistory] = useState<NavigationHistory[]>([]);

  // Update navigation state when location changes
  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      previousRoute: prev.currentRoute,
      currentRoute: location.pathname,
      canGoBack: history.length > 1
    }));

    // Add to history
    setHistory(prev => {
      const newEntry: NavigationHistory = {
        path: location.pathname,
        timestamp: Date.now(),
        title: getPageTitle(location.pathname)
      };

      // Avoid duplicate consecutive entries
      if (prev.length > 0 && prev[prev.length - 1].path === location.pathname) {
        return prev;
      }

      // Keep only last 10 entries
      const newHistory = [...prev, newEntry];
      return newHistory.slice(-10);
    });
  }, [location.pathname]);

  // Get page title based on route
  const getPageTitle = (path: string): string => {
    const segments = path.split('/').filter(Boolean);
    
    if (segments.length === 0 || segments[0] === 'dashboard') {
      return 'Dashboard';
    }

    switch (segments[0]) {
      case 'content':
        if (segments.length > 2 && segments[2] === 'edit') {
          return 'Edit Content';
        }
        return 'Content';
      case 'tasks':
        return 'Tasks';
      case 'morals':
        return 'Morals';
      case 'suggestions':
        return 'Publication Suggestions';
      case 'settings':
        return 'Settings';
      default:
        return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
    }
  };

  // Navigation helpers
  const goBack = () => {
    if (history.length > 1) {
      const previousEntry = history[history.length - 2];
      navigate(previousEntry.path);
    } else {
      navigate('/dashboard');
    }
  };

  const goToRoute = (path: string, options?: { replace?: boolean }) => {
    setNavigationState(prev => ({ ...prev, isNavigating: true }));
    
    if (options?.replace) {
      navigate(path, { replace: true });
    } else {
      navigate(path);
    }
    
    // Reset navigating state after a short delay
    setTimeout(() => {
      setNavigationState(prev => ({ ...prev, isNavigating: false }));
    }, 100);
  };

  const goToContent = (contentId: string) => {
    goToRoute(`/content/${contentId}/edit`);
  };

  const goToDashboard = () => {
    goToRoute('/dashboard');
  };

  const goToContentList = () => {
    goToRoute('/content');
  };

  const goToTasks = () => {
    goToRoute('/tasks');
  };

  const goToMorals = () => {
    goToRoute('/morals');
  };

  const goToSuggestions = () => {
    goToRoute('/suggestions');
  };

  const goToSettings = () => {
    goToRoute('/settings');
  };

  // Check if current route matches pattern
  const isCurrentRoute = (pattern: string): boolean => {
    if (pattern === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(pattern);
  };

  // Get current page info
  const getCurrentPageInfo = () => ({
    path: location.pathname,
    title: getPageTitle(location.pathname),
    isRoot: location.pathname === '/' || location.pathname === '/dashboard',
    segments: location.pathname.split('/').filter(Boolean)
  });

  // Clear navigation history (useful for logout)
  const clearHistory = () => {
    setHistory([]);
    setNavigationState(prev => ({
      ...prev,
      previousRoute: null,
      canGoBack: false
    }));
  };

  return {
    // State
    navigationState,
    history,
    
    // Navigation methods
    goBack,
    goToRoute,
    goToContent,
    goToDashboard,
    goToContentList,
    goToTasks,
    goToMorals,
    goToSuggestions,
    goToSettings,
    
    // Utility methods
    isCurrentRoute,
    getCurrentPageInfo,
    getPageTitle,
    clearHistory,
    
    // Current location info
    currentPath: location.pathname,
    currentTitle: getPageTitle(location.pathname)
  };
};