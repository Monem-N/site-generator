import { DocsifyMarkdownParser } from '../../parsers/DocsifyMarkdownParser.js';
import { ____ParsedContent } from '../../../types/parser.js';
import { ____logger } from '../../utils/logger.js';

describe('DocsifyMarkdownParser', () => {
  let parser: DocsifyMarkdownParser;

  beforeEach(() => {
    parser = new DocsifyMarkdownParser();
  });

  test('should parse basic markdown', async () => {
    const markdown = '# Hello World\n\nThis is a test.';
    const result = await parser.parse(markdown);

    expect(result.title).toBe('Hello World');
    expect(result.sections.length).toBe(1);
    expect(result.sections[0].title).toBe('Hello World');
    expect(result.sections[0].content).toContain('This is a test.');
  });

  test('should extract frontmatter', async () => {
    const markdown = `---
title: Custom Title
description: Custom description
---

# Hello World

This is a test.`;

    const result = await parser.parse(markdown);

    expect(result.title).toBe('Custom Title');
    expect(result.description).toBe('Custom description');
    expect(result.metadata.title).toBe('Custom Title');
    expect(result.metadata.description).toBe('Custom description');
  });

  test('should extract assets', async () => {
    const markdown = '# Hello World\n\n![Image](image.png)\n\nThis is a test.';
    const result = await parser.parse(markdown);

    expect(result.assets.length).toBe(1);
    expect(result.assets[0].type).toBe('image');
    expect(result.assets[0].path).toBe('image.png');
    expect(result.assets[0].metadata.altText).toBe('Image');
  });

  test('should extract references', async () => {
    const markdown = '# Hello World\n\n[Link](https://example.com)\n\nThis is a test.';
    const result = await parser.parse(markdown);

    expect(result.references.length).toBe(1);
    expect(result.references[0].type).toBe('external');
    expect(result.references[0].target).toBe('https://example.com');
    expect(result.references[0].attributes.text).toBe('Link');
  });

  test('should handle multiple sections with different heading levels', async () => {
    const markdown = `# Main Title

Main content.

## Section 1

Section 1 content.

### Subsection 1.1

Subsection 1.1 content.

## Section 2

Section 2 content.`;

    const result = await parser.parse(markdown);

    expect(result.sections.length).toBe(4);
    expect(result.sections[0].level).toBe(1);
    expect(result.sections[0].title).toBe('Main Title');
    expect(result.sections[1].level).toBe(2);
    expect(result.sections[1].title).toBe('Section 1');
    expect(result.sections[2].level).toBe(3);
    expect(result.sections[2].title).toBe('Subsection 1.1');
    expect(result.sections[3].level).toBe(2);
    expect(result.sections[3].title).toBe('Section 2');
  });

  test('should handle code blocks correctly', async () => {
    const markdown = `# Code Example

\`\`\`javascript
const hello = 'world';
logger.debug(hello);
\`\`\`

Regular text.`;

    const result = await parser.parse(markdown);

    expect(result.sections[0].content).toContain('```javascript');
    expect(result.sections[0].content).toContain("const hello = 'world';");
    expect(result.sections[0].content).toContain('logger.debug(hello);');
    expect(result.sections[0].content).toContain('```');
  });

  test('should handle Docsify-specific syntax', async () => {
    const markdown = `# Docsify Features

<!-- {docsify-ignore} -->

?> This is a tip

!> This is a warning

[toc]

[Link Text](guide.md#anchor)`;

    const result = await parser.parse(markdown);

    expect(result.sections[0].content).toContain('<!-- {docsify-ignore} -->');
    expect(result.sections[0].content).toContain('?> This is a tip');
    expect(result.sections[0].content).toContain('!> This is a warning');
    expect(result.sections[0].content).toContain('[toc]');
    // Docsify transforms relative links to hash-based routing
    expect(result.sections[0].content).toContain('[Link Text](#/guide#anchor)');
  });

  test('should handle empty or invalid markdown', async () => {
    const emptyMarkdown = '';
    const result = await parser.parse(emptyMarkdown);

    expect(result.title).toBe('');
    expect(result.content).toBe('');
    expect(result.sections.length).toBe(0);
  });

  test('should handle markdown with only frontmatter', async () => {
    const markdownWithOnlyFrontmatter = `---
title: Just Frontmatter
description: No content
---`;

    const result = await parser.parse(markdownWithOnlyFrontmatter);

    expect(result.title).toBe('Just Frontmatter');
    expect(result.description).toBe('No content');
    expect(result.content).toBe('');
    expect(result.sections.length).toBe(0);
  });

  test('should handle markdown with tables', async () => {
    const markdownWithTable = `# Table Example

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`;

    const result = await parser.parse(markdownWithTable);

    expect(result.sections[0].content).toContain('| Header 1 | Header 2 |');
    expect(result.sections[0].content).toContain('| -------- | -------- |');
    expect(result.sections[0].content).toContain('| Cell 1   | Cell 2   |');
    expect(result.sections[0].content).toContain('| Cell 3   | Cell 4   |');
  });

  test('should handle markdown with lists', async () => {
    const markdownWithLists = `# Lists Example

- Item 1
- Item 2
  - Nested Item 1
  - Nested Item 2
- Item 3

1. Ordered Item 1
2. Ordered Item 2
3. Ordered Item 3`;

    const result = await parser.parse(markdownWithLists);

    expect(result.sections[0].content).toContain('- Item 1');
    expect(result.sections[0].content).toContain('  - Nested Item 1');
    expect(result.sections[0].content).toContain('1. Ordered Item 1');
  });

  test('should handle file paths correctly', async () => {
    // Mock the parser's file handling methods
    const originalReadFile = parser.readFile;
    parser.readFile = jest.fn().mockImplementation((___filePath: string) => {
      return '# File Content\n\nThis is content from a file.';
    });

    const result = await parser.parseFile('/path/to/document.md');

    expect(result.title).toBe('File Content');
    expect(result.content).toContain('This is content from a file.');
    expect(result.metadata.originalPath).toBe('/path/to/document.md');

    // Restore original method
    parser.readFile = originalReadFile;
  });

  test('should handle errors gracefully', async () => {
    // Mock the parser's file handling methods to throw an error
    const originalReadFile = parser.readFile;
    parser.readFile = jest.fn().mockImplementation((___filePath: string) => {
      throw new Error('File not found');
    });

    await expect(parser.parseFile('/non-existent/file.md')).rejects.toThrow('File not found');

    // Restore original method
    parser.readFile = originalReadFile;
  });
});
