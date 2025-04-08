import { ParsedContent } from '../../types/parser.js';
import { DesignSystem } from '../../types/design.js';
import { PerformanceMonitor } from '../utils/performance.js';
import { TemplateError } from '../utils/errors.js';

/**
 * Interface for template engine options
 */
export interface TemplateEngineOptions {
  /**
   * The cache size for templates
   */
  cacheSize?: number;

  /**
   * Whether to minify the output
   */
  minify?: boolean;

  /**
   * Additional options specific to the template engine
   */
  [key: string]: unknown;
}

/**
 * Abstract class for template engines
 */
export abstract class TemplateEngine {
  protected options: TemplateEngineOptions;
  protected templateCache: Map<string, unknown>;

  constructor(options: TemplateEngineOptions = {}) {
    this.options = {
      cacheSize: 100,
      minify: false,
      ...options,
    };
    this.templateCache = new Map();
  }

  /**
   * Render a template with the given data
   * @param templatePath Path to the template file
   * @param data Data to render the template with
   * @returns The rendered template
   */
  @PerformanceMonitor.createMethodDecorator()
  async render(templatePath: string, data: Record<string, unknown>): Promise<string> {
    try {
      // Load the template
      const template = await this.loadTemplate(templatePath);

      // Render the template
      return await this.renderTemplate(template, data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new TemplateError(`Failed to render template ${templatePath}: ${errorMessage}`, {
        templatePath,
      });
    }
  }

  /**
   * Render content with the given template
   * @param content The parsed content to render
   * @param templatePath Path to the template file
   * @param designSystem Optional design system to apply
   * @returns The rendered content
   */
  @PerformanceMonitor.createMethodDecorator()
  async renderContent(
    content: ParsedContent,
    templatePath: string,
    designSystem?: DesignSystem
  ): Promise<string> {
    // Prepare the data for the template
    const data = {
      content,
      designSystem,
      meta: content.metadata || {},
      title: content.title,
      description: content.description,
      sections: content.sections || [],
      assets: content.assets || [],
      references: content.references || [],
    };

    // Render the template
    return await this.render(templatePath, data);
  }

  /**
   * Clear the template cache
   */
  clearCache(): void {
    this.templateCache.clear();
  }

  /**
   * Load a template from the given path
   * @param templatePath Path to the template file
   * @returns The loaded template
   */
  protected abstract loadTemplate(templatePath: string): Promise<unknown>;

  /**
   * Render a template with the given data
   * @param template The template to render
   * @param data Data to render the template with
   * @returns The rendered template
   */
  protected abstract renderTemplate(
    template: unknown,
    data: Record<string, unknown>
  ): Promise<string>;
}
