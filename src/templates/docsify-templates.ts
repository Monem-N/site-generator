import { ComponentTemplate, DesignSystem } from '../../types';

export class DocsifyTemplateManager {
  private designSystem: DesignSystem;

  constructor(designSystem: DesignSystem) {
    this.designSystem = designSystem;
  }

  public getTemplate(type: string): ComponentTemplate {
    switch (type) {
      case 'markdown':
        return new MarkdownTemplate(this.designSystem);
      case 'api':
        return new APITemplate(this.designSystem);
      case 'code':
        return new CodeTemplate(this.designSystem);
      default:
        throw new Error(`Template type '${type}' not supported`);
    }
  }
}

class MarkdownTemplate implements ComponentTemplate {
  private designSystem: DesignSystem;

  constructor(designSystem: DesignSystem) {
    this.designSystem = designSystem;
  }

  async generate(content: any): Promise<string> {
    const { title, body } = content;
    return `
      <div class="markdown-section ${this.designSystem.classNames.markdownContainer}">
        ${title ? `<h1>${title}</h1>` : ''}
        <div class="markdown-body">
          ${this.processMarkdownContent(body)}
        </div>
      </div>
    `;
  }

  private processMarkdownContent(content: string): string {
    // Apply design system styles to markdown elements
    return content
      .replace(/<h([1-6])>/g, (_, level) => 
        `<h${level} class="${this.designSystem.classNames[`heading${level}`]}">`);
  }
}

class APITemplate implements ComponentTemplate {
  private designSystem: DesignSystem;

  constructor(designSystem: DesignSystem) {
    this.designSystem = designSystem;
  }

  async generate(content: any): Promise<string> {
    const { method, endpoint, parameters, responses } = content;
    return `
      <div class="api-section ${this.designSystem.classNames.apiContainer}">
        <div class="api-method ${method.toLowerCase()}">
          <span class="method">${method}</span>
          <span class="endpoint">${endpoint}</span>
        </div>
        ${this.generateParameters(parameters)}
        ${this.generateResponses(responses)}
      </div>
    `;
  }

  private generateParameters(parameters: any[]): string {
    if (!parameters?.length) return '';
    return `
      <div class="parameters">
        <h3>Parameters</h3>
        <table class="${this.designSystem.classNames.table}">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${parameters.map(param => `
              <tr>
                <td>${param.name}</td>
                <td>${param.type}</td>
                <td>${param.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateResponses(responses: any): string {
    if (!responses) return '';
    return `
      <div class="responses">
        <h3>Responses</h3>
        ${Object.entries(responses).map(([code, response]: [string, any]) => `
          <div class="response-code">
            <span class="code">${code}</span>
            <span class="description">${response.description}</span>
          </div>
          ${response.example ? `
            <pre><code class="language-json">
              ${JSON.stringify(response.example, null, 2)}
            </code></pre>
          ` : ''}
        `).join('')}
      </div>
    `;
  }
}

class CodeTemplate implements ComponentTemplate {
  private designSystem: DesignSystem;

  constructor(designSystem: DesignSystem) {
    this.designSystem = designSystem;
  }

  async generate(content: any): Promise<string> {
    const { language, code, filename } = content;
    return `
      <div class="code-section ${this.designSystem.classNames.codeContainer}">
        ${filename ? `<div class="filename">${filename}</div>` : ''}
        <pre><code class="language-${language}">
          ${this.escapeHtml(code)}
        </code></pre>
      </div>
    `;
  }

  private escapeHtml(str: string): string {
    const escapeMap: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => escapeMap[m]);
  }
}