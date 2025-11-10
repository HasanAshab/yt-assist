import { useState, useCallback } from 'react';

interface ErrorItem {
  id: string;
  message: string;
  timestamp: number;
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

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    handleError
  };
}