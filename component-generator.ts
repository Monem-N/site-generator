import { ContentModel, ComponentTemplate, DesignSystem } from './types';

// Core component generator
export class ComponentGenerator {
  private designSystem: DesignSystem;
  private templateRegistry: Map<string, ComponentTemplate>;

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

  public registerTemplate(type: string, template: ComponentTemplate): void {
    this.templateRegistry.set(type, template);
  }

  public async generateComponent(contentElement: any): Promise<string> {
    const elementType = contentElement.type;
    const template = this.templateRegistry.get(elementType);

    if (!template) {
      throw new Error(`No template registered for element type: ${elementType}`);
    }

    // Generate component based on content model and design system
    const componentCode = await template.generate(contentElement, this.designSystem);
    return this.applyDesignSystem(componentCode, elementType);
  }

  private applyDesignSystem(componentCode: string, elementType: string): string {
    // Apply design system styling and components
    const dsConfig = this.designSystem.getConfigForType(elementType);

    // Replace placeholder classes with design system classes
    let styledCode = componentCode;
    for (const [placeholder, actualClass] of Object.entries(dsConfig.classMapping)) {
      styledCode = styledCode.replace(new RegExp(`{${placeholder}}`, 'g'), actualClass as string);
    }

    // Add design system imports if needed
    const imports = this.generateImports(dsConfig.components);

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
    for (const element of contentModel.elements) {
      const component = await this.generateComponent(element);
      components.push(component);
    }

    // Combine into page component
    return this.assemblePage(components, contentModel.metadata);
  }

  private assemblePage(components: string[], metadata: any): string {
    const pageTitle = metadata.title || 'Generated Page';
    const imports = this.generatePageImports();

    return `
${imports}

export default function ${this.sanitizeComponentName(pageTitle)}() {
  return (
    <div className={${this.designSystem.classNames.pageContainer}}>
      ${components.join('\n      ')}
    </div>
  );
}
`;
  }

  private generatePageImports(): string {
    const baseImports = `import React from 'react';`;
    const dsImports = `import { ${this.designSystem.pageComponents.join(', ')} } from '${
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
class SectionTemplate implements ComponentTemplate {
  async generate(element: any, designSystem: DesignSystem): Promise<string> {
    const { title, level, content } = element;

    // Determine heading level
    const HeadingTag = `h${level}`;

    return `
<section className="{section-container}">
  <${HeadingTag} className="{heading-${level}}">${title}</${HeadingTag}>
  <div className="{content-container}">
    ${this.renderContent(content, designSystem)}
  </div>
</section>
`;
  }

  private renderContent(content: any[], designSystem: DesignSystem): string {
    // Implementation would render different content types
    return content
      .map(item => {
        if (item.type === 'paragraph') {
          return `<p className="{paragraph}">${item.content.join(' ')}</p>`;
        }
        // Handle other content types
        return '';
      })
      .join('\n    ');
  }
}

class CodeBlockTemplate implements ComponentTemplate {
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

class APIEndpointTemplate implements ComponentTemplate {
  async generate(element: any, designSystem: DesignSystem): Promise<string> {
    const { method, endpoint, parameters, responses } = element;

    return `
<div className="{api-endpoint-container}">
  <div className="{endpoint-header} {method-${method.toLowerCase()}}">
    <span className="{http-method}">${method}</span>
    <span className="{endpoint-path}">${endpoint}</span>
  </div>
  <div className="{endpoint-body}">
    ${this.renderParameters(parameters)}
    ${this.renderResponses(responses)}
  </div>
</div>
`;
  }

  private renderParameters(parameters: any[]): string {
    if (!parameters || parameters.length === 0) {
      return '';
    }

    return `
    <div className="{parameters-section}">
      <h4 className="{section-title}">Parameters</h4>
      <table className="{parameters-table}">
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
        </tbody>
      </table>
    </div>
    `;
  }

  private renderResponses(responses: any): string {
    if (!responses || Object.keys(responses).length === 0) {
      return '';
    }

    return `
    <div className="{responses-section}">
      <h4 className="{section-title}">Responses</h4>
      <div className="{responses-container}">
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

class TableTemplate implements ComponentTemplate {
  async generate(element: any, designSystem: DesignSystem): Promise<string> {
    const { headers, rows } = element;

    return `
<div className="{table-container}">
  <table className="{table}">
    <thead>
      <tr>
        ${headers
          .map((header: string) => `<th className="{table-header}">${header}</th>`)
          .join('\n        ')}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row: string[]) => `
      <tr className="{table-row}">
        ${row.map((cell: string) => `<td className="{table-cell}">${cell}</td>`).join('\n        ')}
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

class NavigationTemplate implements ComponentTemplate {
  async generate(element: any, designSystem: DesignSystem): Promise<string> {
    const { items } = element;

    return `
<nav className="{navigation-container}">
  <ul className="{nav-list}">
    ${items
      .map(
        (item: any) => `
    <li className="{nav-item}">
      <a href="${item.path}" className="{nav-link}${item.active ? ' {nav-link-active}' : ''}">
        ${item.label}
      </a>
      ${item.children ? this.renderSubItems(item.children) : ''}
    </li>
    `
      )
      .join('\n    ')}
  </ul>
</nav>
`;
  }

  private renderSubItems(items: any[]): string {
    return `
    <ul className="{nav-sublist}">
      ${items
        .map(
          (item: any) => `
      <li className="{nav-subitem}">
        <a href="${item.path}" className="{nav-sublink}${
            item.active ? ' {nav-sublink-active}' : ''
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

// Type definitions would be in a separate file
// This is for illustration purposes
interface ComponentTemplate {
  generate(element: any, designSystem: DesignSystem): Promise<string>;
}
