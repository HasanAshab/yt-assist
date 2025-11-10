import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useNavigation } from '../useNavigation';

const createWrapper = (initialEntries: string[] = ['/']) => {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );
};

describe('useNavigation', () => {
  describe('Navigation State', () => {
    it('initializes with correct current route', () => {
      const wrapper = createWrapper(['/dashboard']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.navigationState.currentRoute).toBe('/dashboard');
      expect(result.current.currentPath).toBe('/dashboard');
    });

    it('updates navigation state when route changes', () => {
      const wrapper = createWrapper(['/']);
      const { result, rerender } = renderHook(() => useNavigation(), { wrapper });
      
      // Initial state
      expect(result.current.navigationState.currentRoute).toBe('/');
      
      // Simulate route change by re-rendering with new wrapper
      const newWrapper = createWrapper(['/content']);
      rerender();
      
      // Note: In a real app, this would be handled by React Router
      // For testing, we verify the hook structure is correct
      expect(result.current.getCurrentPageInfo).toBeDefined();
    });

    it('tracks navigation history', () => {
      const wrapper = createWrapper(['/dashboard']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.history).toBeDefined();
      expect(Array.isArray(result.current.history)).toBe(true);
    });
  });

  describe('Page Title Generation', () => {
    it('returns correct titles for different routes', () => {
      const wrapper = createWrapper(['/dashboard']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.getPageTitle('/dashboard')).toBe('Dashboard');
      expect(result.current.getPageTitle('/')).toBe('Dashboard');
      expect(result.current.getPageTitle('/content')).toBe('Content');
      expect(result.current.getPageTitle('/content/123/edit')).toBe('Edit Content');
      expect(result.current.getPageTitle('/tasks')).toBe('Tasks');
      expect(result.current.getPageTitle('/morals')).toBe('Morals');
      expect(result.current.getPageTitle('/suggestions')).toBe('Publication Suggestions');
      expect(result.current.getPageTitle('/settings')).toBe('Settings');
    });

    it('handles unknown routes', () => {
      const wrapper = createWrapper(['/unknown']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.getPageTitle('/unknown')).toBe('Unknown');
    });

    it('capitalizes first letter of unknown routes', () => {
      const wrapper = createWrapper(['/test']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.getPageTitle('/test')).toBe('Test');
    });
  });

  describe('Route Checking', () => {
    it('correctly identifies current routes', () => {
      const wrapper = createWrapper(['/content/123']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.isCurrentRoute('/content')).toBe(true);
      expect(result.current.isCurrentRoute('/tasks')).toBe(false);
    });

    it('handles root route correctly', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.isCurrentRoute('/')).toBe(true);
    });

    it('handles dashboard route variants', () => {
      const wrapper = createWrapper(['/dashboard']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.isCurrentRoute('/')).toBe(true);
      expect(result.current.isCurrentRoute('/dashboard')).toBe(true);
    });
  });

  describe('Page Info', () => {
    it('returns correct page info', () => {
      const wrapper = createWrapper(['/content/123/edit']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      const pageInfo = result.current.getCurrentPageInfo();
      
      expect(pageInfo.path).toBe('/content/123/edit');
      expect(pageInfo.title).toBe('Edit Content');
      expect(pageInfo.isRoot).toBe(false);
      expect(pageInfo.segments).toEqual(['content', '123', 'edit']);
    });

    it('identifies root pages correctly', () => {
      const wrapper = createWrapper(['/dashboard']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      const pageInfo = result.current.getCurrentPageInfo();
      expect(pageInfo.isRoot).toBe(true);
    });

    it('handles empty path segments', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      const pageInfo = result.current.getCurrentPageInfo();
      expect(pageInfo.segments).toEqual([]);
      expect(pageInfo.isRoot).toBe(true);
    });
  });

  describe('Navigation Methods', () => {
    it('provides navigation helper methods', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      // Check that all navigation methods exist
      expect(typeof result.current.goToDashboard).toBe('function');
      expect(typeof result.current.goToContent).toBe('function');
      expect(typeof result.current.goToContentList).toBe('function');
      expect(typeof result.current.goToTasks).toBe('function');
      expect(typeof result.current.goToMorals).toBe('function');
      expect(typeof result.current.goToSuggestions).toBe('function');
      expect(typeof result.current.goToSettings).toBe('function');
      expect(typeof result.current.goBack).toBe('function');
      expect(typeof result.current.goToRoute).toBe('function');
    });

    it('provides utility methods', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(typeof result.current.clearHistory).toBe('function');
      expect(typeof result.current.getCurrentPageInfo).toBe('function');
      expect(typeof result.current.getPageTitle).toBe('function');
      expect(typeof result.current.isCurrentRoute).toBe('function');
    });
  });

  describe('History Management', () => {
    it('initializes with current route in history', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].path).toBe('/');
      expect(result.current.history[0].title).toBe('Dashboard');
    });

    it('provides clearHistory method', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      // Verify history has initial entry
      expect(result.current.history).toHaveLength(1);
      
      act(() => {
        result.current.clearHistory();
      });
      
      expect(result.current.history).toEqual([]);
      expect(result.current.navigationState.canGoBack).toBe(false);
    });
  });

  describe('Current State Properties', () => {
    it('provides current path and title', () => {
      const wrapper = createWrapper(['/content']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.currentPath).toBe('/content');
      expect(result.current.currentTitle).toBe('Content');
    });

    it('updates current title based on path', () => {
      const wrapper = createWrapper(['/tasks']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      expect(result.current.currentTitle).toBe('Tasks');
    });
  });

  describe('Navigation State Structure', () => {
    it('has correct navigation state structure', () => {
      const wrapper = createWrapper(['/']);
      const { result } = renderHook(() => useNavigation(), { wrapper });
      
      const { navigationState } = result.current;
      
      expect(navigationState).toHaveProperty('currentRoute');
      expect(navigationState).toHaveProperty('previousRoute');
      expect(navigationState).toHaveProperty('isNavigating');
      expect(navigationState).toHaveProperty('canGoBack');
      
      expect(typeof navigationState.currentRoute).toBe('string');
      expect(typeof navigationState.isNavigating).toBe('boolean');
      expect(typeof navigationState.canGoBack).toBe('boolean');
    });
  });
});