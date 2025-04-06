import { WebsiteGeneratorConfig, defaultConfig } from '../config/generator.config';
import { ParsedContent, Plugin, ComponentTemplate, BuildConfig } from '../types';
import { DocumentationParserFactory } from '../parser-implementation';
import { ComponentGenerator } from '../component-generator';
import path from 'path';
import fs from 'fs/promises';

export class WebsiteGenerator {
  private config: WebsiteGeneratorConfig;
  private parserFactory: typeof DocumentationParserFactory;
  private componentGenerator: ComponentGenerator;
  private plugins: Plugin[] = [];

  constructor(config: Partial<WebsiteGeneratorConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.parserFactory = DocumentationParserFactory;
    if (this.config.cms?.type === 'contentful' && this.config.cms.spaceId && this.config.cms.accessToken) {
      import('./CMSIntegrationModule').then(CMSIntegrationModule => {
        const cmsModule = new CMSIntegrationModule.CMSIntegrationModule(this.config.cms.spaceId || '', this.config.cms.accessToken || '');
        this.parserFactory.prototype.register('contentful', cmsModule);
      });
    }
    this.componentGenerator = new ComponentGenerator(this.config.designSystem);

private async initializePlugins(): Promise<void> {
    if (!this.config.plugins) return;

    for (const pluginConfig of this.config.plugins) {
      try {
        const plugin = await import(pluginConfig.name);
        this.plugins.push({
          ...plugin.default,
          options: pluginConfig.options,
        });
      } catch (error) {
        console.error(`Failed to load plugin ${pluginConfig.name}:`, error);
      }
    }
  }

  public async generate(): Promise<void> {
    try {
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

      console.log('Website generation completed successfully!');
    } catch (error) {
      console.error('Website generation failed:', error);
      throw error;
    }
  }

  private async parseDocumentation(): Promise<ParsedContent[]> {
    const sourceDir = path.resolve(this.config.sourceDir);
    const files = await this.getDocumentationFiles(sourceDir);
    const parsedContent: ParsedContent[] = [];

    for (const file of files) {
                                                                                                                                                                                                const content = await fs.readFile(file, 'utf-8');
      const format = path.extname(file).slice(1);

      // Apply plugins' beforeParse hooks
      let processedContent = content;
      for (const plugin of this.plugins) {
        if (plugin.hooks?.beforeParse) {
          processedContent = await plugin.hooks.beforeParse(processedContent);
        }
      }

      // Parse content
      const parser = this.parserFactory.prototype.getParser(format);
      let parsed = await parser.parse(processedContent);

      // Apply plugins' afterParse hooks
      for (const plugin of this.plugins) {
        if (plugin.hooks?.afterParse) {
          parsed = await plugin.hooks.afterParse(parsed);
        }
      }

      parsedContent.push(parsed);
    }

    return parsedContent;
  }

  private async generateComponents(parsedContent: ParsedContent[]): Promise<ComponentTemplate[]> {
    const components: ComponentTemplate[] = [];

    for (const content of parsedContent) {
      // Apply plugins' beforeGenerate hooks
      let currentComponents = await this.componentGenerator.generateComponent(content);
      
      for (const plugin of this.plugins) {
        if (plugin.hooks?.beforeGenerate) {
          currentComponents = await plugin.hooks.beforeGenerate(currentComponents);
        }
      }

      components.push(...(currentComponents as any as ComponentTemplate[]));
    }

    return components;
  }

  private async applyDesignSystem(components: ComponentTemplate[]): Promise<ComponentTemplate[]> {
    return Promise.all(components.map(async component => ({
      ...component,
      content: await this.componentGenerator.generateComponent(component.content),
    })));
  }

  private async generateTests(components: ComponentTemplate[]): Promise<void> {
    if (!this.config.testing.components.unit && 
        !this.config.testing.components.integration) {
      return;
    }

    const testGenerator = await import('./TestGenerator').then(m => new m.TestGenerator(this.config.testing));
    await testGenerator.generateTests(components);
  }

  private async build(components: ComponentTemplate[]): Promise<void> {
    const buildConfig: BuildConfig = {
      target: 'production',
      outDir: this.config.outputDir,
      optimization: this.config.build.optimization,
      assets: this.config.build.assets,
    };

    const builder = await import('./Builder').then(m => new m.Builder(buildConfig));
    await builder.build(components);
  }

  private async getDocumentationFiles(sourceDir: string): Promise<string[]> {
    const files: string[] = [];
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(sourceDir, entry.name);

      if (entry.isDirectory()) {
        files.push(...await this.getDocumentationFiles(fullPath));
      } else if (this.isDocumentationFile(entry.name)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private isDocumentationFile(filename: string): boolean {
    const ext = path.extname(filename).slice(1);
    return this.config.parser.extensions?.includes(ext) ?? false;
  }
}


