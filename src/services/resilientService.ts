import { ErrorHandlingService } from './errorHandling.service';

export interface RetryConfig {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
}

const defaultRetryConfig: Required<RetryConfig> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: (error: Error) => ErrorHandlingService.isRetryableError(error),
};

/**
 * Resilient service wrapper that adds retry logic and error handling to any service method
 */
export class ResilientService {
  private static calculateDelay(attempt: number, config: Required<RetryConfig>): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute a service method with retry logic and error handling
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    config: RetryConfig = {}
  ): Promise<T> {
    const finalConfig = { ...defaultRetryConfig, ...config };
    const errorService = ErrorHandlingService.getInstance();
    let lastError: Error;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Report error for monitoring
        errorService.reportError(lastError, context, { attempt });

        // Check if we should retry
        if (!finalConfig.retryCondition(lastError) || attempt === finalConfig.maxAttempts) {
          throw new Error(
            ErrorHandlingService.createUserFriendlyMessage(lastError, context)
          );
        }

        // Wait before retrying with exponential backoff
        const delay = this.calculateDelay(attempt, finalConfig);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Execute a service method with offline queue support
   */
  static async executeWithOfflineSupport<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => T | Promise<T>,
    context: string,
    config: RetryConfig = {}
  ): Promise<T> {
    try {
      return await this.executeWithRetry(operation, context, config);
    } catch (error) {
      // If online operation fails and we have a fallback, use it
      if (typeof fallbackOperation === 'function') {
        console.warn(`Using fallback for ${context}:`, error);
        return await fallbackOperation();
      }
      throw error;
    }
  }

  /**
   * Create a resilient version of any service class
   */
  static createResilientService<T extends Record<string, any>>(
    serviceClass: T,
    defaultContext: string,
    defaultConfig: RetryConfig = {}
  ): T {
    const resilientService = {} as T;

    Object.getOwnPropertyNames(serviceClass).forEach(methodName => {
      const method = serviceClass[methodName];
      
      if (typeof method === 'function' && methodName !== 'constructor') {
        (resilientService as any)[methodName] = async (...args: any[]) => {
          const context = `${defaultContext}-${methodName}`;
          
          return this.executeWithRetry(
            () => method.apply(serviceClass, args),
            context,
            defaultConfig
          );
        };
      } else {
        (resilientService as any)[methodName] = method;
      }
    });

    return resilientService;
  }
}

/**
 * Decorator for adding retry logic to service methods
 */
export function withRetry(
  context: string,
  config: RetryConfig = {}
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return ResilientService.executeWithRetry(
        () => method.apply(this, args),
        `${target.constructor.name}-${propertyName}`,
        config
      );
    };

    return descriptor;
  };
}

/**
 * Decorator for adding offline support to service methods
 */
export function withOfflineSupport(
  context: string,
  fallbackFn?: (...args: any[]) => any,
  config: RetryConfig = {}
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const fallback = fallbackFn ? () => fallbackFn.apply(this, args) : undefined;
      
      return ResilientService.executeWithOfflineSupport(
        () => method.apply(this, args),
        fallback || (() => { throw new Error('No offline fallback available'); }),
        `${target.constructor.name}-${propertyName}`,
        config
      );
    };

    return descriptor;
  };
}