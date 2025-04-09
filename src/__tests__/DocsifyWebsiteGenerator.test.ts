import { DocsifyWebsiteGenerator } from '../DocsifyWebsiteGenerator.js';
import { WebsiteGeneratorConfig } from '../../config/generator.config.js';
import * as fs from 'fs';
import * as path from 'path';
import { ____ParsedContent } from '../../types/parser.js';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../WebsiteGenerator');
jest.mock('../utils/cache');

// Create a minimal test configuration
const createTestConfig = (): WebsiteGeneratorConfig => ({
  projectName: 'test-docsify-project',
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
    name: 'vue',
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

describe('DocsifyWebsiteGenerator', () => {
  // Mock file system data
  const mockFiles = {
    '/test/source/README.md': '# Home Page\n\nWelcome to the documentation',
    '/test/source/_sidebar.md': '* [Home](/)\n* [Guide](guide.md)',
    '/test/source/guide.md': '# Guide\n\nThis is a guide',
    '/test/source/_navbar.md': '* [Home](/)\n* [External](https://example.com)',
    '/test/source/.nojekyll': '',
    '/test/source/index.html': '<!DOCTYPE html><html><head></head><body></body></html>',
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
      if (filePath.endsWith('.html')) return '.html';
      return '';
    });

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) =>
      paths.join('/').replace(/\/+/g, '/')
    );

    // Mock fs.readdir to return mock directory contents
    (fs.readdir as jest.Mock).mockImplementation((_dirPath: string, ___options) => {
      if (_dirPath === '/test/source') {
        return Promise.resolve([
          { name: 'README.md', isDirectory: () => false },
          { name: '_sidebar.md', isDirectory: () => false },
          { name: 'guide.md', isDirectory: () => false },
          { name: '_navbar.md', isDirectory: () => false },
          { name: '.nojekyll', isDirectory: () => false },
          { name: 'index.html', isDirectory: () => false },
        ]);
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

    // Mock fs.writeFile
    (fs.writeFile as jest.Mock).mockImplementation((___filePath: string, ___content: string) => {
      return Promise.resolve();
    });

    // Mock fs.copyFile
    (fs.copyFile as jest.Mock).mockImplementation((___src: string, ___dest: string) => {
      return Promise.resolve();
    });
  });

  test('should initialize with valid configuration', () => {
    const config = createTestConfig();
    const generator = new DocsifyWebsiteGenerator(config);

    expect(generator).toBeDefined();
  });

  test('should set Docsify-specific configuration', () => {
    const config = createTestConfig();
    const generator = new DocsifyWebsiteGenerator(config);

    // Access the protected docsifyConfig property using type assertion
    const docsifyConfig = (generator as unknown).docsifyConfig;

    expect(docsifyConfig).toBeDefined();
    expect(docsifyConfig.name).toBe(config.projectName);
    expect(docsifyConfig.repo).toBe('');
    expect(docsifyConfig.coverpage).toBe(false);
    expect(docsifyConfig.loadSidebar).toBe(true);
    expect(docsifyConfig.loadNavbar).toBe(true);
    expect(docsifyConfig.auto2top).toBe(true);
    expect(docsifyConfig.maxLevel).toBe(4);
    expect(docsifyConfig.subMaxLevel).toBe(2);
    expect(docsifyConfig.themeColor).toBe('#3F51B5');
  });

  test('should customize Docsify configuration with options', () => {
    const config = createTestConfig();
    const docsifyOptions = {
      name: 'Custom Name',
      repo: 'user/repo',
      coverpage: true,
      themeColor: '#FF5722',
      maxLevel: 3,
      subMaxLevel: 3,
    };

    const generator = new DocsifyWebsiteGenerator(config, docsifyOptions);

    // Access the protected docsifyConfig property using type assertion
    const docsifyConfig = (generator as unknown).docsifyConfig;

    expect(docsifyConfig.name).toBe('Custom Name');
    expect(docsifyConfig.repo).toBe('user/repo');
    expect(docsifyConfig.coverpage).toBe(true);
    expect(docsifyConfig.themeColor).toBe('#FF5722');
    expect(docsifyConfig.maxLevel).toBe(3);
    expect(docsifyConfig.subMaxLevel).toBe(3);
  });

  test('should generate Docsify index.html', async () => {
    const config = createTestConfig();
    const generator = new DocsifyWebsiteGenerator(config);

    // Mock the parent class methods
    (generator as unknown).parseDocumentation = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateComponents = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateTests = jest.fn().mockResolvedValue([]);
    (generator as unknown).buildWebsite = jest.fn().mockResolvedValue(true);

    // Mock the generateDocsifyFiles method to call the real implementation
    const originalGenerateDocsifyFiles = (generator as unknown).generateDocsifyFiles;
    (generator as unknown).generateDocsifyFiles = jest.fn().mockImplementation(async () => {
      return await originalGenerateDocsifyFiles.call(generator);
    });

    await generator.generate();

    // Verify that generateDocsifyFiles was called
    expect((generator as unknown).generateDocsifyFiles).toHaveBeenCalled();

    // Verify that fs.writeFile was called for index.html
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/test/output/index.html',
      expect.stringContaining('<!DOCTYPE html>'),
      'utf-8'
    );

    // Verify that the index.html contains Docsify configuration
    const indexHtmlCall = (fs.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/output/index.html'
    );

    const indexHtmlContent = indexHtmlCall ? indexHtmlCall[1] : '';
    expect(indexHtmlContent).toContain('window.$docsify');
    expect(indexHtmlContent).toContain(config.projectName);
  });

  test('should copy Docsify-specific files', async () => {
    const config = createTestConfig();
    const generator = new DocsifyWebsiteGenerator(config);

    // Mock the parent class methods
    (generator as unknown).parseDocumentation = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateComponents = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateTests = jest.fn().mockResolvedValue([]);
    (generator as unknown).buildWebsite = jest.fn().mockResolvedValue(true);

    await generator.generate();

    // Verify that fs.copyFile was called for .nojekyll
    expect(fs.copyFile).toHaveBeenCalledWith('/test/source/.nojekyll', '/test/output/.nojekyll');

    // Verify that fs.copyFile was called for _sidebar.md
    expect(fs.copyFile).toHaveBeenCalledWith(
      '/test/source/_sidebar.md',
      '/test/output/_sidebar.md'
    );

    // Verify that fs.copyFile was called for _navbar.md
    expect(fs.copyFile).toHaveBeenCalledWith('/test/source/_navbar.md', '/test/output/_navbar.md');
  });

  test('should create .nojekyll file if it does not exist', async () => {
    const config = createTestConfig();
    const generator = new DocsifyWebsiteGenerator(config);

    // Mock fs.existsSync to return false for .nojekyll
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath === '/test/source/.nojekyll') return false;
      if (filePath in mockFiles) return true;
      if (filePath === '/test/source' || filePath === '/test/output') return true;
      return false;
    });

    // Mock the parent class methods
    (generator as unknown).parseDocumentation = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateComponents = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateTests = jest.fn().mockResolvedValue([]);
    (generator as unknown).buildWebsite = jest.fn().mockResolvedValue(true);

    await generator.generate();

    // Verify that fs.writeFile was called for .nojekyll
    expect(fs.writeFile).toHaveBeenCalledWith('/test/output/.nojekyll', '', 'utf-8');
  });

  test('should create _sidebar.md if it does not exist', async () => {
    const config = createTestConfig();
    const generator = new DocsifyWebsiteGenerator(config);

    // Mock fs.existsSync to return false for _sidebar.md
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath === '/test/source/_sidebar.md') return false;
      if (filePath in mockFiles) return true;
      if (filePath === '/test/source' || filePath === '/test/output') return true;
      return false;
    });

    // Mock the parent class methods
    (generator as unknown).parseDocumentation = jest.fn().mockResolvedValue([
      {
        title: 'Home Page',
        content: 'Welcome to the documentation',
        sections: [],
        metadata: { originalPath: '/test/source/README.md' },
      },
      {
        title: 'Guide',
        content: 'This is a guide',
        sections: [],
        metadata: { originalPath: '/test/source/guide.md' },
      },
    ]);
    (generator as unknown).generateComponents = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateTests = jest.fn().mockResolvedValue([]);
    (generator as unknown).buildWebsite = jest.fn().mockResolvedValue(true);

    await generator.generate();

    // Verify that fs.writeFile was called for _sidebar.md
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/test/output/_sidebar.md',
      expect.stringContaining('* [Home Page](/)'),
      'utf-8'
    );
  });

  test('should apply Docsify theme', async () => {
    const config = createTestConfig();
    config.designSystem.name = 'dark';
    const generator = new DocsifyWebsiteGenerator(config);

    // Mock the parent class methods
    (generator as unknown).parseDocumentation = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateComponents = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateTests = jest.fn().mockResolvedValue([]);
    (generator as unknown).buildWebsite = jest.fn().mockResolvedValue(true);

    await generator.generate();

    // Verify that the index.html contains the dark theme
    const indexHtmlCall = (fs.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/output/index.html'
    );

    const indexHtmlContent = indexHtmlCall ? indexHtmlCall[1] : '';
    expect(indexHtmlContent).toContain('theme-dark.css');
  });

  test('should add Docsify plugins', async () => {
    const config = createTestConfig();
    config.plugins = [{ name: 'search' }, { name: 'copy-code' }, { name: 'zoom-image' }];
    const generator = new DocsifyWebsiteGenerator(config);

    // Mock the parent class methods
    (generator as unknown).parseDocumentation = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateComponents = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateTests = jest.fn().mockResolvedValue([]);
    (generator as unknown).buildWebsite = jest.fn().mockResolvedValue(true);

    await generator.generate();

    // Verify that the index.html contains the plugins
    const indexHtmlCall = (fs.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/output/index.html'
    );

    const indexHtmlContent = indexHtmlCall ? indexHtmlCall[1] : '';
    expect(indexHtmlContent).toContain('docsify-search.min.js');
    expect(indexHtmlContent).toContain('docsify-copy-code.min.js');
    expect(indexHtmlContent).toContain('zoom-image.min.js');
  });

  test('should handle errors during Docsify file generation', async () => {
    const config = createTestConfig();
    const generator = new DocsifyWebsiteGenerator(config);

    // Mock fs.writeFile to throw an error
    (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Write error'));

    // Mock the parent class methods
    (generator as unknown).parseDocumentation = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateComponents = jest.fn().mockResolvedValue([]);
    (generator as unknown).generateTests = jest.fn().mockResolvedValue([]);
    (generator as unknown).buildWebsite = jest.fn().mockResolvedValue(true);

    await expect(generator.generate()).rejects.toThrow('Write error');
  });
});
