import { SyntaxHighlightPlugin } from '../../plugins/SyntaxHighlightPlugin.js';
import { ParsedContent, ContentNode } from '../../../types/parser.js';
import { logger } from './utils/logger.js';

describe('SyntaxHighlightPlugin', () => {
  let plugin: SyntaxHighlightPlugin;

  beforeEach(() => {
    plugin = new SyntaxHighlightPlugin();
  });

  test('should initialize with default options', () => {
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('syntax-highlight');
  });

  test('should initialize with custom options', () => {
    const customPlugin = new SyntaxHighlightPlugin({
      theme: 'dark',
      lineNumbers: true,
      languages: ['javascript', 'typescript', 'html'],
      highlightInline: true,
      codeBlockClass: 'custom-code-block',
    });

    expect(customPlugin).toBeDefined();
    expect(customPlugin.name).toBe('syntax-highlight');
  });

  test('should add syntax highlighting to code blocks', () => {
    // Create mock parsed content
    const parsedContent: ParsedContent = {
      title: 'Test Document',
      description: 'Test description',
      content: 'Test content',
      metadata: {},
      sections: [
        {
          type: 'section',
          title: 'Introduction',
          content: 'This is the introduction',
        },
        {
          type: 'codeBlock',
          content: 'function hello() {\n  logger.debug("Hello, world!");\n}',
          attributes: {
            language: 'javascript',
          },
        },
        {
          type: 'section',
          title: 'Conclusion',
          content: 'This is the conclusion',
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = plugin.hooks.afterParse(parsedContent);

    // Verify that syntax highlighting was added to the code block
    expect(result.sections[1].attributes).toEqual({
      language: 'javascript',
      highlighted: true,
      theme: 'default',
      lineNumbers: false,
      className: 'code-block language-javascript',
    });

    // Verify that metadata was added
    expect(result.metadata.syntaxHighlighting).toEqual({
      enabled: true,
      theme: 'default',
      lineNumbers: false,
    });
  });

  test('should highlight inline code when enabled', () => {
    // Create a plugin with highlightInline: true
    const inlinePlugin = new SyntaxHighlightPlugin({
      highlightInline: true,
    });

    // Create mock parsed content with inline code
    const parsedContent: ParsedContent = {
      title: 'Test Document',
      description: 'Test description',
      content: 'Test content',
      metadata: {},
      sections: [
        {
          type: 'section',
          title: 'Introduction',
          content: [
            {
              type: 'text',
              content: 'This is some text with ',
            },
            {
              type: 'inlineCode',
              content: 'const x = 42;',
            },
            {
              type: 'text',
              content: ' inline code.',
            },
          ],
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = inlinePlugin.hooks.afterParse(parsedContent);

    // Verify that syntax highlighting was added to the inline code
    const inlineCode = (result.sections[0].content as ContentNode[])[1];
    expect(inlineCode.attributes).toEqual({
      highlighted: true,
      theme: 'default',
      className: 'language-text',
    });
  });

  test('should not highlight inline code when disabled', () => {
    // Create mock parsed content with inline code
    const parsedContent: ParsedContent = {
      title: 'Test Document',
      description: 'Test description',
      content: 'Test content',
      metadata: {},
      sections: [
        {
          type: 'section',
          title: 'Introduction',
          content: [
            {
              type: 'text',
              content: 'This is some text with ',
            },
            {
              type: 'inlineCode',
              content: 'const x = 42;',
            },
            {
              type: 'text',
              content: ' inline code.',
            },
          ],
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = plugin.hooks.afterParse(parsedContent);

    // Verify that syntax highlighting was not added to the inline code
    const inlineCode = (result.sections[0].content as ContentNode[])[1];
    expect(inlineCode.attributes).toBeUndefined();
  });

  test('should respect the languages option', () => {
    // Create a plugin with specific languages
    const languagePlugin = new SyntaxHighlightPlugin({
      languages: ['javascript', 'typescript'],
    });

    // Create mock parsed content with different language code blocks
    const parsedContent: ParsedContent = {
      title: 'Test Document',
      description: 'Test description',
      content: 'Test content',
      metadata: {},
      sections: [
        {
          type: 'codeBlock',
          content: 'function hello() {\n  logger.debug("Hello, world!");\n}',
          attributes: {
            language: 'javascript',
          },
        },
        {
          type: 'codeBlock',
          content: 'const x: number = 42;',
          attributes: {
            language: 'typescript',
          },
        },
        {
          type: 'codeBlock',
          content: '<div>Hello, world!</div>',
          attributes: {
            language: 'html',
          },
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = languagePlugin.hooks.afterParse(parsedContent);

    // Verify that syntax highlighting was added to javascript and typescript blocks
    expect(result.sections[0].attributes?.highlighted).toBe(true);
    expect(result.sections[1].attributes?.highlighted).toBe(true);

    // Verify that syntax highlighting was not added to html block
    expect(result.sections[2].attributes?.highlighted).toBeUndefined();
  });

  test('should process nested content nodes', () => {
    // Create mock parsed content with nested nodes
    const parsedContent: ParsedContent = {
      title: 'Test Document',
      description: 'Test description',
      content: 'Test content',
      metadata: {},
      sections: [
        {
          type: 'section',
          title: 'Introduction',
          content: 'This is the introduction',
          children: [
            {
              type: 'codeBlock',
              content: 'function hello() {\n  logger.debug("Hello, world!");\n}',
              attributes: {
                language: 'javascript',
              },
            },
          ],
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = plugin.hooks.afterParse(parsedContent);

    // Verify that syntax highlighting was added to the nested code block
    expect(result.sections[0].children?.[0].attributes).toEqual({
      language: 'javascript',
      highlighted: true,
      theme: 'default',
      lineNumbers: false,
      className: 'code-block language-javascript',
    });
  });
});
