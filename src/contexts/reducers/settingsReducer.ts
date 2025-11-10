import { SettingsAction } from '../../types';

export interface SettingsState {
  defaultFinalChecks: string[];
}

export const settingsReducer = (
  state: SettingsState,
  action: SettingsAction
): SettingsState => {
  switch (action.type) {
    case 'SET_DEFAULT_FINAL_CHECKS':
      return {
        ...state,
        defaultFinalChecks: action.payload,
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};