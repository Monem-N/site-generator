import { logger } from './utils/logger.js';

/**
 * Base error class for all site generator errors
 * Provides standardized error handling with error codes and contextual information
 */
export class SiteGeneratorError extends Error {
  code: string;
  context?: Record<string, any>;

  constructor(message: string, code: string, context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a formatted error message with context information
   */
  getFormattedMessage(): string {
    let message = `[${this.code}] ${this.message}`;

    if (this.context && Object.keys(this.context).length > 0) {
      message += '\nContext:';
      for (const [key, value] of Object.entries(this.context)) {
        message += `\n  ${key}: ${JSON.stringify(value)}`;
      }
    }

    return message;
  }
}

/**
 * Error thrown when there's an issue with configuration
 */
export class ConfigurationError extends SiteGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONFIG_ERROR', context);
  }
}

/**
 * Error thrown when there's an issue with parsing documentation
 */
export class ParserError extends SiteGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PARSER_ERROR', context);
  }
}

/**
 * Error thrown when there's an issue with generating components
 */
export class GeneratorError extends SiteGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'GENERATOR_ERROR', context);
  }
}

/**
 * Error thrown when there's an issue with building the website
 */
export class BuildError extends SiteGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'BUILD_ERROR', context);
  }
}

/**
 * Error thrown when there's an issue with plugins
 */
export class PluginError extends SiteGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PLUGIN_ERROR', context);
  }
}

/**
 * Error thrown when there's an issue with file system operations
 */
export class FileSystemError extends SiteGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'FS_ERROR', context);
  }
}

/**
 * Error thrown when a feature is not implemented
 */
export class NotImplementedError extends SiteGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NOT_IMPLEMENTED', context);
  }
}

/**
 * Error thrown when there's an issue with templates
 */
export class TemplateError extends SiteGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'TEMPLATE_ERROR', context);
  }
}

/**
 * Error thrown when there's an issue with validation
 */
export class ValidationError extends SiteGeneratorError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context);
  }
}

/**
 * Global error handler for uncaught exceptions
 */
export function setupGlobalErrorHandler(verbose = false): void {
  process.on('uncaughtException', error => {
    logger.error('\n🔥 Uncaught Exception:');

    if (error instanceof SiteGeneratorError) {
      logger.error(error.getFormattedMessage());
    } else {
      logger.error(`[UNKNOWN_ERROR] ${error.message}`);
    }

    if (verbose) {
      logger.error('\nStack Trace:');
      logger.error(error.stack);
    } else {
      logger.error('\nRun with --verbose flag for more details.');
    }

    process.exit(1);
  });

  process.on('unhandledRejection', (reason, _promise) => {
    logger.error('\n🔥 Unhandled Promise Rejection:');

    if (reason instanceof SiteGeneratorError) {
      logger.error(reason.getFormattedMessage());
    } else {
      logger.error(`[UNHANDLED_REJECTION] ${reason}`);
    }

    if (verbose) {
      logger.error('\nStack Trace:');
      logger.error((reason as Error).stack);
    } else {
      logger.error('\nRun with --verbose flag for more details.');
    }

    process.exit(1);
  });
}

/**
 * Error handler for async functions
 * @param fn Async function to wrap with error handling
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof SiteGeneratorError) {
        throw error;
      } else {
        throw new SiteGeneratorError(
          (error as Error).message || 'Unknown error occurred',
          'INTERNAL_ERROR',
          { originalError: error }
        );
      }
    }
  };
}

/**
 * Try-catch wrapper for async functions
 * @param fn Function to execute
 * @param errorHandler Optional error handler
 * @returns Result of the function or error handler
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => T | Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      return await errorHandler(error);
    }
    throw error;
  }
}

/**
 * Try-catch wrapper for sync functions
 * @param fn Function to execute
 * @param errorHandler Optional error handler
 * @returns Result of the function or error handler
 */
export function tryCatchSync<T>(fn: () => T, errorHandler?: (error: unknown) => T): T {
  try {
    return fn();
  } catch (error) {
    if (errorHandler) {
      return errorHandler(error);
    }
    throw error;
  }
}
