import { logger } from './logger.js';

interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export class PerformanceMonitor {
  private entries: PerformanceEntry[] = [];
  private activeMarks: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  mark(name: string): void {
    this.activeMarks.set(name, Date.now());
  }

  /**
   * End timing an operation and record the duration
   */
  measure(name: string): PerformanceEntry | undefined {
    const startTime = this.activeMarks.get(name);
    if (!startTime) {
      logger.warn(`No mark found for: ${name}`);
      return undefined;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    const entry: PerformanceEntry = {
      name,
      startTime,
      endTime,
      duration,
    };

    this.entries.push(entry);
    this.activeMarks.delete(name);

    return entry;
  }

  /**
   * Get all performance entries
   */
  getEntries(): PerformanceEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries for a specific operation
   */
  getEntriesByName(name: string): PerformanceEntry[] {
    return this.entries.filter(entry => entry.name === name);
  }

  /**
   * Calculate average duration for an operation
   */
  getAverageDuration(name: string): number {
    const entries = this.getEntriesByName(name);
    if (entries.length === 0) return 0;

    const totalDuration = entries.reduce((sum, entry) => sum + entry.duration, 0);
    return totalDuration / entries.length;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
    this.activeMarks.clear();
  }

  /**
   * Generate a performance report
   */
  generateReport(): string {
    const operations = new Set(this.entries.map(entry => entry.name));
    let report = 'Performance Report\n';
    report += '=================\n\n';

    for (const operation of operations) {
      const entries = this.getEntriesByName(operation);
      const avgDuration = this.getAverageDuration(operation);
      const minDuration = Math.min(...entries.map(e => e.duration));
      const maxDuration = Math.max(...entries.map(e => e.duration));

      report += `Operation: ${operation}\n`;
      report += `  Count: ${entries.length}\n`;
      report += `  Average: ${avgDuration.toFixed(2)}ms\n`;
      report += `  Min: ${minDuration}ms\n`;
      report += `  Max: ${maxDuration}ms\n\n`;
    }

    return report;
  }

  /**
   * Create a performance decorator for class methods
   */
  static createMethodDecorator() {
    return function performanceDecorator(
      _target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = function (...args: unknown[]) {
        const className = this.constructor.name;
        const methodName = propertyKey;
        const operationName = `${className}.${methodName}`;

        performance.mark(operationName);

        try {
          const result = originalMethod.apply(this, args);

          // Handle promises
          if (result instanceof Promise) {
            return result.finally(() => {
              performance.measure(operationName);
            });
          }

          performance.measure(operationName);
          return result;
        } catch (error) {
          performance.measure(operationName);
          throw error;
        }
      };

      return descriptor;
    };
  }
}

// Global performance monitor instance
export const performance = new PerformanceMonitor();
