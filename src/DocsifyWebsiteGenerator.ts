import { WebsiteGeneratorConfig, defaultConfig } from '../config/generator.config';
import { ParsedContent } from '../types/parser';
import { DocsifyIntegration } from './DocsifyIntegration';
import { ComponentGenerator } from '../component-generator';
import { Builder } from './Builder';
import * as path from 'path';
import * as fs from 'fs/promises';

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
      console.log('Starting website generation with Docsify integration...');

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
    console.log('Parsing documentation...');

    const sourceDir = path.resolve(this.config.sourceDir);
    const files = await this.getDocumentationFiles(sourceDir);
    const parsedContent: ParsedContent[] = [];

    // Generate navigation
    const navigation = await this.docsifyIntegration.generateNavigation();

    for (const file of files) {
      console.log(`Parsing file: ${file}`);

      try {
        // Parse file using Docsify integration
        const parsed = await this.docsifyIntegration.parseFile(file);

        // Add navigation data
        parsed.navigation = navigation;

        // Add theme data
        parsed.theme = this.docsifyIntegration.getThemeStyles();

        parsedContent.push(parsed);
      } catch (error) {
        console.error(`Error parsing file ${file}:`, error);
      }
    }

    return parsedContent;
  }

  private async generateComponents(parsedContent: ParsedContent[]): Promise<any[]> {
    console.log('Generating components...');

    const components: unknown[] = [];

    for (const content of parsedContent) {
      try {
        // Generate component using the component generator
        // Cast content to any to bypass type checking
        const component = await this.componentGenerator.generatePage(content as any);

        components.push({
          name: this.getComponentName(content.title),
          path: this.getOutputPath(content),
          content: component,
        });
      } catch (error) {
        console.error(`Error generating component for ${content.title}:`, error);
      }
    }

    return components;
  }

  private async applyDesignSystem(components: unknown[]): Promise<any[]> {
    console.log('Applying design system...');

    // Generate theme CSS
    const themeCSS = this.docsifyIntegration.generateThemeCSS();

    // Save theme CSS to output directory
    const themePath = path.join(this.config.outputDir, 'theme.css');
    await fs.mkdir(path.dirname(themePath), { recursive: true });
    await fs.writeFile(themePath, themeCSS);

    return components;
  }

  private async generateTests(components: unknown[]): Promise<void> {
    if (!this.config.testing.components.unit && !this.config.testing.components.integration) {
      return;
    }

    console.log('Generating tests...');

    const testGenerator = await import('./TestGenerator').then(
      m => new m.TestGenerator(this.config.testing)
    );
    await testGenerator.generateTests(components as any);
  }

  private async build(components: unknown[]): Promise<void> {
    console.log('Building website...');

    const buildConfig: any = {
      target: 'production',
      outDir: this.config.outputDir,
      optimization: this.config.build.optimization,
      assets: this.config.build.assets,
    };

    const builder = new Builder(buildConfig);
    await builder.build(components as any);
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
