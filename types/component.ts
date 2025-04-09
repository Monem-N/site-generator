// Component generator types

import { DesignSystem } from './design.js';
import { ContentElement } from './cms.js';

/**
 * Interface for component templates
 */
export interface ComponentTemplate extends ComponentConfig {
  type: string;
  name: string;
  path: string;
  content: string;
  id?: string; // Make id optional to maintain backward compatibility// Make id optional to maintain backward compatibility
  metadata?: Record<string, unknown>;
  generate(element: ContentElement, designSystem: DesignSystem): Promise<string>;esignSystem: DesignSystem): Promise<string>;
}

/**/**
 * Configuration for a componentConfiguration for a component
 */
export interface ComponentConfig {ort interface ComponentConfig {
  name: string;
  path: string;
  content: string;ng;
  variables?: Record<string, unknown>;rd<string, unknown>;
  dependencies?: string[];
}

/**/**
 * Design system configuration for a specific component typeDesign system configuration for a specific component type
 */
export interface ComponentDesignConfig {ort interface ComponentDesignConfig {
  classMapping: Record<string, string>;
  components: string[];
}

/**/**
 * API endpoint definition for documentationAPI endpoint definition for documentation
 */
export interface APIEndpoint {ort interface APIEndpoint {
  method: string;
  endpoint: string;g;
  parameters?: Array<{y<{
    name: string;
    type: string;
    description: string;string;
    required?: boolean;
  }>;
  responses?: Record<ponses?: Record<
    string,
    {
      description: string; description: string;
      example?: unknown;
    }
  >;
}

/**/**
 * Table component data structureTable component data structure
 */
export interface TableData {ort interface TableData {
  headers: string[];
  rows: string[][];
}

/**/**
 * Code block component data structureCode block component data structure
 */
export interface CodeBlock {ort interface CodeBlock {
  language: string;
  content: string[];;
  filename?: string;
}

/**/**
 * Section component data structureSection component data structure
 */
export interface Section {ort interface Section {
  title: string;
  level: number;
  content: ContentElement[];ntElement[];
}

/**/**
 * Navigation component data structureNavigation component data structure
 */
export interface Navigation {ort interface Navigation {
  items: Array<{
    label: string;g;
    path: string;
    active?: boolean;ean;
    children?: Array<{{
      label: string;
      path: string;
      active?: boolean;ean;
    }>;
  }>;
}
