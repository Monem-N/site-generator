import { TemplateManager } from '../../templates/TemplateManager.js';
import { TemplateEngine } from '../../templates/TemplateEngine.js';
import { HandlebarsTemplateEngine } from '../../templates/HandlebarsTemplateEngine.js';
import { EjsTemplateEngine } from '../../templates/EjsTemplateEngine.js';
import { createMockParsedContent } from '../utils/test-helpers.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../templates/HandlebarsTemplateEngine');
jest.mock('../../templates/EjsTemplateEngine');

describe('TemplateManager', () => {
  let templateManager: TemplateManager;
  let mockHandlebarsEngine: jest.Mocked<HandlebarsTemplateEngine>;
  let mockEjsEngine: jest.Mocked<EjsTemplateEngine>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock template engines
    mockHandlebarsEngine = new HandlebarsTemplateEngine() as jest.Mocked<HandlebarsTemplateEngine>;
    mockEjsEngine = new EjsTemplateEngine() as jest.Mocked<EjsTemplateEngine>;

    // Mock the constructors
    (HandlebarsTemplateEngine as jest.Mock).mockImplementation(() => mockHandlebarsEngine);
    (EjsTemplateEngine as jest.Mock).mockImplementation(() => mockEjsEngine);

    // Create the template manager
    templateManager = new TemplateManager({
      defaultEngine: 'handlebars',
      handlebarsOptions: {
        partialsDir: '/test/partials',
      },
      ejsOptions: {
        includesDir: '/test/includes',
      },
    });
  });

  test('should initialize with default engines', () => {
    expect(templateManager).toBeDefined();
    expect(HandlebarsTemplateEngine).toHaveBeenCalled();
    expect(EjsTemplateEngine).toHaveBeenCalled();
  });

  test('should register a custom template engine', () => {
    // Create a mock custom engine
    const mockCustomEngine = {
      render: jest.fn().mockResolvedValue('<div>Custom Template</div>'),
      renderContent: jest.fn().mockResolvedValue('<div>Custom Content</div>'),
      clearCache: jest.fn(),
    } as unknown as TemplateEngine;

    // Register the custom engine
    templateManager.registerEngine('custom', mockCustomEngine);

    // Get the custom engine
    const engine = templateManager.getEngine('custom');
    expect(engine).toBe(mockCustomEngine);
  });

  test('should get the default engine when no name is provided', () => {
    const engine = templateManager.getEngine();
    expect(engine).toBe(mockHandlebarsEngine);
  });

  test('should throw an error when getting a non-existent engine', () => {
    expect(() => templateManager.getEngine('non-existent')).toThrow();
  });

  test('should infer engine from file extension', async () => {
    // Mock path.extname to return the file extension
    (path.extname as jest.Mock).mockImplementation((filePath: string) => {
      const parts = filePath.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    });

    // Mock the render methods
    mockHandlebarsEngine.render.mockResolvedValue('<div>Handlebars Template</div>');
    mockEjsEngine.render.mockResolvedValue('<div>EJS Template</div>');

    // Render templates with different extensions
    await templateManager.render('template.hbs', { title: 'Test' });
    await templateManager.render('template.ejs', { title: 'Test' });
    await templateManager.render('template.txt', { title: 'Test' });

    // Verify that the correct engines were used
    expect(mockHandlebarsEngine.render).toHaveBeenCalledTimes(2); // .hbs and .txt (default)
    expect(mockEjsEngine.render).toHaveBeenCalledTimes(1); // .ejs
  });

  test('should render content with the specified engine', async () => {
    // Create mock parsed content
    const mockContent = createMockParsedContent({
      title: 'Test Document',
      description: 'Test description',
    });

    // Mock the renderContent method
    mockHandlebarsEngine.renderContent.mockResolvedValue('<div>Rendered Content</div>');

    // Render content with the handlebars engine
    const result = await templateManager.renderContent(
      mockContent,
      'template.hbs',
      undefined,
      'handlebars'
    );

    // Verify the result
    expect(result).toBe('<div>Rendered Content</div>');
    expect(mockHandlebarsEngine.renderContent).toHaveBeenCalledWith(
      mockContent,
      'template.hbs',
      undefined
    );
  });

  test('should clear cache for all engines', () => {
    // Clear the cache
    templateManager.clearCache();

    // Verify that clearCache was called on all engines
    expect(mockHandlebarsEngine.clearCache).toHaveBeenCalled();
    expect(mockEjsEngine.clearCache).toHaveBeenCalled();
  });
});
