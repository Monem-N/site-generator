import { Plugin } from '../../types/plugin.js';
import { ParsedContent } from '../../types/parser.js';

export class PrismPlugin implements Plugin {
  name = 'prism';
  version = '1.0.0';
  hooks = {
    beforeParse: this.beforeParse.bind(this),
    afterParse: this.afterParse.bind(this),
  };
  options = {
    theme: 'default',
    languages: ['javascript', 'typescript', 'html', 'css', 'json', 'markdown'],
  };

  async beforeParse(content: string): Promise<string> {
    // No pre-processing needed for Prism
    return content;
  }

  async afterParse(parsedContent: ParsedContent): Promise<ParsedContent> {
    // Check if the content contains code blocks
    const hasCodeBlocks = parsedContent.html && parsedContent.html.includes('<pre><code');

    if (hasCodeBlocks) {
      // Add Prism as a dependency
      parsedContent.metadata = parsedContent.metadata || {};
      parsedContent.metadata.dependencies = parsedContent.metadata.dependencies || [];

      // Initialize dependencies array if it doesn't exist
      if (!parsedContent.metadata.dependencies) {
        parsedContent.metadata.dependencies = [];
      }

      // Add prism dependency if not already included
      if (
        !Array.isArray(parsedContent.metadata.dependencies) ||
        !parsedContent.metadata.dependencies.includes('prism')
      ) {
        (parsedContent.metadata.dependencies as string[]).push('prism');
      }

      // Add initialization script for Prism
      parsedContent.metadata.scripts = parsedContent.metadata.scripts || [];
      // Initialize scripts array if it doesn't exist
      if (!parsedContent.metadata.scripts) {
        parsedContent.metadata.scripts = [];
      }

      // Add Prism script
      (parsedContent.metadata.scripts as unknown[]).push({
        type: 'text/javascript',
        content: `
          document.addEventListener('DOMContentLoaded', () => {
            if (_typeof Prism !== 'undefined') {
              Prism.highlightAll();
            }
          });
        `,
      });

      // Add CSS for Prism
      parsedContent.metadata.styles = parsedContent.metadata.styles || [];
      // Initialize styles array if it doesn't exist
      if (!parsedContent.metadata.styles) {
        parsedContent.metadata.styles = [];
      }

      // Add Prism styles
      (parsedContent.metadata.styles as unknown[]).push({
        type: 'text/css',
        href: 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.css',
      });
    }

    return parsedContent;
  }
}
