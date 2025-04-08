import { Plugin } from '../../types/plugin.js';
import { ParsedContent } from '../../types/parser.js';

/**
 * Options for the MarkdownEnhancerPlugin
 */
export interface MarkdownEnhancerOptions {
  enableCodeHighlighting?: boolean;
  enableTableOfContents?: boolean;
  enableFootnotes?: boolean;
}

/**
 * Plugin to enhance Markdown content with additional features
 */
export class MarkdownEnhancerPlugin implements Plugin {
  name = 'markdown-enhancer';
  version = '1.0.0';
  options: MarkdownEnhancerOptions;
  hooks: any;

  constructor(options: MarkdownEnhancerOptions = {}) {
    this.options = {
      enableCodeHighlighting: true,
      enableTableOfContents: true,
      enableFootnotes: false,
      ...options,
    };

    this.hooks = {
      beforeParse: this.beforeParse.bind(this),
      afterParse: this.afterParse.bind(this),
    };
  }

  /**
   * Process markdown content before parsing
   */
  beforeParse(content: string, options?: MarkdownEnhancerOptions): string {
    const opts = options || this.options;
    let result = content;

    // Add syntax highlighting to code blocks
    if (opts.enableCodeHighlighting) {
      result = this.enhanceCodeBlocks(result);
    }

    // Process footnotes
    if (opts.enableFootnotes) {
      result = this.processFootnotes(result);
    }

    return result;
  }

  /**
   * Process parsed content after parsing
   */
  afterParse(content: ParsedContent, options?: MarkdownEnhancerOptions): ParsedContent {
    const opts = options || this.options;

    // Generate table of contents
    if (opts.enableTableOfContents) {
      return this.generateTableOfContents(content);
    }

    return content;
  }

  /**
   * Add syntax highlighting classes to code blocks
   */
  private enhanceCodeBlocks(content: string): string {
    // Simple regex to find code blocks and add language class
    return content.replace(/```(\w+)([\s\S]*?)```/g, (_match, language, code) => {
      return `\`\`\`${language} class="language-${language}"${code}\`\`\``;
    });
  }

  /**
   * Process footnotes in markdown
   */
  private processFootnotes(content: string): string {
    // Find all footnote references
    const footnoteRefs = content.match(/\[\^(\d+)\]/g) || [];
    const footnotes: Record<string, string> = {};

    // Extract footnote definitions
    const footnoteRegex = /\[\^(\d+)\]:\s+(.*?)(?=\n\[\^|$)/gs;
    let match;
    while ((match = footnoteRegex.exec(content)) !== null) {
      const id = match[1];
      const text = match[2].trim();
      footnotes[id] = text;
    }

    // Replace footnote references with HTML
    let result = content;
    footnoteRefs.forEach(ref => {
      const id = ref.match(/\[\^(\d+)\]/)?.[1];
      if (id && footnotes[id]) {
        result = result.replace(
          ref,
          `<sup class="footnote-ref"><a href="#footnote-${id}" id="footnote-ref-${id}">${id}</a></sup>`
        );
      }
    });

    // Add footnote section at the end
    if (Object.keys(footnotes).length > 0) {
      result += '\n\n<div class="footnotes">\n<hr>\n<ol>\n';
      Object.entries(footnotes).forEach(([id, text]) => {
        result += `<li id="footnote-${id}">${text} <a href="#footnote-ref-${id}">↩</a></li>\n`;
      });
      result += '</ol>\n</div>\n';
    }

    return result;
  }

  /**
   * Generate table of contents from parsed content
   */
  private generateTableOfContents(content: ParsedContent): ParsedContent {
    const toc = content.sections.map(section => ({
      title: section.title,
      level: section.level,
      id: section.title ? this.slugify(section.title) : '',
    }));

    return {
      ...content,
      metadata: {
        ...content.metadata,
        tableOfContents: toc,
      },
    };
  }

  /**
   * Convert a string to a slug for use in IDs
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
