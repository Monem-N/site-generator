import { TableOfContentsPlugin } from '../../plugins/TableOfContentsPlugin.js';
import { ParsedContent, ____ContentNode } from '../../../types/parser.js';

describe('TableOfContentsPlugin', () => {
  let plugin: TableOfContentsPlugin;

  beforeEach(() => {
    plugin = new TableOfContentsPlugin();
  });

  test('should initialize with default options', () => {
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('table-of-contents');
  });

  test('should initialize with custom options', () => {
    const customPlugin = new TableOfContentsPlugin({
      title: 'Custom TOC',
      maxLevel: 2,
      addAnchors: false,
      className: 'custom-toc',
      position: 'bottom',
    });

    expect(customPlugin).toBeDefined();
    expect(customPlugin.name).toBe('table-of-contents');
  });

  test('should add table of contents to content', () => {
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
          level: 1,
        },
        {
          type: 'section',
          title: 'Getting Started',
          content: 'This is the getting started section',
          level: 2,
        },
        {
          type: 'section',
          title: 'Advanced Topics',
          content: 'This is the advanced topics section',
          level: 2,
        },
        {
          type: 'section',
          title: 'Conclusion',
          content: 'This is the conclusion',
          level: 1,
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = plugin.hooks.afterParse(parsedContent);

    // Verify that the table of contents was added
    expect(result.sections).toHaveLength(5);
    expect(result.sections[0].type).toBe('toc');
    expect(result.sections[0].title).toBe('Table of Contents');

    // Verify the table of contents content
    const tocContent = result.sections[0].content as string;
    expect(tocContent).toContain('- [Introduction](#introduction)');
    expect(tocContent).toContain('  - [Getting Started](#getting-started)');
    expect(tocContent).toContain('  - [Advanced Topics](#advanced-topics)');
    expect(tocContent).toContain('- [Conclusion](#conclusion)');
  });

  test('should add table of contents at the bottom', () => {
    // Create a plugin with position: 'bottom'
    const bottomPlugin = new TableOfContentsPlugin({
      position: 'bottom',
    });

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
          level: 1,
        },
        {
          type: 'section',
          title: 'Conclusion',
          content: 'This is the conclusion',
          level: 1,
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = bottomPlugin.hooks.afterParse(parsedContent);

    // Verify that the table of contents was added at the bottom
    expect(result.sections).toHaveLength(3);
    expect(result.sections[2].type).toBe('toc');
    expect(result.sections[2].title).toBe('Table of Contents');
  });

  test('should respect maxLevel option', () => {
    // Create a plugin with maxLevel: 1
    const maxLevelPlugin = new TableOfContentsPlugin({
      maxLevel: 1,
    });

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
          level: 1,
        },
        {
          type: 'section',
          title: 'Getting Started',
          content: 'This is the getting started section',
          level: 2,
        },
        {
          type: 'section',
          title: 'Conclusion',
          content: 'This is the conclusion',
          level: 1,
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = maxLevelPlugin.hooks.afterParse(parsedContent);

    // Verify the table of contents content
    const tocContent = result.sections[0].content as string;
    expect(tocContent).toContain('- [Introduction](#introduction)');
    expect(tocContent).not.toContain('  - [Getting Started](#getting-started)');
    expect(tocContent).toContain('- [Conclusion](#conclusion)');
  });

  test('should add anchors to headings', () => {
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
          level: 1,
        },
        {
          type: 'section',
          title: 'Getting Started',
          content: 'This is the getting started section',
          level: 2,
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = plugin.hooks.afterParse(parsedContent);

    // Verify that anchors were added to headings
    expect(result.sections[1].attributes).toBeDefined();
    expect(result.sections[1].attributes?.id).toBe('introduction');
    expect(result.sections[1].attributes?.className).toContain('anchor');

    expect(result.sections[2].attributes).toBeDefined();
    expect(result.sections[2].attributes?.id).toBe('getting-started');
    expect(result.sections[2].attributes?.className).toContain('anchor');
  });

  test('should not add anchors when addAnchors is false', () => {
    // Create a plugin with addAnchors: false
    const noAnchorsPlugin = new TableOfContentsPlugin({
      addAnchors: false,
    });

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
          level: 1,
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = noAnchorsPlugin.hooks.afterParse(parsedContent);

    // Verify that anchors were not added to headings
    expect(result.sections[1].attributes?.id).toBeUndefined();
    expect(result.sections[1].attributes?.className).toBeUndefined();
  });

  test('should handle empty sections', () => {
    // Create mock parsed content with no sections
    const parsedContent: ParsedContent = {
      title: 'Test Document',
      description: 'Test description',
      content: 'Test content',
      metadata: {},
      sections: [],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = plugin.hooks.afterParse(parsedContent);

    // Verify that the result is the same as the input
    expect(result).toBe(parsedContent);
    expect(result.sections).toHaveLength(0);
  });

  test('should handle nested sections', () => {
    // Create mock parsed content with nested sections
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
          level: 1,
          children: [
            {
              type: 'section',
              title: 'Background',
              content: 'This is the background',
              level: 2,
            },
          ],
        },
        {
          type: 'section',
          title: 'Conclusion',
          content: 'This is the conclusion',
          level: 1,
        },
      ],
      assets: [],
      references: [],
    };

    // Apply the plugin
    const result = plugin.hooks.afterParse(parsedContent);

    // Verify the table of contents content
    const tocContent = result.sections[0].content as string;
    expect(tocContent).toContain('- [Introduction](#introduction)');
    expect(tocContent).toContain('  - [Background](#background)');
    expect(tocContent).toContain('- [Conclusion](#conclusion)');

    // Verify that anchors were added to nested headings
    expect(result.sections[1].attributes?.id).toBe('introduction');
    expect(result.sections[1].children?.[0].attributes?.id).toBe('background');
  });
});
