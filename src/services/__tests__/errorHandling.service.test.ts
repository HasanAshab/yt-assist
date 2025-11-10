import { ErrorHandlingService } from '../errorHandling.service';

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock window.addEventListener
const mockAddEventListener = jest.fn();
Object.defineProperty(window, 'addEventListener', {
  writable: true,
  value: mockAddEventListener,
});

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('ErrorHandlingService', () => {
  let errorService: ErrorHandlingService;

  beforeEach(() => {
    jest.clearAllMocks();
    navigator.onLine = true;
    // Reset singleton instance
    (ErrorHandlingService as any).instance = undefined;
    errorService = ErrorHandlingService.getInstance();
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const instance1 = ErrorHandlingService.getInstance();
      const instance2 = ErrorHandlingService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('constructor and event listeners', () => {
    it('sets up event listeners on instantiation', () => {
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });
  });

  describe('reportError', () => {
    it('reports error and logs in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const testError = new Error('Test error');
      errorService.reportError(testError, 'test-context');

      expect(console.error).toHaveBeenCalledWith(
        'Error reported:',
        expect.objectContaining({
          error: testError,
          context: 'test-context',
          timestamp: expect.any(Number),
          userAgent: expect.any(String),
          url: expect.any(String),
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('does not log in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const testError = new Error('Test error');
      errorService.reportError(testError, 'test-context');

      expect(console.error).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it('flushes error queue when online', () => {
      const testError = new Error('Test error');
      errorService.reportError(testError, 'test-context');

      expect(console.log).toHaveBeenCalledWith(
        'Flushing error queue:',
        expect.arrayContaining([
          expect.objectContaining({
            error: testError,
            context: 'test-context',
          })
        ])
      );
    });
  });

  describe('createUserFriendlyMessage', () => {
    it('returns context-specific messages', () => {
      expect(ErrorHandlingService.createUserFriendlyMessage(
        new Error('test'), 
        'content-service'
      )).toBe('Failed to manage content. Please try again.');

      expect(ErrorHandlingService.createUserFriendlyMessage(
        new Error('test'), 
        'task-service'
      )).toBe('Failed to manage tasks. Please try again.');

      expect(ErrorHandlingService.createUserFriendlyMessage(
        new Error('test'), 
        'auth-service'
      )).toBe('Authentication failed. Please check your credentials.');
    });

    it('returns default message for unknown context', () => {
      expect(ErrorHandlingService.createUserFriendlyMessage(
        new Error('test'), 
        'unknown-context'
      )).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('isRetryableError', () => {
    it('identifies retryable network errors', () => {
      expect(ErrorHandlingService.isRetryableError(
        new Error('network connection failed')
      )).toBe(true);

      expect(ErrorHandlingService.isRetryableError(
        new Error('timeout occurred')
      )).toBe(true);

      expect(ErrorHandlingService.isRetryableError(
        new Error('fetch failed')
      )).toBe(true);

      expect(ErrorHandlingService.isRetryableError(
        new Error('500 server error')
      )).toBe(true);

      expect(ErrorHandlingService.isRetryableError(
        new Error('rate limit exceeded')
      )).toBe(true);
    });

    it('identifies non-retryable errors', () => {
      expect(ErrorHandlingService.isRetryableError(
        new Error('validation failed')
      )).toBe(false);

      expect(ErrorHandlingService.isRetryableError(
        new Error('unauthorized access')
      )).toBe(false);

      expect(ErrorHandlingService.isRetryableError(
        new Error('400 bad request')
      )).toBe(false);
    });
  });

  describe('categorizeError', () => {
    it('categorizes network errors', () => {
      expect(ErrorHandlingService.categorizeError(
        new Error('network connection failed')
      )).toBe('network');

      expect(ErrorHandlingService.categorizeError(
        new Error('fetch timeout')
      )).toBe('network');
    });

    it('categorizes validation errors', () => {
      expect(ErrorHandlingService.categorizeError(
        new Error('validation failed')
      )).toBe('validation');

      expect(ErrorHandlingService.categorizeError(
        new Error('invalid input')
      )).toBe('validation');

      expect(ErrorHandlingService.categorizeError(
        new Error('required field missing')
      )).toBe('validation');
    });

    it('categorizes permission errors', () => {
      expect(ErrorHandlingService.categorizeError(
        new Error('permission denied')
      )).toBe('permission');

      expect(ErrorHandlingService.categorizeError(
        new Error('unauthorized access')
      )).toBe('permission');

      expect(ErrorHandlingService.categorizeError(
        new Error('forbidden operation')
      )).toBe('permission');
    });

    it('categorizes server errors', () => {
      expect(ErrorHandlingService.categorizeError(
        new Error('500 internal server error')
      )).toBe('server');

      const serverError = new Error('Something went wrong');
      serverError.name = 'ServerError';
      expect(ErrorHandlingService.categorizeError(serverError)).toBe('server');
    });

    it('categorizes client errors', () => {
      expect(ErrorHandlingService.categorizeError(
        new Error('400 bad request')
      )).toBe('client');

      const clientError = new Error('Something went wrong');
      clientError.name = 'ClientError';
      expect(ErrorHandlingService.categorizeError(clientError)).toBe('client');
    });

    it('categorizes unknown errors', () => {
      expect(ErrorHandlingService.categorizeError(
        new Error('some random error')
      )).toBe('unknown');
    });
  });

  describe('offline handling', () => {
    it('queues errors when offline', () => {
      navigator.onLine = false;
      
      const testError = new Error('Test error');
      errorService.reportError(testError, 'test-context');

      // Should not flush immediately when offline
      expect(console.log).not.toHaveBeenCalledWith(
        'Flushing error queue:',
        expect.any(Array)
      );
    });

    it('flushes queue when coming back online', () => {
      navigator.onLine = false;
      
      const testError = new Error('Test error');
      errorService.reportError(testError, 'test-context');

      // Simulate coming back online
      navigator.onLine = true;
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      onlineHandler?.();

      expect(console.log).toHaveBeenCalledWith(
        'Flushing error queue:',
        expect.arrayContaining([
          expect.objectContaining({
            error: testError,
            context: 'test-context',
          })
        ])
      );
    });
  });

  describe('global error handlers', () => {
    it('handles global window errors', () => {
      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      const mockErrorEvent = {
        message: 'Global error occurred',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
      };

      errorHandler?.(mockErrorEvent);

      expect(console.log).toHaveBeenCalledWith(
        'Flushing error queue:',
        expect.arrayContaining([
          expect.objectContaining({
            context: 'global-error-handler',
          })
        ])
      );
    });

    it('handles unhandled promise rejections', () => {
      const rejectionHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'unhandledrejection'
      )?.[1];

      const mockRejectionEvent = {
        reason: 'Promise rejection reason',
      };

      rejectionHandler?.(mockRejectionEvent);

      expect(console.log).toHaveBeenCalledWith(
        'Flushing error queue:',
        expect.arrayContaining([
          expect.objectContaining({
            context: 'unhandled-promise-rejection',
          })
        ])
      );
    });
  });
});