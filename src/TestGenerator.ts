import type { WebsiteGeneratorConfig } from '../config/generator.config';
import { ComponentConfig } from '../types/component';
import * as path from 'path';
import * as fs from 'fs/promises';

export class TestGenerator {
  constructor(private config: WebsiteGeneratorConfig['testing']) {}
  public async generateTests(components: ComponentConfig[]): Promise<void> {
    if (this.config.coverage?.enabled) {
      // eslint-disable-next-line no-console
      // eslint-disable-next-line no-console
      console.log(`Generating tests with ${this.config.coverage?.threshold}% coverage threshold`);
    }

    await Promise.all([
      this.generateUnitTests(components),
      this.generateIntegrationTests(components),
    ]);
  }

  private async generateUnitTests(components: ComponentConfig[]): Promise<void> {
    if (!this.config.components.unit) return;

    for (const component of components) {
      const testContent = this.generateUnitTestContent(component);
      const testPath = this.getTestFilePath(component.path, 'unit');
      await this.writeTestFile(testPath, testContent);
    }
  }

  private async generateIntegrationTests(components: ComponentConfig[]): Promise<void> {
    if (!this.config.components.integration) return;

    for (const component of components) {
      const testContent = this.generateIntegrationTestContent(component);
      const testPath = this.getTestFilePath(component.path, 'integration');
      await this.writeTestFile(testPath, testContent);
    }
  }

  private generateUnitTestContent(component: ComponentConfig): string {
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

  private generateIntegrationTestContent(component: ComponentConfig): string {
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

  private generateInteractionTests(component: ComponentConfig): string {
    // Generate tests based on component type and props
    const tests: string[] = [];

    if (component.content.includes('onClick')) {
      tests.push(`
  it('handles click events', _async () => {
    const user = userEvent.setup();
    render(<${component.name} />);
    const element = screen.getByRole('button');
    await user.click(element);
    // Add assertions based on expected behavior
  });`);
    }

    if (component.content.includes('onChange')) {
      tests.push(`
  it('handles input changes', _async () => {
    const user = userEvent.setup();
    render(<${component.name} />);
    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');
    expect(input).toHaveValue('test value');
  });`);
    }

    return tests.join('\n');
  }

  private generateIntegrationScenarios(component: ComponentConfig): string {
    // Generate integration scenarios based on component relationships
    const scenarios: string[] = [];

    scenarios.push(`
  it('maintains state across component interactions', _async () => {
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
    // Check if componentPath is defined
    if (!componentPath) {
      return '';
    }

    const testDir = path.dirname(componentPath);
    const relativePath = path.relative(testDir, componentPath);

    // Check if relativePath is defined before calling replace
    return relativePath ? relativePath.replace(/\.[jt]sx?$/, '') : '';
  }

  private async writeTestFile(testPath: string, content: string): Promise<void> {
    const testDir = path.dirname(testPath);
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(testPath, content, 'utf-8');
  }
}
