import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AppProvider } from '../../contexts/AppContext';
import { useContent } from '../../hooks/useContent';
import { Content } from '../../types';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

const mockContent: Content = {
  id: '1',
  topic: 'Test Content',
  category: 'Demanding',
  current_stage: 0,
  title: 'Test Title',
  final_checks: [],
  morals: [],
  flags: [],
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

describe('useContent', () => {
  it('should provide initial empty state', () => {
    const { result } = renderHook(() => useContent(), { wrapper });

    expect(result.current.contents).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.filters).toEqual({});
  });

  it('should add content', () => {
    const { result } = renderHook(() => useContent(), { wrapper });

    act(() => {
      result.current.addContent(mockContent);
    });

    expect(result.current.contents).toHaveLength(1);
    expect(result.current.contents[0]).toEqual(mockContent);
  });

  it('should update content', () => {
    const { result } = renderHook(() => useContent(), { wrapper });

    act(() => {
      result.current.addContent(mockContent);
    });

    const updatedContent = { ...mockContent, title: 'Updated Title' };

    act(() => {
      result.current.updateContent(updatedContent);
    });

    expect(result.current.contents[0].title).toBe('Updated Title');
  });

  it('should delete content', () => {
    const { result } = renderHook(() => useContent(), { wrapper });

    act(() => {
      result.current.addContent(mockContent);
    });

    expect(result.current.contents).toHaveLength(1);

    act(() => {
      result.current.deleteContent('1');
    });

    expect(result.current.contents).toHaveLength(0);
  });

  it('should set filters', () => {
    const { result } = renderHook(() => useContent(), { wrapper });

    act(() => {
      result.current.setFilters({ category: 'Innovative', stage: 1 });
    });

    expect(result.current.filters).toEqual({ category: 'Innovative', stage: 1 });
  });

  it('should filter contents by category', () => {
    const { result } = renderHook(() => useContent(), { wrapper });

    const demandingContent = { ...mockContent, id: '1', category: 'Demanding' as const };
    const innovativeContent = { ...mockContent, id: '2', category: 'Innovative' as const };

    act(() => {
      result.current.setContents([demandingContent, innovativeContent]);
      result.current.setFilters({ category: 'Demanding' });
    });

    expect(result.current.filteredContents).toHaveLength(1);
    expect(result.current.filteredContents[0].category).toBe('Demanding');
  });

  it('should get content by topic', () => {
    const { result } = renderHook(() => useContent(), { wrapper });

    act(() => {
      result.current.addContent(mockContent);
    });

    const foundContent = result.current.getContentByTopic('Test Content');
    expect(foundContent).toEqual(mockContent);

    const notFoundContent = result.current.getContentByTopic('Non-existent');
    expect(notFoundContent).toBeUndefined();
  });

  it('should categorize contents by stage', () => {
    const { result } = renderHook(() => useContent(), { wrapper });

    const pendingContent = { ...mockContent, id: '1', current_stage: 0 };
    const inProgressContent = { ...mockContent, id: '2', current_stage: 5 };
    const publishedContent = { ...mockContent, id: '3', current_stage: 11 };

    act(() => {
      result.current.setContents([pendingContent, inProgressContent, publishedContent]);
    });

    expect(result.current.getPendingContents).toHaveLength(1);
    expect(result.current.getInProgressContents).toHaveLength(1);
    expect(result.current.getPublishedContents).toHaveLength(1);
  });
});