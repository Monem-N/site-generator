import { TemplateEngine, TemplateEngineOptions } from './TemplateEngine.js';
import {
  HandlebarsTemplateEngine,
  HandlebarsTemplateEngineOptions,
} from './HandlebarsTemplateEngine.js';
import { EjsTemplateEngine, EjsTemplateEngineOptions } from './EjsTemplateEngine.js';
import { ParsedContent } from '../../types/parser.js';
import { DesignSystem } from '../../types/design.js';
import * as path from 'path';
import { TemplateError } from '../utils/errors.js';

/**
 * Type of template engine
 */
export type TemplateEngineType = 'handlebars' | 'ejs' | 'custom';

/**
 * Interface for template manager options
 */
export interface TemplateManagerOptions {
  /**
   * The default template engine to use
   */
  defaultEngine?: TemplateEngineType;

  /**
   * Options for the Handlebars template engine
   */
  handlebarsOptions?: HandlebarsTemplateEngineOptions;

  /**
   * Options for the EJS template engine
   */
  ejsOptions?: EjsTemplateEngineOptions;

  /**
   * Custom template engines
   */
  customEngines?: Record<string, TemplateEngine>;
}

/**
 * Template manager for handling different template engines
 */
export class TemplateManager {
  private engines: Map<string, TemplateEngine>;
  private defaultEngine: TemplateEngineType;

  constructor(options: TemplateManagerOptions = {}) {
    this.engines = new Map();
    this.defaultEngine = options.defaultEngine || 'handlebars';

    // Initialize the template engines
    this.initializeEngines(options);
  }

  /**
   * Initialize the template engines
   * @param options Template manager options
   */
  private initializeEngines(options: TemplateManagerOptions): void {
    // Initialize the Handlebars template engine
    const handlebarsEngine = new HandlebarsTemplateEngine(options.handlebarsOptions);
    this.engines.set('handlebars', handlebarsEngine);
    this.engines.set('hbs', handlebarsEngine);

    // Initialize the EJS template engine
    this.engines.set('ejs', new EjsTemplateEngine(options.ejsOptions));

    // Initialize custom template engines
    if (options.customEngines) {
      for (const [name, engine] of Object.entries(options.customEngines)) {
        this.engines.set(name, engine);
      }
    }
  }

  /**
   * Register a custom template engine
   * @param name Name of the template engine
   * @param engine The template engine instance
   */
  registerEngine(name: string, engine: TemplateEngine): void {
    this.engines.set(name, engine);
  }

  /**
   * Get a template engine by name
   * @param name Name of the template engine
   * @returns The template engine instance
   */
  getEngine(name?: string): TemplateEngine {
    // If no name is provided, use the default engine
    const engineName = name || this.defaultEngine;

    // Get the template engine
    const engine = this.engines.get(engineName);
    if (!engine) {
      throw new TemplateError(`Template engine not found: ${engineName}`);
    }

    return engine;
  }

  /**
   * Render a template with the given data
   * @param templatePath Path to the template file
   * @param data Data to render the template with
   * @param engineName Optional name of the template engine to use
   * @returns The rendered template
   */
  async render(
    templatePath: string,
    data: Record<string, unknown>,
    engineName?: string
  ): Promise<string> {
    // If no engine name is provided, infer it from the template file extension
    const inferredEngineName = engineName || this.inferEngineFromPath(templatePath);

    // Get the template engine
    const engine = this.getEngine(inferredEngineName);

    // Render the template
    return await engine.render(templatePath, data);
  }

  /**
   * Render content with the given template
   * @param content The parsed content to render
   * @param templatePath Path to the template file
   * @param designSystem Optional design system to apply
   * @param engineName Optional name of the template engine to use
   * @returns The rendered content
   */
  async renderContent(
    content: ParsedContent,
    templatePath: string,
    designSystem?: DesignSystem,
    engineName?: string
  ): Promise<string> {
    // If no engine name is provided, infer it from the template file extension
    const inferredEngineName = engineName || this.inferEngineFromPath(templatePath);

    // Get the template engine
    const engine = this.getEngine(inferredEngineName);

    // Render the content
    return await engine.renderContent(content, templatePath, designSystem);
  }

  /**
   * Clear the template cache for all engines
   */
  clearCache(): void {
    for (const engine of this.engines.values()) {
      engine.clearCache();
    }
  }

  /**
   * Infer the template engine from the template file path
   * @param templatePath Path to the template file
   * @returns The inferred template engine name
   */
  private inferEngineFromPath(templatePath: string): string {
    const extension = path.extname(templatePath).toLowerCase();

    switch (extension) {
      case '.hbs':
      case '.handlebars':
        return 'handlebars';
      case '.ejs':
        return 'ejs';
      default:
        return this.defaultEngine;
    }
  }
}
