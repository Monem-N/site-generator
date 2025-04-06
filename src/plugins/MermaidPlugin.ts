import { Plugin } from './PluginManager';
import { ParsedContent } from '../types';

export class MermaidPlugin implements Plugin {
  name = 'mermaid';
  
  async beforeParse(content: string): Promise<string> {
    // Find mermaid code blocks and mark them for processing
    return content.replace(/```mermaid([\s\S]*?)```/g, (match, code) => {
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
      
      if (!parsedContent.metadata.dependencies.includes('mermaid')) {
        parsedContent.metadata.dependencies.push('mermaid');
      }
      
      // Add initialization script for mermaid
      parsedContent.metadata.scripts = parsedContent.metadata.scripts || [];
      parsedContent.metadata.scripts.push({
        type: 'text/javascript',
        content: `
          document.addEventListener('DOMContentLoaded', () => {
            mermaid.initialize({ startOnLoad: true });
          });
        `
      });
    }
    
    return parsedContent;
  }
}
