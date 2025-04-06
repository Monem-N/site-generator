import { TestConfig, ComponentTemplate } from '../types';
import path from 'path';
import fs from 'fs/promises';

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

  private async generateUnitTests(components: ComponentTemplate[]): Promise<void> {
    if (!this.config.components.unit) return;

    for (const component of components) {
      const testContent = this.generateUnitTestContent(component);
      const testPath = this.getTestFilePath(component.path, 'unit');
      await this.writeTestFile(testPath, testContent);
    }
  }

  private async generateIntegrationTests(components: ComponentTemplate[]): Promise<void> {
    if (!this.config.components.integration) return;

    for (const component of components) {
      const testContent = this.generateIntegrationTestContent(component);
      const testPath = this.getTestFilePath(component.path, 'integration');
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
    // Add assertions based on expected behavior
  });`);
    }

    if (component.content.includes('onChange')) {
      tests.push(`
  it('handles input changes', async () => {
    const user = userEvent.setup();
    render(<${component.name} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');
    expect(input).toHaveValue('test value');
  });`);
    }

    return tests.join('\n');
  }

  private generateIntegrationScenarios(component: ComponentTemplate): string {
    // Generate integration scenarios based on component relationships
    const scenarios: string[] = [];

    scenarios.push(`
  it('maintains state across component interactions', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <${component.name} />
        {/* Add related components here */}
      </div>
    );
    // Add integration test scenarios
  });`);

    return scenarios.join('\n');
  }

  private getTestFilePath(componentPath: string, type: 'unit' | 'integration'): string {
    const dir = path.dirname(componentPath);
    const filename = path.basename(componentPath, path.extname(componentPath));
    return path.join(dir, '__tests__', `${filename}.${type}.test.tsx`);
  }

  private getRelativeImportPath(componentPath: string): string {
    const testDir = path.dirname(componentPath);
    const componentDir = path.dirname(componentPath);
    return path.relative(testDir, componentPath).replace(/\.[jt]sx?$/, '');
  }

  private async writeTestFile(testPath: string, content: string): Promise<void> {
    const testDir = path.dirname(testPath);
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testPath, content, 'utf-8');
  }
}