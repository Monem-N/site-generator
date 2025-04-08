import { TestGenerator } from '../TestGenerator';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('TestGenerator', () => {
  // Sample components for testing
  const sampleComponents = [
    {
      name: 'Component1',
      content: 'export const Component1 = () => <div>Component 1 Content</div>;',
      path: '/test/source/components/Component1.tsx',
      metadata: {
        originalPath: '/test/source/component1.md',
      },
    },
    {
      name: 'Component2',
      content: 'export const Component2 = () => <div>Component 2 Content</div>;',
      path: '/test/source/components/Component2.tsx',
      metadata: {
        originalPath: '/test/source/component2.md',
      },
    },
  ];

  // Sample test options
  const sampleTestOptions = {
    framework: 'jest' as 'jest' | 'vitest', // Type assertion to fix the error
    coverage: {
      enabled: true,
      threshold: 80,
    },
    components: {
      unit: true,
      integration: true,
    },
    outputDir: '/test/output/__tests__',
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync to return true for output directory
    (fs.existsSync as jest.Mock).mockImplementation((dirPath: string) => {
      return dirPath === '/test/output/__tests__';
    });

    // Mock fs.mkdirSync
    (fs.mkdirSync as jest.Mock).mockImplementation((_dirPath: string, _options) => {
      return undefined;
    });

    // Mock fs.writeFileSync
    (fs.writeFileSync as jest.Mock).mockImplementation((_filePath: string, _content: string) => {
      return undefined;
    });

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
    const testGenerator = new TestGenerator(sampleTestOptions);
    expect(testGenerator).toBeDefined();
  });

  test('should create output directory if it does not exist', () => {
    // Mock fs.existsSync to return false for output directory
    (fs.existsSync as jest.Mock).mockImplementation((dirPath: string) => {
      return dirPath !== '/test/output/__tests__';
    });

    const testGenerator = new TestGenerator(sampleTestOptions);

    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/output/__tests__', { recursive: true });
  });

  test('should generate unit tests for components', async () => {
    const testGenerator = new TestGenerator(sampleTestOptions);

    await testGenerator.generateTests(sampleComponents);

    // Should write test files
    expect(fs.writeFileSync).toHaveBeenCalledTimes(sampleComponents.length);

    // Check first component test file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/__tests__/Component1.test.js',
      expect.stringContaining('test('),
      'utf-8'
    );

    // Check second component test file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/__tests__/Component2.test.js',
      expect.stringContaining('test('),
      'utf-8'
    );
  });

  test('should not generate unit tests when disabled', async () => {
    const generator = new TestGenerator({
      ...sampleTestOptions,
      components: {
        ...sampleTestOptions.components,
        unit: false,
      },
    });

    await generator.generateTests(sampleComponents);

    // Should not write any unit test files
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('should generate integration tests when enabled', async () => {
    const generator = new TestGenerator(sampleTestOptions);

    await generator.generateTests(sampleComponents);

    // Should write integration test file
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/__tests__/integration.test.js',
      expect.stringContaining('integration'),
      'utf-8'
    );
  });

  test('should not generate integration tests when disabled', async () => {
    const generator = new TestGenerator({
      ...sampleTestOptions,
      components: {
        ...sampleTestOptions.components,
        integration: false,
      },
    });

    await generator.generateTests(sampleComponents);

    // Should not write integration test file
    expect(fs.writeFileSync).not.toHaveBeenCalledWith(
      '/test/output/__tests__/integration.test.js',
      expect.any(String),
      'utf-8'
    );
  });

  test('should handle empty component list', async () => {
    const generator = new TestGenerator(sampleTestOptions);

    await generator.generateTests([]);

    // Should not write any files
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('should handle errors during test generation', async () => {
    const generator = new TestGenerator(sampleTestOptions);

    // Mock fs.writeFileSync to throw an error
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Write error');
    });

    await expect(generator.generateTests(sampleComponents)).rejects.toThrow('Write error');
  });

  test('should generate Jest tests when framework is Jest', async () => {
    const generator = new TestGenerator({
      ...sampleTestOptions,
      framework: 'jest',
    });

    await generator.generateTests(sampleComponents);

    // Check that Jest syntax is used
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/__tests__/Component1.test.js',
      expect.stringContaining('describe('),
      'utf-8'
    );
  });

  test('should generate Vitest tests when framework is Vitest', async () => {
    const generator = new TestGenerator({
      ...sampleTestOptions,
      framework: 'vitest',
    });

    await generator.generateTests(sampleComponents);

    // Check that Vitest syntax is used
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/output/__tests__/Component1.test.js',
      expect.stringContaining('import { describe, it, expect }'),
      'utf-8'
    );
  });

  test('should include coverage threshold when enabled', async () => {
    const generator = new TestGenerator({
      ...sampleTestOptions,
      coverage: {
        enabled: true,
        threshold: 90,
      },
    });

    await generator.generateTests(sampleComponents);

    // Check that coverage threshold is included
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('90'),
      'utf-8'
    );
  });
});
