import { DocsifyMarkdownParser } from '../../parsers/DocsifyMarkdownParser';

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
});
