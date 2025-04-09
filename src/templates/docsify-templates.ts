import { ComponentTemplate } from '../../types/component.js';
import { DesignSystem } from '../../types/design.js';
import { ContentElement } from '../../types/cms.js';

export class DocsifyTemplateManager {
  private _designSystem: DesignSystem;

  constructor(_designSystem: DesignSystem) {
    this._designSystem = _designSystem;
  }

  public getTemplate(type: string): ComponentTemplate {
    switch (type) {
      case 'markdown':
        return new MarkdownTemplate(this._designSystem);
      case 'api':
        return new APITemplate(this._designSystem);
      case 'code':
        return new CodeTemplate(this._designSystem);
      default:
        throw new Error(`Template type '${type}' not supported`);
    }
  }
}

class MarkdownTemplate implements ComponentTemplate {
  name = 'markdown-template';
  path = 'templates/markdown.html';
  content = '';
  type = 'markdown';
  private _designSystem: DesignSystem;

  constructor(_designSystem: DesignSystem) {
    this._designSystem = _designSystem;
  }

  async generate(element: ContentElement): Promise<string> {
    const content = element as unknown as { title?: string; body: string };
    const { title, body } = content;
    return `
      <div class="markdown-section ${this._designSystem.classNames?.markdownContainer || ''}">
        ${title ? `<h1>${title}</h1>` : ''}
        <div class="markdown-body">
          ${this.processMarkdownContent(body)}
        </div>
      </div>
    `;
  }

  private processMarkdownContent(content: string): string {
    return content.replace(
      /<h([1-6])>/g,
      (_, level) =>
        `<h${level} class="${this._designSystem.classNames?.[`heading${level}`] || ''}">`
    );
  }
}

class APITemplate implements ComponentTemplate {
  name = 'api-template';
  path = 'templates/api.html';
  content = '';
  type = 'api';
  private _designSystem: DesignSystem;

  constructor(_designSystem: DesignSystem) {
    this._designSystem = _designSystem;
  }

  async generate(element: ContentElement): Promise<string> {
    const content = element as unknown as {
      method: string;
      endpoint: string;
      parameters?: Array<{ name: string; type: string; description: string }>;
      responses?: Record<string, { description: string; example?: unknown }>;
    };
    const { method, endpoint, parameters, responses } = content;
    return `
      <div class="api-section ${this._designSystem.classNames?.apiContainer || ''}">
        <div class="api-method ${method.toLowerCase()}">
          <span class="method">${method}</span>
          <span class="endpoint">${endpoint}</span>
        </div>
        ${this.generateParameters(parameters)}
        ${this.generateResponses(responses)}
      </div>
    `;
  }

  private generateParameters(
    parameters?: Array<{ name: string; type: string; description: string }>
  ): string {
    if (!parameters?.length) return '';
    return `
      <div class="parameters">
        <h3>Parameters</h3>
        <table class="${this._designSystem.classNames?.table || ''}">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
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
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  private generateResponses(
    responses?: Record<string, { description: string; example?: unknown }>
  ): string {
    if (!responses) return '';
    return `
      <div class="responses">
        <h3>Responses</h3>
        ${Object.entries(responses)
          .map(
            ([code, response]: [string, { description: string; example?: unknown }]) => `
          <div class="response-code">
            <span class="code">${code}</span>
            <span class="description">${response.description}</span>
          </div>
          ${
            response.example
              ? `
            <pre><code class="language-json">
              ${JSON.stringify(response.example, null, 2)}
            </code></pre>
          `
              : ''
          }
        `
          )
          .join('')}
      </div>
    `;
  }
}

class CodeTemplate implements ComponentTemplate {
  name = 'code-template';
  path = 'templates/code.html';
  content = '';
  type = 'code';
  private _designSystem: DesignSystem;

  constructor(_designSystem: DesignSystem) {
    this._designSystem = _designSystem;
  }

  async generate(element: ContentElement): Promise<string> {
    const content = element as unknown as { language: string; code: string; filename?: string };
    const { language, code, filename } = content;
    return `
      <div class="code-section ${this._designSystem.classNames?.codeContainer || ''}">
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
      "'": '&#039;',
    };
    return str.replace(/[&<>"']/g, m => escapeMap[m]);
  }
}
