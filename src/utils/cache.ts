import * as fs from 'fs/promises'; // Use fs/promises for async operations
import * as path from 'path';
import * as crypto from 'crypto';
import { FileSystemError } from './errors.js';
// import * as os from 'os'; // Optional: if considering os.tmpdir() as default

/**
 * Cache storage types
 */
export type CacheStorageType = 'memory' | 'filesystem';

/**
 * Cache options
 */
export interface CacheOptions {
  enabled: boolean;
  storageType: CacheStorageType;
  maxSize?: number; // Maximum number of items in memory cache (ignored for filesystem)
  ttl?: number; // Time to live in milliseconds (0 or undefined means infinite)
  cacheDir?: string; // Directory for filesystem cache
}

/**
 * Cache item with metadata
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string; // Store key for potential debugging or easier identification
}

/**
 * Content cache for storing parsed documentation or other serializable data.
 * Note: When using 'filesystem' storage, the cached data type <T> must be
 * JSON serializable (compatible with JSON.stringify and JSON.parse).
 */
export class ContentCache<T> {
  private options: Required<CacheOptions>; // Use Required utility type for internal use
  private memoryCache: Map<string, CacheItem<T>>;
  private cacheDir: string;
  private isFileSystemInitialized = false; // Track if ensureCacheDirectory succeeded

  constructor(options: CacheOptions) {
    const defaultOptions: Required<CacheOptions> = {
      enabled: true,
      storageType: 'memory',
      maxSize: 1000,
      ttl: 3600000, // 1 hour
      // Default cacheDir is now set only if storageType is 'filesystem'
      cacheDir: '', // Set later if needed
    };

    // Override defaults with provided options
    this.options = { ...defaultOptions, ...options };

    this.memoryCache = new Map<string, CacheItem<T>>();

    // Set up filesystem cache path *only* if needed
    if (this.options.storageType === 'filesystem') {
      // Provide a default cache directory if none is specified
      this.cacheDir = this.options.cacheDir || path.join(process.cwd(), '.cache');
      // Note: We don't call ensureCacheDirectory here, it will be called on first write/read attempt
    } else {
      // Ensure cacheDir is empty if not using filesystem
      this.cacheDir = '';
      this.isFileSystemInitialized = true; // Mark as "initialized" (not needed)
    }
  }

  /**
   * Generate a cache key from the input using SHA-256.
   */
  private generateKey(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Ensure the cache directory exists. Creates it if necessary.
   * Throws FileSystemError on failure.
   */
  private async ensureCacheDirectory(): Promise<void> {
    // Avoid repeated checks if already successfully initialized
    if (this.isFileSystemInitialized) {
      return;
    }

    // Should only be called if storageType is 'filesystem'
    if (this.options.storageType !== 'filesystem' || !this.cacheDir) {
      // This case should ideally not happen if constructor logic is correct
      this.isFileSystemInitialized = true; // Prevent further attempts
      return;
    }

    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      this.isFileSystemInitialized = true; // Mark as successfully initialized
    } catch (_error: unknown) {
      // Use unknown for caught errors
      // Prevent further FS operations if directory creation fails
      this.options.enabled = false; // Disable cache to prevent further errors
      throw new FileSystemError(
        `Failed to create or access cache directory: ${this.cacheDir}. Disabling cache.`,
        {
          directory: this.cacheDir,
          error: _error,
        }
      );
    }
  }

  /**
   * Get the filesystem path for a cache key.
   */
  private getCacheFilePath(key: string): string {
    // Ensure cacheDir is set (should be guaranteed by constructor if type is filesystem)
    return this.cacheDir ? path.join(this.cacheDir, `${key}.json`) : '';
  }

  /**
   * Check if a cache item is expired based on TTL.
   */
  private isExpired(itemTimestamp: number): boolean {
    // No TTL means items never expire
    if (!this.options.ttl || this.options.ttl <= 0) {
      return false;
    }
    // Correctly capture current time
    const now = Date.now();
    return now - itemTimestamp > this.options.ttl;
  }

  /**
   * Clean up expired items from memory cache.
   * Note: Currently unused as expiration is checked lazily on get/has.
   * Kept for potential future use (e.g., periodic cleanup).
   */
  private cleanExpiredMemoryItems(): void {
    if (this.options.storageType !== 'memory') return; // Only applies to memory cache

    // Iterate safely and delete expired items
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item.timestamp)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Enforce maximum cache size for memory storage.
   * Removes the oldest items (based on insertion timestamp) if the size exceeds the limit.
   * Note: Sorting the entire map can be inefficient for very large maxSize.
   * Consider dedicated LRU structures if performance becomes critical at scale.
   */
  private enforceMaxSize(): void {
    // Only applies to memory cache and if maxSize is set
    if (
      this.options.storageType !== 'memory' ||
      !this.options.maxSize ||
      this.options.maxSize <= 0
    ) {
      return;
    }

    // Check if size limit is exceeded
    if (this.memoryCache.size > this.options.maxSize) {
      // Convert map entries to array and sort by timestamp (oldest first)
      const sortedItems = Array.from(this.memoryCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      // Calculate how many items to remove
      const itemsToRemoveCount = this.memoryCache.size - this.options.maxSize;

      // Remove the oldest items
      for (let i = 0; i < itemsToRemoveCount; i++) {
        const [keyToRemove] = sortedItems[i];
        this.memoryCache.delete(keyToRemove);
      }
    }
  }

  /**
   * Reads a cache item from the filesystem, parses it, and validates TTL.
   * Returns the valid CacheItem or null if not found, invalid, or expired.
   * Handles file system errors internally.
   */
  private async _readAndValidateFileSystemItem(key: string): Promise<CacheItem<T> | null> {
    const filePath = this.getCacheFilePath(key);
    if (!filePath) return null; // Should not happen if called correctly

    try {
      await this.ensureCacheDirectory(); // Ensure directory exists before reading
      if (!this.options.enabled) return null; // Check if cache was disabled by ensureCacheDirectory failure

      const content = await fs.readFile(filePath, 'utf-8');
      const item: CacheItem<T> = JSON.parse(content); // Could throw SyntaxError

      // Validate basic structure (optional but good practice)
      if (
        typeof item !== 'object' ||
        item === null ||
        typeof item.data === 'undefined' ||
        typeof item.timestamp !== 'number'
      ) {
        logger.warn(`[ContentCache] Found corrupted cache file: ${filePath}. Deleting.`);
        await this._deleteFile(filePath); // Attempt to delete corrupted file
        return null;
      }

      if (this.isExpired(item.timestamp)) {
        // Attempt to delete expired file, but don't throw if deletion fails
        await this._deleteFile(filePath);
        return null; // Return null for expired items
      }

      return item;
    } catch (error: unknown) {
      const errorDetails = error as { code?: string; message?: string }; // Type guard
      if (errorDetails?.code === 'ENOENT') {
        // File not found, which is a normal cache miss
        return null;
      }
      if (error instanceof SyntaxError) {
        logger.warn(
          `[ContentCache] Failed to parse JSON from cache file: ${filePath}. Deleting. Error: ${error.message}`
        );
        // Attempt to delete corrupted file
        await this._deleteFile(filePath);
        return null;
      }
      // Log other unexpected errors during read/parse
      logger.warn(`[ContentCache] Error reading cache file ${filePath}:`, error);
      return null; // Treat other errors as cache misses
    }
  }

  /**
   * Helper to delete a file, ignoring ENOENT errors.
   */
  private async _deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error: unknown) {
      const errorDetails = error as { code?: string }; // Type guard
      if (errorDetails?.code !== 'ENOENT') {
        logger.warn(`[ContentCache] Failed to delete cache file ${filePath}:`, error);
      }
    }
  }

  /**
   * Set an item in the cache.
   */
  async set(input: string, data: T): Promise<void> {
    if (!this.options.enabled) return;

    const key = this.generateKey(input);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      key, // Include key in stored item
    };

    if (this.options.storageType === 'memory') {
      this.memoryCache.set(key, item);
      this.enforceMaxSize(); // Synchronous memory operation
    } else if (this.options.storageType === 'filesystem') {
      await this.ensureCacheDirectory(); // Ensure directory exists before writing
      if (!this.options.enabled) return; // Check if cache was disabled

      const filePath = this.getCacheFilePath(key);
      try {
        await fs.writeFile(filePath, JSON.stringify(item, null, 2), 'utf-8'); // Use null, 2 for pretty printing JSON
      } catch (_error: unknown) {
        // If write fails, we might want to disable cache or just log
        logger.error(`[ContentCache] Failed to write to cache file: ${filePath}`, _error);
        // Optionally throw a FileSystemError, but this might halt application. Logging might be sufficient.
        // throw new FileSystemError(`Failed to write to cache file: ${key}`, { key, error: _error });
      }
    }
  }

  /**
   * Get an item from the cache.
   * Returns the cached data or null if not found, expired, or invalid.
   */
  async get(input: string): Promise<T | null> {
    if (!this.options.enabled) return null;

    const key = this.generateKey(input);

    if (this.options.storageType === 'memory') {
      const item = this.memoryCache.get(key);

      if (!item) return null; // Not found

      if (this.isExpired(item.timestamp)) {
        this.memoryCache.delete(key); // Delete expired item
        return null;
      }

      return item.data; // Return valid data
    } else if (this.options.storageType === 'filesystem') {
      const item = await this._readAndValidateFileSystemItem(key);
      return item ? item.data : null; // Return data from valid item, or null
    }

    // Should not be reached if storageType is valid
    return null;
  }

  /**
   * Check if a non-expired item exists in the cache.
   */
  async has(input: string): Promise<boolean> {
    if (!this.options.enabled) return false;

    const key = this.generateKey(input);

    if (this.options.storageType === 'memory') {
      const item = this.memoryCache.get(key);
      if (!item) return false;

      if (this.isExpired(item.timestamp)) {
        this.memoryCache.delete(key); // Delete expired item
        return false;
      }
      return true; // Valid item exists
    } else if (this.options.storageType === 'filesystem') {
      // Use the helper; it returns null for non-existent, invalid, or expired items.
      const item = await this._readAndValidateFileSystemItem(key);
      return !!item; // Return true if item is not null (i.e., exists and is valid)
    }

    return false;
  }

  /**
   * Delete an item from the cache.
   */
  async delete(input: string): Promise<void> {
    if (!this.options.enabled) return;

    const key = this.generateKey(input);

    if (this.options.storageType === 'memory') {
      this.memoryCache.delete(key);
    } else if (this.options.storageType === 'filesystem') {
      await this.ensureCacheDirectory(); // Needed mainly to check if cache got disabled
      if (!this.options.enabled) return;

      const filePath = this.getCacheFilePath(key);
      await this._deleteFile(filePath); // Use helper to delete, ignoring not found errors
    }
  }

  /**
   * Clear all items from the cache.
   */
  async clear(): Promise<void> {
    if (!this.options.enabled) return;

    if (this.options.storageType === 'memory') {
      this.memoryCache.clear();
    } else if (this.options.storageType === 'filesystem') {
      await this.ensureCacheDirectory(); // Ensure directory access and check enabled status
      if (!this.options.enabled || !this.cacheDir) return;

      let files: string[] = [];
      try {
        files = await fs.readdir(this.cacheDir);
      } catch (error: unknown) {
        const errorDetails = error as { code?: string }; // Type guard
        if (errorDetails?.code === 'ENOENT') {
          // Directory doesn't exist, nothing to clear
          this.isFileSystemInitialized = false; // Reset initialization status
          return;
        }
        // Log other errors during readdir
        logger.error(
          `[ContentCache] Failed to read cache directory for clearing: ${this.cacheDir}`,
          error
        );
        // Optionally throw FileSystemError
        // throw new FileSystemError(`Failed to read cache directory for clearing: ${this.cacheDir}`, { directory: this.cacheDir, error });
        return; // Don't proceed if reading failed
      }

      // Create a list of deletion promises
      const deletionPromises: Promise<void>[] = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          // Only target our cache files
          const filePath = path.join(this.cacheDir, file);
          // Use _deleteFile helper which handles errors internally
          deletionPromises.push(this._deleteFile(filePath));
        }
      }

      // Wait for all deletions to complete (or fail individually)
      await Promise.all(deletionPromises);
      // Log if any deletion failed (handled within _deleteFile)
      // No explicit error throwing here unless absolutely necessary
    }
  }

  /**
   * Get cache statistics.
   */
  async getStats(): Promise<{
    enabled: boolean;
    storageType: CacheStorageType;
    size: number;
    maxSize?: number; // Only relevant for memory
    ttl?: number;
    cacheDir?: string; // Only relevant for filesystem
  }> {
    const baseStats = {
      enabled: this.options.enabled,
      storageType: this.options.storageType,
      ttl: this.options.ttl,
    };

    if (this.options.storageType === 'memory') {
      return {
        ...baseStats,
        size: this.memoryCache.size,
        maxSize: this.options.maxSize,
      };
    } else if (this.options.storageType === 'filesystem') {
      let size = 0;
      // Check cacheDir existence; if ensureCacheDirectory failed, size is 0.
      if (this.options.enabled && this.cacheDir) {
        try {
          // No need to call ensureCacheDirectory again, just try reading
          const files = await fs.readdir(this.cacheDir);
          size = files.filter(file => file.endsWith('.json')).length;
        } catch (error: unknown) {
          const errorDetails = error as { code?: string }; // Type guard
          if (errorDetails?.code === 'ENOENT') {
            // Directory doesn't exist yet or was deleted
            size = 0;
            this.isFileSystemInitialized = false; // Reset flag if dir vanished
          } else {
            // Log error reading directory for stats
            logger.warn(
              `[ContentCache] Failed to read cache directory for stats: ${this.cacheDir}`,
              error
            );
            size = 0; // Report 0 size on error
          }
        }
      }
      return {
        ...baseStats,
        size: size,
        cacheDir: this.cacheDir,
      };
    }

    // Fallback (shouldn't be reached with valid storageType)
    return {
      ...baseStats,
      size: 0,
    };
  }
}

// Example Usage (requires an async context):
/*
async function main() {
  // Example FileSystemError import (replace with your actual path)
  // class FileSystemError extends Error { constructor(message, options) { super(message);
import { logger } from './utils/logger.js'; this.options = options; } }

  const cache = new ContentCache<string>({
    enabled: true,
    storageType: 'filesystem',
    ttl: 5000, // 5 seconds
    cacheDir: './my-app-cache'
  });

  const input1 = "some unique input string";
  const input2 = "another input";

  logger.debug("Setting item 1...");
  await cache.set(input1, "This is cached data V1");

  logger.debug("Getting item 1:", await cache.get(input1));
  logger.debug("Has item 1:", await cache.has(input1));
  logger.debug("Getting item 2 (should be null):", await cache.get(input2));

  logger.debug("Cache stats:", await cache.getStats());

  logger.debug("Waiting for TTL to expire...");
  await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds

  logger.debug("Getting item 1 after TTL (should be null):", await cache.get(input1));
  logger.debug("Has item 1 after TTL (should be false):", await cache.has(input1));

  logger.debug("Setting item 2...");
  await cache.set(input2, "This is cached data V2");

  logger.debug("Getting item 2:", await cache.get(input2));
  logger.debug("Has item 2:", await cache.has(input2));

  logger.debug("Clearing cache...");
  await cache.clear();

  logger.debug("Cache stats after clear:", await cache.getStats());
}

main().catch(err => logger.error("Example failed:", err));
*/
