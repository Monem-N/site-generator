import { WebsiteGeneratorConfig, defaultConfig } from '../config/generator.config';
import { ParsedContent, Plugin, ComponentTemplate, BuildConfig, DesignSystem } from '../types';
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
    if (
      this.config.cms?.type === 'contentful' &&
      this.config.cms?.spaceId &&
      this.config.cms?.accessToken
    ) {
      import('./CMSIntegrationModule').then(CMSIntegrationModule => {
        const cmsModule = new CMSIntegrationModule.CMSIntegrationModule(
          this.config.cms?.spaceId as string,
          this.config.cms?.accessToken as string
        );
        this.parserFactory.prototype.register('contentful', cmsModule);
      });
    }
    // Convert designSystem config to DesignSystem interface implementation
    const designSystem: DesignSystem = {
      type: this.config.designSystem.type,
      importPath: this.config.designSystem.importPath,
      classNames: this.config.designSystem.styles.components || {},
      pageComponents: Object.keys(this.config.designSystem.components || {}),
      getConfigForType: (elementType: string) => ({
        classMapping: this.config.designSystem.styles.components?.[elementType] || {},
        components: Object.keys(this.config.designSystem.components || {}),
      }),
    };
    this.componentGenerator = new ComponentGenerator(designSystem);
  }

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
        // Use a logger instead of console.error
        if (this.config.logging?.enabled !== false) {
          // eslint-disable-next-line no-console
          console.error(`Failed to load plugin ${pluginConfig.name}:`, error);
        }
      }
    }
  }

  public async generate(): Promise<void> {
    try {
      // Initialize plugins
      await this.initializePlugins();

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

      // Use a logger instead of console.log
      if (this.config.logging?.enabled !== false) {
        // eslint-disable-next-line no-console
        console.log('Website generation completed successfully!');
      }
    } catch (error) {
      // Use a logger instead of console.error
      if (this.config.logging?.enabled !== false) {
        // eslint-disable-next-line no-console
        console.error('Website generation failed:', error);
      }
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
      const currentComponent = await this.componentGenerator.generateComponent(content);

      // Convert string to ComponentTemplate if needed
      let currentComponents: ComponentTemplate | ComponentTemplate[] = {
        name: `component-${components.length}`,
        path: `/${content.type || 'component'}`,
        content: currentComponent,
      };

      for (const plugin of this.plugins) {
        if (plugin.hooks?.beforeGenerate) {
          // Ensure we always pass an array to the plugin hooks
          const componentsArray = Array.isArray(currentComponents)
            ? currentComponents
            : [currentComponents];
          const result = await plugin.hooks.beforeGenerate(componentsArray);
          currentComponents = result;
        }
      }

      if (Array.isArray(currentComponents)) {
        components.push(...currentComponents);
      } else {
        components.push(currentComponents);
      }
    }

    return components;
  }

  private async applyDesignSystem(components: ComponentTemplate[]): Promise<ComponentTemplate[]> {
    return Promise.all(
      components.map(async component => {
        // If the content is already processed, just return the component
        if (typeof component.content !== 'string') {
          return component;
        }
        // Convert string content to an object with type property for the component generator
        const contentObj = { type: 'content', value: component.content };
        const generatedContent = await this.componentGenerator.generateComponent(contentObj);

        return {
          ...component,
          content: generatedContent,
        };
      })
    );
  }

  private async generateTests(components: ComponentTemplate[]): Promise<void> {
    if (!this.config.testing.components.unit && !this.config.testing.components.integration) {
      return;
    }

    const testGenerator = await import('./TestGenerator').then(
      m => new m.TestGenerator(this.config.testing)
    );
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
        files.push(...(await this.getDocumentationFiles(fullPath)));
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
