import { useState, useCallback } from 'react';

interface ErrorItem {
  id: string;
  message: string;
  timestamp: number;
}

export class AppError extends Error {
  public id: string;
  public type: 'error' | 'warning' | 'info';
  public context?: string;

  constructor(message: string, public code?: string, type: 'error' | 'warning' | 'info' = 'error', context?: string) {
    super(message);
    this.name = 'AppError';
    this.id = Date.now().toString();
    this.type = type;
    this.context = context;
  }
}

export function useErrorHandler() {
  const [errors, setErrors] = useState<ErrorItem[]>([]);

  const addError = useCallback((message: string) => {
    const error: ErrorItem = {
      id: Date.now().toString(),
      message,
      timestamp: Date.now()
    };
    
    setErrors(prev => [...prev, error]);
    
    // Auto-remove error after 5 seconds
    setTimeout(() => {
      removeError(error.id);
    }, 5000);
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const handleError = useCallback((error: any, defaultMessage?: string) => {
    const message = error?.message || defaultMessage || 'An error occurred';
    addError(message);
  }, [addError]);

  const handleAsyncError = useCallback(async (asyncFn: () => Promise<any>, defaultMessage?: string, context?: string) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error, defaultMessage);
      throw error;
    }
  }, [handleError]);

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    handleError,
    handleAsyncError
  };
}