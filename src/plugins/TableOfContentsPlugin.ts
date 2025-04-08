import { Plugin } from '../../types/plugin';
import { ParsedContent, ContentNode } from '../../types/parser';

/**
 * Plugin options for TableOfContentsPlugin
 */
export interface TableOfContentsPluginOptions {
  /**
   * The title of the table of contents
   */
  title?: string;

  /**
   * The maximum heading level to include in the table of contents
   */
  maxLevel?: number;

  /**
   * Whether to add anchor links to headings
   */
  addAnchors?: boolean;

  /**
   * The CSS class to add to the table of contents
   */
  className?: string;

  /**
   * The CSS class to add to anchor links
   */
  anchorClassName?: string;

  /**
   * The position of the table of contents
   */
  position?: 'top' | 'bottom';
}

/**
 * A plugin that generates a table of contents from headings in the content
 */
export class TableOfContentsPlugin implements Plugin {
  name = 'table-of-contents';
  description = 'Generates a table of contents from headings in the content';

  public options: TableOfContentsPluginOptions;

  constructor(options: TableOfContentsPluginOptions = {}) {
    this.options = {
      title: 'Table of Contents',
      maxLevel: 3,
      addAnchors: true,
      className: 'toc',
      anchorClassName: 'anchor',
      position: 'top',
      ...options,
    };
  }

  hooks = {
    /**
     * After parsing, add a table of contents to the content
     */
    afterParse: (parsedContent: ParsedContent): ParsedContent => {
      // Skip if there are no sections
      if (!parsedContent.sections || parsedContent.sections.length === 0) {
        return parsedContent;
      }

      // Generate the table of contents
      const toc = this.generateTableOfContents(parsedContent.sections);

      // Add the table of contents to the content
      if (this.options.position === 'top') {
        parsedContent.sections.unshift(toc);
      } else {
        parsedContent.sections.push(toc);
      }

      // Add anchor links to headings if enabled
      if (this.options.addAnchors) {
        this.addAnchorsToHeadings(parsedContent.sections);
      }

      return parsedContent;
    },
  };

  /**
   * Generate a table of contents from the sections
   */
  private generateTableOfContents(sections: ContentNode[]): ContentNode {
    // Find all headings
    const headings = this.findHeadings(sections);

    // Generate the table of contents content
    let tocContent = '';

    for (const heading of headings) {
      // Skip headings without a title
      if (!heading.title) continue;

      // Skip headings with a level higher than the maximum level
      if (heading.level && heading.level > (this.options.maxLevel || 3)) continue;

      // Generate the anchor ID
      const anchorId = this.generateAnchorId(heading.title);

      // Add indentation based on the heading level
      const indent = heading.level ? '  '.repeat(heading.level - 1) : '';

      // Add the heading to the table of contents
      tocContent += `${indent}- [${heading.title}](#${anchorId})\n`;
    }

    // Create the table of contents node
    return {
      type: 'toc',
      title: this.options.title || 'Table of Contents',
      content: tocContent,
      attributes: {
        className: this.options.className,
      },
    };
  }

  /**
   * Find all headings in the sections
   */
  private findHeadings(sections: ContentNode[]): ContentNode[] {
    const headings: ContentNode[] = [];

    for (const section of sections) {
      // Skip non-section nodes
      if (section.type !== 'section' && section.type !== 'heading') continue;

      // Add the section to the headings
      headings.push(section);

      // Recursively find headings in child sections
      if (section.children && section.children.length > 0) {
        headings.push(...this.findHeadings(section.children));
      }
    }

    return headings;
  }

  /**
   * Add anchor links to headings
   */
  private addAnchorsToHeadings(sections: ContentNode[]): void {
    for (const section of sections) {
      // Skip non-section nodes
      if (section.type !== 'section' && section.type !== 'heading') continue;

      // Skip sections without a title
      if (!section.title) continue;

      // Generate the anchor ID
      const anchorId = this.generateAnchorId(section.title);

      // Add the anchor ID to the section attributes
      section.attributes = section.attributes || {};
      section.attributes.id = anchorId;
      section.attributes.className = `${section.attributes.className || ''} ${
        this.options.anchorClassName || ''
      }`.trim();

      // Recursively add anchors to child sections
      if (section.children && section.children.length > 0) {
        this.addAnchorsToHeadings(section.children);
      }
    }
  }

  /**
   * Generate an anchor ID from a heading title
   */
  private generateAnchorId(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
