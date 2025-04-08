// Core types for the documentation-driven website generator

// Re-export all types from specific type files
export * from './cms.js';
export * from './component.js';
export * from './design.js';
export * from './parser.js';
export * from './plugin.js';

// Generator related types
export interface GeneratorConfig {
  outputFormat?: 'react' | 'next' | 'gatsby';
  typescript?: boolean;
  cssFramework?: 'css-modules' | 'styled-components' | 'emotion' | 'tailwind';
  optimization?: {
    minify?: boolean;
    treeshake?: boolean;
    splitChunks?: boolean;
  };
}

export interface ComponentTemplate {
  name: string;
  path: string;
  content: string;
  variables?: Record<string, any>;
  dependencies?: string[];
}

// Design system related types
export interface DesignSystemConfig {
  type: 'material-ui' | 'chakra-ui' | 'custom';
  theme?: ThemeConfig;
  components?: Record<string, ComponentConfig>;
  utilities?: Record<string, string>;
}

export interface ThemeConfig {
  colors?: Record<string, string>;
  typography?: {
    fontFamilies?: Record<string, string>;
    fontSizes?: Record<string, string>;
    lineHeights?: Record<string, string | number>;
  };
  spacing?: Record<string, string | number>;
  breakpoints?: Record<string, string | number>;
  shadows?: Record<string, string>;
}

export interface ComponentConfig {
  import: string;
  props?: Record<string, any>;
  styles?: Record<string, any>;
  variants?: Record<string, any>;
}

// Testing related types
export interface TestConfig {
  framework: 'jest' | 'vitest';
  coverage?: {
    enabled: boolean;
    threshold?: number;
  };
  patterns?: {
    unit?: string[];
    integration?: string[];
    e2e?: string[];
  };
}

// Plugin system types are imported from './plugin.js'

// Build and deployment types
export interface BuildConfig {
  target: 'development' | 'production' | 'preview';
  outDir: string;
  assets?: {
    images?: {
      optimize?: boolean;
      formats?: string[];
    };
    fonts?: {
      preload?: boolean;
      formats?: string[];
    };
  };
  optimization?: {
    minify?: boolean;
    treeshake?: boolean;
    splitChunks?: boolean;
  };
}

// CMS integration types
export interface CMSConfig {
  type: 'contentful' | 'strapi' | 'custom';
  spaceId?: string;
  accessToken?: string;
  models?: Record<string, CMSModel>;
}

export interface CMSModel {
  type: string;
  fields: Record<string, CMSField>;
  relationships?: Record<string, CMSRelationship>;
}

export interface CMSField {
  type: string;
  required?: boolean;
  defaultValue?: any;
  validations?: Record<string, any>;
}

export interface CMSRelationship {
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  target: string;
  inversedBy?: string;
  required?: boolean;
}
