import { TemplateEngine, TemplateEngineOptions } from './TemplateEngine.js';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { FileSystemError } from '../utils/errors.js';
import { tryCatch } from '../utils/errors.js';

/**
 * Interface for Handlebars template engine options
 */
export interface HandlebarsTemplateEngineOptions extends TemplateEngineOptions {
  /**
   * Path to the partials directory
   */
  partialsDir?: string;

  /**
   * Path to the helpers directory
   */
  helpersDir?: string;

  /**
   * Whether to use strict mode
   */
  strict?: boolean;
}

/**
 * Handlebars template engine implementation
 */
export class HandlebarsTemplateEngine extends TemplateEngine {
  private handlebars: typeof Handlebars;
  protected options: HandlebarsTemplateEngineOptions;

  constructor(options: HandlebarsTemplateEngineOptions = {}) {
    super(options);
    this.options = options;
    this.handlebars = Handlebars.create();

    // Set strict mode if enabled
    if (options.strict) {
      this.handlebars.registerHelper(
        'blockHelperMissing',
        (_context: unknown, options: Handlebars.HelperOptions & { name?: string }) => {
          throw new Error(`Missing helper: ${options.name || 'unknown'}`);
        }
      );
    }

    // Initialize the template engine
    this.initialize();
  }

  /**
   * Initialize the template engine
   */
  private async initialize(): Promise<void> {
    // Register built-in helpers
    this.registerBuiltInHelpers();

    // Register custom helpers if helpersDir is provided
    if (this.options.helpersDir) {
      await this.registerHelpers(this.options.helpersDir);
    }

    // Register partials if partialsDir is provided
    if (this.options.partialsDir) {
      await this.registerPartials(this.options.partialsDir);
    }
  }

  /**
   * Register built-in helpers
   */
  private registerBuiltInHelpers(): void {
    // Format date helper
    this.handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return '';

      const d = new Date(date);

      // Simple format implementation
      switch (format) {
        case 'YYYY-MM-DD':
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
          ).padStart(2, '0')}`;
        case 'MM/DD/YYYY':
          return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(
            2,
            '0'
          )}/${d.getFullYear()}`;
        case 'DD/MM/YYYY':
          return `${String(d.getDate()).padStart(2, '0')}/
            ${String(d.getMonth() + 1).padStart(2, '0')}/
            ${d.getFullYear()}`;
        default:
          return d.toLocaleDateString();
      }
    });

    // Markdown helper
    this.handlebars.registerHelper('markdown', (content: string) => {
      if (!content) return '';

      // Simple markdown implementation (just for demonstration)
      // In a real implementation, you would use a markdown parser
      return content
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>');
    });

    // Equals helper
    this.handlebars.registerHelper(
      'eq',
      function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
        if (typeof a !== typeof b) return options.inverse(this);
        return a === b ? options.fn(this) : options.inverse(this);
      }
    );

    // Not equals helper
    this.handlebars.registerHelper(
      'neq',
      function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
        if (typeof a !== typeof b) return options.inverse(this);
        return a !== b ? options.fn(this) : options.inverse(this);
      }
    );

    // Greater than helper
    this.handlebars.registerHelper(
      'gt',
      function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
        if (typeof a !== 'number' || typeof b !== 'number') return options.inverse(this);
        return a > b ? options.fn(this) : options.inverse(this);
      }
    );

    // Less than helper
    this.handlebars.registerHelper(
      'lt',
      function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
        if (typeof a !== 'number' || typeof b !== 'number') return options.inverse(this);
        return a < b ? options.fn(this) : options.inverse(this);
      }
    );

    // JSON stringify helper
    this.handlebars.registerHelper('json', function (obj: unknown) {
      return typeof obj === 'object' && obj !== null ? JSON.stringify(obj, null, 2) : String(obj);
    });
  }

  /**
   * Register custom helpers from a directory
   * @param helpersDir Path to the helpers directory
   */
  private async registerHelpers(helpersDir: string): Promise<void> {
    await tryCatch(async () => {
      // Check if the helpers directory exists
      if (!fs.existsSync(helpersDir)) {
        throw new FileSystemError(`Helpers directory does not exist: ${helpersDir}`, {
          path: helpersDir,
          operation: 'read',
        });
      }

      // Read the helpers directory
      const files = await fs.promises.readdir(helpersDir);

      // Register each helper
      for (const file of files) {
        if (file.endsWith('.js') || file.endsWith('.ts')) {
          const helperPath = path.join(helpersDir, file);
          const helperModule = await import(helperPath);
          const helper = typeof helperModule === 'function' ? helperModule : helperModule.default;

          // Register the helper
          if (typeof helper === 'function') {
            const helperName = path.basename(file, path.extname(file));
            this.handlebars.registerHelper(helperName, (context?: unknown, ...args: unknown[]) => {
              return helper(context, ...args);
            });
          } else if (typeof helper === 'object') {
            // Register multiple helpers from a single file
            for (const [name, fn] of Object.entries(helper)) {
              if (typeof fn === 'function') {
                this.handlebars.registerHelper(name, (...args: unknown[]) => fn(...args));
              }
            }
          }
        }
      }
    });
  }

  /**
   * Register partials from a directory
   * @param partialsDir Path to the partials directory
   */
  private async registerPartials(partialsDir: string): Promise<void> {
    await tryCatch(async () => {
      // Check if the partials directory exists
      if (!fs.existsSync(partialsDir)) {
        throw new FileSystemError(`Partials directory does not exist: ${partialsDir}`, {
          path: partialsDir,
          operation: 'read',
        });
      }

      // Read the partials directory
      const files = await fs.promises.readdir(partialsDir);

      // Register each partial
      for (const file of files) {
        if (file.endsWith('.hbs') || file.endsWith('.handlebars')) {
          const partialPath = path.join(partialsDir, file);
          const partialName = path.basename(file, path.extname(file));

          // Read the partial content
          const partialContent = await fs.promises.readFile(partialPath, 'utf8');

          // Register the partial
          this.handlebars.registerPartial(partialName, partialContent);
        }
      }
    });
  }

  /**
   * Load a template from the given path
   * @param templatePath Path to the template file
   * @returns The loaded template
   */
  protected async loadTemplate(templatePath: string): Promise<Handlebars.TemplateDelegate> {
    // Check if the template is already cached
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath) as Handlebars.TemplateDelegate;
    }

    // Read the template file
    if (!templatePath) throw new Error('Template path is required');
    if (!templatePath) throw new Error('Template path is required');
    const templateContent = await tryCatch(
      () => fs.promises.readFile(templatePath, 'utf8'),
      (error: unknown) => {
        throw new FileSystemError(`Failed to read template file: ${templatePath}`, {
          path: templatePath,
          operation: 'read',
          cause: error instanceof Error ? error : new Error(String(error)),
        });
      }
    );

    // Compile the template
    const template = this.handlebars.compile(templateContent, {
      strict: this.options.strict,
    });

    // Cache the template if caching is enabled
    if (this.options.cacheSize && this.options.cacheSize > 0) {
      // Limit the cache size
      if (this.templateCache.size >= this.options.cacheSize) {
        // Remove the oldest entry
        const firstKey = this.templateCache.keys().next().value;
        if (firstKey) {
          this.templateCache.delete(firstKey);
        }
      }

      // Add the template to the cache
      this.templateCache.set(templatePath, template);
    }

    return template;
  }

  /**
   * Render a template with the given data
   * @param template The template to render
   * @param data Data to render the template with
   * @returns The rendered template
   */
  protected async renderTemplate(
    template: Handlebars.TemplateDelegate,
    data: Record<string, unknown>
  ): Promise<string> {
    // Render the template
    const rendered = template(data);

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
