/**
 * Logger utility for standardized logging throughout the application
 */

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${message}`, ...args);
  },

  error: (message: string, error: Error | unknown) => {
    console.error(`[ERROR] ${message}`, error);
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    console.debug(`[DEBUG] ${message}`, ...args);
  },
};
