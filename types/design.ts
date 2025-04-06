// Design system types

/**
 * Design system configuration
 */
export interface DesignSystem {
  /**
   * Type of design system
   */
  type: 'material-ui' | 'chakra-ui' | 'custom';

  /**
   * Path to import design system components from
   */
  importPath: string;

  /**
   * CSS class names for different elements
   */
  classNames: Record<string, string>;

  /**
   * Components to be used in page templates
   */
  pageComponents: string[];

  /**
   * Get configuration for a specific component type
   */
  getConfigForType(elementType: string): {
    classMapping: Record<string, string>;
    components: string[];
  };
}

/**
 * Theme configuration for design system
 */
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

/**
 * Design system component configuration
 */
export interface DesignSystemComponentConfig {
  import: string;
  props?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  variants?: Record<string, unknown>;
}

/**
 * Complete design system configuration
 */
export interface DesignSystemConfig {
  type: 'material-ui' | 'chakra-ui' | 'custom';
  theme?: ThemeConfig;
  components?: Record<string, DesignSystemComponentConfig>;
  utilities?: Record<string, string>;
}
