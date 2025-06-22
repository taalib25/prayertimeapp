/**
 * Simple performance monitoring utility
 */

interface PerformanceMetrics {
  [key: string]: number;
}

class PerformanceMonitor {
  private startTimes: PerformanceMetrics = {};
  private metrics: PerformanceMetrics = {};

  start(key: string): void {
    this.startTimes[key] = Date.now();
  }

  end(key: string): number {
    const startTime = this.startTimes[key];
    if (!startTime) {
      console.warn(`Performance monitoring: No start time found for ${key}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.metrics[key] = duration;

    console.log(`⏱️ ${key}: ${duration}ms`);
    return duration;
  }

  getMetric(key: string): number {
    return this.metrics[key] || 0;
  }

  getAllMetrics(): PerformanceMetrics {
    return {...this.metrics};
  }

  reset(): void {
    this.startTimes = {};
    this.metrics = {};
  }
}

export const performanceMonitor = new PerformanceMonitor();
