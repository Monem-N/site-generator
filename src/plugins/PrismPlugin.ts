import { Plugin } from './PluginManager';
import { ParsedContent } from '../types';

export class PrismPlugin implements Plugin {
  name = 'prism';
  
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
      
      if (!parsedContent.metadata.dependencies.includes('prism')) {
        parsedContent.metadata.dependencies.push('prism');
      }
      
      // Add initialization script for Prism
      parsedContent.metadata.scripts = parsedContent.metadata.scripts || [];
      parsedContent.metadata.scripts.push({
        type: 'text/javascript',
        content: `
          document.addEventListener('DOMContentLoaded', () => {
            if (typeof Prism !== 'undefined') {
              Prism.highlightAll();
            }
          });
        `
      });
      
      // Add CSS for Prism
      parsedContent.metadata.styles = parsedContent.metadata.styles || [];
      parsedContent.metadata.styles.push({
        type: 'text/css',
        href: 'https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism.css'
      });
    }
    
    return parsedContent;
  }
}
