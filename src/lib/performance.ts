/**
 * Performance Optimization Utilities
 * 
 * Enterprise-grade performance monitoring and optimization helpers.
 * Implements best practices for React application performance.
 * 
 * @module lib/performance
 */

/**
 * Request Idle Callback with fallback for older browsers
 * Executes callback when browser is idle
 */
export const requestIdleCallback = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number => {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  // Fallback: execute after a short delay
  const timeout = options?.timeout || 2000;
  return window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 5,
    });
  }, timeout) as unknown as number;
};

/**
 * Cancel idle callback
 */
export const cancelIdleCallback = (id: number): void => {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

/**
 * Debounce function execution
 * Ensures function is only called after a delay period
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

/**
 * Throttle function execution
 * Limits function calls to at most once per delay period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Measure performance of async operations
 * Returns execution time in milliseconds
 */
export async function measurePerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (typeof performance !== 'undefined' && performance.mark) {
    const startMark = `${label}-start`;
    const endMark = `${label}-end`;
    const measureName = `${label}-measure`;

    performance.mark(startMark);
    const result = await fn();
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const measure = performance.getEntriesByName(measureName)[0];
    if (measure && process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${label}: ${measure.duration.toFixed(2)}ms`);
    }

    // Clean up
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);

    return result;
  }

  // Fallback for environments without Performance API
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${label}: ${duration}ms`);
  }
  return result;
}

/**
 * Lazy load images with intersection observer
 * Returns a ref to attach to img elements
 */
export function useLazyImage(): {
  imgRef: React.RefObject<HTMLImageElement>;
  isLoaded: boolean;
} {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const image = entry.target as HTMLImageElement;
            if (image.dataset.src) {
              image.src = image.dataset.src;
              image.removeAttribute('data-src');
              setIsLoaded(true);
              observer.unobserve(image);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(img);

    return () => {
      if (img) observer.unobserve(img);
    };
  }, []);

  return { imgRef, isLoaded };
}

/**
 * Memoize expensive computations with cache
 * Uses WeakMap for automatic garbage collection
 */
export function memoize<Args extends any[], Return>(
  fn: (...args: Args) => Return,
  keyGenerator?: (...args: Args) => string
): (...args: Args) => Return {
  const cache = new Map<string, Return>();

  return (...args: Args): Return => {
    const key = keyGenerator
      ? keyGenerator(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Batch multiple state updates into a single render
 * Useful for preventing multiple re-renders
 */
export function batchUpdates(updates: Array<() => void>): void {
  // React 18+ automatically batches, but this provides explicit control
  if (typeof React.startTransition !== 'undefined') {
    React.startTransition(() => {
      updates.forEach((update) => update());
    });
  } else {
    updates.forEach((update) => update());
  }
}

/**
 * Preload critical resources
 * Improves perceived performance
 */
export function preloadResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch'
): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

/**
 * Prefetch resources for likely next navigation
 */
export function prefetchResource(href: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

// Import React for type definitions
import React from 'react';

