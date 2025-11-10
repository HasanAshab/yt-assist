import { describe, it, expect } from 'vitest';
import { contentReducer, ContentState } from '../../contexts/reducers/contentReducer';
import { Content, ContentAction } from '../../types';

const mockContent: Content = {
  id: '1',
  topic: 'Test Content',
  category: 'Demanding',
  current_stage: 0,
  title: 'Test Title',
  script: 'Test Script',
  final_checks: [],
  morals: [],
  flags: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const initialState: ContentState = {
  items: [],
  filters: {},
  loading: false,
};

describe('contentReducer', () => {
  it('should handle SET_CONTENTS', () => {
    const action: ContentAction = {
      type: 'SET_CONTENTS',
      payload: [mockContent],
    };

    const result = contentReducer(initialState, action);

    expect(result.items).toEqual([mockContent]);
    expect(result.loading).toBe(false);
  });

  it('should handle ADD_CONTENT', () => {
    const action: ContentAction = {
      type: 'ADD_CONTENT',
      payload: mockContent,
    };

    const result = contentReducer(initialState, action);

    expect(result.items).toEqual([mockContent]);
  });

  it('should handle UPDATE_CONTENT', () => {
    const stateWithContent: ContentState = {
      ...initialState,
      items: [mockContent],
    };

    const updatedContent = { ...mockContent, title: 'Updated Title' };
    const action: ContentAction = {
      type: 'UPDATE_CONTENT',
      payload: updatedContent,
    };

    const result = contentReducer(stateWithContent, action);

    expect(result.items[0].title).toBe('Updated Title');
  });

  it('should handle DELETE_CONTENT', () => {
    const stateWithContent: ContentState = {
      ...initialState,
      items: [mockContent],
    };

    const action: ContentAction = {
      type: 'DELETE_CONTENT',
      payload: '1',
    };

    const result = contentReducer(stateWithContent, action);

    expect(result.items).toEqual([]);
  });

  it('should handle SET_FILTERS', () => {
    const action: ContentAction = {
      type: 'SET_FILTERS',
      payload: { category: 'Innovative', stage: 1 },
    };

    const result = contentReducer(initialState, action);

    expect(result.filters).toEqual({ category: 'Innovative', stage: 1 });
  });

  it('should handle SET_LOADING', () => {
    const action: ContentAction = {
      type: 'SET_LOADING',
      payload: true,
    };

    const result = contentReducer(initialState, action);

    expect(result.loading).toBe(true);
  });

  it('should return current state for unknown action', () => {
    const action = { type: 'UNKNOWN_ACTION' } as any;

    const result = contentReducer(initialState, action);

    expect(result).toBe(initialState);
  });
});