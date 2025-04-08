import { PluginOptions } from './index.js';

/**
 * Interface for plugins
 */
export interface Plugin {
  /**
   * Name of the plugin
   */
  name: string;

  /**
   * Description of the plugin
   */
  description?: string;

  /**
   * Plugin options
   */
  options: PluginOptions;

  /**
   * Plugin hooks
   */
  hooks?: Record<string, any>;

  /**
   * Initialize the plugin
   */
  initialize(): void;

  /**
   * Process content
   * @param content Content to process
   */
  processContent(content: string): string;

  /**
   * Process HTML
   * @param html HTML to process
   */
  processHtml(html: string): string;

  /**
   * Get plugin assets
   */
  getAssets(): string[];
}
