import { describe, it, expect } from 'vitest';
import { settingsReducer, SettingsState } from '../../contexts/reducers/settingsReducer';
import { SettingsAction } from '../../types';

const initialState: SettingsState = {
  defaultFinalChecks: ['Check 1', 'Check 2'],
};

describe('settingsReducer', () => {
  it('should handle SET_DEFAULT_FINAL_CHECKS', () => {
    const newChecks = ['New Check 1', 'New Check 2', 'New Check 3'];
    const action: SettingsAction = {
      type: 'SET_DEFAULT_FINAL_CHECKS',
      payload: newChecks,
    };

    const result = settingsReducer(initialState, action);

    expect(result.defaultFinalChecks).toEqual(newChecks);
  });

  it('should handle UPDATE_SETTINGS', () => {
    const updates = {
      defaultFinalChecks: ['Updated Check 1'],
    };
    const action: SettingsAction = {
      type: 'UPDATE_SETTINGS',
      payload: updates,
    };

    const result = settingsReducer(initialState, action);

    expect(result.defaultFinalChecks).toEqual(['Updated Check 1']);
  });

  it('should return current state for unknown action', () => {
    const action = { type: 'UNKNOWN_ACTION' } as any;

    const result = settingsReducer(initialState, action);

    expect(result).toBe(initialState);
  });
});