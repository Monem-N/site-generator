import { Plugin } from '../../types/plugin.js';
import { ParsedContent, ContentNode } from '../../types/parser.js';

/**
 * Plugin options for SyntaxHighlightPlugin
 */
export interface SyntaxHighlightPluginOptions {
  /**
   * The theme to use for syntax highlighting
   */
  theme?:
    | 'default'
    | 'dark'
    | 'funky'
    | 'okaidia'
    | 'twilight'
    | 'coy'
    | 'solarizedlight'
    | 'tomorrow';

  /**
   * Whether to add line numbers
   */
  lineNumbers?: boolean;

  /**
   * Languages to include (if not specified, all supported languages will be included)
   */
  languages?: string[];

  /**
   * Whether to highlight inline code blocks
   */
  highlightInline?: boolean;

  /**
   * CSS class to add to code blocks
   */
  codeBlockClass?: string;
}

/**
 * A plugin that adds syntax highlighting to code blocks using Prism.js
 */
export class SyntaxHighlightPlugin implements Plugin {
  name = 'syntax-highlight';
  description = 'Adds syntax highlighting to code blocks using Prism.js';

  public options: SyntaxHighlightPluginOptions;

  constructor(options: SyntaxHighlightPluginOptions = {}) {
    this.options = {
      theme: 'default',
      lineNumbers: false,
      highlightInline: false,
      codeBlockClass: 'code-block',
      ...options,
    };
  }

  hooks = {
    /**
     * After parsing, add syntax highlighting to code blocks
     */
    afterParse: (parsedContent: ParsedContent): ParsedContent => {
      // Process all sections recursively
      this.processContentNodes(parsedContent.sections);

      // Add Prism.js CSS and JS to the metadata
      parsedContent.metadata = {
        ...parsedContent.metadata,
        syntaxHighlighting: {
          enabled: true,
          theme: this.options.theme,
          lineNumbers: this.options.lineNumbers,
        },
      };

      return parsedContent;
    },
  };

  /**
   * Process content nodes recursively
   */
  private processContentNodes(nodes: ContentNode[]): void {
    for (const node of nodes) {
      // Process code blocks
      if (node.type === 'code' || node.type === 'codeBlock') {
        this.processCodeBlock(node);
      }

      // Process inline code if enabled
      if (node.type === 'inlineCode' && this.options.highlightInline) {
        this.processInlineCode(node);
      }

      // Process content if it's an array of nodes
      if (Array.isArray(node.content)) {
        this.processContentNodes(node.content);
      }

      // Process children recursively
      if (node.children && node.children.length > 0) {
        this.processContentNodes(node.children);
      }
    }
  }

  /**
   * Process a code block node
   */
  private processCodeBlock(node: ContentNode): void {
    // Skip if the content is not a string
    if (typeof node.content !== 'string') {
      return;
    }

    // Get the language from the node attributes
    const language = (node.attributes?.language as string) || 'text';

    // Skip if the language is not supported or not in the list of languages to include
    if (
      this.options.languages &&
      this.options.languages.length > 0 &&
      !this.options.languages.includes(language)
    ) {
      return;
    }

    // Add attributes for syntax highlighting
    node.attributes = {
      ...node.attributes,
      highlighted: true,
      language,
      theme: this.options.theme,
      lineNumbers: this.options.lineNumbers,
      className: `${this.options.codeBlockClass} language-${language}`,
    };
  }

  /**
   * Process an inline code node
   */
  private processInlineCode(node: ContentNode): void {
    // Skip if the content is not a string
    if (typeof node.content !== 'string') {
      return;
    }

    // Add attributes for syntax highlighting
    node.attributes = {
      ...node.attributes,
      highlighted: true,
      theme: this.options.theme,
      className: 'language-text',
    };
  }
}
