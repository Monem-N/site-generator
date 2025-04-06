import { WebsiteGenerator } from '../WebsiteGenerator';
import fs from 'fs';
import path from 'path';
import { WebsiteGeneratorConfig } from '../../config/generator.config';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

// Create a minimal test configuration
const createTestConfig = (): WebsiteGeneratorConfig => ({
  projectName: 'test-project',
  sourceDir: '/test/source',
  outputDir: '/test/output',

  parser: {
    extensions: ['md'],
    ignorePatterns: ['node_modules'],
    plugins: [],
  },

  generator: {
    templates: {
      page: '/test/templates/page.tsx',
      section: '/test/templates/section.tsx',
    },
    componentNaming: {
      style: 'PascalCase',
    },
  },

  designSystem: {
    type: 'custom',
    name: 'test-theme',
    importPath: '/test/themes',
    components: {
      Button: {
        import: '/test/themes/Button',
      },
    },
    styles: {
      global: '/test/themes/global.css',
    },
  },

  testing: {
    framework: 'jest',
    coverage: {
      enabled: true,
      threshold: 80,
    },
    components: {
      unit: true,
      integration: true,
    },
  },

  build: {
    optimization: {
      minify: true,
      splitChunks: true,
      treeshaking: true,
    },
    assets: {
      images: {
        optimize: true,
        formats: ['webp'],
      },
      fonts: {
        preload: true,
        formats: ['woff2'],
      },
    },
  },

  performance: {
    lazyLoading: true,
    prefetching: true,
    caching: {
      enabled: true,
      strategy: 'memory',
    },
  },

  accessibility: {
    wcag: {
      level: 'AA',
      automated: true,
    },
    aria: true,
    keyboard: true,
  },
});

describe('WebsiteGenerator', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync to return true for directories
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return true;
    });

    // Mock path.resolve to return the input path
    (path.resolve as jest.Mock).mockImplementation((path: string) => {
      return path;
    });
  });

  test('should initialize with valid configuration', () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    expect(generator).toBeDefined();
    expect(generator.getConfig()).toEqual(config);
  });

  test('should validate source directory exists', () => {
    const config = createTestConfig();

    // Mock fs.existsSync to return false for source directory
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return path !== config.sourceDir;
    });

    expect(() => {
      new WebsiteGenerator(config);
    }).toThrow(/Source directory does not exist/);
  });

  test('should create output directory if it does not exist', () => {
    const config = createTestConfig();

    // Mock fs.existsSync to return false for output directory
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return path !== config.outputDir;
    });

    const generator = new WebsiteGenerator(config);

    expect(fs.mkdirSync).toHaveBeenCalledWith(config.outputDir, { recursive: true });
  });

  test('should register plugins from configuration', () => {
    const config = createTestConfig();
    config.plugins = [{ name: 'test-plugin' }, { name: 'another-plugin', options: { foo: 'bar' } }];

    const generator = new WebsiteGenerator(config);
    const registeredPlugins = generator.getPlugins();

    expect(registeredPlugins).toHaveLength(2);
    expect(registeredPlugins[0].name).toBe('test-plugin');
    expect(registeredPlugins[1].name).toBe('another-plugin');
    expect(registeredPlugins[1].options).toEqual({ foo: 'bar' });
  });

  test('should generate website', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Mock the internal methods
    generator.parseDocumentation = jest.fn().mockResolvedValue([]);
    generator.generateComponents = jest.fn().mockResolvedValue([]);
    generator.generateTests = jest.fn().mockResolvedValue([]);
    generator.buildWebsite = jest.fn().mockResolvedValue(true);

    await generator.generate();

    expect(generator.parseDocumentation).toHaveBeenCalled();
    expect(generator.generateComponents).toHaveBeenCalled();
    expect(generator.generateTests).toHaveBeenCalled();
    expect(generator.buildWebsite).toHaveBeenCalled();
  });

  test('should handle errors during generation', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Mock the internal methods to throw an error
    generator.parseDocumentation = jest.fn().mockRejectedValue(new Error('Parse error'));

    await expect(generator.generate()).rejects.toThrow('Parse error');
  });

  test('should apply caching when enabled', async () => {
    const config = createTestConfig();
    config.performance.caching.enabled = true;

    const generator = new WebsiteGenerator(config);

    // Mock the cache methods
    generator.cache = {
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      has: jest.fn().mockReturnValue(false),
    } as any;

    // Mock the internal methods
    generator.parseDocumentation = jest.fn().mockResolvedValue([]);
    generator.generateComponents = jest.fn().mockResolvedValue([]);
    generator.generateTests = jest.fn().mockResolvedValue([]);
    generator.buildWebsite = jest.fn().mockResolvedValue(true);

    await generator.generate();

    expect(generator.cache.get).toHaveBeenCalled();
    expect(generator.cache.set).toHaveBeenCalled();
  });
});
