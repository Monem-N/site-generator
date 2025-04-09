// Component generator types

import { DesignSystem } from './design.js';
import { ContentElement } from './cms.js';

/**
 * Interface for component templates
 */
export interface ComponentTemplate {
  type: string;
  template: string;
  name: string;
  path: string;
  content: string;
  metadata?: {
    navigation?: {
      items: Array<{ title: string; path: string }>;
    };
    theme?: {
      styles: Record<string, string>;
    };
    originalPath?: string;
  };
  generate?(element: ContentElement, designSystem?: DesignSystem): Promise<string>;
}

/**
 * Configuration for a component
 */
export interface ComponentConfig {
  id: string;
  name: string;
  content: string;
  metadata?: {
    navigation?: {
      items: Array<{ title: string; path: string }>;
    };
    theme?: {
      styles: Record<string, string>;
    };
    originalPath?: string;
  };
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
