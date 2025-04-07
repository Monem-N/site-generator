# Test Improvements

This document outlines specific recommendations for improving the test suite in the Site Generator project.

## Current Test Issues

Based on the test failures observed after fixing the TypeScript errors, the following issues need to be addressed:

### 1. Missing Component Generator Module

The tests reference a `component-generator` module that doesn't exist in the codebase:

```typescript
import { ComponentGenerator } from '../../component-generator';
```

### 2. Mock Issues in Tests

The tests are trying to mock fs functions but the mocks are not set up correctly:

```typescript
(fs.readdir as jest.Mock).mockImplementation((dirPath: string, options) => {
  // ...
});
```

### 3. ContentNode Type Issues

The test data is missing the required 'type' property for ContentNode objects:

```typescript
{
  level: 1,
  title: 'Test Document',
  content: 'This is a test document with some content.',
}
```

### 4. Path Issues in TestGenerator

There's an issue with the path.relative function in the TestGenerator:

```typescript
return path.relative(testDir, componentPath).replace(/\.[jt]sx?$/, '');
```

## Recommended Fixes

### 1. Create Component Generator Module

Create a minimal implementation of the ComponentGenerator class:

```typescript
// src/component-generator/index.ts
import { ParsedContent } from '../types/parser';

export class ComponentGenerator {
  constructor(private options: any = {}) {}

  async generatePage(content: ParsedContent): Promise<string> {
    // Minimal implementation for testing
    return `<div>${content.title}</div>`;
  }
}
```

### 2. Fix Mock Issues in Tests

Update the mock implementations to use proper type assertions:

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

### 3. Update ContentNode Test Data

Add the required 'type' property to ContentNode objects in test data:

```typescript
// Before
{
  level: 1,
  title: 'Test Document',
  content: 'This is a test document with some content.',
}

// After
{
  type: 'section',
  level: 1,
  title: 'Test Document',
  content: 'This is a test document with some content.',
}
```

### 4. Fix Path Issues in TestGenerator

The getRelativeImportPath method has been updated to handle undefined paths:

```typescript
private getRelativeImportPath(componentPath: string): string {
  // Check if componentPath is defined
  if (!componentPath) {
    return '';
  }

  const testDir = path.dirname(componentPath);
  const relativePath = path.relative(testDir, componentPath);

  // Check if relativePath is defined before calling replace
  return relativePath ? relativePath.replace(/\.[jt]sx?$/, '') : '';
}
```

## Test Coverage Improvements

### 1. Unit Tests for Critical Components

Add unit tests for the following critical components:

- **ParserService**: Test parsing different file formats
- **PluginSystem**: Test plugin registration and execution
- **DocsifyWebsiteGenerator**: Test website generation with different configurations

### 2. Integration Tests

Add integration tests for the following scenarios:

- **End-to-End Generation**: Test the complete generation process
- **Plugin Integration**: Test how plugins interact with the generation process
- **Theme Integration**: Test how themes are applied to the generated website

### 3. Test Utilities

Create test utilities to simplify test setup:

```typescript
// src/__tests__/utils/test-helpers.ts
import { ParsedContent } from '../../types/parser';

export function createMockParsedContent(overrides = {}): ParsedContent {
  return {
    title: 'Test Document',
    description: 'Test description',
    content: 'Test content',
    metadata: {},
    sections: [
      {
        type: 'section',
        title: 'Test Section',
        content: 'Test section content',
      },
    ],
    assets: [],
    references: [],
    ...overrides,
  };
}
```

## Test Organization

### 1. Test Structure

Organize tests into the following categories:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test interactions between components
- **End-to-End Tests**: Test the complete generation process

### 2. Test Naming Conventions

Use descriptive test names that follow this pattern:

```
[Component/Feature] should [expected behavior] when [condition]
```

Examples:

- "ParserService should parse Markdown files correctly"
- "PluginSystem should apply plugins in the correct order"
- "DocsifyWebsiteGenerator should generate a valid website structure"

### 3. Test Setup and Teardown

Use beforeEach and afterEach hooks to set up and tear down test environments:

```typescript
describe('ParserService', () => {
  let parserService: ParserService;
  let mockFileSystem: any;

  beforeEach(() => {
    mockFileSystem = {
      readFile: jest.fn(),
      writeFile: jest.fn(),
    };
    parserService = new ParserService({ fileSystem: mockFileSystem });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // Tests...
});
```

## Continuous Integration

### 1. GitHub Actions Workflow

Create a GitHub Actions workflow to run tests on every pull request:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

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

### 2. Code Coverage Reporting

Configure Jest to generate code coverage reports:

```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};
```

## Conclusion

Implementing these test improvements will significantly enhance the quality and reliability of the Site Generator project. By addressing the current test issues, improving test coverage, and setting up continuous integration, we can ensure that the codebase remains stable and maintainable as it evolves.
