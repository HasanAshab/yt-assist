import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';

export interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
}

export interface RetryState {
  isRetrying: boolean;
  attemptCount: number;
  lastError: Error | null;
}

const defaultConfig: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('timeout') ||
      error.message.includes('5')
    );
  },
};

export const useRetry = (config: RetryConfig = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const { handleAsyncError } = useErrorHandler();
  
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    attemptCount: 0,
    lastError: null,
  });

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt - 1);
    return Math.min(delay, finalConfig.maxDelay);
  }, [finalConfig.baseDelay, finalConfig.backoffFactor, finalConfig.maxDelay]);

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T | null> => {
    setRetryState({
      isRetrying: true,
      attemptCount: 0,
      lastError: null,
    });

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        setRetryState(prev => ({
          ...prev,
          attemptCount: attempt,
        }));

        const result = await operation();
        
        setRetryState({
          isRetrying: false,
          attemptCount: attempt,
          lastError: null,
        });

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        setRetryState(prev => ({
          ...prev,
          lastError: err,
        }));

        // Check if we should retry this error
        if (!finalConfig.retryCondition(err)) {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
          }));
          
          return handleAsyncError(
            () => Promise.reject(err),
            `${operationName || 'Operation'} failed: ${err.message}`
          );
        }

        // If this was the last attempt, don't retry
        if (attempt === finalConfig.maxAttempts) {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
          }));
          
          return handleAsyncError(
            () => Promise.reject(err),
            `${operationName || 'Operation'} failed after ${attempt} attempts: ${err.message}`
          );
        }

        // Wait before retrying
        const delay = calculateDelay(attempt);
        await sleep(delay);
      }
    }

    setRetryState(prev => ({
      ...prev,
      isRetrying: false,
    }));

    return null;
  }, [finalConfig, handleAsyncError, calculateDelay, sleep]);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string
  ): Promise<T | null> => {
    return executeWithRetry(operation, operationName);
  }, [executeWithRetry]);

  const retryWithCustomConfig = useCallback(async <T>(
    operation: () => Promise<T>,
    customConfig: RetryConfig,
    operationName?: string
  ): Promise<T | null> => {
    const tempConfig = { ...finalConfig, ...customConfig };
    
    setRetryState({
      isRetrying: true,
      attemptCount: 0,
      lastError: null,
    });

    for (let attempt = 1; attempt <= tempConfig.maxAttempts; attempt++) {
      try {
        setRetryState(prev => ({
          ...prev,
          attemptCount: attempt,
        }));

        const result = await operation();
        
        setRetryState({
          isRetrying: false,
          attemptCount: attempt,
          lastError: null,
        });

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        setRetryState(prev => ({
          ...prev,
          lastError: err,
        }));

        if (!tempConfig.retryCondition(err) || attempt === tempConfig.maxAttempts) {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
          }));
          
          return handleAsyncError(
            () => Promise.reject(err),
            `${operationName || 'Operation'} failed: ${err.message}`
          );
        }

        const delay = tempConfig.baseDelay * Math.pow(tempConfig.backoffFactor, attempt - 1);
        const finalDelay = Math.min(delay, tempConfig.maxDelay);
        await sleep(finalDelay);
      }
    }

    return null;
  }, [finalConfig, handleAsyncError, sleep]);

  return {
    retry,
    retryWithCustomConfig,
    retryState,
    isRetrying: retryState.isRetrying,
    attemptCount: retryState.attemptCount,
    lastError: retryState.lastError,
  };
};