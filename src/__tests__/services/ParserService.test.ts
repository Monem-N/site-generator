import { ParserService } from '../../services/ParserService.js';
import { createMockFileSystem } from '../utils/test-helpers.js';
import { Plugin } from '../../../types/plugin.js';

describe('ParserService', () => {
  let parserService: ParserService;
  let mockFileSystem: any;

  beforeEach(() => {
    mockFileSystem = createMockFileSystem();

    // Add mock files
    mockFileSystem.addMockFile(
      '/test/source/document.md',
      '# Test Document\n\nThis is a test document.'
    );
    mockFileSystem.addMockFile(
      '/test/source/another.md',
      '# Another Document\n\nThis is another document.'
    );
    mockFileSystem.addMockFile('/test/source/file.txt', 'This is not a markdown file.');

    parserService = new ParserService({
      fileSystem: mockFileSystem,
      extensions: ['md', 'markdown'],
      ignorePatterns: ['node_modules', '.git'],
    });
  });

  test('should initialize with default configuration', () => {
    const defaultParserService = new ParserService();
    expect(defaultParserService).toBeDefined();
  });

  test('should initialize with custom configuration', () => {
    expect(parserService).toBeDefined();
    expect((parserService as any).config.extensions).toEqual(['md', 'markdown']);
    expect((parserService as any).config.ignorePatterns).toEqual(['node_modules', '.git']);
  });

  test('should parse markdown file', async () => {
    // Mock the readFile method
    mockFileSystem.readFile.mockResolvedValue('# Test Document\n\nThis is a test document.');

    // Call the parse method
    const result = await parserService.parse('/test/source/document.md');

    // Verify the result
    expect(result).toEqual({
      title: 'Test Document',
      description: 'This is a test document.',
      content: '# Test Document\n\nThis is a test document.',
      sections: expect.any(Array),
      metadata: expect.any(Object),
      assets: expect.any(Array),
      references: expect.any(Array),
    });
  });

  test('should handle unsupported file format', async () => {
    // Call the parse method with an unsupported file format
    await expect(parserService.parse('/test/source/file.txt')).rejects.toThrow();
  });

  test('should apply plugins during parsing', async () => {
    // Mock the readFile method
    mockFileSystem.readFile.mockResolvedValue('# Test Document\n\nThis is a test document.');

    // Create a mock plugin
    const mockPlugin: Plugin = {
      name: 'MockPlugin',
      hooks: {
        beforeParse: jest.fn().mockImplementation(content => `Modified: ${content}`),
        afterParse: jest.fn().mockImplementation(parsed => ({
          ...parsed,
          title: `Enhanced: ${parsed.title}`,
        })),
      },
    };

    // Add the plugin to the parser service
    parserService.addPlugin(mockPlugin);

    // Call the parse method
    const result = await parserService.parse('/test/source/document.md');

    // Verify that the plugin hooks were called
    expect(mockPlugin.hooks.beforeParse).toHaveBeenCalled();
    expect(mockPlugin.hooks.afterParse).toHaveBeenCalled();

    // Verify the result
    expect(result.title).toBe('Enhanced: Test Document');
  });

  test('should parse multiple files', async () => {
    // Mock the readFile method
    mockFileSystem.readFile.mockImplementation((filePath: string) => {
      if (filePath === '/test/source/document.md') {
        return Promise.resolve('# Test Document\n\nThis is a test document.');
      }
      if (filePath === '/test/source/another.md') {
        return Promise.resolve('# Another Document\n\nThis is another document.');
      }
      return Promise.reject(new Error(`File not found: ${filePath}`));
    });

    // Call the parseFiles method
    const results = await parserService.parseFiles([
      '/test/source/document.md',
      '/test/source/another.md',
    ]);

    // Verify the results
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Test Document');
    expect(results[1].title).toBe('Another Document');
  });

  test('should handle errors during parsing', async () => {
    // Mock the readFile method to throw an error
    mockFileSystem.readFile.mockRejectedValue(new Error('Read error'));

    // Call the parse method and expect it to throw
    await expect(parserService.parse('/test/source/document.md')).rejects.toThrow('Read error');
  });
});
