import { Plugin } from '../../types/plugin';
import fs from 'fs';
import path from 'path';

/**
 * Class for loading plugins from files or directories
 */
export class PluginLoader {
  private pluginDir: string;

  /**
   * Create a new PluginLoader
   * @param pluginDir Directory containing plugins
   */
  constructor(pluginDir: string) {
    this.pluginDir = pluginDir;
  }

  /**
   * Load a plugin from a file
   * @param filePath Path to the plugin file
   * @returns The loaded plugin
   */
  async loadPluginFromFile(filePath: string): Promise<Plugin> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Plugin file not found: ${filePath}`);
      }

      // Import the plugin module
      const pluginModule = require(filePath);

      // Validate the plugin
      if (!this.isValidPlugin(pluginModule)) {
        throw new Error(`Invalid plugin format: ${filePath}`);
      }

      return pluginModule;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Load all plugins from the plugin directory
   * @param customOptions Custom options for plugins
   * @returns Array of loaded plugins
   */
  async loadPluginsFromDirectory(customOptions: Record<string, any> = {}): Promise<Plugin[]> {
    try {
      const plugins: Plugin[] = [];

      // Get all files in the plugin directory
      const files = fs.readdirSync(this.pluginDir);

      // Load each plugin file
      for (const file of files) {
        const filePath = path.join(this.pluginDir, file);

        try {
          // Skip directories and non-JavaScript files
          if (fs.statSync(filePath).isDirectory() || !file.endsWith('.js')) {
            continue;
          }

          // Load the plugin
          const plugin = await this.loadPluginFromFile(filePath);

          // Apply custom options if provided
          if (customOptions[plugin.name]) {
            plugin.options = {
              ...plugin.options,
              ...customOptions[plugin.name],
            };
          }

          plugins.push(plugin);
        } catch (error) {
          console.error(`Failed to load plugin ${file}:`, error);
        }
      }

      return plugins;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load plugins from directory: ${errorMessage}`);
    }
  }

  /**
   * Load specific plugins by name
   * @param pluginNames Names of plugins to load
   * @param customOptions Custom options for plugins
   * @returns Array of loaded plugins
   */
  async loadPluginsByName(pluginNames: string[], customOptions: Record<string, any> = {}): Promise<Plugin[]> {
    try {
      const plugins: Plugin[] = [];

      // Load each plugin by name
      for (const name of pluginNames) {
        const filePath = path.join(this.pluginDir, `${name}.js`);

        try {
          // Load the plugin
          const plugin = await this.loadPluginFromFile(filePath);

          // Apply custom options if provided
          if (customOptions[plugin.name]) {
            plugin.options = {
              ...plugin.options,
              ...customOptions[plugin.name],
            };
          }

          plugins.push(plugin);
        } catch (error) {
          throw new Error(`Plugin not found: ${name}`);
        }
      }

      return plugins;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if an object is a valid plugin
   * @param obj Object to check
   * @returns True if the object is a valid plugin
   */
  isValidPlugin(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.name === 'string' &&
      obj.hooks &&
      typeof obj.hooks === 'object'
    );
  }
}
