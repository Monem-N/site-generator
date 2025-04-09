import { MarkdownEnhancerPlugin } from '../../plugins/MarkdownEnhancerPlugin.js';
import { PluginSystem } from '../../plugins/PluginSystem.js';
import { ParsedContent } from '../../../types/parser.js';
import { Plugin } from '../../../types/plugin.js';

describe('MarkdownEnhancerPlugin', () => {
  // Sample parsed content
  const sampleParsedContent: ParsedContent = {
    title: 'Test Document',
    content: 'This is a test document with some content.',
    sections: [
      {
        level: 1,
        title: 'Test Document',
        content: 'This is a test document with some content.',
        type: 'heading',
      },
      {
        level: 2,
        title: 'Section 1',
        content: 'Content for section 1.',
        type: 'heading',
      },
    ],
    metadata: {
      originalPath: '/test/document.md',
      title: 'Test Document',
      description: 'This is a test document',
    },
    description: '',
    assets: [],
    references: [],
  };

  // Sample markdown content
  const sampleMarkdown = `# Test Document

This is a test document with some content.

## Section 1

Content for section 1.

\`\`\`js
// Code block
const test = 'Hello World';
logger.debug(test);
\`\`\`

[Link to another page](another-page.md)
`;

  test('should initialize with default options', () => {
    const plugin = new MarkdownEnhancerPlugin();
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('markdown-enhancer');
    expect(plugin.options).toBeDefined();
    expect(plugin.hooks).toBeDefined();
  });

  test('should initialize with custom options', () => {
    const customOptions = {
      enableCodeHighlighting: true,
      enableTableOfContents: true,
      enableFootnotes: false,
    };

    const plugin = new MarkdownEnhancerPlugin(customOptions);
    expect(plugin.options).toEqual(customOptions);
  });

  test('should enhance code blocks in beforeParse hook', () => {
    const plugin = new MarkdownEnhancerPlugin({ enableCodeHighlighting: true }) as Plugin;
    const result = plugin.hooks?.beforeParse?.(sampleMarkdown, plugin.options);

    expect(result).toContain('```js');
    expect(result).toContain('// Code block');
    expect(result).toContain("const test = 'Hello World';");
    expect(result).toContain('logger.debug(test);');
    expect(result).toContain('```');

    // Should add language class for syntax highlighting
    expect(result).toContain('class="language-js"');
  });

  test('should not enhance code blocks when disabled', () => {
    const plugin = new MarkdownEnhancerPlugin({ enableCodeHighlighting: false }) as Plugin;
    const result = plugin.hooks?.beforeParse?.(sampleMarkdown, plugin.options);

    expect(result).toContain('```js');
    expect(result).not.toContain('class="language-js"');
  });

  test('should add table of contents in afterParse hook', async () => {
    const plugin = new MarkdownEnhancerPlugin({ enableTableOfContents: true }) as Plugin;
    const result = await plugin.hooks?.afterParse?.(sampleParsedContent, plugin.options);

    expect(result).toBeDefined();
    expect(result?.metadata?.tableOfContents).toBeDefined();
    expect(result?.metadata?.tableOfContents).toHaveLength(2);
    expect(result?.metadata?.tableOfContents?.[0].title).toBe('Test Document');
    expect(result?.metadata?.tableOfContents?.[0].level).toBe(1);
    expect(result?.metadata?.tableOfContents?.[1].title).toBe('Section 1');
    expect(result?.metadata?.tableOfContents?.[1].level).toBe(2);
  });

  test('should not add table of contents when disabled', async () => {
    const plugin = new MarkdownEnhancerPlugin({ enableTableOfContents: false }) as Plugin;
    const result = await plugin.hooks?.afterParse?.(sampleParsedContent, plugin.options);

    expect(result).toBeDefined();
    expect(result?.metadata?.tableOfContents).toBeUndefined();
  });

  test('should work with PluginSystem', () => {
    const plugin = new MarkdownEnhancerPlugin() as Plugin;
    const pluginSystem = new PluginSystem([plugin]);

    const result = pluginSystem.executeHook('beforeParse', sampleMarkdown);
    expect(result).toBeDefined();

    const parsedResult = pluginSystem.executeHook(
      'afterParse',
      sampleParsedContent
    ) as ParsedContent;
    expect(parsedResult).toBeDefined();
    expect(parsedResult?.metadata.tableOfContents).toBeDefined();
  });

  test('should handle empty content gracefully', async () => {
    const plugin = new MarkdownEnhancerPlugin() as Plugin;
    const emptyMarkdown = '';

    const result = plugin.hooks?.beforeParse?.(emptyMarkdown, plugin.options) as string;
    expect(result).toBe('');

    const emptyParsedContent: ParsedContent = {
      title: '',
      content: '',
      sections: [],
      metadata: {},
      description: '',
      assets: [],
      references: [],
    };

    const parsedResult = await plugin.hooks?.afterParse?.(emptyParsedContent, plugin.options);
    expect(parsedResult).toBeDefined();
    expect(parsedResult?.metadata?.tableOfContents).toHaveLength(0);
  });

  test('should handle content without headings', async () => {
    const plugin = new MarkdownEnhancerPlugin() as Plugin;
    const markdownWithoutHeadings = 'This is content without any headings.';

    const result = plugin.hooks?.beforeParse?.(markdownWithoutHeadings, plugin.options);
    expect(result).toBe(markdownWithoutHeadings);

    const parsedContentWithoutHeadings: ParsedContent = {
      title: 'No Headings',
      content: 'This is content without any headings.',
      sections: [],
      metadata: {},
      description: '',
      assets: [],
      references: [],
    };

    const parsedResult = await plugin.hooks?.afterParse?.(
      parsedContentWithoutHeadings,
      plugin.options
    );
    expect(parsedResult).toBeDefined();
    expect(parsedResult?.metadata?.tableOfContents).toHaveLength(0);
  });

  test('should process footnotes when enabled', () => {
    const plugin = new MarkdownEnhancerPlugin({ enableFootnotes: true }) as Plugin;
    const markdownWithFootnotes =
      'This is a text with a footnote[^1].\n\n[^1]: This is the footnote content.';

    const result = plugin.hooks?.beforeParse?.(markdownWithFootnotes, plugin.options);
    expect(result).toContain('This is a text with a footnote');
    expect(result).toContain('This is the footnote content');
    expect(result).toContain('<div class="footnote"');
  });

  test('should not process footnotes when disabled', () => {
    const plugin = new MarkdownEnhancerPlugin({ enableFootnotes: false }) as Plugin;
    const markdownWithFootnotes =
      'This is a text with a footnote[^1].\n\n[^1]: This is the footnote content.';

    const result = plugin.hooks?.beforeParse?.(markdownWithFootnotes, plugin.options);
    expect(result).not.toContain('<div class="footnote"');
  });
});
