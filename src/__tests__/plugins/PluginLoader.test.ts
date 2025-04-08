import { PluginLoader } from '../../plugins/PluginLoader.js';
import { Plugin } from '../../../types/plugin.js';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './utils/logger.js';

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
      if (_dirPath === '/plugins') {
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
          afterParse: (parsed: any) => ({
            ...parsed,
            title: 'Enhanced by test-plugin: ' + parsed.title,
          }),
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
          beforeParse: (content: string, options: any) =>
            'Modified by another-plugin with ' + options.option1 + ': ' + content,
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

  test('should initialize with plugin directory', () => {
    const loader = new PluginLoader('/plugins');
    expect(loader).toBeDefined();
  });

  test('should load plugin from file', async () => {
    const loader = new PluginLoader('/plugins');
    const plugin = await loader.loadPluginFromFile('/plugins/test-plugin.js');

    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('test-plugin');
    expect(plugin.hooks).toBeDefined();
    expect(plugin.hooks.beforeParse).toBeDefined();
    expect(plugin.hooks.afterParse).toBeDefined();
  });

  test('should load plugin with options', async () => {
    const loader = new PluginLoader('/plugins');
    const plugin = await loader.loadPluginFromFile('/plugins/another-plugin.js');

    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('another-plugin');
    expect(plugin.options).toBeDefined();
    expect(plugin.options.option1).toBe('default-value');
    expect(plugin.hooks).toBeDefined();
    expect(plugin.hooks.beforeParse).toBeDefined();
  });

  test('should handle invalid plugin files', async () => {
    const loader = new PluginLoader('/plugins');

    await expect(loader.loadPluginFromFile('/plugins/invalid-plugin.js')).rejects.toThrow(
      'Invalid plugin format'
    );
  });

  test('should handle errors when loading plugins', async () => {
    const loader = new PluginLoader('/plugins');

    await expect(loader.loadPluginFromFile('/plugins/error-plugin.js')).rejects.toThrow(
      'Plugin error'
    );
  });

  test('should handle non-existent plugin files', async () => {
    const loader = new PluginLoader('/plugins');

    await expect(loader.loadPluginFromFile('/plugins/non-existent-plugin.js')).rejects.toThrow(
      'Plugin file not found'
    );
  });

  test('should load all plugins from directory', async () => {
    const loader = new PluginLoader('/plugins');
    const plugins = await loader.loadPluginsFromDirectory();

    // Should only load valid plugins
    expect(plugins).toHaveLength(2);
    expect(plugins[0].name).toBe('test-plugin');
    expect(plugins[1].name).toBe('another-plugin');
  });

  test('should handle errors when loading plugins from directory', async () => {
    // Mock fs.readdirSync to throw an error
    (fs.readdirSync as jest.Mock).mockImplementation(() => {
      throw new Error('Directory error');
    });

    const loader = new PluginLoader('/plugins');

    await expect(loader.loadPluginsFromDirectory()).rejects.toThrow(
      'Failed to load plugins from directory'
    );
  });

  test('should load plugins with custom options', async () => {
    const loader = new PluginLoader('/plugins');
    const customOptions = {
      'another-plugin': {
        option1: 'custom-value',
      },
    };

    const plugins = await loader.loadPluginsFromDirectory(customOptions);

    expect(plugins).toHaveLength(2);
    expect(plugins[1].name).toBe('another-plugin');
    expect(plugins[1].options.option1).toBe('custom-value');
  });

  test('should load specific plugins by name', async () => {
    const loader = new PluginLoader('/plugins');
    const plugins = await loader.loadPluginsByName(['test-plugin']);

    expect(plugins).toHaveLength(1);
    expect(plugins[0].name).toBe('test-plugin');
  });

  test('should handle non-existent plugins when loading by name', async () => {
    const loader = new PluginLoader('/plugins');

    await expect(loader.loadPluginsByName(['non-existent-plugin'])).rejects.toThrow(
      'Plugin not found'
    );
  });

  test('should validate plugin structure', () => {
    const loader = new PluginLoader('/plugins');

    // Valid plugin
    const validPlugin = {
      name: 'valid-plugin',
      version: '1.0.0',
      hooks: {
        beforeParse: () => '',
      },
    };
    expect(loader.isValidPlugin(validPlugin)).toBe(true);

    // Invalid plugin - no name
    const noNamePlugin = {
      hooks: {
        beforeParse: () => '',
      },
    };
    expect(loader.isValidPlugin(noNamePlugin)).toBe(false);

    // Invalid plugin - no hooks
    const noHooksPlugin = {
      name: 'no-hooks-plugin',
    };
    expect(loader.isValidPlugin(noHooksPlugin)).toBe(false);

    // Invalid plugin - hooks is not an object
    const invalidHooksPlugin = {
      name: 'invalid-hooks-plugin',
      hooks: 'not an object',
    };
    expect(loader.isValidPlugin(invalidHooksPlugin)).toBe(false);
  });
});
