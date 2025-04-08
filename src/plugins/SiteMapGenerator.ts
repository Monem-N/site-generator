import { Plugin } from '../../types/plugin.js';
import { ParsedContent } from '../../types/parser.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Plugin options for SiteMapGenerator
 */
export interface SiteMapGeneratorOptions {
  /**
   * The base URL of the website
   */
  baseUrl: string;

  /**
   * The output path for the sitemap.xml file
   */
  outputPath?: string;

  /**
   * The default change frequency for pages
   */
  defaultChangeFreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

  /**
   * The default priority for pages (0.0 to 1.0)
   */
  defaultPriority?: number;

  /**
   * Whether to include the lastmod attribute
   */
  includeLastMod?: boolean;

  /**
   * Paths to exclude from the sitemap
   */
  exclude?: string[];
}

/**
 * A plugin that generates a sitemap.xml file
 */
export class SiteMapGenerator implements Plugin {
  name = 'sitemap-generator';
  description = 'Generates a sitemap.xml file for the website';

  public options: SiteMapGeneratorOptions;
  private urls: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
  }> = [];

  constructor(options: SiteMapGeneratorOptions) {
    this.options = {
      outputPath: 'sitemap.xml',
      defaultChangeFreq: 'weekly',
      defaultPriority: 0.5,
      includeLastMod: true,
      exclude: [],
      ...options,
    };

    // Ensure baseUrl ends with a slash
    if (!this.options.baseUrl.endsWith('/')) {
      this.options.baseUrl += '/';
    }
  }

  hooks = {
    /**
     * After parsing, collect URL information
     */
    afterParse: (parsedContent: ParsedContent): ParsedContent => {
      // Skip if no metadata or originalPath
      if (!parsedContent.metadata || !parsedContent.metadata.originalPath) {
        return parsedContent;
      }

      const originalPath = parsedContent.metadata.originalPath as string;

      // Skip excluded paths
      if (this.shouldExcludePath(originalPath)) {
        return parsedContent;
      }

      // Get the URL path
      const urlPath = this.getUrlPath(originalPath);

      // Add the URL to the list
      this.urls.push({
        loc: `${this.options.baseUrl}${urlPath}`,
        lastmod: this.options.includeLastMod ? this.getLastMod(parsedContent) : undefined,
        changefreq: this.getChangeFreq(parsedContent),
        priority: this.getPriority(parsedContent),
      });

      return parsedContent;
    },

    /**
     * After build, generate the sitemap.xml file
     */
    afterBuild: async (): Promise<void> => {
      // Generate the sitemap XML
      const xml = this.generateSitemapXml();

      // Write the sitemap.xml file
      const outputPath = path.join(process.cwd(), this.options.outputPath || 'sitemap.xml');
      await fs.promises.writeFile(outputPath, xml, 'utf-8');

      // Reset the URLs list
      this.urls = [];
    },
  };

  /**
   * Check if a path should be excluded from the sitemap
   */
  private shouldExcludePath(filePath: string): boolean {
    if (!this.options.exclude || this.options.exclude.length === 0) {
      return false;
    }

    return this.options.exclude.some(pattern => {
      if (pattern.includes('*')) {
        // Convert glob pattern to regex
        const regex = new RegExp(`^${pattern.replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
        return regex.test(filePath);
      }
      return filePath === pattern || filePath.includes(pattern);
    });
  }

  /**
   * Get the URL path from the original file path
   */
  private getUrlPath(filePath: string): string {
    // Remove file extension
    let urlPath = filePath.replace(/\.\w+$/, '');

    // Convert index files to directory paths
    if (urlPath.endsWith('index')) {
      urlPath = urlPath.replace(/index$/, '');
    }

    // Ensure the path starts with a slash
    if (!urlPath.startsWith('/')) {
      urlPath = `/${urlPath}`;
    }

    // Ensure the path ends with a slash if it's not the root
    if (urlPath !== '/' && !urlPath.endsWith('/')) {
      urlPath += '/';
    }

    return urlPath;
  }

  /**
   * Get the last modified date from the parsed content
   */
  private getLastMod(parsedContent: ParsedContent): string {
    // Use the lastModified metadata if available
    if (parsedContent.metadata && parsedContent.metadata.lastModified) {
      const lastModified = parsedContent.metadata.lastModified;

      if (typeof lastModified === 'number') {
        return new Date(lastModified).toISOString().split('T')[0];
      }

      if (lastModified instanceof Date) {
        return lastModified.toISOString().split('T')[0];
      }

      if (typeof lastModified === 'string') {
        return new Date(lastModified).toISOString().split('T')[0];
      }
    }

    // Use the current date as a fallback
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get the change frequency from the parsed content
   */
  private getChangeFreq(parsedContent: ParsedContent): string | undefined {
    // Use the changefreq metadata if available
    if (
      parsedContent.metadata &&
      parsedContent.metadata.changefreq &&
      typeof parsedContent.metadata.changefreq === 'string'
    ) {
      return parsedContent.metadata.changefreq as string;
    }

    // Use the default change frequency
    return this.options.defaultChangeFreq;
  }

  /**
   * Get the priority from the parsed content
   */
  private getPriority(parsedContent: ParsedContent): number | undefined {
    // Use the priority metadata if available
    if (
      parsedContent.metadata &&
      parsedContent.metadata.priority &&
      typeof parsedContent.metadata.priority === 'number'
    ) {
      return parsedContent.metadata.priority as number;
    }

    // Use the default priority
    return this.options.defaultPriority;
  }

  /**
   * Generate the sitemap XML
   */
  private generateSitemapXml(): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add URLs
    for (const url of this.urls) {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;

      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }

      if (url.changefreq) {
        xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      }

      if (url.priority !== undefined) {
        xml += `    <priority>${url.priority.toFixed(1)}</priority>\n`;
      }

      xml += '  </url>\n';
    }

    xml += '</urlset>';
    return xml;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
