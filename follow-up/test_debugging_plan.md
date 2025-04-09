# Test Debugging and Improvement Plan

## Current Testing Issues

The project currently faces several testing challenges:

1. **NavigationGenerator Tests**:

   - Tests hang during execution
   - Potential infinite loops or unresolved promises
   - Issues with mocking file system operations

2. **Async Testing Patterns**:

   - Inconsistent use of async/await in tests
   - Promises not properly resolved or rejected
   - Timeout issues in complex tests

3. **Mocking Implementation**:

   - Inconsistent mocking strategies
   - Mock implementations don't match actual behavior
   - Missing mocks for some dependencies

4. **Test Coverage**:
   - Uneven test coverage across the codebase
   - Some core components lack comprehensive tests
   - Edge cases not adequately tested

## Detailed Debugging and Improvement Plan

### 1. Debug NavigationGenerator Tests

#### Step 1: Add Detailed Logging

```typescript
// Add to NavigationGenerator.ts
private log(message: string, ...args: unknown[]): void {
  if (process.env.DEBUG === 'true') {
    console.log(`[NavigationGenerator] ${message}`, ...args);
  }
}

// Use in methods
public async generate(): Promise<NavigationData> {
  this.log('Starting generation');
  // ... existing code
  this.log('Finished generation');
  return result;
}
```

#### Step 2: Create Isolated Test Cases

- Create smaller test files that test individual methods
- Simplify test setup to identify problematic areas
- Add timeouts to prevent infinite hangs

```typescript
// Example of an isolated test
test('should process a single file correctly', async () => {
  // Simplified setup
  const mockFs = {
    readdir: jest.fn().mockResolvedValue(['file.md']),
    stat: jest.fn().mockResolvedValue({ isDirectory: () => false }),
    readFile: jest.fn().mockResolvedValue('# Title\nContent'),
  };

  const generator = new NavigationGenerator('/source', [], mockFs);

  // Set timeout to catch hangs
  jest.setTimeout(1000);

  const result = await generator.processSingleFile('/source/file.md');
  expect(result).toBeDefined();
  // More assertions...
});
```

#### Step 3: Fix Mock Implementations

- Ensure mocks return appropriate values
- Add proper error handling in mocks
- Match mock behavior to actual implementations

```typescript
// Before
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
  },
}));

// After
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn().mockImplementation(async path => {
      if (!path || typeof path !== 'string') {
        throw new Error('Invalid path');
      }
      if (path === '/empty') {
        return [];
      }
      return ['file1.md', 'file2.md', 'directory'];
    }),
    stat: jest.fn().mockImplementation(async path => {
      if (!path || typeof path !== 'string') {
        throw new Error('Invalid path');
      }
      return {
        isDirectory: () => path.includes('directory'),
        isFile: () => path.includes('file'),
      };
    }),
    readFile: jest.fn().mockImplementation(async path => {
      if (!path || typeof path !== 'string') {
        throw new Error('Invalid path');
      }
      return '# Mock Content\n\nThis is mock content.';
    }),
  },
}));
```

### 2. Improve Async Testing Patterns

#### Step 1: Standardize Async Test Structure

```typescript
// Template for async tests
test('should do something asynchronously', async () => {
  // Arrange
  const input = 'test';

  // Act
  const result = await functionUnderTest(input);

  // Assert
  expect(result).toBe('expected output');
});
```

#### Step 2: Add Proper Error Handling

```typescript
test('should handle errors correctly', async () => {
  // Arrange
  const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

  // Act & Assert
  await expect(async () => {
    await functionThatCallsMockFn(mockFn);
  }).rejects.toThrow('Test error');

  expect(mockFn).toHaveBeenCalled();
});
```

#### Step 3: Create Async Test Utilities

```typescript
// test-utils.ts
export async function expectAsyncError(
  fn: () => Promise<any>,
  errorMessage?: string
): Promise<void> {
  let error: Error | undefined;

  try {
    await fn();
  } catch (e) {
    error = e as Error;
  }

  expect(error).toBeDefined();
  if (errorMessage) {
    expect(error?.message).toContain(errorMessage);
  }
}

// Usage
test('should throw an error', async () => {
  await expectAsyncError(() => functionThatThrows(), 'Expected error message');
});
```

### 3. Standardize Mocking Strategy

#### Step 1: Create Mock Factory Functions

```typescript
// test-utils.ts
export function createFsMock(
  options: {
    files?: Record<string, string>;
    directories?: string[];
  } = {}
) {
  const { files = {}, directories = [] } = options;

  return {
    promises: {
      readdir: jest.fn().mockImplementation(async path => {
        if (directories.includes(path)) {
          return Object.keys(files).filter(file => file.startsWith(path));
        }
        throw new Error(`Directory not found: ${path}`);
      }),
      stat: jest.fn().mockImplementation(async path => {
        const isDir = directories.includes(path);
        const isFile = Object.keys(files).includes(path);

        return {
          isDirectory: () => isDir,
          isFile: () => isFile,
        };
      }),
      readFile: jest.fn().mockImplementation(async path => {
        if (files[path]) {
          return files[path];
        }
        throw new Error(`File not found: ${path}`);
      }),
    },
  };
}

// Usage
test('should process files correctly', async () => {
  const mockFs = createFsMock({
    files: {
      '/source/file1.md': '# Title 1\nContent 1',
      '/source/file2.md': '# Title 2\nContent 2',
    },
    directories: ['/source'],
  });

  jest.mock('fs', () => mockFs);

  // Test implementation...
});
```

#### Step 2: Document Mocking Patterns

- Create a mocking guide for the project
- Document common mocking patterns
- Provide examples for different types of dependencies

#### Step 3: Create Mock Implementations for Core Services

- Create standard mocks for file system
- Create standard mocks for template engines
- Create standard mocks for parsers

### 4. Improve Test Coverage

#### Step 1: Analyze Current Coverage

- Run Jest with coverage reporting
- Identify areas with low coverage
- Prioritize critical components

```bash
npx jest --coverage
```

#### Step 2: Create Test Plan for Uncovered Areas

- List components that need more tests
- Prioritize based on importance and complexity
- Create a schedule for adding tests

#### Step 3: Add Tests for Edge Cases

- Identify potential edge cases
- Add tests for error conditions
- Add tests for boundary conditions

### 5. Implementation Timeline

| Task                             | Estimated Time | Priority |
| -------------------------------- | -------------- | -------- |
| Add Detailed Logging             | 0.5 day        | High     |
| Create Isolated Test Cases       | 1 day          | High     |
| Fix Mock Implementations         | 1-2 days       | High     |
| Standardize Async Test Structure | 1 day          | Medium   |
| Add Proper Error Handling        | 1 day          | Medium   |
| Create Async Test Utilities      | 0.5 day        | Medium   |
| Create Mock Factory Functions    | 1 day          | Medium   |
| Document Mocking Patterns        | 0.5 day        | Low      |
| Create Standard Mocks            | 1 day          | Medium   |
| Analyze Current Coverage         | 0.5 day        | Medium   |
| Create Test Plan                 | 0.5 day        | Medium   |
| Add Tests for Edge Cases         | 2-3 days       | Low      |

## Expected Outcomes

After implementing these changes, we expect:

1. **Reliable Tests**:

   - Tests run consistently without hanging
   - Async operations complete properly
   - Mocks behave predictably

2. **Better Test Coverage**:

   - More comprehensive test suite
   - Edge cases properly tested
   - Critical components fully covered

3. **Improved Developer Experience**:

   - Easier to write new tests
   - Faster feedback cycle
   - More confidence in code changes

4. **Better Documentation**:
   - Clear patterns for writing tests
   - Standard approaches for mocking
   - Examples for common testing scenarios

This plan addresses the core testing issues while providing a framework for ongoing test improvements. It focuses on fixing the immediate issues with hanging tests while also establishing better patterns for future test development.
