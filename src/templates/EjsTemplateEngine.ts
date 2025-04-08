import { TemplateEngine, TemplateEngineOptions } from './TemplateEngine';
import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';
import { FileSystemError } from '../utils/errors';
import { tryCatch } from '../utils/errors';

/**
 * Interface for EJS template engine options
 */
export interface EjsTemplateEngineOptions extends TemplateEngineOptions {
  /**
   * Path to the includes directory
   */
  includesDir?: string;

  /**
   * Whether to use strict mode
   */
  strict?: boolean;

  /**
   * Whether to use async rendering
   */
  async?: boolean;

  /**
   * EJS options
   */
  ejsOptions?: ejs.Options;
}

/**
 * EJS template engine implementation
 */
export class EjsTemplateEngine extends TemplateEngine {
  protected options: EjsTemplateEngineOptions;

  constructor(options: EjsTemplateEngineOptions = {}) {
    super(options);
    this.options = {
      ...options,
      ejsOptions: {
        async: options.async || false,
        cache: options.cacheSize && options.cacheSize > 0,
        ...options.ejsOptions,
      },
    };

    // Initialize the template engine
    this.initialize();
  }

  /**
   * Initialize the template engine
   */
  private async initialize(): Promise<void> {
    // Set up includes directory if provided
    if (this.options.includesDir) {
      this.options.ejsOptions = {
        ...this.options.ejsOptions,
        views: [this.options.includesDir],
      };
    }
  }

  /**
   * Load a template from the given path
   * @param templatePath Path to the template file
   * @returns The loaded template
   */
  protected async loadTemplate(templatePath: string): Promise<string> {
    if (!templatePath || typeof templatePath !== 'string') {
      throw new Error('Template path must be a non-empty string');
    }

    // Check if the template is already cached
    if (this.templateCache.has(templatePath)) {
      const cached = this.templateCache.get(templatePath);
      if (typeof cached === 'string') {
        return cached;
      }
      throw new Error(`Invalid cached template type for ${templatePath}`);
    }

    // Read the template file
    const templateContent = await tryCatch(
      () => fs.promises.readFile(templatePath, 'utf-8'),
      (error: any) => {
        throw new FileSystemError(`Failed to read template file: ${templatePath}`, {
          path: templatePath,
          operation: 'read',
          cause: error,
        });
      }
    );

    // Cache the template if caching is enabled
    if (this.options.cacheSize && this.options.cacheSize > 0) {
      // Limit the cache size
      if (this.templateCache.size >= this.options.cacheSize) {
        // Remove the oldest entry
        const firstKey = this.templateCache.keys().next().value;
        this.templateCache.delete(firstKey);
      }

      // Add the template to the cache
      this.templateCache.set(templatePath, templateContent);
    }

    return templateContent;
  }

  /**
   * Render a template with the given data
   * @param template The template to render
   * @param data Data to render the template with
   * @returns The rendered template
   */
  protected async renderTemplate(template: string, data: Record<string, unknown>): Promise<string> {
    if (!template || typeof template !== 'string') {
      throw new Error('Template must be a non-empty string');
    }

    // Set up the EJS options
    const ejsOptions: ejs.Options = {
      ...this.options.ejsOptions,
      filename: data.filename && typeof data.filename === 'string' ? data.filename : undefined,
    };

    // Render the template
    let rendered: string;

    if (this.options.async) {
      // Use async rendering
      rendered = await ejs.render(template, data, ejsOptions);
    } else {
      // Use sync rendering
      if (!ejsOptions.filename) {
        throw new Error('Filename is required for synchronous EJS rendering');
      }
      rendered = await ejs.render(template, data, ejsOptions);
    }

    // Minify the output if enabled
    if (this.options.minify) {
      return this.minifyHtml(rendered);
    }

    return rendered;
  }

  /**
   * Minify HTML content
   * @param html HTML content to minify
   * @returns Minified HTML content
   */
  private minifyHtml(html: string): string {
    // Simple minification (just for demonstration)
    // In a real implementation, you would use a proper HTML minifier
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .replace(/\s+>/g, '>')
      .replace(/<\s+/g, '<')
      .trim();
  }
}
