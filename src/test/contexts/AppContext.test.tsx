import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '../../contexts/AppContext';
import { Content } from '../../types';

// Test component to access context
const TestComponent = () => {
  const { state, dispatch } = useAppContext();
  
  return (
    <div>
      <div data-testid="auth-status">
        {state.user.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="contents-count">{state.contents.items.length}</div>
      <div data-testid="tasks-count">{state.tasks.items.length}</div>
      <button
        data-testid="login-button"
        onClick={() => dispatch({ type: 'SET_AUTHENTICATED', payload: true })}
      >
        Login
      </button>
      <button
        data-testid="add-content-button"
        onClick={() => dispatch({
          type: 'ADD_CONTENT',
          payload: {
            id: '1',
            topic: 'Test Content',
            category: 'Demanding',
            current_stage: 0,
            final_checks: [],
            morals: [],
            flags: [],
            created_at: '2023-01-01T00:00:00Z',
            updated_at: '2023-01-01T00:00:00Z',
          } as Content
        })}
      >
        Add Content
      </button>
    </div>
  );
};

describe('AppContext', () => {
  it('should provide initial state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('not-authenticated');
    expect(screen.getByTestId('contents-count')).toHaveTextContent('0');
    expect(screen.getByTestId('tasks-count')).toHaveTextContent('0');
  });

  it('should handle user authentication', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('login-button').click();
    });

    expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
  });

  it('should handle content addition', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByTestId('add-content-button').click();
    });

    expect(screen.getByTestId('contents-count')).toHaveTextContent('1');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = () => {};

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAppContext must be used within an AppProvider');

    console.error = originalError;
  });
});