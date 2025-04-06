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
 * Global error handler for uncaught exceptions
 */
export function setupGlobalErrorHandler(verbose = false): void {
  process.on('uncaughtException', error => {
    console.error('\n🔥 Uncaught Exception:');

    if (error instanceof SiteGeneratorError) {
      console.error(error.getFormattedMessage());
    } else {
      console.error(`[UNKNOWN_ERROR] ${error.message}`);
    }

    if (verbose) {
      console.error('\nStack Trace:');
      console.error(error.stack);
    } else {
      console.error('\nRun with --verbose flag for more details.');
    }

    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('\n🔥 Unhandled Promise Rejection:');

    if (reason instanceof SiteGeneratorError) {
      console.error(reason.getFormattedMessage());
    } else {
      console.error(`[UNHANDLED_REJECTION] ${reason}`);
    }

    if (verbose) {
      console.error('\nStack Trace:');
      console.error((reason as Error).stack);
    } else {
      console.error('\nRun with --verbose flag for more details.');
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
