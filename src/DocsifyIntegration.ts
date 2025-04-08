import { ParserFactory } from './parsers/ParserFactory';
import { PluginManager } from './plugins/PluginManager';
import { MermaidPlugin } from './plugins/MermaidPlugin';
import { CrossReferencePlugin } from './plugins/CrossReferencePlugin';
import { PrismPlugin } from './plugins/PrismPlugin';
import { NavigationGenerator } from './navigation/NavigationGenerator';
import { DocsifyThemeAdapter } from './themes/DocsifyThemeAdapter';
import * as path from 'path';

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

  async parseFile(filePath: string): Promise<any> {
    try {
      const fileExtension = path.extname(filePath).slice(1);
      const content = await require('fs').promises.readFile(filePath, 'utf-8');

      // Apply plugins before parsing
      const processedContent = await this.pluginManager.applyBeforeParse(content, filePath);

      // Parse content
      const parser = this.parserFactory.getParser(fileExtension || 'markdown');
      let parsedContent = await parser.parse(processedContent, { filePath });

      // Apply plugins after parsing
      parsedContent = await this.pluginManager.applyAfterParse(parsedContent, filePath);

      return parsedContent;
    } catch (error) {
      console.error(`Error parsing file ${filePath}:`, error);
      throw error;
    }
  }

  async generateNavigation(): Promise<any> {
    return await this.navigationGenerator.generate();
  }

  getThemeStyles(): any {
    return this.themeAdapter.getThemeStyles();
  }

  generateThemeCSS(): string {
    return this.themeAdapter.generateThemeCSS();
  }
}
