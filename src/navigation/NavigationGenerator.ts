import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../utils/logger.js';

interface FileEntry {
  name: string;
  path: string;
}

interface DirectoryStructure {
  name?: string;
  path?: string;
  files: FileEntry[];
  directories: DirectoryStructure[];
}

export interface NavigationItem {
  title: string;
  path?: string;
  type: 'page' | 'section' | 'link';
  children?: NavigationItem[];
  external?: boolean;
}

export class NavigationGenerator {
  private sourceDir: string;
  private ignorePaths: string[];
  generateSidebar(navigationItems: NavigationItem[]): string {
    // Convert navigation items to markdown sidebar format
    return this.navigationToMarkdown(navigationItems, 0);
  }

  generateNavbar(navigationItems: NavigationItem[]): string {
    // Convert navigation items to markdown navbar format (only top level)
    return navigationItems
      .map(item => `* [${item.title}](${this.pathToUrl(item.path)})`)
      .join('\n');
  }

  private pathToUrl(filePath?: string): string {
    if (!filePath) return '/';

    // Convert file path to URL
    // Remove file extension and ensure it starts with /
    let url = filePath.replace(/\.md$/, '');
    if (!url.startsWith('/')) url = '/' + url;

    // Handle index files
    if (url.endsWith('/index')) {
      url = url.replace(/\/index$/, '/');
    } else if (url === '/index') {
      url = '/';
    }

    return url;
  }

  private navigationToMarkdown(items: NavigationItem[], level: number): string {
    if (!items || items.length === 0) return '';

    const indent = '  '.repeat(level);
    let result = '';

    for (const item of items) {
      // Add the current item
      result += `${indent}* [${item.title}](${this.pathToUrl(item.path)})\n`;

      // Add children if any
      if (item.children && item.children.length > 0) {
        result += this.navigationToMarkdown(item.children, level + 1);
      }
    }

    return result;
  }

  constructor(sourceDir: string, ignorePaths: string[] = []) {
    this.sourceDir = sourceDir;
    this.ignorePaths = ['node_modules', '.git', '.github', '.vscode', ...ignorePaths];
  }

  async generate(): Promise<NavigationItem[]> {
    const structure = await this.scanDirectory(this.sourceDir);
    return this.buildNavigation(structure);
  }

  private async scanDirectory(dir: string): Promise<DirectoryStructure> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const result: DirectoryStructure = { files: [], directories: [] };

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(this.sourceDir, fullPath);

        // Skip ignored paths
        if (this.shouldIgnore(entry.name, relativePath)) {
          continue;
        }

        if (entry.isDirectory()) {
          const subDir = await this.scanDirectory(fullPath);
          result.directories.push({
            name: entry.name,
            path: relativePath,
            ...subDir,
          });
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          result.files.push({
            name: entry.name,
            path: relativePath,
          });
        }
      }

      return result;
    } catch (error) {
      logger.error(`Error scanning directory ${dir}:`, error);
      return { files: [], directories: [] };
    }
  }

  private shouldIgnore(name: string, relativePath: string): boolean {
    // Check if the name or path should be ignored
    if (name.startsWith('.') || this.ignorePaths.includes(name)) {
      return true;
    }

    // Check if the path contains any ignored directory
    return this.ignorePaths.some(ignorePath => relativePath.split(path.sep).includes(ignorePath));
  }

  private async buildNavigation(structure: DirectoryStructure): Promise<NavigationItem[]> {
    const navigation: NavigationItem[] = [];

    // Process README.md files first
    const readmeFile = structure.files.find(
      (file: FileEntry) => file.name.toLowerCase() === 'readme.md'
    );

    if (readmeFile) {
      const title = await this.extractTitle(path.join(this.sourceDir, readmeFile.path));
      navigation.push({
        title: title || this.formatName(path.dirname(readmeFile.path)),
        path: readmeFile.path,
        type: 'page',
      });
    }

    // Process other markdown files
    for (const file of structure.files) {
      if (file.name.toLowerCase() !== 'readme.md') {
        const title = await this.extractTitle(path.join(this.sourceDir, file.path));
        navigation.push({
          title: title || this.formatName(file.name.replace('.md', '')),
          path: file.path,
          type: 'page',
        });
      }
    }

    // Process subdirectories
    for (const dir of structure.directories) {
      const subNav = await this.buildNavigation(dir);

      // Only add directories that have content
      if (subNav.length > 0) {
        // Check if directory has a README.md
        const dirReadme = dir.files.find(
          (file: FileEntry) => file.name.toLowerCase() === 'readme.md'
        );

        let title = this.formatDirectoryName(dir.name);
        let path = undefined;

        if (dirReadme) {
          title =
            (await this.extractTitle(path.join(this.sourceDir, dir.path, dirReadme.name))) || title;
          path = path.join(dir.path, dirReadme.name);
        }

        navigation.push({
          title,
          path,
          type: 'section',
          children: subNav,
        });
      }
    }

    return navigation;
  }

  private async extractTitle(filePath: string): Promise<string | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const titleMatch = content.match(/^#\s+(.*)/m);
      return titleMatch ? titleMatch[1].trim() : null;
    } catch (error) {
      logger.error(`Error extracting title from ${filePath}:`, error);
      return null;
    }
  }

  private formatDirectoryName(name: string): string {
    // Convert directory names like "I._Introduction" to "I. Introduction"
    return name.replace(/_/g, ' ');
  }

  private formatName(name: string): string {
    // Convert filenames to readable titles
    return name
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
