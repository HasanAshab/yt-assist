import { Task, TaskAction } from '../../types';

export interface TaskState {
  items: Task[];
  loading: boolean;
}

export const taskReducer = (
  state: TaskState,
  action: TaskAction
): TaskState => {
  switch (action.type) {
    case 'SET_TASKS':
      return {
        ...state,
        items: action.payload,
        loading: false,
      };

    case 'ADD_TASK':
      return {
        ...state,
        items: [...state.items, action.payload],
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        items: state.items.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        items: state.items.filter(task => task.id !== action.payload),
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};