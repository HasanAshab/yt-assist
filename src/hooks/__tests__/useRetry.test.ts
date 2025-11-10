import { renderHook, act } from '@testing-library/react';
import { useRetry } from '../useRetry';
import { useErrorHandler } from '../useErrorHandler';

// Mock the useErrorHandler hook
jest.mock('../useErrorHandler');
const mockUseErrorHandler = useErrorHandler as jest.MockedFunction<typeof useErrorHandler>;

const mockHandleAsyncError = jest.fn();

describe('useRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockUseErrorHandler.mockReturnValue({
      errors: [],
      addError: jest.fn(),
      removeError: jest.fn(),
      clearErrors: jest.fn(),
      handleAsyncError: mockHandleAsyncError,
      handleSyncError: jest.fn(),
      showSuccess: jest.fn(),
      showWarning: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useRetry());

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.attemptCount).toBe(0);
    expect(result.current.lastError).toBeNull();
  });

  it('successfully executes operation on first attempt', async () => {
    const { result } = renderHook(() => useRetry());
    const mockOperation = jest.fn().mockResolvedValue('success');

    let operationResult: any;
    await act(async () => {
      operationResult = await result.current.retry(mockOperation, 'test-operation');
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(operationResult).toBe('success');
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.attemptCount).toBe(1);
    expect(result.current.lastError).toBeNull();
  });

  it('retries on retryable errors', async () => {
    const { result } = renderHook(() => useRetry());
    const mockOperation = jest
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('timeout error'))
      .mockResolvedValue('success');

    let operationResult: any;
    await act(async () => {
      const promise = result.current.retry(mockOperation, 'test-operation');
      
      // Fast-forward through delays
      jest.advanceTimersByTime(1000); // First retry delay
      await Promise.resolve(); // Let the first retry execute
      jest.advanceTimersByTime(2000); // Second retry delay
      await Promise.resolve(); // Let the second retry execute
      
      operationResult = await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(3);
    expect(operationResult).toBe('success');
    expect(result.current.attemptCount).toBe(3);
  });

  it('does not retry on non-retryable errors', async () => {
    const { result } = renderHook(() => useRetry());
    const mockOperation = jest.fn().mockRejectedValue(new Error('validation error'));

    mockHandleAsyncError.mockResolvedValue(null);

    let operationResult: any;
    await act(async () => {
      operationResult = await result.current.retry(mockOperation, 'test-operation');
    });

    expect(mockOperation).toHaveBeenCalledTimes(1);
    expect(operationResult).toBeNull();
    expect(mockHandleAsyncError).toHaveBeenCalled();
  });

  it('stops retrying after max attempts', async () => {
    const { result } = renderHook(() => useRetry({ maxAttempts: 2 }));
    const mockOperation = jest.fn().mockRejectedValue(new Error('network error'));

    mockHandleAsyncError.mockResolvedValue(null);

    let operationResult: any;
    await act(async () => {
      const promise = result.current.retry(mockOperation, 'test-operation');
      
      // Fast-forward through delays
      jest.advanceTimersByTime(1000); // First retry delay
      await Promise.resolve();
      
      operationResult = await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(2);
    expect(operationResult).toBeNull();
    expect(mockHandleAsyncError).toHaveBeenCalledWith(
      expect.any(Function),
      expect.stringContaining('failed after 2 attempts'),
      'retry-mechanism'
    );
  });

  it('uses exponential backoff for delays', async () => {
    const { result } = renderHook(() => useRetry({
      baseDelay: 100,
      backoffFactor: 2,
      maxAttempts: 3
    }));
    
    const mockOperation = jest
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('success');

    const startTime = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => startTime);

    await act(async () => {
      const promise = result.current.retry(mockOperation, 'test-operation');
      
      // First retry: 100ms delay
      jest.advanceTimersByTime(100);
      await Promise.resolve();
      
      // Second retry: 200ms delay (100 * 2^1)
      jest.advanceTimersByTime(200);
      await Promise.resolve();
      
      await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('respects max delay limit', async () => {
    const { result } = renderHook(() => useRetry({
      baseDelay: 1000,
      backoffFactor: 10,
      maxDelay: 2000,
      maxAttempts: 3
    }));
    
    const mockOperation = jest
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('success');

    await act(async () => {
      const promise = result.current.retry(mockOperation, 'test-operation');
      
      // First retry: should be capped at maxDelay (2000ms)
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      
      // Second retry: should also be capped at maxDelay (2000ms)
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
      
      await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  it('uses custom retry condition', async () => {
    const customRetryCondition = jest.fn().mockReturnValue(false);
    const { result } = renderHook(() => useRetry({
      retryCondition: customRetryCondition
    }));
    
    const mockOperation = jest.fn().mockRejectedValue(new Error('custom error'));
    mockHandleAsyncError.mockResolvedValue(null);

    await act(async () => {
      await result.current.retry(mockOperation, 'test-operation');
    });

    expect(customRetryCondition).toHaveBeenCalledWith(expect.any(Error));
    expect(mockOperation).toHaveBeenCalledTimes(1); // Should not retry
  });

  it('updates retry state during execution', async () => {
    const { result } = renderHook(() => useRetry());
    const mockOperation = jest
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('success');

    await act(async () => {
      const promise = result.current.retry(mockOperation, 'test-operation');
      
      // Check state during retry
      expect(result.current.isRetrying).toBe(true);
      expect(result.current.attemptCount).toBeGreaterThan(0);
      
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      await promise;
    });

    expect(result.current.isRetrying).toBe(false);
    expect(result.current.attemptCount).toBe(2);
  });

  it('works with retryWithCustomConfig', async () => {
    const { result } = renderHook(() => useRetry());
    const mockOperation = jest
      .fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('success');

    const customConfig = {
      maxAttempts: 5,
      baseDelay: 500,
    };

    let operationResult: any;
    await act(async () => {
      const promise = result.current.retryWithCustomConfig(
        mockOperation,
        customConfig,
        'test-operation'
      );
      
      jest.advanceTimersByTime(500);
      await Promise.resolve();
      
      operationResult = await promise;
    });

    expect(mockOperation).toHaveBeenCalledTimes(2);
    expect(operationResult).toBe('success');
  });

  it('handles errors that are not Error instances', async () => {
    const { result } = renderHook(() => useRetry());
    const mockOperation = jest.fn().mockRejectedValue('string error');

    mockHandleAsyncError.mockResolvedValue(null);

    await act(async () => {
      await result.current.retry(mockOperation, 'test-operation');
    });

    expect(result.current.lastError).toBeInstanceOf(Error);
    expect(result.current.lastError?.message).toBe('string error');
  });
});