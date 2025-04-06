# Test Generator Documentation

## Overview

The Test Generator is a key component in the Website Generator system, responsible for creating automated tests for the generated components. It represents the fourth step in the 5-step pipeline process, ensuring that the generated website is not only functional but also testable and maintainable.

## Responsibilities

- Generating unit tests for individual components
- Creating integration tests for component interactions
- Configuring test coverage requirements
- Supporting different testing frameworks (Jest, Vitest)
- Generating test files with appropriate assertions and mocks

## Architecture

The Test Generator follows a template-based approach similar to the Component Generator, where test templates are applied based on component types and characteristics.

```
┌───────────────┐
│TestGenerator  │
└───────┬───────┘
        │ uses
        ▼
┌───────────────────┐
│   Test Templates  │
└─────────┬─────────┘
          │ generates
          ▼
┌─────────┬─────────┐
│Unit     │Integration│
│Tests    │Tests     │
└─────────┴─────────┘
```

## Key Components

### TestGenerator Class

The main class responsible for generating tests for components:

```typescript
export class TestGenerator {
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.config = config;
  }

  public async generateTests(components: ComponentTemplate[]): Promise<void> {
    if (this.config.coverage?.enabled) {
      console.log(`Generating tests with ${this.config.coverage.threshold}% coverage threshold`);
    }

    await Promise.all([
      this.generateUnitTests(components),
      this.generateIntegrationTests(components),
    ]);
  }

  // Additional methods...
}
```

### Unit Test Generation

The TestGenerator creates unit tests for individual components:

```typescript
private async generateUnitTests(components: ComponentTemplate[]): Promise<void> {
  if (!this.config.components.unit) return;

  for (const component of components) {
    const testContent = this.generateUnitTestContent(component);
    const testPath = this.getTestFilePath(component.path, 'unit');
    await this.writeTestFile(testPath, testContent);
  }
}

private generateUnitTestContent(component: ComponentTemplate): string {
  const { name } = component;
  const importPath = this.getRelativeImportPath(component.path);

  return `import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from '${this.config.framework}';
import ${name} from '${importPath}';

describe('${name}', () => {
  it('renders without crashing', () => {
    render(<${name} />);
    expect(screen.container).toBeTruthy();
  });

  it('matches snapshot', () => {
    const { container } = render(<${name} />);
    expect(container).toMatchSnapshot();
  });

  ${this.generateInteractionTests(component)}
});
`;
}
```

### Integration Test Generation

The TestGenerator creates integration tests for component interactions:

```typescript
private async generateIntegrationTests(components: ComponentTemplate[]): Promise<void> {
  if (!this.config.components.integration) return;

  for (const component of components) {
    const testContent = this.generateIntegrationTestContent(component);
    const testPath = this.getTestFilePath(component.path, 'integration');
    await this.writeTestFile(testPath, testContent);
  }
}

private generateIntegrationTestContent(component: ComponentTemplate): string {
  const { name } = component;
  const importPath = this.getRelativeImportPath(component.path);

  return `import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from '${this.config.framework}';
import ${name} from '${importPath}';

describe('${name} Integration', () => {
  it('integrates with other components', () => {
    render(
      <div>
        <${name} />
        {/* Add related components here */}
      </div>
    );
    expect(screen.container).toBeTruthy();
  });

  ${this.generateIntegrationScenarios(component)}
});
`;
}
```

## Data Structures

### TestConfig

Configuration for test generation:

```typescript
export interface TestConfig {
  framework: 'jest' | 'vitest';
  coverage?: {
    enabled: boolean;
    threshold?: number;
  };
  patterns?: {
    unit?: string[];
    integration?: string[];
    e2e?: string[];
  };
}
```

## Test Generation Process

The test generation process follows these steps:

1. **Component Analysis**: The system analyzes the components to determine their structure, props, and event handlers.

2. **Test Type Selection**: Based on the configuration, the system determines which types of tests to generate (unit, integration).

3. **Test Content Generation**: For each component and test type, the appropriate test content is generated.

4. **Test File Creation**: The generated test content is written to files in the appropriate locations.

```typescript
private async generateTests(components: ComponentTemplate[]): Promise<void> {
  if (!this.config.testing.components.unit &&
      !this.config.testing.components.integration) {
    return;
  }

  const testGenerator = await import('./TestGenerator').then(m => new m.TestGenerator(this.config.testing));
  await testGenerator.generateTests(components);
}
```

## Smart Test Generation

The TestGenerator includes smart test generation based on component characteristics:

### Interaction Tests

For components with event handlers, the TestGenerator creates tests for those interactions:

```typescript
private generateInteractionTests(component: ComponentTemplate): string {
  // Generate tests based on component type and props
  const tests: string[] = [];

  if (component.content.includes('onClick')) {
    tests.push(`
  it('handles click events', async () => {
    const user = userEvent.setup();
    render(<${component.name} />);
    const element = screen.getByRole('button');
    await user.click(element);
    // Add assertions here
  });
`);
  }

  // Add more interaction tests based on component analysis

  return tests.join('\n');
}
```

### Integration Scenarios

For integration tests, the TestGenerator creates scenarios based on component relationships:

```typescript
private generateIntegrationScenarios(component: ComponentTemplate): string {
  // Generate integration scenarios based on component relationships
  const scenarios: string[] = [];

  // Example: Test form submission if component is a form
  if (component.content.includes('<form')) {
    scenarios.push(`
  it('submits form data correctly', async () => {
    const user = userEvent.setup();
    render(<${component.name} />);
    // Fill form fields
    // Submit form
    // Assert on form submission
  });
`);
  }

  // Add more scenarios based on component analysis

  return scenarios.join('\n');
}
```

## Configuration

The Test Generator is configured through the `testing` section of the `WebsiteGeneratorConfig`:

```typescript
testing: {
  framework: 'jest' | 'vitest';
  coverage: {
    enabled: boolean;
    threshold?: number;
  };
  components: {
    unit: boolean;
    integration: boolean;
    e2e?: boolean;
  };
}
```

This configuration allows the Test Generator to:

- Use the appropriate testing framework
- Configure test coverage requirements
- Determine which types of tests to generate

## Integration with the Pipeline

The Test Generator is the fourth component in the Website Generator pipeline:

1. The WebsiteGenerator calls the `generateTests()` method with the styled components from the previous step.
2. The generated tests are written to files alongside the component files.
3. The Builder component can then include these tests in the build process if needed.

## Extensibility

The Test Generator is designed to be extensible in several ways:

1. **Custom Test Templates**: The system can be extended with custom test templates for specific component types.

2. **Additional Test Types**: Beyond unit and integration tests, the system can be extended to support other test types (e.g., end-to-end tests).

3. **Framework Support**: The system can be extended to support additional testing frameworks beyond Jest and Vitest.

## Conclusion

The Test Generator component provides a powerful and flexible system for creating automated tests for the generated components. Its smart test generation capabilities and framework-agnostic approach ensure that the resulting website is not only functional but also testable and maintainable.
