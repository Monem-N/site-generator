import { PluginDocsGenerator } from '../../tools/plugin-docs-generator.js';
import { Plugin } from '../../../types/plugin.js';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('PluginDocsGenerator', () => {
  let generator: PluginDocsGenerator;
  let mockPlugin1: Plugin;
  let mockPlugin2: Plugin;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock fs.existsSync to return false for directories
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    // Mock fs.mkdirSync to do nothing
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {
      return undefined;
    });

    // Define interface for fs.promises mock to replace 'any'
    interface FSPromisesMock {
      writeFile: jest.Mock;
      [key: string]: unknown; // Allow for additional properties
    }

    // Define interface for PluginDocsGenerator internals to avoid using 'any'
    interface _PluginDocsGeneratorInternals {
      plugins: Plugin[];
      [key: string]: unknown; // Allow for additional properties
    }

    // Mock fs.promises.writeFile to do nothing
    (fs.promises as unknown as FSPromisesMock) = {
      writeFile: jest.fn().mockResolvedValue(undefined),
    };

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) => paths.join('/'));

    // Create mock plugins
    mockPlugin1 = {
      name: 'test-plugin-1',
      description: 'A test plugin',
      hooks: {
        beforeParse: jest.fn(),
        afterParse: jest.fn(),
      },
      options: {
        option1: {
          type: 'string',
          description: 'Option 1 description',
          required: true,
        },
        option2: {
          type: 'boolean',
          description: 'Option 2 description',
          required: false,
          default: false,
        },
      },
    };

    mockPlugin2 = {
      name: 'test-plugin-2',
      description: 'Another test plugin',
      hooks: {
        beforeBuild: jest.fn(),
        afterBuild: jest.fn(),
      },
    };

    // Create the generator
    generator = new PluginDocsGenerator('/test/docs');
  });

  test('should initialize with the output directory', () => {
    expect(generator).toBeDefined();
  });

  test('should add plugins', () => {
    // Add plugins
    generator.addPlugin(mockPlugin1);
    generator.addPlugin(mockPlugin2);

    // Verify that the plugins were added
    expect((generator as unknown as PluginDocsGeneratorInternals).plugins).toHaveLength(2);
    expect((generator as unknown as PluginDocsGeneratorInternals).plugins[0]).toBe(mockPlugin1);
    expect((generator as unknown as PluginDocsGeneratorInternals).plugins[1]).toBe(mockPlugin2);
  });

  test('should generate documentation', async () => {
    // Add plugins
    generator.addPlugin(mockPlugin1);
    generator.addPlugin(mockPlugin2);

    // Generate documentation
    await generator.generateDocs();

    // Verify that the output directory was created
    expect(fs.existsSync).toHaveBeenCalledWith('/test/docs');
    expect(fs.mkdirSync).toHaveBeenCalledWith('/test/docs', { recursive: true });

    // Verify that the index file was generated
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      '/test/docs/README.md',
      expect.stringContaining('# Plugin Documentation'),
      undefined
    );

    // Verify that the plugin documentation files were generated
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      '/test/docs/test-plugin-1.md',
      expect.stringContaining('# test-plugin-1 Plugin'),
      undefined
    );
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      '/test/docs/test-plugin-2.md',
      expect.stringContaining('# test-plugin-2 Plugin'),
      undefined
    );
  });

  test('should generate index file with plugin links', async () => {
    // Add plugins
    generator.addPlugin(mockPlugin1);
    generator.addPlugin(mockPlugin2);

    // Generate documentation
    await generator.generateDocs();

    // Get the index file content
    const indexFileCall = (fs.promises.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/docs/README.md'
    );
    const indexContent = indexFileCall ? indexFileCall[1] : '';

    // Verify the index content
    expect(indexContent).toContain('# Plugin Documentation');
    expect(indexContent).toContain('## Available Plugins');
    expect(indexContent).toContain('- [test-plugin-1](test-plugin-1.md): A test plugin');
    expect(indexContent).toContain('- [test-plugin-2](test-plugin-2.md): Another test plugin');
  });

  test('should generate plugin documentation with hooks', async () => {
    // Add a plugin
    generator.addPlugin(mockPlugin1);

    // Generate documentation
    await generator.generateDocs();

    // Get the plugin documentation content
    const pluginDocCall = (fs.promises.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/docs/test-plugin-1.md'
    );
    const pluginDocContent = pluginDocCall ? pluginDocCall[1] : '';

    // Verify the plugin documentation content
    expect(pluginDocContent).toContain('# test-plugin-1 Plugin');
    expect(pluginDocContent).toContain('A test plugin');
    expect(pluginDocContent).toContain('## Hooks');
    expect(pluginDocContent).toContain('- `beforeParse`: Called before parsing content');
    expect(pluginDocContent).toContain('- `afterParse`: Called after parsing content');
  });

  test('should generate plugin documentation with options', async () => {
    // Add a plugin
    generator.addPlugin(mockPlugin1);

    // Generate documentation
    await generator.generateDocs();

    // Get the plugin documentation content
    const pluginDocCall = (fs.promises.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/docs/test-plugin-1.md'
    );
    const pluginDocContent = pluginDocCall ? pluginDocCall[1] : '';

    // Verify the plugin documentation content
    expect(pluginDocContent).toContain('## Options');
    expect(pluginDocContent).toContain('| Option | Type | Description | Required | Default |');
    expect(pluginDocContent).toContain('| `option1` | `string` | Option 1 description | Yes | - |');
    expect(pluginDocContent).toContain(
      '| `option2` | `boolean` | Option 2 description | No | false |'
    );
  });

  test('should handle plugins without hooks', async () => {
    // Create a plugin without hooks
    const pluginWithoutHooks: Plugin = {
      name: 'plugin-without-hooks',
      description: 'A plugin without hooks',
    };

    // Add the plugin
    generator.addPlugin(pluginWithoutHooks);

    // Generate documentation
    await generator.generateDocs();

    // Get the plugin documentation content
    const pluginDocCall = (fs.promises.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/docs/plugin-without-hooks.md'
    );
    const pluginDocContent = pluginDocCall ? pluginDocCall[1] : '';

    // Verify the plugin documentation content
    expect(pluginDocContent).toContain('## Hooks');
    expect(pluginDocContent).toContain('This plugin does not implement any hooks.');
  });

  test('should handle plugins without options', async () => {
    // Create a plugin without options
    const pluginWithoutOptions: Plugin = {
      name: 'plugin-without-options',
      description: 'A plugin without options',
      hooks: {
        beforeParse: jest.fn(),
      },
    };

    // Add the plugin
    generator.addPlugin(pluginWithoutOptions);

    // Generate documentation
    await generator.generateDocs();

    // Get the plugin documentation content
    const pluginDocCall = (fs.promises.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/docs/plugin-without-options.md'
    );
    const pluginDocContent = pluginDocCall ? pluginDocCall[1] : '';

    // Verify the plugin documentation content
    expect(pluginDocContent).toContain('## Options');
    expect(pluginDocContent).toContain('This plugin does not have any options.');
  });

  test('should handle plugins without description', async () => {
    // Create a plugin without description
    const pluginWithoutDescription: Plugin = {
      name: 'plugin-without-description',
      hooks: {
        beforeParse: jest.fn(),
      },
    };

    // Add the plugin
    generator.addPlugin(pluginWithoutDescription);

    // Generate documentation
    await generator.generateDocs();

    // Get the plugin documentation content
    const pluginDocCall = (fs.promises.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/docs/plugin-without-description.md'
    );
    const pluginDocContent = pluginDocCall ? pluginDocCall[1] : '';

    // Verify the plugin documentation content
    expect(pluginDocContent).toContain('# plugin-without-description Plugin');
    expect(pluginDocContent).toContain('No description available.');
  });

  test('should handle plugins with examples', async () => {
    // Create a plugin with examples
    const pluginWithExamples: Plugin = {
      name: 'plugin-with-examples',
      description: 'A plugin with examples',
      hooks: {
        beforeParse: jest.fn(),
      },
      examples: [
        'const plugin = new ExamplePlugin();\ngenerator.addPlugin(plugin);',
        'const plugin = new ExamplePlugin({ option: "value" });\ngenerator.addPlugin(plugin);',
      ],
    };

    // Add the plugin
    generator.addPlugin(pluginWithExamples);

    // Generate documentation
    await generator.generateDocs();

    // Get the plugin documentation content
    const pluginDocCall = (fs.promises.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/docs/plugin-with-examples.md'
    );
    const pluginDocContent = pluginDocCall ? pluginDocCall[1] : '';

    // Verify the plugin documentation content
    expect(pluginDocContent).toContain('## Examples');
    expect(pluginDocContent).toContain('```javascript');
    expect(pluginDocContent).toContain('const plugin = new ExamplePlugin();');
    expect(pluginDocContent).toContain('const plugin = new ExamplePlugin({ option: "value" });');
  });

  test('should handle plugins without examples', async () => {
    // Add a plugin without examples
    generator.addPlugin(mockPlugin1);

    // Generate documentation
    await generator.generateDocs();

    // Get the plugin documentation content
    const pluginDocCall = (fs.promises.writeFile as jest.Mock).mock.calls.find(
      call => call[0] === '/test/docs/test-plugin-1.md'
    );
    const pluginDocContent = pluginDocCall ? pluginDocCall[1] : '';

    // Verify the plugin documentation content
    expect(pluginDocContent).toContain('## Examples');
    expect(pluginDocContent).toContain('No examples available.');
  });
});
