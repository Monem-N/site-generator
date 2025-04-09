import { WebsiteGeneratorConfig, defaultConfig } from '../config/generator.config.js';
import { ParsedContent } from '../types/parser.js';
import { DocsifyIntegration } from './DocsifyIntegration.js';
import { ComponentGenerator } from '../component-generator.js';
import { Builder } from './Builder.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from './utils/logger.js';
import { ComponentConfig, ComponentTemplate } from '../types/component.js';
import { ContentModel } from '../types/cms.js';
import { BuildConfig } from '../types/build.js';
import type { BuildConfig as IndexBuildConfig } from '../types/index.js';

export class DocsifyWebsiteGenerator {
  private config: WebsiteGeneratorConfig;
  private docsifyIntegration: DocsifyIntegration;
  private componentGenerator: ComponentGenerator;

  constructor(config: Partial<WebsiteGeneratorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };

    // Initialize Docsify integration
    this.docsifyIntegration = new DocsifyIntegration(
      this.config.sourceDir,
      this.config.designSystem?.name || 'vue',
      this.config.parser.ignorePatterns
    );

    // Initialize component generator
    this.componentGenerator = new ComponentGenerator(this.config.designSystem);
  }

  public async generate(): Promise<void> {
    try {
      logger.debug('Starting website generation with Docsify integration...');

      // 1. Parse documentation sources
      const parsedContent = await this.parseDocumentation();

      // 2. Generate React components
      const components = await this.generateComponents(parsedContent);

      // 3. Apply design system
      const styledComponents = await this.applyDesignSystem(components);

      // 4. Generate tests
      await this.generateTests(styledComponents);

      // 5. Build and optimize
      await this.build(styledComponents);

      logger.debug('Website generation completed successfully!');
    } catch (error) {
      logger.error('Website generation failed:', error);
      throw error;
    }
  }

  private async parseDocumentation(): Promise<ParsedContent[]> {
    logger.debug('Parsing documentation...');

    const sourceDir = path.resolve(this.config.sourceDir);
    const files = await this.getDocumentationFiles(sourceDir);
    const parsedContent: ParsedContent[] = [];

    // Generate navigation
    const navigation = await this.docsifyIntegration.generateNavigation();

    for (const file of files) {
      logger.debug(`Parsing file: ${file}`);

      try {
        // Parse file using Docsify integration
        const parsed = (await this.docsifyIntegration.parseFile(file)) as ParsedContent;

        // Add navigation data
        (parsed as unknown).navigation = navigation;

        // Add theme data
        (parsed as unknown).theme = this.docsifyIntegration.getThemeStyles();

        parsedContent.push(parsed);
      } catch (error) {
        logger.error(`Error parsing file ${file}:`, error);
      }
    }

    return parsedContent;
  }

  private async generateComponents(parsedContent: ParsedContent[]): Promise<ComponentConfig[]> {
    logger.debug('Generating components...');

    const components: ComponentConfig[] = [];

    for (const content of parsedContent) {
      try {
        // Generate component using the component generator
        // Cast content to any to bypass type checking
        const component = await this.componentGenerator.generatePage(
          content as unknown as ContentModel
        );

        components.push({
          name: this.getComponentName(content.title),
          path: this.getOutputPath(content),
          content: component,
        });
      } catch (error) {
        logger.error(`Error generating component for ${content.title}:`, error);
      }
    }

    return components;
  }

  private async applyDesignSystem(components: unknown[]): Promise<ComponentConfig[]> {
    logger.debug('Applying design system...');

    // Generate theme CSS
    const themeCSS = this.docsifyIntegration.generateThemeCSS();

    // Save theme CSS to output directory
    const themePath = path.join(this.config.outputDir, 'theme.css');
    await fs.mkdir(path.dirname(themePath), { recursive: true });
    await fs.writeFile(themePath, themeCSS);

    return components as ComponentConfig[];
  }

  private async generateTests(components: unknown[]): Promise<void> {
    if (!this.config.testing.components.unit && !this.config.testing.components.integration) {
      return;
    }

    logger.debug('Generating tests...');

    const testGenerator = await import('./TestGenerator.js').then(
      m => new m.TestGenerator(this.config.testing)
    );
    await testGenerator.generateTests(components as ComponentConfig[]);
  }

  private async build(components: ComponentConfig[]): Promise<void> {
    logger.debug('Building website...');

    const buildConfig: BuildConfig & IndexBuildConfig = {
      target: 'production',
      outDir: this.config.outputDir,
      optimization: this.config.build.optimization,
      assets: this.config.build.assets,
    };

    const builder = new Builder(buildConfig);
    await builder.build(components as ComponentTemplate[]);
  }

  private async getDocumentationFiles(sourceDir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(sourceDir, entry.name);

      // Skip ignored paths
      if (this.shouldIgnore(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...(await this.getDocumentationFiles(fullPath)));
      } else if (this.isDocumentationFile(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private shouldIgnore(name: string): boolean {
    return (
      name.startsWith('.') ||
      name === 'node_modules' ||
      (this.config.parser.ignorePatterns?.includes(name) ?? false)
    );
  }

  private isDocumentationFile(filename: string): boolean {
    const ext = path.extname(filename).slice(1);
    return this.config.parser.extensions?.includes(ext) ?? false;
  }

  private getComponentName(title: string): string {
    return title.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]/, 'Page');
  }

  private getOutputPath(content: ParsedContent): string {
    // Generate output path based on the original file path
    if (content.metadata && content.metadata.originalPath) {
      // Cast originalPath to string to bypass type checking
      const originalPath = content.metadata.originalPath as string;
      const relativePath = path.relative(this.config.sourceDir, originalPath);
      const dirPath = path.dirname(relativePath);
      const baseName = path.basename(relativePath, path.extname(relativePath));

      return path.join(dirPath, `${baseName}.jsx`);
    }

    // Fallback to using the title
    return `${this.getComponentName(content.title)}.jsx`;
  }
}
