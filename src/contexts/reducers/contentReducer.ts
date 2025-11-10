import { Content, ContentAction, ContentFilters } from '../../types';

export interface ContentState {
  items: Content[];
  filters: ContentFilters;
  loading: boolean;
}

export const contentReducer = (
  state: ContentState,
  action: ContentAction
): ContentState => {
  switch (action.type) {
    case 'SET_CONTENTS':
      return {
        ...state,
        items: action.payload,
        loading: false,
      };

    case 'ADD_CONTENT':
      return {
        ...state,
        items: [...state.items, action.payload],
      };

    case 'UPDATE_CONTENT':
      return {
        ...state,
        items: state.items.map(content =>
          content.id === action.payload.id ? action.payload : content
        ),
      };

    case 'DELETE_CONTENT':
      return {
        ...state,
        items: state.items.filter(content => content.id !== action.payload),
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
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