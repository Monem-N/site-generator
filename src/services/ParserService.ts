import { BaseService } from './BaseService.js';
import { ContentCache, CacheOptions } from '../utils/cache.js';
import { ParserError } from '../utils/errors.js';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Parser service configuration
 */
export interface ParserServiceConfig {
  extensions: string[];
  ignorePatterns: string[];
  plugins?: string[];
  caching?: CacheOptions;
}

/**
 * Parser result
 */
export interface ParseResult {
  content: Record<string, unknown>;
  metadata: {
    filePath: string;
    lastModified: number;
    size: number;
  };
}

/**
 * Parser service for parsing documentation files
 */
export class ParserService extends BaseService {
  private config: ParserServiceConfig;
  private cache: ContentCache<ParseResult>;
  private parsers: Map<string, (content: string, filePath: string) => Record<string, unknown>>;

  constructor(config: ParserServiceConfig) {
    super('parser-service');

    // Create config with defaults that will be overridden by any values in config
    this.config = {
      ...{
        extensions: ['md', 'markdown'],
        ignorePatterns: ['node_modules', '.git'],
      },
      ...config,
    };

    this.parsers = new Map();

    // Initialize cache
    this.cache = new ContentCache<ParseResult>(
      this.config.caching || {
        enabled: true,
        storageType: 'memory',
      }
    );
  }

  /**
   * Start the parser service
   */
  protected async doStart(): Promise<void> {
    // Register default parsers
    this.registerParser('md', this.parseMarkdown.bind(this));
    this.registerParser('markdown', this.parseMarkdown.bind(this));

    // Load plugins if specified
    if (this.config.plugins && this.config.plugins.length > 0) {
      for (const plugin of this.config.plugins) {
        try {
          // In a real implementation, this would dynamically load plugins
          logger.debug(`Loading plugin: ${plugin}`);
        } catch (error) {
          throw new ParserError(`Failed to load plugin: ${plugin}`, {
            plugin,
            error,
          });
        }
      }
    }

    this.setMetric('parsers', this.parsers.size);
  }

  /**
   * Stop the parser service
   */
  protected async doStop(): Promise<void> {
    // Clean up resources
    this.parsers.clear();
  }

  /**
   * Register a parser for a file extension
   */
  registerParser(
    extension: string,
    parser: (content: string, filePath: string) => Record<string, unknown>
  ): void {
    this.parsers.set(extension.toLowerCase(), parser);
    this.setMetric('parsers', this.parsers.size);
  }

  /**
   * Parse a file
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    if (!this.isRunning()) {
      throw new ParserError('Parser service is not running', {
        filePath,
        status: this.getStatus(),
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new ParserError(`File not found: ${filePath}`, {
        filePath,
      });
    }

    // Get file stats
    const stats = fs.statSync(filePath);

    // Check if it's a directory
    if (stats.isDirectory()) {
      throw new ParserError(`Cannot parse a directory: ${filePath}`, {
        filePath,
      });
    }

    // Check if the file is in the ignore patterns
    for (const pattern of this.config.ignorePatterns) {
      if (filePath.includes(pattern)) {
        throw new ParserError(`File is in ignore pattern: ${filePath}`, {
          filePath,
          pattern,
        });
      }
    }

    // Get file extension
    const extension = path.extname(filePath).slice(1).toLowerCase();

    // Check if we have a parser for this extension
    if (!this.parsers.has(extension)) {
      throw new ParserError(`No parser registered for extension: ${extension}`, {
        filePath,
        extension,
      });
    }

    // Check cache first
    const cacheKey = `${filePath}:${stats.mtimeMs}`;
    const cachedResult = this.cache.get(cacheKey);

    if (cachedResult) {
      this.incrementMetric('cache_hits');
      return cachedResult;
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse the content
    const parser = this.parsers.get(extension);

    if (!parser) {
      throw new ParserError(`No parser found for extension: ${extension}`, { filePath });
    }

    try {
      const parsedContent = parser(content, filePath);

      const result: ParseResult = {
        content: parsedContent,
        metadata: {
          filePath,
          lastModified: stats.mtimeMs,
          size: stats.size,
        },
      };

      // Cache the result
      this.cache.set(cacheKey, result);

      this.incrementMetric('files_parsed');
      this.incrementMetric('cache_misses');

      return result;
    } catch (error) {
      throw new ParserError(`Failed to parse file: ${filePath}`, {
        filePath,
        extension,
        error,
      });
    }
  }

  /**
   * Parse a directory recursively
   */
  async parseDirectory(dirPath: string): Promise<ParseResult[]> {
    if (!this.isRunning()) {
      throw new ParserError('Parser service is not running', {
        dirPath,
        status: this.getStatus(),
      });
    }

    // Check if directory exists
    if (!fs.existsSync(dirPath)) {
      throw new ParserError(`Directory not found: ${dirPath}`, {
        dirPath,
      });
    }

    // Check if it's a directory
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      throw new ParserError(`Not a directory: ${dirPath}`, {
        dirPath,
      });
    }

    const results: ParseResult[] = [];

    // Read directory contents
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileStats = fs.statSync(filePath);

      // Skip ignored patterns
      let ignored = false;
      for (const pattern of this.config.ignorePatterns) {
        if (filePath.includes(pattern)) {
          ignored = true;
          break;
        }
      }

      if (ignored) {
        continue;
      }

      if (fileStats.isDirectory()) {
        // Recursively parse subdirectory
        const subResults = await this.parseDirectory(filePath);
        results.push(...subResults);
      } else {
        // Get file extension
        const extension = path.extname(file).slice(1).toLowerCase();

        // Check if we have a parser for this extension
        if (this.parsers.has(extension)) {
          try {
            const result = await this.parseFile(filePath);
            results.push(result);
          } catch (error) {
            // Log error but continue with other files
            logger.error(`Error parsing file ${filePath}:`, error);
          }
        }
      }
    }

    this.incrementMetric('directories_parsed');

    return results;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<Record<string, unknown>> {
    const stats = await this.cache.getStats();
    return stats as unknown as Record<string, unknown>;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
    this.setMetric('cache_hits', 0);
    this.setMetric('cache_misses', 0);
  }

  /**
   * Parse Markdown content
   * This is a simple implementation - in a real app, you'd use a proper Markdown parser
   */
  private parseMarkdown(content: string, filePath: string): Record<string, unknown> {
    // Extract front matter if present
    let metadata = {};
    let mainContent = content;

    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

    if (frontMatterMatch) {
      try {
        metadata = JSON.parse(`{${frontMatterMatch[1]}}`);
        mainContent = frontMatterMatch[2];
      } catch (error) {
        // If parsing fails, assume no front matter
      }
    }

    // Extract title from first heading
    const titleMatch = mainContent.match(/^#\s+(.*)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(filePath, path.extname(filePath));

    // Extract sections
    const sections = [];
    const sectionMatches = mainContent.matchAll(/^(#{2,6})\s+(.*)$/gm);

    for (const match of sectionMatches) {
      sections.push({
        level: match[1].length,
        title: match[2],
      });
    }

    return {
      title,
      metadata,
      content: mainContent,
      sections,
    };
  }
}
