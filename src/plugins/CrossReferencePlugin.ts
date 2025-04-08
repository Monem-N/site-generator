import { Plugin } from '../../types/plugin';
import { ParsedContent } from '../../types/parser';
import * as path from 'path';

export class CrossReferencePlugin implements Plugin {
  name = 'crossReference';
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async beforeParse(content: string, filePath?: string): Promise<string> {
    // Process cross-references in markdown
    // Format: [[path/to/file|Optional link text]]
    return content.replace(/\[\[(.*?)\]\]/g, (_match, reference) => {
      const parts = reference.split('|');
      const targetPath = parts[0].trim();
      const displayText = parts.length > 1 ? parts[1].trim() : targetPath;

      // Calculate relative path if filePath is provided
      let relativePath = targetPath;
      if (filePath) {
        const currentDir = path.dirname(filePath);
        relativePath = this.resolveRelativePath(currentDir, targetPath);
      }

      // Convert to markdown link
      return `[${displayText}](${relativePath})`;
    });
  }

  private resolveRelativePath(currentDir: string, targetPath: string): string {
    // If target path is absolute (starts with /), resolve from base path
    if (targetPath.startsWith('/')) {
      return targetPath;
    }

    // If target path includes .md extension, keep it
    if (!targetPath.endsWith('.md')) {
      targetPath += '.md';
    }

    // Resolve relative path
    const absoluteTargetPath = path.resolve(currentDir, targetPath);
    const relativeToBase = path.relative(this.basePath, absoluteTargetPath);

    return relativeToBase;
  }

  async afterParse(parsedContent: ParsedContent): Promise<ParsedContent> {
    // No post-processing needed for cross-references
    return parsedContent;
  }
}
