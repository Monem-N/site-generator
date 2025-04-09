import { WebsiteGenerator } from '../WebsiteGenerator.js';
import * as fs from 'fs';
import * as path from 'path';
import { WebsiteGeneratorConfig } from '../../config/generator.config.js';
// import { ParsedContent } from '../../types/parser.js';
import { ContentCache } from '../utils/cache.js';
import { SiteGeneratorError } from '../utils/errors.js';
// import { TestGenerator } from '../TestGenerator.js';
import { Builder } from '../Builder.js';

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
    (fs.readdir as unknown as jest.Mock).mockImplementation((_dirPath: string) => {
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
    (fs.readFile as unknown as jest.Mock).mockImplementation((filePath: string) => {
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

    const generator = new WebsiteGenerator(config); // eslint-disable-line @typescript-eslint/no-unused-vars

    expect(fs.mkdirSync).toHaveBeenCalledWith(config.outputDir, { recursive: true });
  });

  test('should register plugins from configuration', () => {
    const config = createTestConfig();
    config.plugins = [{ name: 'test-plugin' }, { name: 'another-plugin', options: { foo: 'bar' } }];

    const generator = new WebsiteGenerator(config); // eslint-disable-line @typescript-eslint/no-unused-vars
  });

  test('should generate website', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Mock the internal methods
    jest.spyOn(WebsiteGenerator.prototype, 'parseDocumentation').mockResolvedValue([]);
    jest.spyOn(WebsiteGenerator.prototype, 'generateComponents').mockResolvedValue([]);
    jest.spyOn(WebsiteGenerator.prototype, 'generateTests').mockResolvedValue(undefined);
    jest.spyOn(WebsiteGenerator.prototype, 'build').mockResolvedValue(undefined);

    await generator.generate();

    expect(WebsiteGenerator.prototype.parseDocumentation).toHaveBeenCalled();
    expect(WebsiteGenerator.prototype.generateComponents).toHaveBeenCalled();
    expect(WebsiteGenerator.prototype.generateTests).toHaveBeenCalled();
    expect(WebsiteGenerator.prototype.build).toHaveBeenCalled();
  });

  test('should handle errors during generation', async () => {
    const config = createTestConfig();
    const generator = new WebsiteGenerator(config);

    // Mock the internal methods to throw an error
    jest
      .spyOn(WebsiteGenerator.prototype, 'parseDocumentation')
      .mockRejectedValue(new Error('Parse error'));

    await expect(generator.generate()).rejects.toThrow('Parse error');
  });

  test('should build with components', () => {
    const mockComponents: unknown[] = [];

    const buildInstance = (Builder as jest.Mock).mock.results[0].value;
    expect(buildInstance.build).toHaveBeenCalledWith(mockComponents);
  });

  test('should handle errors with SiteGeneratorError', async () => {
    const generator = new WebsiteGenerator(createTestConfig());

    // Mock fs.readdir to throw an error
    (fs.readdir as unknown as jest.Mock).mockRejectedValue(new Error('File system error'));

    // Call the method and expect it to throw a SiteGeneratorError
    await expect(generator.getDocumentationFiles('/test/source')).rejects.toThrow(
      SiteGeneratorError
    );
  });
});
