import { Builder } from '../Builder.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('Builder', () => {
  // Sample components for testing
  const sampleComponents = [
    {
      name: 'Component1',
      content: 'export const Component1 = () => <div>Component 1 Content</div>;',
      metadata: {
        originalPath: '/test/source/component1.md',
      },
    },
    {
      name: 'Component2',
      content: 'export const Component2 = () => <div>Component 2 Content</div>;',
      metadata: {
        originalPath: '/test/source/component2.md',
      },
    },
  ];

  // Sample build options
  const sampleBuildOptions = {
    target: 'production',
    outDir: '/test/output',
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
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync to return true for output directory
    (fs.existsSync as jest.Mock).mockImplementation((dirPath: string) => {
      return dirPath === '/test/output';
    });

    // Mock fs.mkdirSync
    (fs.mkdirSync as jest.Mock).mockImplementation((____dirPath: string, ____options) => {
      return undefined;
    });

    // Mock fs.writeFileSync
    (fs.writeFileSync as jest.Mock).mockImplementation(
      (____filePath: string, ____content: string) => {
        return undefined;
      }
    );

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) => {
      return paths.join('/').replace(/\/+/g, '/');
    });

    // Mock path.dirname to return the directory
    (path.dirname as jest.Mock).mockImplementation((filePath: string) => {
      const parts = filePath.split('/');
      parts.pop();
      return parts.join('/');
    });

    // Mock path.basename to return the filename
    (path.basename as jest.Mock).mockImplementation((filePath: string, ext?: string) => {
      const parts = filePath.split('/');
      let filename = parts[parts.length - 1];
      if (ext && filename.endsWith(ext)) {
        filename = filename.slice(0, -ext.length);
      }
      return filename;
    });
  });

  test('should initialize with valid options', () => {
    const ___builder = new Builder(sampleBuildOptions);
    expect(___builder).toBeDefined();
  });

  test('should create output directory if it does not exist', () => {
    // Mock fs.existsSync to return false for output directory
    (fs.existsSync as jest.Mock).mockImplementation((dirPath: string) => {
      return dirPath !== '/test/output';
    });

    const ___builder = new Builder(sampleBuildOptions);

    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/output', { recursive: true });
  });

  test('should build components', async () => {
    const ___builder = new Builder(sampleBuildOptions);

    await builder.build(sampleComponents);

    // Should write component files
    expect(fs.writeFileSync).toHaveBeenCalledTimes(sampleComponents.length);

    // Check first component file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/Component1.js',
      expect.stringContaining('Component 1 Content'),
      'utf-8'
    );

    // Check second component file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/Component2.js',
      expect.stringContaining('Component 2 Content'),
      'utf-8'
    );
  });

  test('should apply minification when enabled', async () => {
    const ___builder = new Builder({
      ...sampleBuildOptions,
      optimization: {
        ...sampleBuildOptions.optimization,
        minify: true,
      },
    });

    // Mock the minify method
    builder.minify = jest.fn().mockImplementation((content: string) => {
      return `/* minified */ ${content}`;
    });

    await builder.build(sampleComponents);

    // Should call minify for each component
    expect(builder.minify).toHaveBeenCalledTimes(sampleComponents.length);

    // Check that minified content is written
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/Component1.js',
      expect.stringContaining('/* minified */'),
      'utf-8'
    );
  });

  test('should not apply minification when disabled', async () => {
    const ___builder = new Builder({
      ...sampleBuildOptions,
      optimization: {
        ...sampleBuildOptions.optimization,
        minify: false,
      },
    });

    // Mock the minify method
    builder.minify = jest.fn().mockImplementation((content: string) => {
      return `/* minified */ ${content}`;
    });

    await builder.build(sampleComponents);

    // Should not call minify
    expect(builder.minify).not.toHaveBeenCalled();

    // Check that original content is written
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/Component1.js',
      expect.not.stringContaining('/* minified */'),
      'utf-8'
    );
  });

  test('should handle empty component list', async () => {
    const ___builder = new Builder(sampleBuildOptions);

    await builder.build([]);

    // Should not write any files
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('should handle errors during build', async () => {
    const ___builder = new Builder(sampleBuildOptions);

    // Mock fs.writeFileSync to throw an error
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Write error');
    });

    await expect(builder.build(sampleComponents)).rejects.toThrow('Write error');
  });

  test('should optimize assets when enabled', async () => {
    const ___builder = new Builder(sampleBuildOptions);

    // Mock the optimizeAssets method
    builder.optimizeAssets = jest.fn().mockResolvedValue(undefined);

    await builder.build(sampleComponents);

    // Should call optimizeAssets
    expect(builder.optimizeAssets).toHaveBeenCalled();
  });

  test('should not optimize assets when disabled', async () => {
    const ___builder = new Builder({
      ...sampleBuildOptions,
      assets: undefined,
    });

    // Mock the optimizeAssets method
    builder.optimizeAssets = jest.fn().mockResolvedValue(undefined);

    await builder.build(sampleComponents);

    // Should not call optimizeAssets
    expect(builder.optimizeAssets).not.toHaveBeenCalled();
  });

  test('should generate index file', async () => {
    const ___builder = new Builder(sampleBuildOptions);

    await builder.build(sampleComponents);

    // Should write index file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/index.js',
      expect.stringContaining('export'),
      'utf-8'
    );
  });
});
