import { PluginLoader } from '../../plugins/PluginLoader.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('PluginLoader', () => {
  // Sample plugin files
  const mockPluginFiles = {
    '/plugins/test-plugin.js': `
      module.exports = {
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {
          beforeParse: (_content) => 'Modified by test-plugin: ' + content,
          afterParse: (parsed) => ({ ...parsed, title: 'Enhanced by test-plugin: ' + parsed.title })
        }
      };
    `,
    '/plugins/another-plugin.js': `
      module.exports = {
        name: 'another-plugin',
        version: '1.0.0',
        options: {
          option1: 'default-value'
        },
        hooks: {
          beforeParse: (content, options) => 'Modified by another-plugin with ' + options.option1 + ': ' + content
        }
      };
    `,
    '/plugins/invalid-plugin.js': `
      // This is not a valid plugin
      logger.debug('This is not a plugin');
    `,
    '/plugins/error-plugin.js': `
      throw new Error('Plugin error');
    `,
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync to return true for plugin files
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return filePath in mockPluginFiles || filePath === '/plugins';
    });

    // Mock fs.readFileSync to return mock plugin files
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath in mockPluginFiles) {
        return mockPluginFiles[filePath];
      }
      throw new Error(`File not found: ${filePath}`);
    });

    // Mock fs.readdirSync to return plugin files
    (fs.readdirSync as jest.Mock).mockImplementation((dirPath: string) => {
      if (dirPath === '/plugins') {
        return ['test-plugin.js', 'another-plugin.js', 'invalid-plugin.js', 'error-plugin.js'];
      }
      return [];
    });

    // Mock path.resolve to return the input path
    (path.resolve as jest.Mock).mockImplementation((...paths: string[]) => {
      return paths.join('/').replace(/\/+/g, '/');
    });

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) => {
      return paths.join('/').replace(/\/+/g, '/');
    });

    // Mock require to return plugin modules
    jest.mock(
      '/plugins/test-plugin.js',
      () => ({
        name: 'test-plugin',
        version: '1.0.0',
        hooks: {
          beforeParse: (content: string) => 'Modified by test-plugin: ' + content,
          afterParse: (parsed: unknown) => {
            const p = parsed as { title: string };
            return {
              ...p,
              title: 'Enhanced by test-plugin: ' + p.title,
            };
          },
        },
      }),
      { virtual: true }
    );

    jest.mock(
      '/plugins/another-plugin.js',
      () => ({
        name: 'another-plugin',
        version: '1.0.0',
        options: {
          option1: 'default-value',
        },
        hooks: {
          beforeParse: (content: string, options: unknown) => {
            const opts = options as { option1: string };
            return 'Modified by another-plugin with ' + opts.option1 + ': ' + content;
          },
        },
      }),
      { virtual: true }
    );

    jest.mock(
      '/plugins/invalid-plugin.js',
      () => ({
        // Not a valid plugin
        notAPlugin: true,
      }),
      { virtual: true }
    );

    jest.mock(
      '/plugins/error-plugin.js',
      () => {
        throw new Error('Plugin error');
      },
      { virtual: true }
    );
  });

  test('should initialize', () => {
    const loader = new PluginLoader();
    expect(loader).toBeDefined();
  });

  test('should load plugin from file', () => {
    const loader = new PluginLoader();
    const plugin = loader.loadPlugin('/plugins/test-plugin.js');

    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('test-plugin');
    expect(plugin.hooks).toBeDefined();
    if (plugin.hooks) {
      expect(plugin.hooks.beforeParse).toBeDefined();
      expect(plugin.hooks.afterParse).toBeDefined();
    }
  });

  test('should load plugin with options', () => {
    const loader = new PluginLoader();
    const plugin = loader.loadPlugin('/plugins/another-plugin.js', {
      'another-plugin': {
        option1: 'default-value',
      },
    });

    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('another-plugin');
    expect(plugin.options).toBeDefined();
    expect(plugin.options.option1).toBe('default-value');
    expect(plugin.hooks).toBeDefined();
    if (plugin.hooks) {
      expect(plugin.hooks.beforeParse).toBeDefined();
    }
  });

  test('should handle invalid plugin files', () => {
    const loader = new PluginLoader();

    expect(() => {
      loader.loadPlugin('/plugins/invalid-plugin.js');
    }).toThrow('Invalid plugin');
  });

  test('should handle errors when loading plugins', () => {
    const loader = new PluginLoader();

    expect(() => {
      loader.loadPlugin('/plugins/error-plugin.js');
    }).toThrow();
  });

  test('should handle non-existent plugin files', () => {
    const loader = new PluginLoader();

    expect(() => {
      loader.loadPlugin('/plugins/non-existent-plugin.js');
    }).toThrow('Plugin file not found');
  });

  test('should load all plugins from directory', () => {
    const loader = new PluginLoader();
    const plugins = loader.loadPlugins('/plugins');

    // Should only load valid plugins
    expect(plugins).toHaveLength(2);
    expect(plugins[0].name).toBe('test-plugin');
    expect(plugins[1].name).toBe('another-plugin');
  });

  test('should handle errors when loading plugins from directory', () => {
    // Mock fs.readdirSync to throw an error
    (fs.readdirSync as jest.Mock).mockImplementation(() => {
      throw new Error('Directory error');
    });

    const loader = new PluginLoader();

    expect(() => {
      loader.loadPlugins('/plugins');
    }).toThrow('Plugin directory not found');
  });

  test('should load plugins with custom options', () => {
    const loader = new PluginLoader();
    const customOptions = {
      'another-plugin': {
        option1: 'custom-value',
      },
    };

    const plugins = loader.loadPlugins('/plugins', customOptions);

    expect(plugins).toHaveLength(2);
    expect(plugins[1].name).toBe('another-plugin');
    expect(plugins[1].options.option1).toBe('custom-value');
  });

  // Note: loadPluginsByName method doesn't exist in the actual implementation
  // These tests are commented out until the method is implemented
  /*
  test('should load specific plugins by name', () => {
    const loader = new PluginLoader();
    // Implementation needed
  });

  test('should handle non-existent plugins when loading by name', () => {
    const loader = new PluginLoader();
    // Implementation needed
  });
  */

  // Note: isValidPlugin is a private method in the actual implementation
  // These tests are commented out until the method is made public or exposed for testing
  /*
  test('should validate plugin structure', () => {
    const loader = new PluginLoader();

    // Valid plugin
    const validPlugin = {
      name: 'valid-plugin',
      initialize: () => {},
      processContent: () => '',
      processHtml: () => '',
      getAssets: () => [],
    };
    // expect(loader.isValidPlugin(validPlugin)).toBe(true);
  });
  */
});
