import { ParserFactory } from './parsers/ParserFactory.js';
import { PluginManager } from './plugins/PluginManager.js';
import { MermaidPlugin } from './plugins/MermaidPlugin.js';
import { CrossReferencePlugin } from './plugins/CrossReferencePlugin.js';
import { PrismPlugin } from './plugins/PrismPlugin.js';
import { NavigationGenerator } from './navigation/NavigationGenerator.js';
import { DocsifyThemeAdapter } from './themes/DocsifyThemeAdapter.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from './utils/logger.js';
import { ParsedContent } from '../types/parser.js';

export class DocsifyIntegration {
  private parserFactory: ParserFactory;
  private pluginManager: PluginManager;
  private navigationGenerator: NavigationGenerator;
  private themeAdapter: DocsifyThemeAdapter;
  private sourceDir: string;

  constructor(sourceDir: string, theme = 'vue', ignorePaths: string[] = []) {
    this.sourceDir = sourceDir;

    // Initialize components
    this.parserFactory = new ParserFactory();
    this.pluginManager = new PluginManager();
    this.navigationGenerator = new NavigationGenerator(sourceDir, ignorePaths);
    this.themeAdapter = new DocsifyThemeAdapter(theme);

    // Register plugins
    this.registerPlugins();
  }

  private registerPlugins() {
    // Register Mermaid plugin
    this.pluginManager.register(new MermaidPlugin());

    // Register Cross-Reference plugin
    this.pluginManager.register(new CrossReferencePlugin(this.sourceDir));

    // Register Prism plugin for syntax highlighting
    this.pluginManager.register(new PrismPlugin());
  }

  async parseFile(filePath: string): Promise<ParsedContent> {
    try {
      const fileExtension = path.extname(filePath).slice(1);
      const content = await fs.readFile(filePath, 'utf-8');

      // Apply plugins before parsing
      const processedContent = await this.pluginManager.applyBeforeParse(content);

      // Parse content
      const parser = this.parserFactory.getParser(fileExtension || 'markdown');
      let parsedContent = await parser.parse(processedContent, { filePath });

      // Apply plugins after parsing
      parsedContent = await this.pluginManager.applyAfterParse(parsedContent);

      return parsedContent;
    } catch (error) {
      logger.error(`Error parsing file ${filePath}:`, error);
      throw error;
    }
  }

  async generateNavigation(): Promise<unknown> {
    return await this.navigationGenerator.generate();
  }

  getThemeStyles(): unknown {
    return this.themeAdapter.getThemeStyles();
  }

  generateThemeCSS(): string {
    return this.themeAdapter.generateThemeCSS();
  }
}
