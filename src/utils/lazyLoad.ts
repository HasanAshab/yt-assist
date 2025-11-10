import { lazy, ComponentType } from 'react';

/**
 * Enhanced lazy loading utility with retry mechanism and better error handling
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): ComponentType<any> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      let attempt = 0;
      
      const tryImport = async () => {
        try {
          const module = await importFunc();
          resolve(module);
        } catch (error) {
          attempt++;
          if (attempt >= retries) {
            reject(error);
          } else {
            // Exponential backoff
            setTimeout(tryImport, delay * Math.pow(2, attempt - 1));
          }
        }
      };
      
      tryImport();
    });
  });
}

/**
 * Preload a component for better perceived performance
 */
export function preloadComponent(importFunc: () => Promise<any>): void {
  // Only preload if the browser supports it and we're not on a slow connection
  if (
    'connection' in navigator &&
    (navigator as any).connection?.effectiveType !== 'slow-2g' &&
    (navigator as any).connection?.effectiveType !== '2g'
  ) {
    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        importFunc().catch(() => {
          // Silently fail preloading
        });
      });
    } else {
      setTimeout(() => {
        importFunc().catch(() => {
          // Silently fail preloading
        });
      }, 100);
    }
  }
}

/**
 * Component preloader for route-based preloading
 */
export class ComponentPreloader {
  private static preloadedComponents = new Set<string>();
  
  static preload(componentName: string, importFunc: () => Promise<any>): void {
    if (!this.preloadedComponents.has(componentName)) {
      this.preloadedComponents.add(componentName);
      preloadComponent(importFunc);
    }
  }
  
  static reset(): void {
    this.preloadedComponents.clear();
  }
}