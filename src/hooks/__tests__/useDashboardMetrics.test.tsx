import React from 'react';
import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useDashboardMetrics } from '../useDashboardMetrics';
import { AppProvider } from '../../contexts/AppContext';
import { Content, Task } from '../../types';

// Mock the hooks
vi.mock('../useContent', () => ({
  useContent: vi.fn(),
}));

vi.mock('../useTasks', () => ({
  useTasks: vi.fn(),
}));

import { useContent } from '../useContent';
import { useTasks } from '../useTasks';

const mockUseContent = vi.mocked(useContent);
const mockUseTasks = vi.mocked(useTasks);

describe('useDashboardMetrics', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns correct metrics when all counts are zero', () => {
    mockUseContent.mockReturnValue({
      getPendingContents: [],
      getInProgressContents: [],
      contents: [],
      filters: {},
      loading: false,
      setContents: vi.fn(),
      addContent: vi.fn(),
      updateContent: vi.fn(),
      deleteContent: vi.fn(),
      setFilters: vi.fn(),
      setLoading: vi.fn(),
      filteredContents: [],
      getContentByTopic: vi.fn(),
      getContentsByStage: vi.fn(),
      getPublishedContents: [],
    });

    mockUseTasks.mockReturnValue({
      remainingTasksCount: 0,
      tasks: [],
      loading: false,
      setTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      setLoading: vi.fn(),
      userTasks: [],
      systemTasks: [],
      activeTasks: [],
      expiredTasks: [],
      todaysTasks: [],
    });

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });

    expect(result.current).toEqual({
      pendingCount: 0,
      inProgressCount: 0,
      remainingTasksCount: 0,
    });
  });

  it('returns correct metrics with pending content', () => {
    const pendingContents: Content[] = [
      {
        id: '1',
        topic: 'Test Content 1',
        category: 'Innovative',
        current_stage: 0,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        topic: 'Test Content 2',
        category: 'Demanding',
        current_stage: 0,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockUseContent.mockReturnValue({
      getPendingContents: pendingContents,
      getInProgressContents: [],
      contents: [],
      filters: {},
      loading: false,
      setContents: vi.fn(),
      addContent: vi.fn(),
      updateContent: vi.fn(),
      deleteContent: vi.fn(),
      setFilters: vi.fn(),
      setLoading: vi.fn(),
      filteredContents: [],
      getContentByTopic: vi.fn(),
      getContentsByStage: vi.fn(),
      getPublishedContents: [],
    });

    mockUseTasks.mockReturnValue({
      remainingTasksCount: 0,
      tasks: [],
      loading: false,
      setTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      setLoading: vi.fn(),
      userTasks: [],
      systemTasks: [],
      activeTasks: [],
      expiredTasks: [],
      todaysTasks: [],
    });

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });

    expect(result.current).toEqual({
      pendingCount: 2,
      inProgressCount: 0,
      remainingTasksCount: 0,
    });
  });

  it('returns correct metrics with in-progress content', () => {
    const inProgressContents: Content[] = [
      {
        id: '1',
        topic: 'Test Content 1',
        category: 'Innovative',
        current_stage: 3,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        topic: 'Test Content 2',
        category: 'Demanding',
        current_stage: 7,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '3',
        topic: 'Test Content 3',
        category: 'Innovative',
        current_stage: 10,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockUseContent.mockReturnValue({
      getPendingContents: [],
      getInProgressContents: inProgressContents,
      contents: [],
      filters: {},
      loading: false,
      setContents: vi.fn(),
      addContent: vi.fn(),
      updateContent: vi.fn(),
      deleteContent: vi.fn(),
      setFilters: vi.fn(),
      setLoading: vi.fn(),
      filteredContents: [],
      getContentByTopic: vi.fn(),
      getContentsByStage: vi.fn(),
      getPublishedContents: [],
    });

    mockUseTasks.mockReturnValue({
      remainingTasksCount: 0,
      tasks: [],
      loading: false,
      setTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      setLoading: vi.fn(),
      userTasks: [],
      systemTasks: [],
      activeTasks: [],
      expiredTasks: [],
      todaysTasks: [],
    });

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });

    expect(result.current).toEqual({
      pendingCount: 0,
      inProgressCount: 3,
      remainingTasksCount: 0,
    });
  });

  it('returns correct metrics with remaining tasks', () => {
    mockUseContent.mockReturnValue({
      getPendingContents: [],
      getInProgressContents: [],
      contents: [],
      filters: {},
      loading: false,
      setContents: vi.fn(),
      addContent: vi.fn(),
      updateContent: vi.fn(),
      deleteContent: vi.fn(),
      setFilters: vi.fn(),
      setLoading: vi.fn(),
      filteredContents: [],
      getContentByTopic: vi.fn(),
      getContentsByStage: vi.fn(),
      getPublishedContents: [],
    });

    mockUseTasks.mockReturnValue({
      remainingTasksCount: 5,
      tasks: [],
      loading: false,
      setTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      setLoading: vi.fn(),
      userTasks: [],
      systemTasks: [],
      activeTasks: [],
      expiredTasks: [],
      todaysTasks: [],
    });

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });

    expect(result.current).toEqual({
      pendingCount: 0,
      inProgressCount: 0,
      remainingTasksCount: 5,
    });
  });

  it('returns correct metrics with all counts populated', () => {
    const pendingContents: Content[] = [
      {
        id: '1',
        topic: 'Pending Content',
        category: 'Innovative',
        current_stage: 0,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    const inProgressContents: Content[] = [
      {
        id: '2',
        topic: 'In Progress Content 1',
        category: 'Demanding',
        current_stage: 5,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: '3',
        topic: 'In Progress Content 2',
        category: 'Innovative',
        current_stage: 8,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockUseContent.mockReturnValue({
      getPendingContents: pendingContents,
      getInProgressContents: inProgressContents,
      contents: [],
      filters: {},
      loading: false,
      setContents: vi.fn(),
      addContent: vi.fn(),
      updateContent: vi.fn(),
      deleteContent: vi.fn(),
      setFilters: vi.fn(),
      setLoading: vi.fn(),
      filteredContents: [],
      getContentByTopic: vi.fn(),
      getContentsByStage: vi.fn(),
      getPublishedContents: [],
    });

    mockUseTasks.mockReturnValue({
      remainingTasksCount: 3,
      tasks: [],
      loading: false,
      setTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      setLoading: vi.fn(),
      userTasks: [],
      systemTasks: [],
      activeTasks: [],
      expiredTasks: [],
      todaysTasks: [],
    });

    const { result } = renderHook(() => useDashboardMetrics(), { wrapper });

    expect(result.current).toEqual({
      pendingCount: 1,
      inProgressCount: 2,
      remainingTasksCount: 3,
    });
  });

  it('memoizes the result correctly', () => {
    const pendingContents: Content[] = [
      {
        id: '1',
        topic: 'Test Content',
        category: 'Innovative',
        current_stage: 0,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockUseContent.mockReturnValue({
      getPendingContents: pendingContents,
      getInProgressContents: [],
      contents: [],
      filters: {},
      loading: false,
      setContents: vi.fn(),
      addContent: vi.fn(),
      updateContent: vi.fn(),
      deleteContent: vi.fn(),
      setFilters: vi.fn(),
      setLoading: vi.fn(),
      filteredContents: [],
      getContentByTopic: vi.fn(),
      getContentsByStage: vi.fn(),
      getPublishedContents: [],
    });

    mockUseTasks.mockReturnValue({
      remainingTasksCount: 2,
      tasks: [],
      loading: false,
      setTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      setLoading: vi.fn(),
      userTasks: [],
      systemTasks: [],
      activeTasks: [],
      expiredTasks: [],
      todaysTasks: [],
    });

    const { result, rerender } = renderHook(() => useDashboardMetrics(), { wrapper });

    const firstResult = result.current;
    
    // Rerender without changing dependencies
    rerender();
    
    const secondResult = result.current;
    
    // Should be the same object reference due to memoization
    expect(firstResult).toBe(secondResult);
  });

  it('updates when dependencies change', () => {
    const initialPendingContents: Content[] = [
      {
        id: '1',
        topic: 'Test Content',
        category: 'Innovative',
        current_stage: 0,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockUseContent.mockReturnValue({
      getPendingContents: initialPendingContents,
      getInProgressContents: [],
      contents: [],
      filters: {},
      loading: false,
      setContents: vi.fn(),
      addContent: vi.fn(),
      updateContent: vi.fn(),
      deleteContent: vi.fn(),
      setFilters: vi.fn(),
      setLoading: vi.fn(),
      filteredContents: [],
      getContentByTopic: vi.fn(),
      getContentsByStage: vi.fn(),
      getPublishedContents: [],
    });

    mockUseTasks.mockReturnValue({
      remainingTasksCount: 1,
      tasks: [],
      loading: false,
      setTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      setLoading: vi.fn(),
      userTasks: [],
      systemTasks: [],
      activeTasks: [],
      expiredTasks: [],
      todaysTasks: [],
    });

    const { result, rerender } = renderHook(() => useDashboardMetrics(), { wrapper });

    expect(result.current).toEqual({
      pendingCount: 1,
      inProgressCount: 0,
      remainingTasksCount: 1,
    });

    // Update the mock to return different values
    const updatedPendingContents: Content[] = [];
    const updatedInProgressContents: Content[] = [
      {
        id: '2',
        topic: 'Updated Content',
        category: 'Demanding',
        current_stage: 5,
        final_checks: [],
        morals: [],
        flags: [],
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];

    mockUseContent.mockReturnValue({
      getPendingContents: updatedPendingContents,
      getInProgressContents: updatedInProgressContents,
      contents: [],
      filters: {},
      loading: false,
      setContents: vi.fn(),
      addContent: vi.fn(),
      updateContent: vi.fn(),
      deleteContent: vi.fn(),
      setFilters: vi.fn(),
      setLoading: vi.fn(),
      filteredContents: [],
      getContentByTopic: vi.fn(),
      getContentsByStage: vi.fn(),
      getPublishedContents: [],
    });

    mockUseTasks.mockReturnValue({
      remainingTasksCount: 3,
      tasks: [],
      loading: false,
      setTasks: vi.fn(),
      addTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      setLoading: vi.fn(),
      userTasks: [],
      systemTasks: [],
      activeTasks: [],
      expiredTasks: [],
      todaysTasks: [],
    });

    rerender();

    expect(result.current).toEqual({
      pendingCount: 0,
      inProgressCount: 1,
      remainingTasksCount: 3,
    });
  });
});