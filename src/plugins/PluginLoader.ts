import { Plugin } from '../types/plugin.js';
import { FileSystemError } from '../utils/errors.js';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger.js';

/**
 * Plugin loader class
 */
export class PluginLoader {
  /**
   * Load a plugin from a file
   * @param filePath Plugin file path
   * @param customOptions Custom options for the plugin
   */
  loadPlugin(
    filePath: string,
    customOptions: Record<string, Record<string, unknown>> = {}
  ): Plugin {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      throw new FileSystemError(`Plugin file not found: ${filePath}`, { filePath });
    }

    // Get the plugin name from the file name
    const pluginName = path.basename(filePath, path.extname(filePath));

    // Load the plugin
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const plugin = require(filePath);

    // Check if the plugin is valid
    if (!plugin || !plugin.default) {
      throw new Error(`Invalid plugin: ${filePath}`);
    }

    // Create the plugin instance
    const pluginInstance = new plugin.default();

    // Check if the plugin implements the Plugin interface
    if (!this.isValidPlugin(pluginInstance)) {
      throw new Error(`Plugin does not implement the Plugin interface: ${filePath}`);
    }

    // Set the plugin name if not set
    if (!pluginInstance.name) {
      pluginInstance.name = pluginName;
    }

    // Set the plugin options
    if (customOptions[pluginInstance.name]) {
      // Merge the custom options with the default options
      pluginInstance.options = {
        ...pluginInstance.options,
        ...(customOptions[pluginInstance.name] || {}),
      };
    }

    return pluginInstance;
  }

  /**
   * Load plugins from a directory
   * @param dirPath Directory path
   * @param customOptions Custom options for the plugins
   */
  loadPlugins(
    dirPath: string,
    customOptions: Record<string, Record<string, unknown>> = {}
  ): Plugin[] {
    // Check if the directory exists
    if (!fs.existsSync(dirPath)) {
      throw new FileSystemError(`Plugin directory not found: ${dirPath}`, { dirPath });
    }

    // Get all files in the directory
    const files = fs.readdirSync(dirPath);

    // Load all plugins
    const plugins: Plugin[] = [];
    for (const file of files) {
      // Skip non-JavaScript/TypeScript files
      if (!file.endsWith('.js') && !file.endsWith('.ts')) {
        continue;
      }

      // Load the plugin
      const filePath = path.join(dirPath, file);
      try {
        const plugin = this.loadPlugin(filePath, customOptions);
        plugins.push(plugin);
      } catch (error) {
        logger.error(`Failed to load plugin: ${filePath}`, error);
      }
    }

    return plugins;
  }

  /**
   * Check if a plugin implements the Plugin interface
   * @param plugin Plugin to check
   */
  private isValidPlugin(plugin: unknown): plugin is Plugin {
    if (!plugin || typeof plugin !== 'object') return false;

    const p = plugin as Record<string, unknown>;

    return (
      typeof p.name === 'string' &&
      typeof p.initialize === 'function' &&
      typeof p.processContent === 'function' &&
      typeof p.processHtml === 'function' &&
      typeof p.getAssets === 'function'
    );
  }
}
