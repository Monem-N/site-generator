import { WebsiteGenerator } from '../WebsiteGenerator.js';
import * as fs from 'fs';
import * as path from 'path';
import { WebsiteGeneratorConfig } from '../../config/generator.config.js';
import { ParsedContent } from '../../types/parser.js';
import { Plugin } from '../../types/plugin.js';
import { ComponentTemplate } from '../../types/component.js';
import { ContentCache } from '../utils/cache.js';
import { SiteGeneratorError } from '../utils/errors.js';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../utils/cache');
jest.mock('../TestGenerator', () => ({
  TestGenerator: jest.fn().mockImplementation(() => ({
    generateTests: jest.fn().mockResolvedValue(undefined),
  })),
}));
jest.mock('../Builder', () => ({
  Builder: jest.fn().mockImplementation(() => ({
    build: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock DocumentationParserFactory
jest.mock('../parser-implementation', () => ({
  DocumentationParserFactory: {
    prototype: {
      register: jest.fn(),
      getParser: jest.fn().mockImplementation(() => ({
        parse: jest.fn().mockImplementation(content => ({
          title: 'Test Document',
          content: content,
          sections: [],
          metadata: { originalPath: '/test/source/test.md' },
        })),
      })),
    },
  },
}));

// Mock ComponentGenerator
jest.mock('../component-generator', () => ({
  ComponentGenerator: jest.fn().mockImplementation(() => ({
    generateComponent: jest.fn().mockImplementation(content => ({
      name: 'TestComponent',
      content: content,
    })),
    generatePage: jest.fn().mockImplementation(content => ({
      name: 'TestPage',
      content: content,
    })),
  })),
}));

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
  // Mock file system data
  const mockFiles = {
    '/test/source/doc1.md': '# Document 1\n\nContent of document 1',
    '/test/source/doc2.md': '# Document 2\n\nContent of document 2',
    '/test/source/subfolder/doc3.md': '# Document 3\n\nContent of document 3',
    '/test/source/ignored/doc4.md': '# Document 4\n\nContent of document 4',
    '/test/source/file.txt': 'This is not a markdown file',
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync to return true for directories and mock files
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath in mockFiles) return true;
      if (filePath === '/test/source' || filePath === '/test/output') return true;
      return false;
    });

    // Mock path.resolve to return the input path
    (path.resolve as jest.Mock).mockImplementation((filePath: string) => filePath);

    // Mock path.extname to return the correct extension
    (path.extname as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.endsWith('.md')) return '.md';
      if (filePath.endsWith('.txt')) return '.txt';
      return '';
    });

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) =>
      paths.join('/').replace(/\/+/g, '/')
    );

    // Mock fs.readdir to return mock directory contents
    (fs.readdir as jest.Mock).mockImplementation((dirPath: string, _options) => {
      if (_dirPath === '/test/source') {
        return Promise.resolve([
          { name: 'doc1.md', isDirectory: () => false },
          { name: 'doc2.md', isDirectory: () => false },
          { name: 'subfolder', isDirectory: () => true },
          { name: 'ignored', isDirectory: () => true },
          { name: 'file.txt', isDirectory: () => false },
        ]);
      } else if (_dirPath === '/test/source/subfolder') {
        return Promise.resolve([{ name: 'doc3.md', isDirectory: () => false }]);
      } else if (_dirPath === '/test/source/ignored') {
        return Promise.resolve([{ name: 'doc4.md', isDirectory: () => false }]);
      }
      return Promise.resolve([]);
    });

    // Mock fs.readFile to return mock file contents
    (fs.readFile as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath in mockFiles) {
        return Promise.resolve(mockFiles[filePath]);
      }
      return Promise.reject(new Error(`File not found: ${filePath}`));
    });

    // Mock ContentCache constructor
    (ContentCache as jest.Mock).mockImplementation(() => ({
      get: jest.fn().mockReturnValue(null),
      set: jest.fn(),
      has: jest.fn().mockReturnValue(false),
      clear: jest.fn(),
      getStats: jest.fn().mockReturnValue({ size: 0 }),
    }));
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
      clear: jest.fn(),
      getStats: jest.fn().mockReturnValue({ size: 0 }),
    } as unknown;

    // Mock the internal methods
    generator.parseDocumentation = jest.fn().mockResolvedValue([]);
    generator.generateComponents = jest.fn().mockResolvedValue([]);
    generator.generateTests = jest.fn().mockResolvedValue([]);
    generator.buildWebsite = jest.fn().mockResolvedValue(true);

    await generator.generate();

    expect(generator.cache.get).toHaveBeenCalled();
    expect(generator.cache.set).toHaveBeenCalled();
  });

  test('should parse documentation files correctly', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Call the actual parseDocumentation method
    const parsedContent = await generator.parseDocumentation();

    // Verify the results
    expect(parsedContent).toHaveLength(3); // 3 markdown files (excluding the ignored one)
    expect(parsedContent[0].title).toBe('Test Document');
    expect(parsedContent[1].title).toBe('Test Document');
    expect(parsedContent[2].title).toBe('Test Document');
  });

  test('should filter files based on extensions', async () => {
    const config = createTestConfig();
    config.parser.extensions = ['md']; // Only parse markdown files
    const generator = new WebsiteGenerator(config);

    // Call the actual method
    const files = await generator.getDocumentationFiles('/test/source');

    // Verify the results
    expect(files).toHaveLength(3); // 3 markdown files (excluding the ignored one)
    expect(files).toContain('/test/source/doc1.md');
    expect(files).toContain('/test/source/doc2.md');
    expect(files).toContain('/test/source/subfolder/doc3.md');
    expect(files).not.toContain('/test/source/file.txt'); // Not a markdown file
    expect(files).not.toContain('/test/source/ignored/doc4.md'); // In ignored directory
  });

  test('should respect ignore patterns', async () => {
    const config = createTestConfig();
    config.parser.ignorePatterns = ['ignored']; // Ignore the 'ignored' directory
    const generator = new WebsiteGenerator(config);

    // Call the actual method
    const files = await generator.getDocumentationFiles('/test/source');

    // Verify the results
    expect(files).not.toContain('/test/source/ignored/doc4.md');
  });

  test('should apply plugins to parsed content', async () => {
    const config = createTestConfig();

    // Add mock plugins
    config.plugins = [
      {
        name: 'test-plugin',
        hooks: {
          beforeParse: jest.fn().mockImplementation(content => `Modified ${content}`),
          afterParse: jest.fn().mockImplementation(parsed => ({
            ...parsed,
            title: `Enhanced ${parsed.title}`,
          })),
        },
      },
    ];

    const generator = new WebsiteGenerator(config);

    // Mock plugin initialization
    await generator.initializePlugins();

    // Call the actual parseDocumentation method
    const parsedContent = await generator.parseDocumentation();

    // Verify the results
    expect(parsedContent[0].title).toBe('Enhanced Test Document');
  });

  test('should handle errors during parsing', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Mock parser to throw an error
    const mockParser = {
      parse: jest.fn().mockRejectedValue(new Error('Parse error')),
    };

    const mockParserFactory = jest.fn().mockImplementation(() => ({
      getParser: jest.fn().mockReturnValue(mockParser),
    }));

    generator.parserFactory = mockParserFactory as unknown;

    // Call the method and expect it to throw
    await expect(generator.parseDocumentation()).rejects.toThrow('Parse error');
  });

  test('should generate components from parsed content', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Create mock parsed content
    const mockParsedContent: ParsedContent[] = [
      {
        title: 'Test Document 1',
        content: 'Content 1',
        sections: [],
        metadata: { originalPath: '/test/source/doc1.md' },
        description: '',
        assets: [],
        references: [],
      },
      {
        title: 'Test Document 2',
        content: 'Content 2',
        sections: [],
        metadata: { originalPath: '/test/source/doc2.md' },
        description: '',
        assets: [],
        references: [],
      },
    ];

    // Call the method
    const components = await generator.generateComponents(mockParsedContent);

    // Verify the results
    expect(components).toHaveLength(2);
    expect(components[0].name).toBe('TestComponent');
    expect(components[1].name).toBe('TestComponent');
  });

  test('should apply design system to components', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Create mock components
    const mockComponents = [
      { name: 'Component1', content: 'Content 1' },
      { name: 'Component2', content: 'Content 2' },
    ];

    // Call the method
    const styledComponents = await generator.applyDesignSystem(mockComponents as unknown);

    // Verify the results
    expect(styledComponents).toHaveLength(2);
    expect(styledComponents[0].content).toEqual({ name: 'TestComponent', content: 'Content 1' });
    expect(styledComponents[1].content).toEqual({ name: 'TestComponent', content: 'Content 2' });
  });

  test('should skip test generation when disabled', async () => {
    const config = createTestConfig();
    config.testing.components.unit = false;
    config.testing.components.integration = false;

    const generator = new WebsiteGenerator(config);

    // Create mock components
    const mockComponents = [
      { name: 'Component1', content: 'Content 1' },
      { name: 'Component2', content: 'Content 2' },
    ];

    // Call the method
    await generator.generateTests(mockComponents as unknown);

    // Verify that TestGenerator was not imported
    expect(require('../TestGenerator').TestGenerator).not.toHaveBeenCalled();
  });

  test('should build the website with the correct configuration', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Create mock components
    const mockComponents = [
      { name: 'Component1', content: 'Content 1' },
      { name: 'Component2', content: 'Content 2' },
    ];

    // Call the method
    await generator.build(mockComponents as unknown);

    // Verify that Builder was called with the correct config
    const Builder = require('../Builder').Builder;
    expect(Builder).toHaveBeenCalledWith({
      target: 'production',
      outDir: config.outputDir,
      optimization: config.build.optimization,
      assets: config.build.assets,
    });

    // Verify that build was called with the components
    const buildInstance = Builder.mock.results[0].value;
    expect(buildInstance.build).toHaveBeenCalledWith(mockComponents);
  });

  test('should handle errors with SiteGeneratorError', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Mock fs.readdir to throw an error
    (fs.readdir as unknown as jest.Mock).mockRejectedValue(new Error('File system error'));

    // Call the method and expect it to throw a SiteGeneratorError
    await expect(generator.getDocumentationFiles('/test/source')).rejects.toThrow(
      SiteGeneratorError
    );
  });
});
