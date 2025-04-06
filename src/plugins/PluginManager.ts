import { ParsedContent } from '../types';

export interface Plugin {
  name: string;
  beforeParse?: (content: string, filePath?: string) => Promise<string> | string;
  afterParse?: (
    parsedContent: ParsedContent,
    filePath?: string
  ) => Promise<ParsedContent> | ParsedContent;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
    console.log(`Plugin registered: ${plugin.name}`);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  async applyBeforeParse(content: string, filePath?: string): Promise<string> {
    let result = content;

    for (const [_, plugin] of this.plugins.entries()) {
      if (plugin.beforeParse) {
        result = await plugin.beforeParse(result, filePath);
      }
    }

    return result;
  }

  async applyAfterParse(parsedContent: ParsedContent, filePath?: string): Promise<ParsedContent> {
    let result = parsedContent;

    for (const [_, plugin] of this.plugins.entries()) {
      if (plugin.afterParse) {
        result = await plugin.afterParse(result, filePath);
      }
    }

    return result;
  }
}
