/* eslint-disable */

// Core component generator
import { ContentModel } from './types/cms.js';
import { DesignSystem } from './types/design.js';
import { ContentElement } from './types/cms.js';

export class ComponentGenerator {
  private designSystem: DesignSystem;
  private templateRegistry: Map<string, IComponentTemplate>;

  constructor(designSystem: DesignSystem) {
    this.designSystem = designSystem;
    this.templateRegistry = new Map();
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates(): void {
    // Register built-in component templates
    this.registerTemplate('section', new SectionTemplate());
    this.registerTemplate('code-block', new CodeBlockTemplate());
    this.registerTemplate('api-endpoint', new APIEndpointTemplate());
    this.registerTemplate('table', new TableTemplate());
    this.registerTemplate('navigation', new NavigationTemplate());
  }

  public registerTemplate(type: string, template: IComponentTemplate): void {
    this.templateRegistry.set(type, template);
  }

  public async generateComponent(contentElement: any): Promise<string> {
    console.log('contentElement:', contentElement);
    const elementType = contentElement.type;
    const template = this.templateRegistry.get(elementType) as IComponentTemplate;

    if (!template) {
      throw new Error(`No template registered for element type: ${elementType}`);
    }

    // Generate component based on content model and design system
    const componentCode = await template.generate(contentElement, this.designSystem);
    return this.applyDesignSystem(componentCode, elementType);
  }

  private applyDesignSystem(componentCode: string, elementType: string): string {
    // Apply design system styling and components
    if (!this.designSystem) return componentCode;
    const dsConfig = this.designSystem.getConfigForType?.(elementType);

    // Replace placeholder classes with design system classes
    let styledCode = componentCode;
    for (const [placeholder, actualClass] of Object.entries(dsConfig?.classMapping || {})) {
      styledCode = styledCode.replace(new RegExp(`{${placeholder}}`, 'g'), actualClass as string);
    }

    // Add design system imports if needed
    const imports = this.generateImports(dsConfig?.components || []);

    return `${imports}\n\n${styledCode}`;
  }

  private generateImports(components: string[]): string {
    if (components.length === 0) return '';

    const importSource = this.designSystem.importPath;
    return `import { ${components.join(', ')} } from '${importSource}';`;
  }

  public async generatePage(contentModel: ContentModel): Promise<string> {
    const components: string[] = [];

    // Generate individual components
    if (!contentModel?.elements) return '';
    for (const element of contentModel.elements) {
      const component = await this.generateComponent(element);
      components.push(component);
    }

    // Combine into page component
    return this.assemblePage(components, contentModel.metadata);
  }

  private assemblePage(components: string[], metadata: any): string {
    console.log('metadata:', metadata);
    const pageTitle = metadata.title || 'Generated Page';
    const imports = this.generatePageImports();

    return `
${imports}

export default function ${this.sanitizeComponentName(pageTitle)}() {
  return (
    <div className={${this.designSystem?.classNames?.pageContainer || ''}}>
      ${components.join('\n      ')}
    </div>
  );
}
`;
  }

  private generatePageImports(): string {
    if (!this.designSystem) return '';
    const baseImports = `import React from 'react';`;
    const dsImports = `import { ${this.designSystem?.pageComponents?.join(', ')} } from '${
      this.designSystem.importPath
    }';`;

    return `${baseImports}\n${dsImports}`;
  }

  private sanitizeComponentName(name: string): string {
    // Convert page title to valid component name
    return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^[0-9]/, 'Page');
  }
}

// Template implementations
interface IComponentTemplate {
  generate(element: any, designSystem: DesignSystem): Promise<string>;
}

class SectionTemplate implements IComponentTemplate {
  async generate(element: any, designSystem: DesignSystem): Promise<string> {
    const { title, level, content } = element;
    const dsConfig = designSystem?.getConfigForType?.('section');

    // Determine heading level
    const HeadingTag = `h${level}`;

    return `
<section className="${dsConfig?.classMapping?.sectionContainer || ''}">
  <${HeadingTag} className="${
      dsConfig?.classMapping?.[`heading${level}`] || ''
    }">${title}</${HeadingTag}>
  <div className="${dsConfig?.classMapping?.contentContainer || ''}">
    ${this.renderContent(content, dsConfig)}
  </div>
</section>
`;
  }

  private renderContent(content: any[], dsConfig: any): string {
    return content
      .map(item => {
        if (item.type === 'paragraph') {
          return `<p className="${dsConfig?.classMapping?.paragraph || ''}">${item.content.join(
            ' '
          )}</p>`;
        }
        // Handle other content types
        return '';
      })
      .join('\n    ');
  }
}

class CodeBlockTemplate implements IComponentTemplate {
  async generate(element: any, designSystem: DesignSystem): Promise<string> {
    const { language, content } = element;

    return `
<div className="{code-block-container}">
  <div className="{code-block-header}">
    <span className="{code-language-badge}">${language}</span>
  </div>
  <pre className="{code-pre}">
    <code className="{code} {code-${language}}">
      ${this.escapeCode(content.join('\n'))}
    </code>
  </pre>
</div>
`;
  }

  private escapeCode(code: string): string {
    // Escape HTML special characters
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

class APIEndpointTemplate implements IComponentTemplate {
  async generate(element: any, designSystem: DesignSystem): Promise<string> {
    const { method, endpoint, parameters, responses } = element;
    const dsConfig = designSystem?.getConfigForType?.('api-endpoint');

    return `
<div className="${dsConfig?.classMapping?.apiEndpointContainer || ''}">
  <div className="${dsConfig?.classMapping?.endpointHeader || ''} ${
      dsConfig?.classMapping?.[`method${method.toLowerCase()}`] || ''
    }">
    <span className="${dsConfig?.classMapping?.httpMethod || ''}">${method}</span>
    <span className="${dsConfig?.classMapping?.endpointPath || ''}">${endpoint}</span>
  </div>
  <div className="${dsConfig?.classMapping?.endpointBody || ''}">
    ${this.renderParameters(parameters, designSystem)}
    ${this.renderResponses(responses, designSystem)}
  </div>
</div>
`;
  }

  private renderParameters(parameters: any[], designSystem: DesignSystem): string {
    const dsConfig = designSystem?.getConfigForType?.('api-endpoint');
    if (!parameters || parameters.length === 0) {
      return '';
    }

    return `
    <div className="${dsConfig?.classMapping?.parametersSection || ''}">
      <h4 className="${dsConfig?.classMapping?.sectionTitle || ''}">Parameters</h4>
      <table className="${dsConfig?.classMapping?.parametersTable || ''}">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Description</th>
            <th>Required</th>
          </tr>
        </thead>
        <tbody>
          ${parameters
            .map(
              param => `
          <tr>
            <td>${param.name}</td>
            <td>${param.type}</td>
            <td>${param.description}</td>
            <td>${param.required ? 'Yes' : 'No'}</td>
          </tr>
          `
            )
            .join('')}
      </table>
    </div>
    `;
  }

  private renderResponses(responses: any, designSystem: DesignSystem): string {
    const dsConfig = designSystem?.getConfigForType?.('api-endpoint');
    if (!responses || Object.keys(responses).length === 0) {
      return '';
    }

    return `
    <div className="${dsConfig?.classMapping?.responsesSection || ''}">
      <h4 className="${dsConfig?.classMapping?.sectionTitle || ''}">Responses</h4>
      <div className="${dsConfig?.classMapping?.responsesContainer || ''}">
        ${Object.entries(responses)
          .map(
            ([code, response]: [string, any]) => `
        <div className="{response-item} {response-${this.getResponseClass(code)}}">
          <div className="{response-code}">${code}</div>
          <div className="{response-description}">${response.description}</div>
        </div>
        `
          )
          .join('')}
      </div>
    </div>
    `;
  }

  private getResponseClass(code: string): string {
    const codeNum = parseInt(code, 10);
    if (codeNum < 300) return 'success';
    if (codeNum < 400) return 'redirect';
    if (codeNum < 500) return 'client-error';
    return 'server-error';
  }
}

class TableTemplate implements IComponentTemplate {
  async generate(element: any, designSystem: DesignSystem): Promise<string> {
    const { headers, rows } = element;
    const dsConfig = designSystem?.getConfigForType?.('table');

    return `
<div className="${dsConfig?.classMapping?.tableContainer || ''}">
  <table className="${dsConfig?.classMapping?.table || ''}">
    <thead>
      <tr>
        ${headers
          .map(
            (header: string) =>
              `<th className="${dsConfig?.classMapping?.tableHeader || ''}">${header}</th>`
          )
          .join('\n        ')}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row: string[]) => `
      <tr className="${dsConfig?.classMapping?.tableRow || ''}">
        ${row
          .map(
            (cell: string) =>
              `<td className="${dsConfig?.classMapping?.tableCell || ''}">${cell}</td>`
          )
          .join('\n        ')}
      </tr>
      `
        )
        .join('\n      ')}
    </tbody>
  </table>
</div>
`;
  }
}

class NavigationTemplate implements IComponentTemplate {
  async generate(element: any, designSystem: DesignSystem): Promise<string> {
    const { items } = element;
    const dsConfig = designSystem?.getConfigForType?.('navigation');

    return `
<nav className="${dsConfig?.classMapping?.navigationContainer || ''}">
  <ul className="${dsConfig?.classMapping?.navList || ''}">
    ${items
      .map(
        (item: any) => `
    <li className="${dsConfig?.classMapping?.navItem || ''}">
      <a href="${item.path}" className="${dsConfig?.classMapping?.navLink || ''}${
          item.active ? ' ' + (dsConfig?.classMapping?.navLinkActive || '') : ''
        }">
        ${item.label}
      </a>
      ${item.children ? this.renderSubItems(item.children, dsConfig) : ''}
    </li>
    `
      )
      .join('\n    ')}
  </ul>
</nav>
`;
  }

  private renderSubItems(items: any[], dsConfig?: any): string {
    return `
    <ul className="${dsConfig?.classMapping?.navSublist || ''}">
      ${items
        .map(
          (item: any) => `
      <li className="${dsConfig?.classMapping?.navSubitem || ''}">
        <a href="${item.path}" className="${dsConfig?.classMapping?.navSublink || ''}${
            item.active ? ' ' + (dsConfig?.classMapping?.navSublinkActive || '') : ''
          }">
          ${item.label}
        </a>
      </li>
      `
        )
        .join('\n      ')}
    </ul>
    `;
  }
}

// Test

async function testComponentGenerator() {
  const designSystem: DesignSystem = {
    type: 'custom',
    importPath: 'test',
    classNames: {
      pageContainer: 'test',
    },
  };
  const componentGenerator = new ComponentGenerator(designSystem);
  const contentElement: ContentElement = {
    type: 'section',
    title: 'Test Section',
    level: 1,
    content: [],
  };
  await componentGenerator.generateComponent(contentElement);

  const contentModel: ContentModel = {
    id: 'test',
    contentType: 'page',
    title: 'Test Page',
    slug: 'test-page',
    content: 'test content',
    metadata: {
      createdAt: '2024-04-07',
      updatedAt: '2024-04-07',
      locale: 'en-US',
    },
    fields: {},
    elements: [contentElement],
  };
  await componentGenerator.generatePage(contentModel);
}

testComponentGenerator();
