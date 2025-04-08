import { ContentCache, CacheOptions } from '../../utils/cache';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('ContentCache', () => {
  // Sample cache options
  const memoryCacheOptions: CacheOptions = {
    enabled: true,
    storageType: 'memory',
    maxSize: 10,
    ttl: 3600000, // 1 hour
  };

  const filesystemCacheOptions: CacheOptions = {
    enabled: true,
    storageType: 'filesystem',
    cacheDir: '/test/cache',
    ttl: 3600000, // 1 hour
  };

  // Sample cache data
  const sampleData = {
    title: 'Test Document',
    content: 'Test content',
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync to return true for cache directory
    (fs.existsSync as jest.Mock).mockImplementation((dirPath: string) => {
      return dirPath === '/test/cache';
    });

    // Mock fs.mkdirSync
    (fs.mkdirSync as jest.Mock).mockImplementation((dirPath: string, _options) => {
      return undefined;
    });

    // Mock fs.writeFileSync
    (fs.writeFileSync as jest.Mock).mockImplementation((filePath: string, _content: string) => {
      return undefined;
    });

    // Mock fs.readFileSync
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('valid-key')) {
        return JSON.stringify({
          data: sampleData,
          timestamp: Date.now() - 1000, // 1 second ago
          key: 'valid-key',
        });
      } else if (filePath.includes('expired-key')) {
        return JSON.stringify({
          data: sampleData,
          timestamp: Date.now() - 7200000, // 2 hours ago (expired)
          key: 'expired-key',
        });
      }
      throw new Error(`File not found: ${filePath}`);
    });

    // Mock fs.unlinkSync
    (fs.unlinkSync as jest.Mock).mockImplementation((filePath: string) => {
      return undefined;
    });

    // Mock fs.readdirSync
    (fs.readdirSync as jest.Mock).mockImplementation((dirPath: string) => {
      if (dirPath === '/test/cache') {
        return ['valid-key.json', 'expired-key.json'];
      }
      return [];
    });

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) => {
      return paths.join('/').replace(/\/+/g, '/');
    });
  });

  test('should initialize with memory storage', () => {
    const cache = new ContentCache<any>(memoryCacheOptions);
    expect(cache).toBeDefined();
  });

  test('should initialize with filesystem storage', () => {
    const cache = new ContentCache<any>(filesystemCacheOptions);
    expect(cache).toBeDefined();
    expect(fs.existsSync).toHaveBeenCalledWith('/test/cache');
  });

  test('should create cache directory if it does not exist', () => {
    // Mock fs.existsSync to return false for cache directory
    (fs.existsSync as jest.Mock).mockImplementation((dirPath: string) => {
      return dirPath !== '/test/cache';
    });

    const cache = new ContentCache<any>(filesystemCacheOptions);
    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/cache', { recursive: true });
  });

  test('should set and get item from memory cache', () => {
    const cache = new ContentCache<any>(memoryCacheOptions);

    cache.set('test-key', sampleData);
    const result = cache.get('test-key');

    expect(result).toEqual(sampleData);
  });

  test('should set and get item from filesystem cache', () => {
    const cache = new ContentCache<any>(filesystemCacheOptions);

    cache.set('test-key', sampleData);

    // Mock fs.existsSync to return true for cache file
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return filePath === '/test/cache/098f6bcd4621d373cade4e832627b4f6.json';
    });

    const result = cache.get('test-key');

    expect(result).toEqual(sampleData);
    expect(fs.writeFileSync).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
  });

  test('should return null for non-existent item', () => {
    const cache = new ContentCache<any>(memoryCacheOptions);

    const result = cache.get('non-existent-key');

    expect(result).toBeNull();
  });

  test('should check if item exists in memory cache', () => {
    const cache = new ContentCache<any>(memoryCacheOptions);

    cache.set('test-key', sampleData);

    expect(cache.has('test-key')).toBe(true);
    expect(cache.has('non-existent-key')).toBe(false);
  });

  test('should check if item exists in filesystem cache', () => {
    const cache = new ContentCache<any>(filesystemCacheOptions);

    // Mock fs.existsSync to return true for valid cache file
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return filePath.includes('valid-key');
    });

    expect(cache.has('valid-key')).toBe(true);
    expect(cache.has('non-existent-key')).toBe(false);
  });

  test('should delete item from memory cache', () => {
    const cache = new ContentCache<any>(memoryCacheOptions);

    cache.set('test-key', sampleData);
    expect(cache.has('test-key')).toBe(true);

    cache.delete('test-key');
    expect(cache.has('test-key')).toBe(false);
  });

  test('should delete item from filesystem cache', () => {
    const cache = new ContentCache<any>(filesystemCacheOptions);

    // Mock fs.existsSync to return true for cache file
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return filePath.includes('test-key');
    });

    cache.delete('test-key');

    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  test('should clear memory cache', () => {
    const cache = new ContentCache<any>(memoryCacheOptions);

    cache.set('test-key-1', sampleData);
    cache.set('test-key-2', sampleData);

    cache.clear();

    expect(cache.has('test-key-1')).toBe(false);
    expect(cache.has('test-key-2')).toBe(false);
  });

  test('should clear filesystem cache', () => {
    const cache = new ContentCache<any>(filesystemCacheOptions);

    cache.clear();

    expect(fs.readdirSync).toHaveBeenCalledWith('/test/cache');
    expect(fs.unlinkSync).toHaveBeenCalledTimes(2); // Two cache files
  });

  test('should handle expired items in memory cache', () => {
    const cache = new ContentCache<any>({
      ...memoryCacheOptions,
      ttl: 1000, // 1 second
    });

    cache.set('test-key', sampleData);

    // Fast-forward time by 2 seconds
    jest.advanceTimersByTime(2000);

    expect(cache.get('test-key')).toBeNull();
  });

  test('should handle expired items in filesystem cache', () => {
    const cache = new ContentCache<any>(filesystemCacheOptions);

    // Mock fs.existsSync to return true for expired cache file
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return filePath.includes('expired-key');
    });

    expect(cache.get('expired-key')).toBeNull();
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  test('should enforce maximum cache size', () => {
    const cache = new ContentCache<any>({
      ...memoryCacheOptions,
      maxSize: 2, // Only allow 2 items
    });

    // Add 3 items
    cache.set('test-key-1', { id: 1 });
    cache.set('test-key-2', { id: 2 });
    cache.set('test-key-3', { id: 3 });

    // The oldest item should be removed
    expect(cache.has('test-key-1')).toBe(false);
    expect(cache.has('test-key-2')).toBe(true);
    expect(cache.has('test-key-3')).toBe(true);
  });

  test('should get cache statistics', () => {
    const cache = new ContentCache<any>(memoryCacheOptions);

    cache.set('test-key-1', { id: 1 });
    cache.set('test-key-2', { id: 2 });

    const stats = cache.getStats();

    expect(stats).toBeDefined();
    expect(stats.enabled).toBe(true);
    expect(stats.storageType).toBe('memory');
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(10);
    expect(stats.ttl).toBe(3600000);
  });

  test('should do nothing when cache is disabled', () => {
    const cache = new ContentCache<any>({
      ...memoryCacheOptions,
      enabled: false,
    });

    cache.set('test-key', sampleData);

    expect(cache.get('test-key')).toBeNull();
    expect(cache.has('test-key')).toBe(false);
  });
});
