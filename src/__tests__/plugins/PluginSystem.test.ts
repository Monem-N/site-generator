import { PluginSystem } from '../../plugins/PluginSystem.js';
import { Plugin } from '../../../types/plugin.js';

describe('PluginSystem', () => {
  // Sample plugins for testing
  const mockPlugins: Plugin[] = [
    {
      name: 'test-plugin-1',
      version: '1.0.0',
      hooks: {
        beforeParse: jest.fn(content => `Modified by plugin 1: ${content}`),
        afterParse: jest.fn(parsed => ({
          ...parsed,
          title: `Enhanced by plugin 1: ${parsed.title}`,
        })),
        beforeGenerate: jest.fn(component => ({
          ...component,
          content: `Modified by plugin 1: ${component.content}`,
        })),
        afterGenerate: jest.fn(component => ({ ...component, name: `${component.name}Enhanced1` })),
      },
    },
    {
      name: 'test-plugin-2',
      version: '1.0.0',
      hooks: {
        beforeParse: jest.fn(content => `Modified by plugin 2: ${content}`),
        afterParse: jest.fn(parsed => ({
          ...parsed,
          title: `Enhanced by plugin 2: ${parsed.title}`,
        })),
        beforeGenerate: jest.fn(component => ({
          ...component,
          content: `Modified by plugin 2: ${component.content}`,
        })),
        afterGenerate: jest.fn(component => ({ ...component, name: `${component.name}Enhanced2` })),
      },
    },
  ];

  // Plugin with options
  const mockPluginWithOptions: Plugin = {
    name: 'plugin-with-options',
    version: '1.0.0',
    options: {
      option1: 'value1',
      option2: 'value2',
    },
    hooks: {
      beforeParse: jest.fn(
        (content, options) => `Modified with options (${options.option1}): ${content}`
      ),
      afterParse: jest.fn((parsed, options) => ({
        ...parsed,
        title: `Enhanced with options (${options.option2}): ${parsed.title}`,
      })),
    },
  };

  // Plugin with initialization
  const mockPluginWithInit: Plugin = {
    name: 'plugin-with-init',
    version: '1.0.0',
    initialize: jest.fn().mockResolvedValue(undefined),
    hooks: {
      beforeParse: jest.fn(content => `Modified by initialized plugin: ${content}`),
    },
  };

  // Plugin with error in hook
  const mockPluginWithError: Plugin = {
    name: 'plugin-with-error',
    version: '1.0.0',
    hooks: {
      beforeParse: jest.fn().mockImplementation(() => {
        throw new Error('Plugin hook error');
      }),
    },
  };

  beforeEach(() => {
    // Reset all mock functions
    jest.clearAllMocks();
  });

  test('should initialize with plugins', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    expect(pluginSystem).toBeDefined();
    expect(pluginSystem.getPlugins()).toHaveLength(2);
    expect(pluginSystem.getPlugins()[0].name).toBe('test-plugin-1');
    expect(pluginSystem.getPlugins()[1].name).toBe('test-plugin-2');
  });

  test('should register plugins', () => {
    const pluginSystem = new PluginSystem([]);
    expect(pluginSystem.getPlugins()).toHaveLength(0);

    pluginSystem.registerPlugin(mockPlugins[0]);
    expect(pluginSystem.getPlugins()).toHaveLength(1);
    expect(pluginSystem.getPlugins()[0].name).toBe('test-plugin-1');

    pluginSystem.registerPlugin(mockPlugins[1]);
    expect(pluginSystem.getPlugins()).toHaveLength(2);
    expect(pluginSystem.getPlugins()[1].name).toBe('test-plugin-2');
  });

  test('should initialize plugins', async () => {
    const pluginSystem = new PluginSystem([mockPluginWithInit]);
    await pluginSystem.initializePlugins();
    expect(mockPluginWithInit.initialize).toHaveBeenCalled();
  });

  test('should handle plugin initialization errors', async () => {
    const pluginWithInitError: Plugin = {
      name: 'plugin-with-init-error',
      version: '1.0.0',
      initialize: jest.fn().mockRejectedValue(new Error('Initialization error')),
      hooks: {},
    };

    const pluginSystem = new PluginSystem([pluginWithInitError]);
    await expect(pluginSystem.initializePlugins()).rejects.toThrow('Initialization error');
  });

  test('should execute beforeParse hooks', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    const content = 'Original content';
    const result = pluginSystem.executeHook('beforeParse', content);

    // Hooks should be executed in order
    expect(mockPlugins[0].hooks?.beforeParse).toHaveBeenCalledWith(content);
    expect(mockPlugins[1].hooks?.beforeParse).toHaveBeenCalledWith(
      'Modified by plugin 1: Original content'
    );
    expect(result).toBe('Modified by plugin 2: Modified by plugin 1: Original content');
  });

  test('should execute afterParse hooks', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    const parsedContent = {
      title: 'Original Title',
      content: 'Original content',
      sections: [],
      metadata: {},
    };

    const result = pluginSystem.executeHook('afterParse', parsedContent);

    // Hooks should be executed in order
    expect(mockPlugins[0].hooks?.afterParse).toHaveBeenCalledWith(parsedContent);
    expect(mockPlugins[1].hooks?.afterParse).toHaveBeenCalledWith({
      ...parsedContent,
      title: 'Enhanced by plugin 1: Original Title',
    });
    expect(result.title).toBe('Enhanced by plugin 2: Enhanced by plugin 1: Original Title');
  });

  test('should execute beforeGenerate hooks', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    const component = {
      name: 'TestComponent',
      content: 'Original component content',
    };

    const result = pluginSystem.executeHook('beforeGenerate', component);

    // Hooks should be executed in order
    expect(mockPlugins[0].hooks?.beforeGenerate).toHaveBeenCalledWith(component);
    expect(mockPlugins[1].hooks?.beforeGenerate).toHaveBeenCalledWith({
      ...component,
      content: 'Modified by plugin 1: Original component content',
    });
    expect(result.content).toBe(
      'Modified by plugin 2: Modified by plugin 1: Original component content'
    );
  });

  test('should execute afterGenerate hooks', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    const component = {
      name: 'TestComponent',
      content: 'Original component content',
    };

    const result = pluginSystem.executeHook('afterGenerate', component);

    // Hooks should be executed in order
    expect(mockPlugins[0].hooks?.afterGenerate).toHaveBeenCalledWith(component);
    expect(mockPlugins[1].hooks?.afterGenerate).toHaveBeenCalledWith({
      ...component,
      name: 'TestComponentEnhanced1',
    });
    expect(result.name).toBe('TestComponentEnhanced1Enhanced2');
  });

  test('should pass plugin options to hooks', () => {
    const pluginSystem = new PluginSystem([mockPluginWithOptions]);
    const content = 'Original content';
    const result = pluginSystem.executeHook('beforeParse', content);

    expect(mockPluginWithOptions.hooks?.beforeParse).toHaveBeenCalledWith(
      content,
      mockPluginWithOptions.options
    );
    expect(result).toBe('Modified with options (value1): Original content');
  });

  test('should handle missing hooks gracefully', () => {
    const pluginWithoutHooks: Plugin = {
      name: 'plugin-without-hooks',
      version: '1.0.0',
      hooks: {},
    };

    const pluginSystem = new PluginSystem([pluginWithoutHooks]);
    const content = 'Original content';
    const result = pluginSystem.executeHook('beforeParse', content);

    // Should return the original content unchanged
    expect(result).toBe(content);
  });

  test('should handle errors in hooks', () => {
    const pluginSystem = new PluginSystem([mockPluginWithError, mockPlugins[0]]);
    const content = 'Original content';

    // Should throw the error from the hook
    expect(() => pluginSystem.executeHook('beforeParse', content)).toThrow('Plugin hook error');

    // The second plugin's hook should not be called
    expect(mockPlugins[0].hooks?.beforeParse).not.toHaveBeenCalled();
  });

  test('should handle errors in hooks with error handling option', () => {
    const pluginSystem = new PluginSystem([mockPluginWithError, mockPlugins[0]]);
    const content = 'Original content';

    // With continueOnError=true, should not throw and continue to the next plugin
    const result = pluginSystem.executeHook('beforeParse', content, true);

    // The second plugin's hook should be called
    expect(mockPlugins[0].hooks?.beforeParse).toHaveBeenCalledWith(content);
    expect(result).toBe('Modified by plugin 1: Original content');
  });

  test('should get plugin by name', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    const plugin = pluginSystem.getPluginByName('test-plugin-1');
    expect(plugin).toBeDefined();
    expect(plugin?.name).toBe('test-plugin-1');

    // Non-existent plugin
    const nonExistentPlugin = pluginSystem.getPluginByName('non-existent-plugin');
    expect(nonExistentPlugin).toBeUndefined();
  });

  test('should check if plugin exists', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    expect(pluginSystem.hasPlugin('test-plugin-1')).toBe(true);
    expect(pluginSystem.hasPlugin('non-existent-plugin')).toBe(false);
  });

  test('should remove plugin', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    expect(pluginSystem.getPlugins()).toHaveLength(2);

    pluginSystem.removePlugin('test-plugin-1');
    expect(pluginSystem.getPlugins()).toHaveLength(1);
    expect(pluginSystem.getPlugins()[0].name).toBe('test-plugin-2');

    // Removing non-existent plugin should not throw
    expect(() => pluginSystem.removePlugin('non-existent-plugin')).not.toThrow();
  });

  test('should execute hooks with specific plugin', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    const content = 'Original content';

    // Execute hook only for the second plugin
    const result = pluginSystem.executeHookForPlugin('beforeParse', 'test-plugin-2', content);

    // Only the second plugin's hook should be called
    expect(mockPlugins[0].hooks?.beforeParse).not.toHaveBeenCalled();
    expect(mockPlugins[1].hooks?.beforeParse).toHaveBeenCalledWith(content);
    expect(result).toBe('Modified by plugin 2: Original content');
  });

  test('should handle non-existent plugin when executing specific hook', () => {
    const pluginSystem = new PluginSystem(mockPlugins);
    const content = 'Original content';

    // Execute hook for non-existent plugin
    const result = pluginSystem.executeHookForPlugin('beforeParse', 'non-existent-plugin', content);

    // No hooks should be called
    expect(mockPlugins[0].hooks?.beforeParse).not.toHaveBeenCalled();
    expect(mockPlugins[1].hooks?.beforeParse).not.toHaveBeenCalled();
    expect(result).toBe(content);
  });

  test('should handle plugin without specific hook', () => {
    const pluginWithoutSpecificHook: Plugin = {
      name: 'plugin-without-specific-hook',
      version: '1.0.0',
      hooks: {
        // Only has afterParse hook, no beforeParse
        afterParse: jest.fn(parsed => parsed),
      },
    };

    const pluginSystem = new PluginSystem([pluginWithoutSpecificHook]);
    const content = 'Original content';

    // Execute beforeParse hook which doesn't exist
    const result = pluginSystem.executeHook('beforeParse', content);

    // Should return the original content unchanged
    expect(result).toBe(content);
  });
});
