import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoading } from '../../hooks/useLoading';

describe('useLoading', () => {
  it('should initialize with empty loading state', () => {
    const { result } = renderHook(() => useLoading());

    expect(result.current.loadingStates).toEqual({});
    expect(result.current.isAnyLoading()).toBe(false);
  });

  it('should initialize with provided initial state', () => {
    const initialState = { test: true };
    const { result } = renderHook(() => useLoading(initialState));

    expect(result.current.loadingStates).toEqual(initialState);
    expect(result.current.isLoading('test')).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);
  });

  it('should set and check loading states', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.setLoading('operation1', true);
    });

    expect(result.current.isLoading('operation1')).toBe(true);
    expect(result.current.isLoading('operation2')).toBe(false);
    expect(result.current.isAnyLoading()).toBe(true);

    act(() => {
      result.current.setLoading('operation1', false);
    });

    expect(result.current.isLoading('operation1')).toBe(false);
    expect(result.current.isAnyLoading()).toBe(false);
  });

  it('should clear specific loading state', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.setLoading('operation1', true);
      result.current.setLoading('operation2', true);
    });

    expect(result.current.isAnyLoading()).toBe(true);

    act(() => {
      result.current.clearLoading('operation1');
    });

    expect(result.current.isLoading('operation1')).toBe(false);
    expect(result.current.isLoading('operation2')).toBe(true);
  });

  it('should clear all loading states', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.setLoading('operation1', true);
      result.current.setLoading('operation2', true);
    });

    expect(result.current.isAnyLoading()).toBe(true);

    act(() => {
      result.current.clearLoading();
    });

    expect(result.current.isAnyLoading()).toBe(false);
    expect(result.current.loadingStates).toEqual({});
  });

  it('should handle async operations with loading state', async () => {
    const { result } = renderHook(() => useLoading());

    const asyncOperation = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return 'success';
    };

    let returnValue: string;
    await act(async () => {
      returnValue = await result.current.withLoading('test', asyncOperation);
    });

    expect(returnValue!).toBe('success');
    expect(result.current.isLoading('test')).toBe(false);
  });

  it('should handle async operation errors with loading state', async () => {
    const { result } = renderHook(() => useLoading());

    const failingAsyncOperation = async () => {
      throw new Error('Operation failed');
    };

    let error: Error | null = null;
    await act(async () => {
      try {
        await result.current.withLoading('test', failingAsyncOperation);
      } catch (e) {
        error = e as Error;
      }
    });

    expect(error?.message).toBe('Operation failed');
    expect(result.current.isLoading('test')).toBe(false);
  });
});