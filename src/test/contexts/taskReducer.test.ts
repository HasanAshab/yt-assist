import { describe, it, expect } from 'vitest';
import { taskReducer, TaskState } from '../../contexts/reducers/taskReducer';
import { Task, TaskAction } from '../../types';

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  link: 'https://example.com',
  type: 'user',
  created_at: '2023-01-01T00:00:00Z',
  expires_at: '2023-01-01T23:59:59Z',
};

const initialState: TaskState = {
  items: [],
  loading: false,
};

describe('taskReducer', () => {
  it('should handle SET_TASKS', () => {
    const action: TaskAction = {
      type: 'SET_TASKS',
      payload: [mockTask],
    };

    const result = taskReducer(initialState, action);

    expect(result.items).toEqual([mockTask]);
    expect(result.loading).toBe(false);
  });

  it('should handle ADD_TASK', () => {
    const action: TaskAction = {
      type: 'ADD_TASK',
      payload: mockTask,
    };

    const result = taskReducer(initialState, action);

    expect(result.items).toEqual([mockTask]);
  });

  it('should handle UPDATE_TASK', () => {
    const stateWithTask: TaskState = {
      ...initialState,
      items: [mockTask],
    };

    const updatedTask = { ...mockTask, title: 'Updated Task' };
    const action: TaskAction = {
      type: 'UPDATE_TASK',
      payload: updatedTask,
    };

    const result = taskReducer(stateWithTask, action);

    expect(result.items[0].title).toBe('Updated Task');
  });

  it('should handle DELETE_TASK', () => {
    const stateWithTask: TaskState = {
      ...initialState,
      items: [mockTask],
    };

    const action: TaskAction = {
      type: 'DELETE_TASK',
      payload: '1',
    };

    const result = taskReducer(stateWithTask, action);

    expect(result.items).toEqual([]);
  });

  it('should handle SET_LOADING', () => {
    const action: TaskAction = {
      type: 'SET_LOADING',
      payload: true,
    };

    const result = taskReducer(initialState, action);

    expect(result.loading).toBe(true);
  });

  it('should return current state for unknown action', () => {
    const action = { type: 'UNKNOWN_ACTION' } as any;

    const result = taskReducer(initialState, action);

    expect(result).toBe(initialState);
  });
});