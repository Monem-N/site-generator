import { Plugin } from '../../types/plugin.js';
import { ParsedContent } from '../../types/parser.js';
import { logger } from '../utils/logger.js';

export class PluginManager {
  private plugins: Plugin[] = [];
  // Flag to track if the plugin list has been modified

  constructor(plugins: Plugin[] = []) {
    this.plugins = [...plugins];
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return this.plugins;
  }

  /**
   * Register a new plugin
   */
  registerPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Initialize all plugins that have an initialize method
   */
  async initializePlugins(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.initialize) {
        await plugin.initialize();
      }
    }
  }

  /**
   * Execute a specific hook for all plugins
   */
  executeHook<T>(hookName: string, data: T, continueOnError = false): T {
    let result = data;

    for (const plugin of this.plugins) {
      if (plugin.hooks && plugin.hooks[hookName]) {
        try {
          result = plugin.hooks[hookName](result, plugin.options);
        } catch (error) {
          if (!continueOnError) {
            throw error;
          }
          logger.warn(
            `Error executing hook ${hookName} for plugin ${plugin.name}: ${error}`,
            error
          );
        }
      }
    }

    return result;
  }

  /**
   * Execute a specific hook for a specific plugin
   */
  executeHookForPlugin<T>(hookName: string, pluginName: string, data: T): T {
    const plugin = this.getPluginByName(pluginName);

    if (!plugin || !plugin.hooks || !plugin.hooks[hookName]) {
      return data;
    }

    try {
      return plugin.hooks[hookName](data, plugin.options);
    } catch (error) {
      logger.error(`Error executing hook ${hookName} for plugin ${pluginName}: ${error}`, error);
      throw error;
    }
  }

  /**
   * Get a plugin by name
   */
  getPluginByName(name: string): Plugin | undefined {
    return this.plugins.find(plugin => plugin.name === name);
  }

  /**
   * Check if a plugin exists
   */
  hasPlugin(name: string): boolean {
    return this.plugins.some(plugin => plugin.name === name);
  }

  /**
   * Remove a plugin by name
   */
  removePlugin(name: string): void {
    const index = this.plugins.findIndex(plugin => plugin.name === name);
    if (index !== -1) {
      this.plugins.splice(index, 1);
    }
  }

  /**
   * Apply beforeParse hooks to content
   */
  async applyBeforeParse(content: string, filePath?: string): Promise<string> {
    return this.executeHook('beforeParse', content, true);
  }

  /**
   * Apply afterParse hooks to parsed content
   */
  async applyAfterParse(parsedContent: ParsedContent, filePath?: string): Promise<ParsedContent> {
    return this.executeHook('afterParse', parsedContent, true);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.getPluginByName(name);
  }

  register(plugin: Plugin): void {
    this.registerPlugin(plugin);
  }
}
