import { ParsedContent, ContentNode } from '../../types/parser.js';
import { Asset, Reference } from '../../types/parser.js';
import { Parser } from './Parser.js';
import { marked } from 'marked';
import { logger } from '../utils/logger.js';
// Import front-matter dynamically to avoid ESM issues
let frontMatterModule;

async function loadFrontMatter() {
  frontMatterModule = await import('front-matter');
}

export class DocsifyMarkdownParser implements Parser {
  // Options are not currently used but may be needed in the future
  private plugins: Array<{
    beforeParse?: (content: string, filePath?: string) => string | Promise<string>;
    afterParse?: (
      content: ParsedContent,
      filePath?: string
    ) => ParsedContent | Promise<ParsedContent>;
  }> = [];

  constructor(_options = {}) {
    // Options are stored for future use

    // Configure marked with Docsify-like settings
    marked.setOptions({
      renderer: new marked.Renderer(),
      gfm: true,
      // Enable tables (this is a custom option that may not be in the type definition)
      breaks: false,
      pedantic: false,
      sanitize: false,
      smartLists: true,
      smartypants: false,
      ..._options,
    });
  }

  use(plugin: {
    beforeParse?: (content: string, filePath?: string) => string | Promise<string>;
    afterParse?: (
      content: ParsedContent,
      filePath?: string
    ) => ParsedContent | Promise<ParsedContent>;
  }) {
    this.plugins.push(plugin);
    return this;
  }

  async parse(source: string, options?: Record<string, unknown>): Promise<ParsedContent> {
    const content = source;
    const filePath = options?.filePath as string | undefined;
    try {
      // Load front-matter if not already loaded
      if (!frontMatterModule) {
        await loadFrontMatter();
      }

      // Apply plugins (pre-processing)
      let processedContent = content;
      for (const plugin of this.plugins) {
        if (plugin.beforeParse) {
          processedContent = await plugin.beforeParse(processedContent, filePath);
        }
      }

      // Extract frontmatter
      const { attributes, body } = frontMatterModule.default(processedContent);
      const metadata = attributes as Record<string, unknown>;

      // Parse markdown to HTML
      const html = marked(body);

      // Extract title from the first heading or use filename
      const title = this.extractTitle(body) || (metadata.title as string) || 'Untitled';
      const description = (metadata.description as string) || '';

      // Extract sections, assets, and references
      const sections = this.extractSections(body);
      const assets = this.extractAssets(body);
      const references = this.extractReferences(body, filePath);

      // Create parsed content structure
      const parsedContent: ParsedContent = {
        title,
        description,
        metadata,
        sections,
        assets,
        references,
        html, // Add the HTML for rendering
      };

      // Apply plugins (post-processing)
      let result = parsedContent;
      for (const plugin of this.plugins) {
        if (plugin.afterParse) {
          result = await plugin.afterParse(result, filePath);
        }
      }

      return result;
    } catch (error) {
      logger.error('Error parsing markdown:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Markdown parsing failed: ${errorMessage}`);
    }
  }

  private extractTitle(content: string): string | null {
    // Extract title from the first heading
    const titleMatch = content.match(/^#\s+(.*)/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  private extractSections(content: string): ContentNode[] {
    const sections: ContentNode[] = [];
    const lines = content.split('\n');

    let currentSection: ContentNode | null = null;
    let currentSubsection: ContentNode | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      // Check for headings
      const h1Match = line.match(/^#\s+(.*)/);
      const h2Match = line.match(/^##\s+(.*)/);
      const h3Match = line.match(/^###\s+(.*)/);

      if (h1Match) {
        // Save previous section if exists
        if (currentSection) {
          currentSection.content = currentContent.join('\n');
          sections.push(currentSection);
          currentContent = [];
        }

        // Create new section
        currentSection = {
          type: 'section',
          title: h1Match[1].trim(),
          content: '',
          children: [],
        };

        currentSubsection = null;
      } else if (h2Match && currentSection) {
        // Save content to current section or subsection
        if (currentSubsection) {
          currentSubsection.content = currentContent.join('\n');
          currentContent = [];
        } else if (currentContent.length > 0) {
          currentSection.content = currentContent.join('\n');
          currentContent = [];
        }

        // Create new subsection
        currentSubsection = {
          type: 'subsection',
          title: h2Match[1].trim(),
          content: '',
          children: [],
        };

        // Initialize children array if it doesn't exist
        if (!currentSection.children) {
          currentSection.children = [];
        }
        currentSection.children.push(currentSubsection);
      } else if (h3Match && currentSubsection) {
        // Save content to current subsection
        currentSubsection.content = currentContent.join('\n');
        currentContent = [];

        // Create new sub-subsection
        const subSubsection: ContentNode = {
          type: 'subsubsection',
          title: h3Match[1].trim(),
          content: '',
          children: [],
        };

        // Initialize children array if it doesn't exist
        if (!currentSubsection.children) {
          currentSubsection.children = [];
        }
        currentSubsection.children.push(subSubsection);
        currentSubsection = subSubsection;
      } else {
        // Add line to current content
        currentContent.push(line);
      }
    }

    // Save final section or subsection
    if (currentSubsection) {
      currentSubsection.content = currentContent.join('\n');
    } else if (currentSection) {
      currentSection.content = currentContent.join('\n');
    }

    // Add final section if exists
    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  private extractAssets(content: string): Asset[] {
    const assets: Asset[] = [];
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      const altText = match[1];
      const imagePath = match[2];

      assets.push({
        type: 'image',
        path: imagePath,
        metadata: {
          altText,
        },
      });
    }

    return assets;
  }

  private extractReferences(content: string, filePath?: string): Reference[] {
    const references: Reference[] = [];
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const text = match[1];
      const target = match[2];

      // Skip image links (already handled in extractAssets)
      if (content.substring(match.index - 1, match.index) === '!') {
        continue;
      }

      // Determine if internal or external link
      const type = target.startsWith('http') ? 'external' : 'internal';

      references.push({
        type,
        source: filePath || '',
        target,
        attributes: {
          text,
        },
      });
    }

    return references;
  }

  public async readFile(): Promise<string> {
    // This is a public method that can be mocked in tests
    throw new Error('Not implemented');
  }
}
