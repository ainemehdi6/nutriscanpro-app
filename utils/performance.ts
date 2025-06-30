import React from 'react';

// Performance monitoring utility
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private timers: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    // Store metric for averaging
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);

    // Log if duration is significant
    if (duration > 100) {
      console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  getAverageTime(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  clearMetrics(): void {
    this.metrics.clear();
    this.timers.clear();
  }

  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, times] of this.metrics.entries()) {
      result[name] = this.getAverageTime(name);
    }
    return result;
  }
}

// Decorator for measuring function performance
export function measurePerformance(name?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const timerName = name || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const monitor = PerformanceMonitor.getInstance();
      monitor.startTimer(timerName);
      
      try {
        const result = await method.apply(this, args);
        monitor.endTimer(timerName);
        return result;
      } catch (error) {
        monitor.endTimer(timerName);
        throw error;
      }
    };
  };
}

// Hook for measuring component render performance
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  React.useEffect(() => {
    monitor.startTimer(`${componentName}-render`);
    
    return () => {
      monitor.endTimer(`${componentName}-render`);
    };
  });
}

// Utility functions
export const performanceMonitor = PerformanceMonitor.getInstance();

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory usage monitoring
export function logMemoryUsage(label?: string): void {
  if (__DEV__) {
    const used = process.memoryUsage();
    console.log(`${label || 'Memory Usage'}:`, {
      rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
      external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`,
    });
  }
} 