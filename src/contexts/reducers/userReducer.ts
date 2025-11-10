import { UserAction } from '../../types';

export interface UserState {
  isAuthenticated: boolean;
  lastAuthTime: number;
}

export const userReducer = (
  state: UserState,
  action: UserAction
): UserState => {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload,
        lastAuthTime: action.payload ? Date.now() : 0,
      };

    case 'SET_LAST_AUTH_TIME':
      return {
        ...state,
        lastAuthTime: action.payload,
      };

    case 'LOGOUT':
      return {
        isAuthenticated: false,
        lastAuthTime: 0,
      };

    default:
      return state;
  }
};