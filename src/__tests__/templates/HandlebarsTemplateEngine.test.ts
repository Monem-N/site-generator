import { HandlebarsTemplateEngine } from '../../templates/HandlebarsTemplateEngine';
import { createMockParsedContent } from '../utils/test-helpers';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('handlebars');

describe('HandlebarsTemplateEngine', () => {
  let engine: HandlebarsTemplateEngine;
  let mockHandlebars: jest.Mocked<typeof Handlebars>;
  let mockTemplate: jest.Mock;
  let mockCompile: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Handlebars
    mockTemplate = jest.fn().mockReturnValue('<div>Rendered Template</div>');
    mockCompile = jest.fn().mockReturnValue(mockTemplate);
    mockHandlebars = {
      create: jest.fn().mockReturnValue({
        compile: mockCompile,
        registerHelper: jest.fn(),
        registerPartial: jest.fn(),
      }),
    } as unknown as jest.Mocked<typeof Handlebars>;

    // Replace the real Handlebars with the mock
    (Handlebars as unknown) = mockHandlebars;

    // Mock fs.promises.readFile to return template content
    (fs.promises as any) = {
      readFile: jest.fn().mockResolvedValue('Template content: {{title}}'),
      readdir: jest.fn().mockResolvedValue(['partial.hbs', 'helper.js']),
    };

    // Mock fs.existsSync to return true for directories
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) => paths.join('/'));

    // Mock path.basename to return the file name without extension
    (path.basename as jest.Mock).mockImplementation((filePath: string, ext: string) => {
      const parts = filePath.split('/');
      const fileName = parts[parts.length - 1];
      return ext ? fileName.replace(ext, '') : fileName;
    });

    // Mock path.extname to return the file extension
    (path.extname as jest.Mock).mockImplementation((filePath: string) => {
      const parts = filePath.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    });

    // Create the engine
    engine = new HandlebarsTemplateEngine({
      partialsDir: '/test/partials',
      helpersDir: '/test/helpers',
      strict: true,
      minify: true,
    });
  });

  test('should initialize with default options', () => {
    const defaultEngine = new HandlebarsTemplateEngine();
    expect(defaultEngine).toBeDefined();
    expect(Handlebars.create).toHaveBeenCalled();
  });

  test('should initialize with custom options', () => {
    expect(engine).toBeDefined();
    expect(Handlebars.create).toHaveBeenCalled();
    expect(fs.existsSync).toHaveBeenCalledWith('/test/partials');
    expect(fs.existsSync).toHaveBeenCalledWith('/test/helpers');
  });

  test('should render a template', async () => {
    // Render a template
    const result = await engine.render('/test/template.hbs', { title: 'Test' });

    // Verify the result
    expect(result).toBe('<div>Rendered Template</div>');
    expect(fs.promises.readFile).toHaveBeenCalledWith('/test/template.hbs', 'utf-8');
    expect(mockCompile).toHaveBeenCalledWith('Template content: {{title}}', { strict: true });
    expect(mockTemplate).toHaveBeenCalledWith({ title: 'Test' });
  });

  test('should render content', async () => {
    // Create mock parsed content
    const mockContent = createMockParsedContent({
      title: 'Test Document',
      description: 'Test description',
    });

    // Render content
    const result = await engine.renderContent(mockContent, '/test/template.hbs');

    // Verify the result
    expect(result).toBe('<div>Rendered Template</div>');
    expect(fs.promises.readFile).toHaveBeenCalledWith('/test/template.hbs', 'utf-8');
    expect(mockCompile).toHaveBeenCalledWith('Template content: {{title}}', { strict: true });
    expect(mockTemplate).toHaveBeenCalledWith({
      content: mockContent,
      designSystem: undefined,
      meta: {},
      title: 'Test Document',
      description: 'Test description',
      sections: [],
      assets: [],
      references: [],
    });
  });

  test('should cache templates', async () => {
    // Render the same template twice
    await engine.render('/test/template.hbs', { title: 'Test 1' });
    await engine.render('/test/template.hbs', { title: 'Test 2' });

    // Verify that the template was only loaded once
    expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
    expect(mockCompile).toHaveBeenCalledTimes(1);
    expect(mockTemplate).toHaveBeenCalledTimes(2);
  });

  test('should clear the template cache', async () => {
    // Render a template
    await engine.render('/test/template.hbs', { title: 'Test' });

    // Clear the cache
    engine.clearCache();

    // Render the same template again
    await engine.render('/test/template.hbs', { title: 'Test' });

    // Verify that the template was loaded twice
    expect(fs.promises.readFile).toHaveBeenCalledTimes(2);
    expect(mockCompile).toHaveBeenCalledTimes(2);
  });

  test('should handle errors when loading templates', async () => {
    // Mock fs.promises.readFile to throw an error
    (fs.promises.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

    // Render a template and expect it to throw
    await expect(engine.render('/test/template.hbs', { title: 'Test' })).rejects.toThrow();
  });

  test('should minify HTML output when enabled', async () => {
    // Mock the template function to return HTML with whitespace
    mockTemplate.mockReturnValue('<div>\n  <h1>Test</h1>\n  <p>Content</p>\n</div>');

    // Render a template
    const result = await engine.render('/test/template.hbs', { title: 'Test' });

    // Verify that the output was minified
    expect(result).toBe('<div><h1>Test</h1><p>Content</p></div>');
  });
});
