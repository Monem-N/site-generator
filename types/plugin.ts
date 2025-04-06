// Plugin system types
import { ParsedContent } from './parser';
import { ComponentTemplate } from './component';

/**
 * Plugin interface for extending functionality
 */
export interface Plugin {
  name: string;
  version: string;
  hooks?: PluginHooks;
  options?: Record<string, unknown>;
}

/**
 * Plugin hooks for different lifecycle events
 */
export interface PluginHooks {
  beforeParse?: (content: string, filePath?: string) => Promise<string>;
  afterParse?: (content: ParsedContent, filePath?: string) => Promise<ParsedContent>;
  beforeGenerate?: (components: ComponentTemplate[]) => Promise<ComponentTemplate[]>;
  afterGenerate?: (output: string) => Promise<string>;
}

/**
 * Docsify plugin options
 */
export interface DocsifyPluginOptions {
  basePath?: string;
  coverpage?: boolean;
  navbar?: boolean;
  sidebar?: boolean;
  themeable?: {
    responsiveTables: boolean;
    readyTransition: boolean;
  };
}

/**
 * Plugin manager interface
 */
export interface PluginManagerInterface {
  register(plugin: Plugin): void;
  applyBeforeParse(content: string, filePath?: string): Promise<string>;
  applyAfterParse(content: ParsedContent, filePath?: string): Promise<ParsedContent>;
  applyBeforeGenerate(components: ComponentTemplate[]): Promise<ComponentTemplate[]>;
  applyAfterGenerate(output: string): Promise<string>;
}
