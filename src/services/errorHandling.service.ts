import { AppError } from '../hooks/useErrorHandler';

export interface ErrorReport {
  error: Error;
  context: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorQueue: ErrorReport[] = [];
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Global error handler for unhandled errors
    window.addEventListener('error', (event) => {
      this.reportError(
        new Error(event.message),
        'global-error-handler',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    });

    // Global handler for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        new Error(event.reason),
        'unhandled-promise-rejection'
      );
    });
  }

  reportError(error: Error, context: string, additionalInfo?: any) {
    const errorReport: ErrorReport = {
      error,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Add to queue for offline handling
    this.errorQueue.push(errorReport);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', {
        ...errorReport,
        additionalInfo,
      });
    }

    // Try to send immediately if online
    if (this.isOnline) {
      this.flushErrorQueue();
    }
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In a real application, you would send these to your error reporting service
      // For now, we'll just log them
      console.log('Flushing error queue:', errors);
      
      // Example: await this.sendErrorsToService(errors);
    } catch (error) {
      // If sending fails, put errors back in queue
      this.errorQueue.unshift(...errors);
      console.error('Failed to flush error queue:', error);
    }
  }

  // Helper method to create user-friendly error messages
  static createUserFriendlyMessage(error: Error, context: string): string {
    const contextMessages: Record<string, string> = {
      'content-service': 'Failed to manage content. Please try again.',
      'task-service': 'Failed to manage tasks. Please try again.',
      'auth-service': 'Authentication failed. Please check your credentials.',
      'network-error': 'Network connection failed. Please check your internet connection.',
      'validation-error': 'Please check your input and try again.',
      'permission-error': 'You don\'t have permission to perform this action.',
    };

    return contextMessages[context] || 'An unexpected error occurred. Please try again.';
  }

  // Helper method to determine if an error is retryable
  static isRetryableError(error: Error): boolean {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /5\d\d/,  // 5xx server errors
      /rate limit/i,
    ];

    return retryablePatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  // Helper method to categorize errors
  static categorizeError(error: Error): 'network' | 'validation' | 'permission' | 'server' | 'client' | 'unknown' {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network';
    }

    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return 'validation';
    }

    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission';
    }

    if (message.includes('5') || name.includes('server')) {
      return 'server';
    }

    if (message.includes('4') || name.includes('client')) {
      return 'client';
    }

    return 'unknown';
  }
}