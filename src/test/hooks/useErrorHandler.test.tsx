import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../../hooks/useErrorHandler';

describe('useErrorHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should add and remove errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.errors).toHaveLength(0);

    act(() => {
      result.current.addError('Test error');
    });

    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe('Test error');
    expect(result.current.errors[0].type).toBe('error');

    act(() => {
      result.current.removeError(result.current.errors[0].id);
    });

    expect(result.current.errors).toHaveLength(0);
  });

  it('should auto-remove non-error types after timeout', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('Test warning', 'warning');
    });

    expect(result.current.errors).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.errors).toHaveLength(0);
  });

  it('should not auto-remove error types', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('Test error', 'error');
    });

    expect(result.current.errors).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.errors).toHaveLength(1);
  });

  it('should clear all errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.addError('Error 1');
      result.current.addError('Error 2');
    });

    expect(result.current.errors).toHaveLength(2);

    act(() => {
      result.current.clearErrors();
    });

    expect(result.current.errors).toHaveLength(0);
  });

  it('should handle async errors', async () => {
    const { result } = renderHook(() => useErrorHandler());

    const failingAsyncFn = async () => {
      throw new Error('Async error');
    };

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.handleAsyncError(failingAsyncFn);
    });

    expect(returnValue).toBeNull();
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe('Async error');
  });

  it('should handle sync errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    const failingSyncFn = () => {
      throw new Error('Sync error');
    };

    let returnValue: any;
    act(() => {
      returnValue = result.current.handleSyncError(failingSyncFn);
    });

    expect(returnValue).toBeNull();
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].message).toBe('Sync error');
  });

  it('should show success and warning messages', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showSuccess('Success message');
      result.current.showWarning('Warning message');
    });

    expect(result.current.errors).toHaveLength(2);
    expect(result.current.errors[0].type).toBe('info');
    expect(result.current.errors[1].type).toBe('warning');
  });
});