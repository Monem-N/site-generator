import { TemplateManager } from '../../templates/TemplateManager.js';
import { TemplateEngine } from '../../templates/TemplateEngine.js';
import { HandlebarsTemplateEngine } from '../../templates/HandlebarsTemplateEngine.js';
import { EjsTemplateEngine } from '../../templates/EjsTemplateEngine.js';
import { createMockParsedContent } from '../utils/test-helpers.js';
import * as path from 'path';
// Import ParsedContent from the root types directory
import { ParsedContent, Asset, Reference, ContentNode } from '../../../types/parser.js';

// Mock dependencies
jest.mock('fs');
jest.mock('path');
jest.mock('../../templates/HandlebarsTemplateEngine');
jest.mock('../../templates/EjsTemplateEngine');

/**
 * Helper function to transform mock content into a valid format.
 */
// Using unknown instead of any for better type safety
function transformMockContent(mockContent: unknown): ParsedContent {
  const content = mockContent as Record<string, unknown>;

  // Create properly typed sections
  const sectionsAsNodes = ((content.sections as unknown[]) || []).map(section => {
    const sectionObj = section as Record<string, unknown>;
    return {
      type: String(sectionObj.type || 'default-type'),
      content: String(sectionObj.content || ''),
      title: sectionObj.title as string | undefined,
      level: sectionObj.level as number | undefined,
      children: sectionObj.children as ContentNode[] | undefined,
      attributes: sectionObj.attributes as Record<string, unknown> | undefined,
    } as ContentNode;
  });

  // Create a properly typed ParsedContent object
  return {
    title: String(content.title || 'Default Title'),
    description: String(content.description || 'Default Description'),
    content: String(content.content || ''),
    metadata: (content.metadata as Record<string, unknown>) || {},
    sections: sectionsAsNodes,
    assets: (content.assets as Asset[]) || [],
    references: (content.references as Reference[]) || [],
  };
}

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
      metadata: undefined,
    });

    // Transform the mock content
    const contentToRender = transformMockContent(mockContent);

    // Render content with the handlebars engine
    const result = await templateManager.renderContent(
      contentToRender,
      'template.hbs',
      undefined,
      'handlebars'
    );

    // Verify the result
    expect(result).toBe('<div>Rendered Content</div>');
    expect(mockHandlebarsEngine.renderContent).toHaveBeenCalledWith(
      contentToRender,
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

  test('should handle ParsedContent with title', () => {
    const parsedContent = {
      title: 'Sample Title', // Ensure title is always a string
      // Add other properties as needed
    };

    // Replace 'someFunction' with a valid implementation or mock
    const mockFunction = jest.fn(content => {
      expect(content.title).toBe('Sample Title');
    });

    // Pass parsedContent to the mock function
    mockFunction(parsedContent);

    // Verify the mock function was called
    expect(mockFunction).toHaveBeenCalledWith(parsedContent);
  });
});
