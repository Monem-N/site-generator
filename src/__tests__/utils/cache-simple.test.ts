import { ContentCache, CacheOptions } from '../../utils/cache';

describe('ContentCache', () => {
  test('should initialize with memory storage', () => {
    const options: CacheOptions = {
      enabled: true,
      storageType: 'memory',
      maxSize: 100,
      ttl: 3600,
    };
    const cache = new ContentCache<string>(options);
    expect(cache).toBeDefined();
  });
});
