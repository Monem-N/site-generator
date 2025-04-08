import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FileSystemError } from './errors';

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
  maxSize?: number; // Maximum number of items in memory cache
  ttl?: number; // Time to live in milliseconds
  cacheDir?: string; // Directory for filesystem cache
}

/**
 * Cache item with metadata
 */
interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * Content cache for storing parsed documentation
 */
export class ContentCache<T> {
  private options: CacheOptions;
  private memoryCache: Map<string, CacheItem<T>>;
  private cacheDir: string;

  constructor(options: CacheOptions) {
    // Set default options first, then override with provided options
    const defaultOptions = {
      enabled: true,
      storageType: 'memory' as 'memory' | 'filesystem',
      maxSize: 1000,
      ttl: 3600000, // 1 hour
    };

    this.options = { ...defaultOptions, ...options };

    this.memoryCache = new Map<string, CacheItem<T>>();

    // Set up filesystem cache if needed
    if (this.options.storageType === 'filesystem') {
      this.cacheDir = this.options.cacheDir || path.join(process.cwd(), '.cache');
      this.ensureCacheDirectory();
    } else {
      this.cacheDir = '';
    }
  }

  /**
   * Generate a cache key from the input
   */
  private generateKey(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
  }

  /**
   * Ensure the cache directory exists
   */
  private ensureCacheDirectory(): void {
    if (!fs.existsSync(this.cacheDir)) {
      try {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      } catch (_error) {
        throw new FileSystemError(`Failed to create cache directory: ${this.cacheDir}`, {
          directory: this.cacheDir,
          error: _error,
        });
      }
    }
  }

  /**
   * Get the filesystem path for a cache key
   */
  private getCacheFilePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`);
  }

  /**
   * Check if a cache item is expired
   */
  private isExpired(item: CacheItem<T>): boolean {
    if (!this.options.ttl) return false;
    const now = Date.now();
    return now - item.timestamp > this.options.ttl;
  }

  /**
   * Clean up expired items from memory cache
   */
  // Method to clean up memory cache (currently unused but kept for future use)
  private cleanExpiredItems(): void {
    const now = Date.now();
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**

  /**
   * Enforce maximum cache size
   */
  private enforceMaxSize(): void {
    if (!this.options.maxSize) return;

    if (this.memoryCache.size > this.options.maxSize) {
      // Remove oldest items first
      const items = Array.from(this.memoryCache.entries()).sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );

      const itemsToRemove = items.slice(0, this.memoryCache.size - this.options.maxSize);
      for (const [key] of itemsToRemove) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Set an item in the cache
   */
  set(input: string, data: T): void {
    if (!this.options.enabled) return;

    const key = this.generateKey(input);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      key,
    };

    if (this.options.storageType === 'memory') {
      this.memoryCache.set(key, item);
      this.enforceMaxSize();
    } else if (this.options.storageType === 'filesystem') {
      try {
        fs.writeFileSync(this.getCacheFilePath(key), JSON.stringify(item), 'utf-8');
      } catch (_error) {
        throw new FileSystemError(`Failed to write to cache file: ${key}`, {
          key,
          error: _error,
        });
      }
    }
  }

  /**
   * Get an item from the cache
   * @returns The cached data or null if not found or expired
   */
  get(input: string): T | null {
    if (!this.options.enabled) return null;

    const key = this.generateKey(input);

    if (this.options.storageType === 'memory') {
      const item = this.memoryCache.get(key);

      if (!item) return null;
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
        return null;
      }

      return item.data;
    } else if (this.options.storageType === 'filesystem') {
      const filePath = this.getCacheFilePath(key);

      if (!fs.existsSync(filePath)) return null;

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const item: CacheItem<T> = JSON.parse(content);

        if (this.isExpired(item)) {
          fs.unlinkSync(filePath);
          return null;
        }

        return item.data;
      } catch (error) {
        // If there's an error reading the cache, just return null
        return null;
      }
    }

    return null;
  }

  /**
   * Check if an item exists in the cache and is not expired
   */
  has(input: string): boolean {
    if (!this.options.enabled) return false;

    const key = this.generateKey(input);

    if (this.options.storageType === 'memory') {
      const item = this.memoryCache.get(key);
      if (!item) return false;
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
        return false;
      }
      return true;
    } else if (this.options.storageType === 'filesystem') {
      const filePath = this.getCacheFilePath(key);

      if (!fs.existsSync(filePath)) return false;

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const item: CacheItem<T> = JSON.parse(content);

        if (this.isExpired(item)) {
          fs.unlinkSync(filePath);
          return false;
        }

        return true;
      } catch (error) {
        return false;
      }
    }

    return false;
  }

  /**
   * Delete an item from the cache
   */
  delete(input: string): void {
    if (!this.options.enabled) return;

    const key = this.generateKey(input);

    if (this.options.storageType === 'memory') {
      this.memoryCache.delete(key);
    } else if (this.options.storageType === 'filesystem') {
      const filePath = this.getCacheFilePath(key);

      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          throw new FileSystemError(`Failed to delete cache file: ${key}`, {
            key,
            error,
          });
        }
      }
    }
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    if (!this.options.enabled) return;

    if (this.options.storageType === 'memory') {
      this.memoryCache.clear();
    } else if (this.options.storageType === 'filesystem') {
      try {
        const files = fs.readdirSync(this.cacheDir);

        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(this.cacheDir, file));
          }
        }
      } catch (error) {
        throw new FileSystemError(`Failed to clear cache directory: ${this.cacheDir}`, {
          directory: this.cacheDir,
          error,
        });
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    enabled: boolean;
    storageType: CacheStorageType;
    size: number;
    maxSize?: number;
    ttl?: number;
  } {
    if (this.options.storageType === 'memory') {
      return {
        enabled: this.options.enabled,
        storageType: this.options.storageType,
        size: this.memoryCache.size,
        maxSize: this.options.maxSize,
        ttl: this.options.ttl,
      };
    } else if (this.options.storageType === 'filesystem') {
      try {
        const files = fs.readdirSync(this.cacheDir);
        const cacheFiles = files.filter(file => file.endsWith('.json'));

        return {
          enabled: this.options.enabled,
          storageType: this.options.storageType,
          size: cacheFiles.length,
          ttl: this.options.ttl,
        };
      } catch (error) {
        return {
          enabled: this.options.enabled,
          storageType: this.options.storageType,
          size: 0,
          ttl: this.options.ttl,
        };
      }
    }

    return {
      enabled: this.options.enabled,
      storageType: 'memory',
      size: 0,
    };
  }
}
