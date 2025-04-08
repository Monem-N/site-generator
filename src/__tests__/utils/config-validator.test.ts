import { validateConfig } from '../../utils/config-validator.js';
import { WebsiteGeneratorConfig } from '../../../config/generator.config.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('Config Validator', () => {
  // Valid test configuration
  const validConfig: WebsiteGeneratorConfig = {
    projectName: 'test-project',
    sourceDir: '/test/source',
    outputDir: '/test/output',

    parser: {
      extensions: ['md'],
      ignorePatterns: ['node_modules'],
      plugins: [],
    },

    generator: {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase',
      },
    },

    designSystem: {
      type: 'custom',
      name: 'test-theme',
      importPath: '/test/themes',
      components: {
        Button: {
          import: '/test/themes/Button',
        },
      },
      styles: {
        global: '/test/themes/global.css',
      },
    },

    testing: {
      framework: 'jest',
      coverage: {
        enabled: true,
        threshold: 80,
      },
      components: {
        unit: true,
        integration: true,
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
          formats: ['webp'],
        },
        fonts: {
          preload: true,
          formats: ['woff2'],
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
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync to return true for directories
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return true;
    });

    // Mock fs.accessSync to not throw
    (fs.accessSync as jest.Mock).mockImplementation((path: string, _mode: number) => {
      return undefined;
    });

    // Mock path.resolve to return the input path
    (path.resolve as jest.Mock).mockImplementation((path: string) => {
      return path;
    });

    // Mock path.dirname to return the directory
    (path.dirname as jest.Mock).mockImplementation((path: string) => {
      const parts = path.split('/');
      parts.pop();
      return parts.join('/');
    });
  });

  test('should validate valid configuration', () => {
    expect(() => {
      validateConfig(validConfig);
    }).not.toThrow();
  });

  test('should throw error for missing projectName', () => {
    const invalidConfig = { ...validConfig, projectName: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: projectName');
  });

  test('should throw error for missing sourceDir', () => {
    const invalidConfig = { ...validConfig, sourceDir: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: sourceDir');
  });

  test('should throw error for non-existent sourceDir', () => {
    // Mock fs.existsSync to return false for source directory
    (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
      return path !== '/test/source';
    });

    expect(() => {
      validateConfig(validConfig);
    }).toThrow('Source directory does not exist: /test/source');
  });

  test('should throw error for missing outputDir', () => {
    const invalidConfig = { ...validConfig, outputDir: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: outputDir');
  });

  test('should throw error for non-writable output directory', () => {
    // Mock fs.accessSync to throw for output directory
    (fs.accessSync as jest.Mock).mockImplementation((path: string, _mode: number) => {
      if (path === '/test') {
        throw new Error('Permission denied');
      }
    });

    expect(() => {
      validateConfig(validConfig);
    }).toThrow('Cannot write to parent directory of output directory: /test');
  });

  test('should throw error for missing parser', () => {
    const invalidConfig = { ...validConfig, parser: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: parser');
  });

  test('should throw error for invalid parser plugins', () => {
    const invalidConfig = {
      ...validConfig,
      parser: {
        ...validConfig.parser,
        plugins: 'not-an-array',
      },
    };

    expect(() => {
      validateConfig(invalidConfig as any);
    }).toThrow('parser.plugins must be an array');
  });

  test('should throw error for missing generator', () => {
    const invalidConfig = { ...validConfig, generator: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: generator');
  });

  test('should throw error for missing generator templates', () => {
    const invalidConfig = {
      ...validConfig,
      generator: {
        ...validConfig.generator,
        templates: undefined,
      },
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: generator.templates');
  });

  test('should throw error for invalid generator templates', () => {
    const invalidConfig = {
      ...validConfig,
      generator: {
        ...validConfig.generator,
        templates: 'not-an-object',
      },
    };

    expect(() => {
      validateConfig(invalidConfig as any);
    }).toThrow('generator.templates must be an object');
  });

  test('should throw error for missing required templates', () => {
    const invalidConfig = {
      ...validConfig,
      generator: {
        ...validConfig.generator,
        templates: {
          page: '/test/templates/page.tsx',
          // Missing section template
        },
      },
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required template: section');
  });

  test('should throw error for invalid component naming style', () => {
    const invalidConfig = {
      ...validConfig,
      generator: {
        ...validConfig.generator,
        componentNaming: {
          style: 'invalid-style',
        },
      },
    };

    expect(() => {
      validateConfig(invalidConfig as any);
    }).toThrow('generator.componentNaming.style must be either "PascalCase" or "camelCase"');
  });

  test('should throw error for missing designSystem', () => {
    const invalidConfig = { ...validConfig, designSystem: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: designSystem');
  });

  test('should throw error for missing designSystem name', () => {
    const invalidConfig = {
      ...validConfig,
      designSystem: {
        ...validConfig.designSystem,
        name: undefined,
      },
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: designSystem.name');
  });

  test('should throw error for missing designSystem importPath', () => {
    const invalidConfig = {
      ...validConfig,
      designSystem: {
        ...validConfig.designSystem,
        importPath: undefined,
      },
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: designSystem.importPath');
  });

  test('should throw error for missing designSystem components', () => {
    const invalidConfig = {
      ...validConfig,
      designSystem: {
        ...validConfig.designSystem,
        components: undefined,
      },
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: designSystem.components');
  });

  test('should throw error for invalid designSystem components', () => {
    const invalidConfig = {
      ...validConfig,
      designSystem: {
        ...validConfig.designSystem,
        components: 'not-an-object',
      },
    };

    expect(() => {
      validateConfig(invalidConfig as any);
    }).toThrow('designSystem.components must be an object');
  });

  test('should throw error for missing testing', () => {
    const invalidConfig = { ...validConfig, testing: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: testing');
  });

  test('should throw error for missing testing framework', () => {
    const invalidConfig = {
      ...validConfig,
      testing: {
        ...validConfig.testing,
        framework: undefined,
      },
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: testing.framework');
  });

  test('should throw error for invalid testing framework', () => {
    const invalidConfig = {
      ...validConfig,
      testing: {
        ...validConfig.testing,
        framework: 'invalid-framework',
      },
    };

    expect(() => {
      validateConfig(invalidConfig as any);
    }).toThrow('testing.framework must be either "jest" or "vitest"');
  });

  test('should throw error for missing testing coverage', () => {
    const invalidConfig = {
      ...validConfig,
      testing: {
        ...validConfig.testing,
        coverage: undefined,
      },
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: testing.coverage');
  });

  test('should throw error for invalid testing coverage enabled', () => {
    const invalidConfig = {
      ...validConfig,
      testing: {
        ...validConfig.testing,
        coverage: {
          ...validConfig.testing.coverage,
          enabled: 'not-a-boolean',
        },
      },
    };

    expect(() => {
      validateConfig(invalidConfig as any);
    }).toThrow('testing.coverage.enabled must be a boolean');
  });

  test('should throw error for invalid testing coverage threshold', () => {
    const invalidConfig = {
      ...validConfig,
      testing: {
        ...validConfig.testing,
        coverage: {
          ...validConfig.testing.coverage,
          threshold: 101, // Invalid: > 100
        },
      },
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('testing.coverage.threshold must be a number between 0 and 100');
  });

  test('should throw error for missing testing components', () => {
    const invalidConfig = {
      ...validConfig,
      testing: {
        ...validConfig.testing,
        components: undefined,
      },
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: testing.components');
  });

  test('should throw error for invalid testing components unit', () => {
    const invalidConfig = {
      ...validConfig,
      testing: {
        ...validConfig.testing,
        components: {
          ...validConfig.testing.components,
          unit: 'not-a-boolean',
        },
      },
    };

    expect(() => {
      validateConfig(invalidConfig as any);
    }).toThrow('testing.components.unit must be a boolean');
  });

  test('should throw error for missing build', () => {
    const invalidConfig = { ...validConfig, build: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: build');
  });

  test('should throw error for missing performance', () => {
    const invalidConfig = { ...validConfig, performance: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: performance');
  });

  test('should throw error for missing accessibility', () => {
    const invalidConfig = { ...validConfig, accessibility: undefined };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Missing required field: accessibility');
  });

  test('should throw error for invalid plugins', () => {
    const invalidConfig = {
      ...validConfig,
      plugins: 'not-an-array',
    };

    expect(() => {
      validateConfig(invalidConfig as any);
    }).toThrow('plugins must be an array');
  });

  test('should throw error for plugin missing name', () => {
    const invalidConfig = {
      ...validConfig,
      plugins: [
        { options: {} }, // Missing name
      ],
    };

    expect(() => {
      validateConfig(invalidConfig as unknown as unknown as WebsiteGeneratorConfig);
    }).toThrow('Plugin at index 0 is missing required field: name');
  });

  test('should validate configuration with plugins', () => {
    const configWithPlugins = {
      ...validConfig,
      plugins: [{ name: 'plugin1' }, { name: 'plugin2', options: { option1: 'value1' } }],
    };

    expect(() => {
      validateConfig(configWithPlugins as unknown as unknown as WebsiteGeneratorConfig);
    }).not.toThrow();
  });
});
