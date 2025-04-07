/**
 * Logger utility for standardized logging throughout the application
 * Respects the logging configuration from WebsiteGeneratorConfig
 */

export interface LoggerConfig {
  enabled?: boolean;
  level?: 'debug' | 'info' | 'warn' | 'error';
  format?: 'json' | 'text';
}

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig = {
    enabled: true,
    level: 'info',
    format: 'text',
  };

  private constructor() {
    // Private constructor to enforce singleton pattern
  }

  /**
   * Get the singleton instance of the logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Configure the logger
   * @param config Logger configuration
   */
  public configure(config: LoggerConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param context Optional context data
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    this.log('debug', message, context);
  }

  /**
   * Log an info message
   * @param message The message to log
   * @param context Optional context data
   */
  public info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param context Optional context data
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param context Optional context data
   */
  public error(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    this.log('error', message, context);
  }

  /**
   * Determine if a message should be logged based on the current log level
   * @param level The log level to check
   * @returns Whether the message should be logged
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    if (!this.config.enabled) return false;

    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.level || 'info');
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= configLevelIndex;
  }

  /**
   * Format and output a log message
   * @param level The log level
   * @param message The message to log
   * @param context Optional context data
   */
  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString();

    if (this.config.format === 'json') {
      console[level]?.(
        JSON.stringify({
          timestamp,
          level,
          message,
          context,
        })
      );
    } else {
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      console[level]?.(`[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`);
    }
  }
}

// Export a default logger instance
export const logger = Logger.getInstance();
