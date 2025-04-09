import { WebsiteGeneratorConfig, defaultConfig } from '../config/generator.config.js';
import { ParsedContent } from '../types/parser.js';
import { DocsifyIntegration } from './DocsifyIntegration.js';
import { ComponentGenerator } from '../component-generator.js';
import { Builder } from './Builder.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from './utils/logger.js';
import { ComponentConfig, ComponentTemplate } from '../types/component.js';
import { BuildConfig } from '../types/build.js';
import type { BuildConfig as IndexBuildConfig } from '../types/index.js';

// Enhance ParsedContent to include navigation and theme properties
interface EnhancedParsedContent extends Omit<ParsedContent, 'metadata'> {
  navigation: { items: Array<{ title: string; path: string }> };
  theme: { styles: Record<string, string> };
  metadata?: {
    originalPath?: string;
    [key: string]: unknown;
  };
}

// Enhance ComponentConfig to include id, path, and metadata
interface EnhancedComponentConfig extends ComponentConfig {
  id: string;
  path: string;
  metadata: {
    navigation?: { items: Array<{ title: string; path: string }> };
    theme?: { styles: Record<string, string> };
    originalPath?: string;
    [key: string]: unknown;
  };
}

// Type definition for the component generator output
interface GeneratedComponent {
  id: string;
  name: string;
  content: string;
  path: string;
}

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

  private async parseDocumentation(): Promise<EnhancedParsedContent[]> {
    logger.debug('Parsing documentation...');

    const sourceDir = path.resolve(this.config.sourceDir);
    const files = await this.getDocumentationFiles(sourceDir);
    const parsedContent: EnhancedParsedContent[] = [];

    // Generate navigation
    const navigation = await this.docsifyIntegration.generateNavigation();

    for (const file of files) {
      logger.debug(`Parsing file: ${file}`);

      try {
        // Cast to EnhancedParsedContent to add navigation and theme
        const parsed = (await this.docsifyIntegration.parseFile(file)) as EnhancedParsedContent;

        // Add navigation and theme data
        parsed.navigation = navigation as { items: Array<{ title: string; path: string }> };
        parsed.theme = this.docsifyIntegration.getThemeStyles() as {
          styles: Record<string, string>;
        };

        parsedContent.push(parsed);
      } catch (error) {
        logger.error(`Error parsing file ${file}:`, error);
      }
    }

    return parsedContent;
  }

  private async generateComponents(
    parsedContent: EnhancedParsedContent[]
  ): Promise<EnhancedComponentConfig[]> {
    return Promise.all(
      parsedContent.map(async content => {
        const generatedComponent = (await this.componentGenerator.generateComponent(
          content
        )) as unknown as GeneratedComponent;

        const component: EnhancedComponentConfig = {
          id: generatedComponent.id,
          name: generatedComponent.name,
          content: generatedComponent.content,
          path: generatedComponent.path,
          metadata: {
            navigation: content.navigation,
            theme: content.theme,
            originalPath: content.metadata?.originalPath,
          },
        };
        return component;
      })
    );
  }

  private async applyDesignSystem(
    components: EnhancedComponentConfig[]
  ): Promise<EnhancedComponentConfig[]> {
    logger.debug('Applying design system...');

    const themeCSS = this.docsifyIntegration.generateThemeCSS();
    const themePath = path.join(this.config.outputDir, 'theme.css');
    await fs.mkdir(path.dirname(themePath), { recursive: true });
    await fs.writeFile(themePath, themeCSS);

    return Promise.all(
      components.map(async component => ({
        ...component,
        metadata: {
          ...component.metadata,
          theme:
            component.metadata.theme ||
            (this.docsifyIntegration.getThemeStyles() as { styles: Record<string, string> }),
          navigation:
            component.metadata.navigation ||
            ((await this.docsifyIntegration.generateNavigation()) as {
              items: Array<{ title: string; path: string }>;
            }),
        },
      }))
    );
  }

  private async generateTests(components: EnhancedComponentConfig[]): Promise<void> {
    if (!this.config.testing.components.unit && !this.config.testing.components.integration) {
      return;
    }

    logger.debug('Generating tests...');

    const testGenerator = await import('./TestGenerator.js').then(
      m => new m.TestGenerator(this.config.testing)
    );
    await testGenerator.generateTests(components);
  }

  private async build(components: EnhancedComponentConfig[]): Promise<void> {
    logger.debug('Building website...');

    const buildConfig: BuildConfig & IndexBuildConfig = {
      target: 'production',
      outDir: this.config.outputDir,
      optimization: this.config.build.optimization,
      assets: this.config.build.assets,
    };

    const builder = new Builder(buildConfig);
    await builder.build(components as unknown as ComponentTemplate[]);
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

  private getOutputPath(content: EnhancedParsedContent): string {
    // Generate output path based on the original file path
    if (content.metadata && content.metadata.originalPath) {
      const originalPath = content.metadata.originalPath;
      const relativePath = path.relative(this.config.sourceDir, originalPath);
      const dirPath = path.dirname(relativePath);
      const baseName = path.basename(relativePath, path.extname(relativePath));

      return path.join(dirPath, `${baseName}.jsx`);
    }

    // Fallback to using the title
    return `${this.getComponentName(content.title)}.jsx`;
  }
}
