import { validateConfig } from '../../utils/config-validator.js';

// Define interfaces for our test configurations
interface TestConfig {
  source?: string;
  output?: string;
  title?: string;
  description?: string;
  theme?: string;
  plugins?: string[];
  options?: {
    navbar?: boolean;
    sidebar?: boolean;
    search?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Use the return type directly from validateConfig
// No need for a separate type definition

describe('Config Validator', () => {
  test('should validate a valid config', () => {
    const config: TestConfig = {
      source: './docs',
      output: './build',
      title: 'Test Documentation',
      description: 'Test description',
      theme: 'default',
      plugins: ['search', 'zoom-image'],
      options: {
        navbar: true,
        sidebar: true,
        search: true,
      },
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should validate a minimal valid config', () => {
    const config: TestConfig = {
      source: './docs',
      output: './build',
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should invalidate a config without source', () => {
    const config: TestConfig = {
      output: './build',
      title: 'Test Documentation',
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Source directory is required');
  });

  test('should invalidate a config without output', () => {
    const config: TestConfig = {
      source: './docs',
      title: 'Test Documentation',
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Output directory is required');
  });

  test('should invalidate a config with invalid source type', () => {
    const config: TestConfig = {
      source: 123 as unknown as string, // Type assertion to simulate runtime type error
      output: './build',
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Source must be a string');
  });

  test('should invalidate a config with invalid output type', () => {
    const config: TestConfig = {
      source: './docs',
      output: 123 as unknown as string, // Type assertion to simulate runtime type error
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Output must be a string');
  });

  test('should invalidate a config with invalid title type', () => {
    const config: TestConfig = {
      source: './docs',
      output: './build',
      title: 123 as unknown as string, // Type assertion to simulate runtime type error
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Title must be a string');
  });

  test('should invalidate a config with invalid description type', () => {
    const config: TestConfig = {
      source: './docs',
      output: './build',
      description: 123 as unknown as string, // Type assertion to simulate runtime type error
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Description must be a string');
  });

  test('should invalidate a config with invalid theme type', () => {
    const config: TestConfig = {
      source: './docs',
      output: './build',
      theme: 123 as unknown as string, // Type assertion to simulate runtime type error
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Theme must be a string');
  });

  test('should invalidate a config with invalid plugins type', () => {
    const config: TestConfig = {
      source: './docs',
      output: './build',
      plugins: 'search' as unknown as string[], // Type assertion to simulate runtime type error
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Plugins must be an array');
  });

  test('should invalidate a config with invalid options type', () => {
    const config: TestConfig = {
      source: './docs',
      output: './build',
      options: 'options' as unknown as Record<string, unknown>, // Type assertion to simulate runtime type error
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Options must be an object');
  });

  test('should validate a config with additional properties', () => {
    const config: TestConfig = {
      source: './docs',
      output: './build',
      customProperty: 'custom value',
      anotherProperty: 42,
    };

    const result = validateConfig(config);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should handle null or undefined config', () => {
    const result = validateConfig(null as unknown as Record<string, unknown>);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Config must be an object');
  });
});
