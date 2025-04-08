import * as fs from 'fs';
import * as path from 'path';
import { Plugin } from '../types/plugin.js';

interface PluginDocumentation {
  name: string;
  description: string;
  hooks: string[];
  options: {
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: string;
  }[];
  examples: string[];
}

export class PluginDocsGenerator {
  private plugins: Plugin[] = [];
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Add a plugin to document
   */
  addPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Generate documentation for all plugins
   */
  async generateDocs(): Promise<void> {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Generate index file
    await this.generateIndexFile();

    // Generate docs for each plugin
    for (const plugin of this.plugins) {
      await this.generatePluginDoc(plugin);
    }
  }

  /**
   * Generate index file
   */
  private async generateIndexFile(): Promise<void> {
    let content = '# Plugin Documentation\n\n';
    content += 'This documentation describes the available plugins for the Site Generator.\n\n';
    content += '## Available Plugins\n\n';

    for (const plugin of this.plugins) {
      content += `- [${plugin.name}](${plugin.name}.md): ${
        plugin.description || 'No description'
      }\n`;
    }

    const filePath = path.join(this.outputDir, 'README.md');
    await fs.promises.writeFile(filePath, content);
  }

  /**
   * Generate documentation for a specific plugin
   */
  private async generatePluginDoc(plugin: Plugin): Promise<void> {
    const doc: PluginDocumentation = {
      name: plugin.name,
      description: plugin.description || 'No description available.',
      hooks: Object.keys(plugin.hooks || {}),
      options: [],
      examples: [],
    };

    // Extract options from plugin
    if (plugin.options) {
      for (const [name, option] of Object.entries(plugin.options)) {
        doc.options.push({
          name,
          type: (option as any).type || 'any',
          description: (option as any).description || 'No description available.',
          required: (option as any).required || false,
          default:
            (option as any).default !== undefined ? String((option as any).default) : undefined,
        });
      }
    }

    // Generate markdown content
    let content = `# ${doc.name} Plugin\n\n`;
    content += `${doc.description}\n\n`;

    // Hooks
    content += '## Hooks\n\n';
    if (doc.hooks.length > 0) {
      for (const hook of doc.hooks) {
        content += `- \`${hook}\`: ${this.getHookDescription(hook)}\n`;
      }
    } else {
      content += 'This plugin does not implement any hooks.\n';
    }
    content += '\n';

    // Options
    content += '## Options\n\n';
    if (doc.options.length > 0) {
      content += '| Option | Type | Description | Required | Default |\n';
      content += '|--------|------|-------------|----------|--------|\n';

      for (const option of doc.options) {
        content += `| \`${option.name}\` | \`${option.type}\` | ${option.description} | ${
          option.required ? 'Yes' : 'No'
        } | ${option.default || '-'} |\n`;
      }
    } else {
      content += 'This plugin does not have any options.\n';
    }
    content += '\n';

    // Examples
    content += '## Examples\n\n';
    if (doc.examples.length > 0) {
      for (const example of doc.examples) {
        content += '```javascript\n';
        content += example;
        content += '\n```\n\n';
      }
    } else {
      content += 'No examples available.\n';
    }

    const filePath = path.join(this.outputDir, `${plugin.name}.md`);
    await fs.promises.writeFile(filePath, content);
  }

  /**
   * Get description for a hook
   */
  private getHookDescription(hook: string): string {
    const descriptions: Record<string, string> = {
      beforeParse: 'Called before parsing content, allows modifying the raw content.',
      afterParse: 'Called after parsing content, allows modifying the parsed content.',
      beforeGenerate: 'Called before generating components, allows modifying the component data.',
      afterGenerate:
        'Called after generating components, allows modifying the generated components.',
      beforeBuild: 'Called before building the website, allows modifying the build configuration.',
      afterBuild: 'Called after building the website, allows performing post-build operations.',
    };

    return descriptions[hook] || 'No description available.';
  }
}
