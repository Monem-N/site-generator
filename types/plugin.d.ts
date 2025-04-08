import { ParsedContent } from './parser';
import { ComponentTemplate } from './component';
/**
 * Plugin interface for extending functionality
 */
export interface Plugin {
  name: string;
  version?: string;
  hooks?: PluginHooks;
  options?: Record<string, any>;
  initialize?: () => Promise<void> | void;
}
/**
 * Plugin hooks for different lifecycle events
 */
export interface PluginHooks {
  beforeParse?: (content: string, options?: any) => string | Promise<string>;
  afterParse?: (content: ParsedContent, options?: any) => ParsedContent | Promise<ParsedContent>;
  beforeGenerate?: (component: any, options?: any) => any | Promise<any>;
  afterGenerate?: (component: any, options?: any) => any | Promise<any>;
  [key: string]: any;
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
