import { EventEmitter } from 'events';

/**
 * Service status
 */
export enum ServiceStatus {
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Base service interface
 */
export interface IService {
  getName(): string;
  getStatus(): ServiceStatus;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

/**
 * Base service implementation
 */
export abstract class BaseService extends EventEmitter implements IService {
  protected name: string;
  protected status: ServiceStatus;
  protected startTime: number;
  protected metrics: Record<string, number>;

  constructor(name: string) {
    super();
    this.name = name;
    this.status = ServiceStatus.STOPPED;
    this.startTime = 0;
    this.metrics = {};
  }

  /**
   * Get the service name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the current service status
   */
  getStatus(): ServiceStatus {
    return this.status;
  }

  /**
   * Check if the service is running
   */
  isRunning(): boolean {
    return this.status === ServiceStatus.RUNNING;
  }

  /**
   * Start the service
   */
  async start(): Promise<void> {
    if (this.status === ServiceStatus.RUNNING) {
      return;
    }

    this.status = ServiceStatus.STARTING;
    this.emit('starting');

    try {
      await this.doStart();
      this.status = ServiceStatus.RUNNING;
      this.startTime = Date.now();
      this.emit('started');
    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    if (this.status === ServiceStatus.STOPPED) {
      return;
    }

    this.status = ServiceStatus.STOPPING;
    this.emit('stopping');

    try {
      await this.doStop();
      this.status = ServiceStatus.STOPPED;
      this.emit('stopped');
    } catch (error) {
      this.status = ServiceStatus.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get service metrics
   */
  getMetrics(): Record<string, number> {
    const uptime = this.startTime > 0 ? Date.now() - this.startTime : 0;

    return {
      uptime,
      ...this.metrics,
    };
  }

  /**
   * Increment a metric
   */
  protected incrementMetric(name: string, value = 1): void {
    this.metrics[name] = (this.metrics[name] || 0) + value;
  }

  /**
   * Set a metric value
   */
  protected setMetric(name: string, value: number): void {
    this.metrics[name] = value;
  }

  /**
   * Implementation of service start logic
   */
  protected abstract doStart(): Promise<void>;

  /**
   * Implementation of service stop logic
   */
  protected abstract doStop(): Promise<void>;
}
