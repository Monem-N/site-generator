import { WebsiteGeneratorConfig } from '../../config/generator.config';

/**
 * Available configuration presets
 */
export type PresetType = 'docs' | 'blog' | 'api';

/**
 * Loads a predefined configuration preset
 * @param presetName The name of the preset to load
 * @returns A partial configuration object for the specified preset
 * @throws Error if the preset is not found
 */
export function loadPreset(presetName: string): Partial<WebsiteGeneratorConfig> {
  switch (presetName) {
    case 'docs':
      return docsPreset;
    case 'blog':
      return blogPreset;
    case 'api':
      return apiPreset;
    default:
      throw new Error(`Unknown preset: ${presetName}. Available presets: docs, blog, api`);
  }
}

/**
 * Documentation site preset
 * Optimized for technical documentation with sidebar navigation
 */
const docsPreset: Partial<WebsiteGeneratorConfig> = {
  projectName: 'documentation-site',

  parser: {
    plugins: ['frontmatter', 'code-blocks', 'links', 'table-of-contents'],
    extensions: ['md', 'markdown'],
    ignorePatterns: ['node_modules', '.git', '.github', '.vscode', 'dist'],
  },

  generator: {
    templates: {
      page: './templates/docs/page.tsx',
      section: './templates/docs/section.tsx',
      navigation: './templates/docs/sidebar.tsx',
      toc: './templates/docs/toc.tsx',
    },
    componentNaming: {
      prefix: 'Doc',
      style: 'PascalCase',
    },
  },

  designSystem: {
    type: 'custom',
    name: 'vue',
    importPath: './themes/vue',
    components: {
      Button: {
        import: './themes/vue/Button',
      },
      Typography: {
        import: './themes/vue/Typography',
      },
      Sidebar: {
        import: './themes/vue/Sidebar',
      },
      CodeBlock: {
        import: './themes/vue/CodeBlock',
      },
    },
    styles: {
      global: './themes/vue/global.css',
    },
  },

  plugins: [{ name: 'mermaid' }, { name: 'prism' }, { name: 'search' }, { name: 'copy-code' }],

  performance: {
    lazyLoading: true,
    prefetching: true,
    caching: {
      enabled: true,
      strategy: 'memory',
    },
  },
};

/**
 * Blog site preset
 * Optimized for blog posts with tags and categories
 */
const blogPreset: Partial<WebsiteGeneratorConfig> = {
  projectName: 'blog-site',

  parser: {
    plugins: ['frontmatter', 'code-blocks', 'links', 'excerpt'],
    extensions: ['md', 'markdown'],
    ignorePatterns: ['node_modules', '.git', '.github', '.vscode', 'dist'],
  },

  generator: {
    templates: {
      page: './templates/blog/page.tsx',
      section: './templates/blog/section.tsx',
      navigation: './templates/blog/navigation.tsx',
      post: './templates/blog/post.tsx',
      postList: './templates/blog/post-list.tsx',
      tag: './templates/blog/tag.tsx',
    },
    componentNaming: {
      prefix: 'Blog',
      style: 'PascalCase',
    },
  },

  designSystem: {
    type: 'custom',
    name: 'dark',
    importPath: './themes/dark',
    components: {
      Button: {
        import: './themes/dark/Button',
      },
      Typography: {
        import: './themes/dark/Typography',
      },
      Card: {
        import: './themes/dark/Card',
      },
      Tag: {
        import: './themes/dark/Tag',
      },
    },
    styles: {
      global: './themes/dark/global.css',
    },
  },

  plugins: [
    { name: 'social-share' },
    { name: 'reading-time' },
    { name: 'related-posts' },
    { name: 'prism' },
  ],

  performance: {
    lazyLoading: true,
    prefetching: false,
    caching: {
      enabled: true,
      strategy: 'memory',
    },
  },
};

/**
 * API documentation preset
 * Optimized for API documentation with OpenAPI support
 */
const apiPreset: Partial<WebsiteGeneratorConfig> = {
  projectName: 'api-documentation',

  parser: {
    plugins: ['frontmatter', 'code-blocks', 'links', 'openapi'],
    extensions: ['md', 'markdown', 'yaml', 'json'],
    ignorePatterns: ['node_modules', '.git', '.github', '.vscode', 'dist'],
    customFormats: {
      openapi: {
        parser: 'openapi',
        options: {
          validateSchema: true,
        },
      },
    },
  },

  generator: {
    templates: {
      page: './templates/api/page.tsx',
      section: './templates/api/section.tsx',
      navigation: './templates/api/navigation.tsx',
      endpoint: './templates/api/endpoint.tsx',
      schema: './templates/api/schema.tsx',
      parameter: './templates/api/parameter.tsx',
    },
    componentNaming: {
      prefix: 'Api',
      style: 'PascalCase',
    },
  },

  designSystem: {
    type: 'custom',
    name: 'buble',
    importPath: './themes/buble',
    components: {
      Button: {
        import: './themes/buble/Button',
      },
      Typography: {
        import: './themes/buble/Typography',
      },
      Endpoint: {
        import: './themes/buble/Endpoint',
      },
      Schema: {
        import: './themes/buble/Schema',
      },
    },
    styles: {
      global: './themes/buble/global.css',
    },
  },

  plugins: [
    { name: 'swagger-ui' },
    { name: 'try-it-out' },
    { name: 'prism' },
    { name: 'copy-code' },
  ],

  performance: {
    lazyLoading: true,
    prefetching: true,
    caching: {
      enabled: true,
      strategy: 'memory',
    },
  },
};
