import { describe, it, expect } from 'vitest';
import { userReducer, UserState } from '../../contexts/reducers/userReducer';
import { UserAction } from '../../types';

const initialState: UserState = {
  isAuthenticated: false,
  lastAuthTime: 0,
};

describe('userReducer', () => {
  it('should handle SET_AUTHENTICATED with true', () => {
    const action: UserAction = {
      type: 'SET_AUTHENTICATED',
      payload: true,
    };

    const result = userReducer(initialState, action);

    expect(result.isAuthenticated).toBe(true);
    expect(result.lastAuthTime).toBeGreaterThan(0);
  });

  it('should handle SET_AUTHENTICATED with false', () => {
    const authenticatedState: UserState = {
      isAuthenticated: true,
      lastAuthTime: Date.now(),
    };

    const action: UserAction = {
      type: 'SET_AUTHENTICATED',
      payload: false,
    };

    const result = userReducer(authenticatedState, action);

    expect(result.isAuthenticated).toBe(false);
    expect(result.lastAuthTime).toBe(0);
  });

  it('should handle SET_LAST_AUTH_TIME', () => {
    const timestamp = Date.now();
    const action: UserAction = {
      type: 'SET_LAST_AUTH_TIME',
      payload: timestamp,
    };

    const result = userReducer(initialState, action);

    expect(result.lastAuthTime).toBe(timestamp);
    expect(result.isAuthenticated).toBe(false);
  });

  it('should handle LOGOUT', () => {
    const authenticatedState: UserState = {
      isAuthenticated: true,
      lastAuthTime: Date.now(),
    };

    const action: UserAction = {
      type: 'LOGOUT',
    };

    const result = userReducer(authenticatedState, action);

    expect(result.isAuthenticated).toBe(false);
    expect(result.lastAuthTime).toBe(0);
  });

  it('should return current state for unknown action', () => {
    const action = { type: 'UNKNOWN_ACTION' } as any;

    const result = userReducer(initialState, action);

    expect(result).toBe(initialState);
  });
});