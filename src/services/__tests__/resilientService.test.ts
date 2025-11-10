import { ResilientService, withRetry, withOfflineSupport } from '../resilientService';
import { ErrorHandlingService } from '../errorHandling.service';

// Mock ErrorHandlingService
jest.mock('../errorHandling.service');
const MockErrorHandlingService = ErrorHandlingService as jest.MockedClass<typeof ErrorHandlingService>;

const mockErrorService = {
  reportError: jest.fn(),
};

describe('ResilientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    MockErrorHandlingService.getInstance.mockReturnValue(mockErrorService as any);
    MockErrorHandlingService.createUserFriendlyMessage.mockReturnValue('User friendly error message');
    MockErrorHandlingService.isRetryableError.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('executeWithRetry', () => {
    it('executes operation successfully on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');

      const result = await ResilientService.executeWithRetry(
        mockOperation,
        'test-context'
      );

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockErrorService.reportError).not.toHaveBeenCalled();
    });

    it('retries on retryable errors', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockRejectedValueOnce(new Error('timeout error'))
        .mockResolvedValue('success');

      const promise = ResilientService.executeWithRetry(
        mockOperation,
        'test-context'
      );

      // Fast-forward through delays
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
      expect(mockErrorService.reportError).toHaveBeenCalledTimes(2);
    });

    it('stops retrying on non-retryable errors', async () => {
      MockErrorHandlingService.isRetryableError.mockReturnValue(false);
      const mockOperation = jest.fn().mockRejectedValue(new Error('validation error'));

      await expect(
        ResilientService.executeWithRetry(mockOperation, 'test-context')
      ).rejects.toThrow('User friendly error message');

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockErrorService.reportError).toHaveBeenCalledTimes(1);
    });

    it('stops retrying after max attempts', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('network error'));

      const promise = ResilientService.executeWithRetry(
        mockOperation,
        'test-context',
        { maxAttempts: 2 }
      );

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow('User friendly error message');

      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(mockErrorService.reportError).toHaveBeenCalledTimes(2);
    });

    it('uses custom retry configuration', async () => {
      const mockOperation = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success');

      const promise = ResilientService.executeWithRetry(
        mockOperation,
        'test-context',
        {
          baseDelay: 500,
          maxAttempts: 5,
        }
      );

      jest.advanceTimersByTime(500);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('reports errors with attempt information', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('network error'));

      const promise = ResilientService.executeWithRetry(
        mockOperation,
        'test-context',
        { maxAttempts: 2 }
      );

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      await expect(promise).rejects.toThrow();

      expect(mockErrorService.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        'test-context',
        { attempt: 1 }
      );
      expect(mockErrorService.reportError).toHaveBeenCalledWith(
        expect.any(Error),
        'test-context',
        { attempt: 2 }
      );
    });
  });

  describe('executeWithOfflineSupport', () => {
    it('executes online operation successfully', async () => {
      const mockOnlineOperation = jest.fn().mockResolvedValue('online success');
      const mockFallbackOperation = jest.fn().mockReturnValue('fallback success');

      const result = await ResilientService.executeWithOfflineSupport(
        mockOnlineOperation,
        mockFallbackOperation,
        'test-context'
      );

      expect(result).toBe('online success');
      expect(mockOnlineOperation).toHaveBeenCalled();
      expect(mockFallbackOperation).not.toHaveBeenCalled();
    });

    it('uses fallback when online operation fails', async () => {
      const mockOnlineOperation = jest.fn().mockRejectedValue(new Error('network error'));
      const mockFallbackOperation = jest.fn().mockReturnValue('fallback success');

      // Make the retry mechanism fail after all attempts
      MockErrorHandlingService.isRetryableError.mockReturnValue(false);

      const result = await ResilientService.executeWithOfflineSupport(
        mockOnlineOperation,
        mockFallbackOperation,
        'test-context'
      );

      expect(result).toBe('fallback success');
      expect(mockOnlineOperation).toHaveBeenCalled();
      expect(mockFallbackOperation).toHaveBeenCalled();
    });

    it('throws error when both online and fallback operations fail', async () => {
      const mockOnlineOperation = jest.fn().mockRejectedValue(new Error('network error'));
      const mockFallbackOperation = jest.fn().mockRejectedValue(new Error('fallback error'));

      MockErrorHandlingService.isRetryableError.mockReturnValue(false);

      await expect(
        ResilientService.executeWithOfflineSupport(
          mockOnlineOperation,
          mockFallbackOperation,
          'test-context'
        )
      ).rejects.toThrow('fallback error');
    });
  });

  describe('createResilientService', () => {
    class TestService {
      static async getData() {
        return 'data';
      }

      static async saveData(data: string) {
        return `saved: ${data}`;
      }

      static nonAsyncMethod() {
        return 'sync result';
      }
    }

    it('creates resilient version of service class', async () => {
      const resilientService = ResilientService.createResilientService(
        TestService,
        'test-service'
      );

      const result = await resilientService.getData();

      expect(result).toBe('data');
    });

    it('preserves non-function properties', () => {
      const TestServiceWithProps = {
        ...TestService,
        someProperty: 'test value',
      };

      const resilientService = ResilientService.createResilientService(
        TestServiceWithProps,
        'test-service'
      );

      expect(resilientService.someProperty).toBe('test value');
    });

    it('wraps methods with retry logic', async () => {
      const mockGetData = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('data');

      TestService.getData = mockGetData;

      const resilientService = ResilientService.createResilientService(
        TestService,
        'test-service'
      );

      const promise = resilientService.getData();

      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('data');
      expect(mockGetData).toHaveBeenCalledTimes(2);
    });
  });

  describe('withRetry decorator', () => {
    it('adds retry logic to method', async () => {
      class TestClass {
        @withRetry('test-context')
        async testMethod() {
          return 'success';
        }
      }

      const instance = new TestClass();
      const result = await instance.testMethod();

      expect(result).toBe('success');
    });

    it('retries on errors', async () => {
      let callCount = 0;

      class TestClass {
        @withRetry('test-context')
        async testMethod() {
          callCount++;
          if (callCount < 3) {
            throw new Error('network error');
          }
          return 'success';
        }
      }

      const instance = new TestClass();
      const promise = instance.testMethod();

      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      const result = await promise;

      expect(result).toBe('success');
      expect(callCount).toBe(3);
    });
  });

  describe('withOfflineSupport decorator', () => {
    it('adds offline support to method', async () => {
      const fallbackFn = jest.fn().mockReturnValue('fallback result');

      class TestClass {
        @withOfflineSupport('test-context', fallbackFn)
        async testMethod() {
          return 'online result';
        }
      }

      const instance = new TestClass();
      const result = await instance.testMethod();

      expect(result).toBe('online result');
      expect(fallbackFn).not.toHaveBeenCalled();
    });

    it('uses fallback when online method fails', async () => {
      const fallbackFn = jest.fn().mockReturnValue('fallback result');
      MockErrorHandlingService.isRetryableError.mockReturnValue(false);

      class TestClass {
        @withOfflineSupport('test-context', fallbackFn)
        async testMethod() {
          throw new Error('network error');
        }
      }

      const instance = new TestClass();
      const result = await instance.testMethod();

      expect(result).toBe('fallback result');
      expect(fallbackFn).toHaveBeenCalled();
    });

    it('throws error when no fallback is provided', async () => {
      MockErrorHandlingService.isRetryableError.mockReturnValue(false);

      class TestClass {
        @withOfflineSupport('test-context')
        async testMethod() {
          throw new Error('network error');
        }
      }

      const instance = new TestClass();

      await expect(instance.testMethod()).rejects.toThrow('No offline fallback available');
    });
  });
});