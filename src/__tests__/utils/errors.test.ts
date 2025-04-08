import {
  SiteGeneratorError,
  FileSystemError,
  ParserError,
  TemplateError,
  PluginError,
  ConfigurationError,
  tryCatch,
  tryCatchSync,
} from '../../utils/errors.js';

describe('Error Classes', () => {
  test('SiteGeneratorError should have correct properties', () => {
    const error = new SiteGeneratorError('Test error message', 'TEST_ERROR', { foo: 'bar' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SiteGeneratorError);
    expect(error.message).toBe('Test error message');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.context).toEqual({ foo: 'bar' });
    expect(error.stack).toBeDefined();
  });

  test('FileSystemError should have correct properties', () => {
    const error = new FileSystemError('File not found', {
      path: '/test/file.txt',
      operation: 'read',
    });

    expect(error).toBeInstanceOf(SiteGeneratorError);
    expect(error).toBeInstanceOf(FileSystemError);
    expect(error.message).toBe('File not found');
    expect(error.code).toBe('FS_ERROR');
    expect(error.context).toEqual({
      path: '/test/file.txt',
      operation: 'read',
    });
  });

  test('ParserError should have correct properties', () => {
    const error = new ParserError('Failed to parse content', {
      parser: 'markdown',
      filePath: '/test/file.md',
    });

    expect(error).toBeInstanceOf(SiteGeneratorError);
    expect(error).toBeInstanceOf(ParserError);
    expect(error.message).toBe('Failed to parse content');
    expect(error.code).toBe('PARSER_ERROR');
    expect(error.context).toEqual({
      parser: 'markdown',
      filePath: '/test/file.md',
    });
  });

  test('TemplateError should have correct properties', () => {
    const error = new TemplateError('Failed to render template', {
      templatePath: '/test/template.hbs',
    });

    expect(error).toBeInstanceOf(SiteGeneratorError);
    expect(error).toBeInstanceOf(TemplateError);
    expect(error.message).toBe('Failed to render template');
    expect(error.code).toBe('TEMPLATE_ERROR');
    expect(error.context).toEqual({
      templatePath: '/test/template.hbs',
    });
  });

  test('PluginError should have correct properties', () => {
    const error = new PluginError('Plugin execution failed', {
      plugin: 'test-plugin',
      hook: 'beforeParse',
    });

    expect(error).toBeInstanceOf(SiteGeneratorError);
    expect(error).toBeInstanceOf(PluginError);
    expect(error.message).toBe('Plugin execution failed');
    expect(error.code).toBe('PLUGIN_ERROR');
    expect(error.context).toEqual({
      plugin: 'test-plugin',
      hook: 'beforeParse',
    });
  });

  test('ConfigurationError should have correct properties', () => {
    const error = new ConfigurationError('Invalid configuration', {
      key: 'outputDir',
      value: null,
    });

    expect(error).toBeInstanceOf(SiteGeneratorError);
    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.message).toBe('Invalid configuration');
    expect(error.code).toBe('CONFIG_ERROR');
    expect(error.context).toEqual({
      key: 'outputDir',
      value: null,
    });
  });

  test('SiteGeneratorError should handle nested errors', () => {
    const originalError = new Error('Original error');
    const error = new SiteGeneratorError('Wrapper error', 'NESTED_ERROR', {
      cause: originalError,
    });

    expect(error.message).toBe('Wrapper error');
    expect(error.context?.cause).toBe(originalError);
  });
});

describe('tryCatch utility', () => {
  test('should return the result of the try function when it succeeds', async () => {
    const result = await tryCatch(
      async () => 'success',
      (error: Error) => `failed: ${error.message}`
    );

    expect(result).toBe('success');
  });

  test('should call the catch function when the try function throws', async () => {
    const result = await tryCatch(
      async () => {
        throw new Error('test error');
      },
      (error: Error) => `failed: ${error.message}`
    );

    expect(result).toBe('failed: test error');
  });

  test('should handle async try function', async () => {
    const result = await tryCatch(
      async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async success';
      },
      (error: Error) => `failed: ${error.message}`
    );

    expect(result).toBe('async success');
  });

  test('should handle async catch function', async () => {
    const result = await tryCatch(
      async () => {
        throw new Error('test error');
      },
      async (error: Error) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return `async failed: ${error.message}`;
      }
    );

    expect(result).toBe('async failed: test error');
  });

  test('should rethrow error when no catch function is provided', async () => {
    await expect(
      tryCatch(async () => {
        throw new Error('test error');
      })
    ).rejects.toThrow('test error');
  });

  test('should handle non-Error objects thrown', async () => {
    const result = await tryCatch(
      async () => {
        throw 'string error';
      },
      (error: unknown) => `caught: ${error}`
    );

    expect(result).toBe('caught: string error');
  });
});

describe('tryCatchSync utility', () => {
  test('should return the result of the try function when it succeeds', () => {
    const result = tryCatchSync(
      () => 'success',
      (error: Error) => `failed: ${error.message}`
    );

    expect(result).toBe('success');
  });

  test('should call the catch function when the try function throws', () => {
    const result = tryCatchSync(
      () => {
        throw new Error('test error');
      },
      (error: Error) => `failed: ${error.message}`
    );

    expect(result).toBe('failed: test error');
  });
});
