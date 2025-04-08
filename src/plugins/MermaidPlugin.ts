import { Plugin } from '../../types/plugin.js';
import { ParsedContent } from '../../types/parser.js';

export class MermaidPlugin implements Plugin {
  name = 'mermaid';

  async beforeParse(content: string): Promise<string> {
    // Find mermaid code blocks and mark them for processing
    return content.replace(/```mermaid([\s\S]*?)```/g, (_match, code) => {
      return `<div class="mermaid">${code.trim()}</div>`;
    });
  }

  async afterParse(parsedContent: ParsedContent): Promise<ParsedContent> {
    // Check if the content contains mermaid diagrams
    const hasMermaid = parsedContent.html && parsedContent.html.includes('class="mermaid"');

    if (hasMermaid) {
      // Add mermaid as a dependency
      parsedContent.metadata = parsedContent.metadata || {};
      parsedContent.metadata.dependencies = parsedContent.metadata.dependencies || [];

      // Ensure dependencies is an array and add mermaid if not already included
      const dependencies = parsedContent.metadata.dependencies as string[];
      if (!dependencies.includes('mermaid')) {
        dependencies.push('mermaid');
      }

      // Add initialization script for mermaid
      parsedContent.metadata.scripts = parsedContent.metadata.scripts || [];
      // Ensure scripts is an array
      const scripts = parsedContent.metadata.scripts as Array<{ type: string; content: string }>;
      scripts.push({
        type: 'text/javascript',
        content: `
          document.addEventListener('DOMContentLoaded', () => {
            mermaid.initialize({ startOnLoad: true });
          });
        `,
      });
    }

    return parsedContent;
  }
}
