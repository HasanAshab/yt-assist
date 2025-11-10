import { useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Content, ContentFilters } from '../types';

export const useContent = () => {
  const { state, dispatch } = useAppContext();

  const setContents = useCallback((contents: Content[]) => {
    dispatch({ type: 'SET_CONTENTS', payload: contents });
  }, [dispatch]);

  const addContent = useCallback((content: Content) => {
    dispatch({ type: 'ADD_CONTENT', payload: content });
  }, [dispatch]);

  const updateContent = useCallback((content: Content) => {
    dispatch({ type: 'UPDATE_CONTENT', payload: content });
  }, [dispatch]);

  const deleteContent = useCallback((contentId: string) => {
    dispatch({ type: 'DELETE_CONTENT', payload: contentId });
  }, [dispatch]);

  const setFilters = useCallback((filters: Partial<ContentFilters>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, [dispatch]);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [dispatch]);

  // Computed values
  const filteredContents = useCallback(() => {
    const { items, filters } = state.contents;
    
    return items.filter(content => {
      // Category filter
      if (filters.category && content.category !== filters.category) {
        return false;
      }
      
      // Stage filter
      if (filters.stage !== undefined && content.current_stage !== filters.stage) {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return content.topic.toLowerCase().includes(searchLower) ||
               content.title?.toLowerCase().includes(searchLower);
      }
      
      return true;
    });
  }, [state.contents]);

  const getContentByTopic = useCallback((topic: string) => {
    return state.contents.items.find(content => content.topic === topic);
  }, [state.contents.items]);

  const getContentsByStage = useCallback((stage: number) => {
    return state.contents.items.filter(content => content.current_stage === stage);
  }, [state.contents.items]);

  const getPendingContents = useCallback(() => {
    return state.contents.items.filter(content => content.current_stage === 0);
  }, [state.contents.items]);

  const getInProgressContents = useCallback(() => {
    return state.contents.items.filter(content => 
      content.current_stage > 0 && content.current_stage < 11
    );
  }, [state.contents.items]);

  const getPublishedContents = useCallback(() => {
    return state.contents.items.filter(content => content.current_stage === 11);
  }, [state.contents.items]);

  return {
    // State
    contents: state.contents.items,
    filters: state.contents.filters,
    loading: state.contents.loading,
    
    // Actions
    setContents,
    addContent,
    updateContent,
    deleteContent,
    setFilters,
    setLoading,
    
    // Computed values
    filteredContents: filteredContents(),
    getContentByTopic,
    getContentsByStage,
    getPendingContents: getPendingContents(),
    getInProgressContents: getInProgressContents(),
    getPublishedContents: getPublishedContents(),
  };
};