# Test Improvement Plan

This document outlines a detailed plan for improving the test coverage in the Site Generator project, including specific examples of tests that should be added.

## Phase 1: Fix Existing Tests

### 1. Fix TypeScript Errors in Tests

Update the tests to work with the new TypeScript types:

```typescript
// Before
(fs.readdir as jest.Mock).mockImplementation((dirPath: string, options) => {
  // ...
});

// After
jest.spyOn(fs, 'readdir').mockImplementation((dirPath: string, options) => {
  // ...
  return Promise.resolve([]);
});
```

### 2. Fix Mock Issues

Update the mock implementations to handle type assertions correctly:

```typescript
// Before
const mockFiles = {
  '/test/source/README.md': '# Test Documentation',
  // ...
};

// After
const mockFiles: Record<string, string> = {
  '/test/source/README.md': '# Test Documentation',
  // ...
};
```

### 3. Fix Private Property Access

Update tests to use public methods or expose private methods for testing:

```typescript
// Before
generator.parseDocumentation = jest.fn().mockResolvedValue([]);

// After
// Option 1: Use a public method that calls the private method
await generator.generate(); // This internally calls parseDocumentation

// Option 2: Create a test-specific subclass
class TestableGenerator extends WebsiteGenerator {
  public async testParseDocumentation() {
    return this.parseDocumentation();
  }
}
```

## Phase 2: Add Unit Tests for Core Components

### 1. WebsiteGenerator.ts

```typescript
describe('WebsiteGenerator', () => {
  let generator: WebsiteGenerator;
  let mockFileSystem: any;

  beforeEach(() => {
    mockFileSystem = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readdir: jest.fn(),
    };
    
    generator = new WebsiteGenerator({
      sourceDir: '/test/source',
      outputDir: '/test/output',
      fileSystem: mockFileSystem,
    });
  });

  test('should initialize with default configuration', () => {
    const defaultGenerator = new WebsiteGenerator();
    expect(defaultGenerator).toBeDefined();
  });

  test('should initialize with custom configuration', () => {
    expect(generator).toBeDefined();
  });

  test('should generate website', async () => {
    // Mock the necessary methods
    jest.spyOn(generator as any, 'parseDocumentation').mockResolvedValue([]);
    jest.spyOn(generator as any, 'generateComponents').mockResolvedValue([]);
    jest.spyOn(generator as any, 'build').mockResolvedValue(true);

    // Call the generate method
    const result = await generator.generate();

    // Verify the result
    expect(result).toBe(true);
    
    // Verify the methods were called
    expect((generator as any).parseDocumentation).toHaveBeenCalled();
    expect((generator as any).generateComponents).toHaveBeenCalled();
    expect((generator as any).build).toHaveBeenCalled();
  });

  test('should handle errors during generation', async () => {
    // Mock the parseDocumentation method to throw an error
    jest.spyOn(generator as any, 'parseDocumentation').mockRejectedValue(new Error('Parse error'));

    // Call the generate method and expect it to throw
    await expect(generator.generate()).rejects.toThrow('Parse error');
  });
});
```

### 2. DocsifyWebsiteGenerator.ts

```typescript
describe('DocsifyWebsiteGenerator', () => {
  let generator: DocsifyWebsiteGenerator;
  let mockFileSystem: any;

  beforeEach(() => {
    mockFileSystem = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readdir: jest.fn(),
      copyFile: jest.fn(),
    };
    
    generator = new DocsifyWebsiteGenerator({
      sourceDir: '/test/source',
      outputDir: '/test/output',
      fileSystem: mockFileSystem,
    });
  });

  test('should initialize with default configuration', () => {
    const defaultGenerator = new DocsifyWebsiteGenerator();
    expect(defaultGenerator).toBeDefined();
  });

  test('should generate index.html with correct content', async () => {
    // Mock the necessary methods
    jest.spyOn(generator as any, 'parseDocumentation').mockResolvedValue([]);
    jest.spyOn(generator as any, 'generateComponents').mockResolvedValue([]);
    jest.spyOn(generator as any, 'build').mockResolvedValue(true);
    
    // Mock the writeFile method
    mockFileSystem.writeFile.mockResolvedValue(undefined);

    // Call the generate method
    await generator.generate();

    // Verify that writeFile was called with the correct parameters
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      '/test/output/index.html',
      expect.stringContaining('<!DOCTYPE html>'),
      expect.anything()
    );
  });

  test('should copy assets to output directory', async () => {
    // Mock the necessary methods
    jest.spyOn(generator as any, 'parseDocumentation').mockResolvedValue([]);
    jest.spyOn(generator as any, 'generateComponents').mockResolvedValue([]);
    jest.spyOn(generator as any, 'build').mockResolvedValue(true);
    
    // Mock the copyFile method
    mockFileSystem.copyFile.mockResolvedValue(undefined);

    // Call the generate method
    await generator.generate();

    // Verify that copyFile was called for assets
    expect(mockFileSystem.copyFile).toHaveBeenCalled();
  });
});
```

### 3. ParserService.ts

```typescript
describe('ParserService', () => {
  let parserService: ParserService;
  let mockFileSystem: any;

  beforeEach(() => {
    mockFileSystem = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readdir: jest.fn(),
    };
    
    parserService = new ParserService({
      fileSystem: mockFileSystem,
      extensions: ['md', 'markdown'],
      ignorePatterns: ['node_modules', '.git'],
    });
  });

  test('should initialize with default configuration', () => {
    const defaultParserService = new ParserService();
    expect(defaultParserService).toBeDefined();
  });

  test('should parse markdown file', async () => {
    // Mock the readFile method
    mockFileSystem.readFile.mockResolvedValue('# Test Document\n\nThis is a test document.');

    // Call the parse method
    const result = await parserService.parse('/test/source/document.md');

    // Verify the result
    expect(result).toEqual({
      title: 'Test Document',
      description: 'This is a test document.',
      content: '# Test Document\n\nThis is a test document.',
      sections: expect.any(Array),
      metadata: expect.any(Object),
      assets: expect.any(Array),
      references: expect.any(Array),
    });
  });

  test('should handle unsupported file format', async () => {
    // Call the parse method with an unsupported file format
    await expect(parserService.parse('/test/source/document.txt')).rejects.toThrow();
  });

  test('should apply plugins during parsing', async () => {
    // Mock the readFile method
    mockFileSystem.readFile.mockResolvedValue('# Test Document\n\nThis is a test document.');

    // Create a mock plugin
    const mockPlugin = {
      name: 'MockPlugin',
      hooks: {
        beforeParse: jest.fn().mockImplementation((content) => `Modified: ${content}`),
        afterParse: jest.fn().mockImplementation((parsed) => ({
          ...parsed,
          title: `Enhanced: ${parsed.title}`,
        })),
      },
    };

    // Add the plugin to the parser service
    parserService.addPlugin(mockPlugin);

    // Call the parse method
    const result = await parserService.parse('/test/source/document.md');

    // Verify that the plugin hooks were called
    expect(mockPlugin.hooks.beforeParse).toHaveBeenCalled();
    expect(mockPlugin.hooks.afterParse).toHaveBeenCalled();

    // Verify the result
    expect(result.title).toBe('Enhanced: Test Document');
  });
});
```

## Phase 3: Add Integration Tests

### 1. End-to-End Generation Process

```typescript
describe('End-to-End Generation Process', () => {
  let generator: WebsiteGenerator;
  let mockFileSystem: any;

  beforeEach(() => {
    mockFileSystem = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readdir: jest.fn(),
      copyFile: jest.fn(),
      mkdir: jest.fn(),
    };
    
    // Mock the readdir method to return a list of files
    mockFileSystem.readdir.mockImplementation((dirPath) => {
      if (dirPath === '/test/source') {
        return Promise.resolve(['document1.md', 'document2.md']);
      }
      return Promise.resolve([]);
    });

    // Mock the readFile method to return file content
    mockFileSystem.readFile.mockImplementation((filePath) => {
      if (filePath === '/test/source/document1.md') {
        return Promise.resolve('# Document 1\n\nThis is document 1.');
      }
      if (filePath === '/test/source/document2.md') {
        return Promise.resolve('# Document 2\n\nThis is document 2.');
      }
      return Promise.reject(new Error('File not found'));
    });

    // Create the generator
    generator = new WebsiteGenerator({
      sourceDir: '/test/source',
      outputDir: '/test/output',
      fileSystem: mockFileSystem,
    });
  });

  test('should generate website from markdown files', async () => {
    // Call the generate method
    await generator.generate();

    // Verify that writeFile was called for each document
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      '/test/output/document1.html',
      expect.stringContaining('Document 1'),
      expect.anything()
    );
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      '/test/output/document2.html',
      expect.stringContaining('Document 2'),
      expect.anything()
    );
  });
});
```

### 2. Plugin Integration

```typescript
describe('Plugin Integration', () => {
  let generator: WebsiteGenerator;
  let mockFileSystem: any;
  let mockPlugin: any;

  beforeEach(() => {
    mockFileSystem = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readdir: jest.fn(),
    };
    
    // Mock the readdir method to return a list of files
    mockFileSystem.readdir.mockImplementation((dirPath) => {
      if (dirPath === '/test/source') {
        return Promise.resolve(['document.md']);
      }
      return Promise.resolve([]);
    });

    // Mock the readFile method to return file content
    mockFileSystem.readFile.mockImplementation((filePath) => {
      if (filePath === '/test/source/document.md') {
        return Promise.resolve('# Test Document\n\nThis is a test document.');
      }
      return Promise.reject(new Error('File not found'));
    });

    // Create a mock plugin
    mockPlugin = {
      name: 'MockPlugin',
      hooks: {
        beforeParse: jest.fn().mockImplementation((content) => `Modified: ${content}`),
        afterParse: jest.fn().mockImplementation((parsed) => ({
          ...parsed,
          title: `Enhanced: ${parsed.title}`,
        })),
        beforeGenerate: jest.fn().mockImplementation((component) => ({
          ...component,
          content: `Modified: ${component.content}`,
        })),
        afterGenerate: jest.fn().mockImplementation((component) => ({
          ...component,
          content: `Enhanced: ${component.content}`,
        })),
      },
    };

    // Create the generator
    generator = new WebsiteGenerator({
      sourceDir: '/test/source',
      outputDir: '/test/output',
      fileSystem: mockFileSystem,
      plugins: [mockPlugin],
    });
  });

  test('should apply plugin hooks during generation', async () => {
    // Call the generate method
    await generator.generate();

    // Verify that the plugin hooks were called
    expect(mockPlugin.hooks.beforeParse).toHaveBeenCalled();
    expect(mockPlugin.hooks.afterParse).toHaveBeenCalled();
    expect(mockPlugin.hooks.beforeGenerate).toHaveBeenCalled();
    expect(mockPlugin.hooks.afterGenerate).toHaveBeenCalled();

    // Verify that writeFile was called with the enhanced content
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      '/test/output/document.html',
      expect.stringContaining('Enhanced:'),
      expect.anything()
    );
  });
});
```

## Phase 4: Add End-to-End Tests

### 1. CLI Commands

```typescript
describe('CLI Commands', () => {
  let mockProcess: any;
  let mockFileSystem: any;

  beforeEach(() => {
    // Mock process.argv
    mockProcess = {
      argv: ['node', 'cli.js', 'generate', '--source', '/test/source', '--output', '/test/output'],
    };

    // Mock file system
    mockFileSystem = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readdir: jest.fn(),
      mkdir: jest.fn(),
    };

    // Mock the readdir method to return a list of files
    mockFileSystem.readdir.mockImplementation((dirPath) => {
      if (dirPath === '/test/source') {
        return Promise.resolve(['document.md']);
      }
      return Promise.resolve([]);
    });

    // Mock the readFile method to return file content
    mockFileSystem.readFile.mockImplementation((filePath) => {
      if (filePath === '/test/source/document.md') {
        return Promise.resolve('# Test Document\n\nThis is a test document.');
      }
      return Promise.reject(new Error('File not found'));
    });

    // Replace the global process object with the mock
    global.process = mockProcess;
  });

  afterEach(() => {
    // Restore the global process object
    jest.restoreAllMocks();
  });

  test('should generate website from CLI command', async () => {
    // Import the CLI module
    const cli = require('../src/cli');

    // Call the CLI function
    await cli();

    // Verify that writeFile was called
    expect(mockFileSystem.writeFile).toHaveBeenCalledWith(
      '/test/output/document.html',
      expect.stringContaining('Test Document'),
      expect.anything()
    );
  });
});
```

### 2. Development Server

```typescript
describe('Development Server', () => {
  let server: any;
  let mockExpress: any;
  let mockHttp: any;
  let mockFileSystem: any;

  beforeEach(() => {
    // Mock Express
    mockExpress = {
      use: jest.fn(),
      get: jest.fn(),
      listen: jest.fn(),
    };

    // Mock HTTP server
    mockHttp = {
      listen: jest.fn(),
      close: jest.fn(),
    };

    // Mock file system
    mockFileSystem = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
      readdir: jest.fn(),
    };

    // Mock the Express module
    jest.mock('express', () => {
      return () => mockExpress;
    });

    // Mock the HTTP module
    jest.mock('http', () => {
      return {
        createServer: () => mockHttp,
      };
    });

    // Import the dev-server module
    const DevServer = require('../src/utils/dev-server').default;

    // Create the server
    server = new DevServer({
      sourceDir: '/test/source',
      outputDir: '/test/output',
      port: 3000,
      fileSystem: mockFileSystem,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should start the development server', async () => {
    // Start the server
    await server.start();

    // Verify that the server was started
    expect(mockHttp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });

  test('should serve static files', async () => {
    // Start the server
    await server.start();

    // Verify that Express.use was called with the static middleware
    expect(mockExpress.use).toHaveBeenCalledWith(expect.any(Function));
  });

  test('should handle file changes', async () => {
    // Mock the file watcher
    const mockWatcher = {
      on: jest.fn(),
      close: jest.fn(),
    };

    // Mock the chokidar module
    jest.mock('chokidar', () => {
      return {
        watch: () => mockWatcher,
      };
    });

    // Start the server
    await server.start();

    // Verify that the watcher was set up
    expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
```

## Phase 5: Set Up Continuous Integration

### 1. GitHub Actions Workflow

Create a GitHub Actions workflow file at `.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16.x'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

### 2. Jest Configuration

Update the Jest configuration in `package.json` or create a `jest.config.js` file:

```json
{
  "collectCoverage": true,
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov"],
  "coverageThreshold": {
    "global": {
      "statements": 70,
      "branches": 70,
      "functions": 70,
      "lines": 70
    }
  }
}
```

## Implementation Timeline

### Week 1: Fix Existing Tests

- Day 1-2: Fix TypeScript errors in tests
- Day 3-4: Fix mock issues
- Day 5: Fix private property access

### Week 2-3: Add Unit Tests for Core Components

- Week 2: Add tests for WebsiteGenerator.ts and DocsifyWebsiteGenerator.ts
- Week 3: Add tests for ParserService.ts and PluginLoader.ts

### Week 4: Add Integration Tests

- Day 1-2: Add tests for end-to-end generation process
- Day 3-4: Add tests for plugin integration
- Day 5: Add tests for theme application

### Week 5: Add End-to-End Tests

- Day 1-2: Add tests for CLI commands
- Day 3-4: Add tests for development server
- Day 5: Set up continuous integration

## Conclusion

By following this test improvement plan, we can significantly increase the test coverage in the Site Generator project. The plan focuses on fixing existing tests first, then adding unit tests for core components, followed by integration and end-to-end tests. This approach will provide the most value in terms of improving code quality and preventing regressions.

The implementation timeline is aggressive but achievable, with a focus on the most critical components first. By the end of the five weeks, we should have a much more robust test suite with significantly higher coverage.
