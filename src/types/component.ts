// Component generator types

import { DesignSystem } from './design';
import { ContentElement } from './cms';

/**
 * Interface for component templates
 */
export interface ComponentTemplate {
  name?: string;
  path?: string;
  content?: string;
  type?: string;
  metadata?: Record<string, any>;
  generate?(element: ContentElement, designSystem?: DesignSystem): Promise<string>;
}

/**
 * Configuration for a component
 */
export interface ComponentConfig {
  name: string;
  path: string;
  content: string;
  variables?: Record<string, unknown>;
  dependencies?: string[];
}

/**
 * Design system configuration for a specific component type
 */
export interface ComponentDesignConfig {
  classMapping: Record<string, string>;
  components: string[];
}

/**
 * API endpoint definition for documentation
 */
export interface APIEndpoint {
  method: string;
  endpoint: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  responses?: Record<
    string,
    {
      description: string;
      example?: unknown;
    }
  >;
}

/**
 * Table component data structure
 */
export interface TableData {
  headers: string[];
  rows: string[][];
}

/**
 * Code block component data structure
 */
export interface CodeBlock {
  language: string;
  content: string[];
  filename?: string;
}

/**
 * Section component data structure
 */
export interface Section {
  title: string;
  level: number;
  content: ContentElement[];
}

/**
 * Navigation component data structure
 */
export interface Navigation {
  items: Array<{
    label: string;
    path: string;
    active?: boolean;
    children?: Array<{
      label: string;
      path: string;
      active?: boolean;
    }>;
  }>;
}
