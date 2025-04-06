// Core types for the documentation-driven website generator

// Parser related types
export interface ParserConfig {
  defaultFormat?: string;
  extensions?: string[];
  ignorePatterns?: string[];
  metadata?: {
    required?: string[];
    optional?: string[];
  };
}

export interface ParsedContent {
  title: string;
  description: string;
  metadata: Record<string, any>;
  sections: ContentNode[];
  assets: Asset[];
  references: Reference[];
}

export interface ContentNode {
  type: string;
  title?: string;
  content: string | ContentNode[];
  attributes?: Record<string, any>;
  children?: ContentNode[];
}

export interface Asset {
  type: 'image' | 'video' | 'document' | 'other';
  path: string;
  mimeType?: string;
  size?: number;
  metadata?: Record<string, any>;
}

export interface Reference {
  type: 'internal' | 'external';
  source: string;
  target: string;
  attributes?: Record<string, any>;
}

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

// Plugin system types
export interface Plugin {
  name: string;
  version: string;
  hooks?: {
    beforeParse?: (content: string) => Promise<string>;
    afterParse?: (content: ParsedContent) => Promise<ParsedContent>;
    beforeGenerate?: (components: ComponentTemplate[]) => Promise<ComponentTemplate[]>;
    afterGenerate?: (output: string) => Promise<string>;
  };
  options?: Record<string, any>;
}

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
