import { DesignSystemConfig, ParserConfig, GeneratorConfig, CMSConfig } from '../types';

export interface WebsiteGeneratorConfig {
  // Core configuration
  projectName: string;
  outputDir: string;
  sourceDir: string;

  // Logging configuration
  logging?: {
    enabled?: boolean;
    level?: 'debug' | 'info' | 'warn' | 'error';
    format?: 'json' | 'text';
  };

  // Parser configuration
  parser: ParserConfig & {
    plugins?: string[];
    customFormats?: {
      [key: string]: {
        parser: string;
        options?: Record<string, any>;
      };
    };
  };

  // Component generation settings
  generator: GeneratorConfig & {
    templates: {
      [key: string]: string; // Template name -> path mapping
    };
    componentNaming?: {
      prefix?: string;
      suffix?: string;
      style: 'PascalCase' | 'camelCase';
    };
  };

  // Design system integration
  designSystem: DesignSystemConfig & {
    name: string;
    importPath: string;
    theme?: Record<string, any>;
    components: {
      [key: string]: {
        import: string;
        props?: Record<string, any>;
      };
    };
    styles: {
      global?: string;
      components?: Record<string, string>;
    };
  };

  // CMS integration
  cms?: CMSConfig;

  // Testing configuration
  testing: {
    framework: 'jest' | 'vitest';
    coverage: {
      enabled: boolean;
      threshold?: number;
    };
    components: {
      unit: boolean;
      integration: boolean;
      e2e?: boolean;
    };
  };

  // Build and deployment
  build: {
    optimization: {
      minify: boolean;
      splitChunks: boolean;
      treeshaking: boolean;
    };
    assets: {
      images: {
        optimize: boolean;
        formats: string[];
      };
      fonts: {
        preload: boolean;
        formats: string[];
      };
    };
  };

  // Performance optimization
  performance: {
    lazyLoading: boolean;
    prefetching: boolean;
    caching: {
      enabled: boolean;
      strategy: 'memory' | 'filesystem';
    };
  };

  // Accessibility
  accessibility: {
    wcag: {
      level: 'A' | 'AA' | 'AAA';
      automated: boolean;
    };
    aria: boolean;
    keyboard: boolean;
  };

  // Plugin system
  plugins?: Array<{
    name: string;
    options?: Record<string, any>;
  }>;
}

// Default configuration
export const defaultConfig: WebsiteGeneratorConfig = {
  projectName: 'documentation-site',
  outputDir: './dist',
  sourceDir: './docs',

  parser: {
    plugins: ['frontmatter', 'code-blocks', 'links'],
    customFormats: {},
  },

  generator: {
    templates: {
      page: './templates/page.tsx',
      section: './templates/section.tsx',
      navigation: './templates/navigation.tsx',
    },
    componentNaming: {
      style: 'PascalCase',
    },
  },

  designSystem: {
    type: 'material-ui',
    name: 'material-ui',
    importPath: '@mui/material',
    components: {
      Button: {
        import: '@mui/material/Button',
      },
      Typography: {
        import: '@mui/material/Typography',
      },
    },
    styles: {
      global: './styles/global.css',
    },
  },

  testing: {
    framework: 'vitest',
    coverage: {
      enabled: true,
      threshold: 80,
    },
    components: {
      unit: true,
      integration: true,
      e2e: false,
    },
  },

  build: {
    optimization: {
      minify: true,
      splitChunks: true,
      treeshaking: true,
    },
    assets: {
      images: {
        optimize: true,
        formats: ['webp', 'avif'],
      },
      fonts: {
        preload: true,
        formats: ['woff2', 'woff'],
      },
    },
  },

  performance: {
    lazyLoading: true,
    prefetching: true,
    caching: {
      enabled: true,
      strategy: 'memory',
    },
  },

  accessibility: {
    wcag: {
      level: 'AA',
      automated: true,
    },
    aria: true,
    keyboard: true,
  },

  plugins: [],
};
