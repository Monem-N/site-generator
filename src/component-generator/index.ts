import { ParsedContent } from '../../types/parser.js';
import { ComponentTemplate } from '../types/component.js';
import { DesignSystem } from '../types/design.js';

export interface ComponentGeneratorOptions {
  templates?: ComponentTemplate[];
  designSystem?: DesignSystem;
}

export class ComponentGenerator {
  private templates: ComponentTemplate[];
  private designSystem?: DesignSystem;

  constructor(options: ComponentGeneratorOptions = {}) {
    this.templates = options.templates || [];
    this.designSystem = options.designSystem;
  }

  /**
   * Register a template with the component generator
   */
  registerTemplate(template: ComponentTemplate): void {
    this.templates.push(template);
  }

  /**
   * Generate a page component from parsed content
   */
  async generatePage(content: ParsedContent): Promise<string> {
    // Find a suitable template
    const template = this.findTemplate(content);

    if (!template) {
      throw new Error(`No template found for content: ${content.title}`);
    }

    // Generate the component
    return template.generate
      ? await template.generate({ type: content.type } as { type: string }, this.designSystem)
      : `<div>${content.title}</div>`;
  }

  /**
   * Find a suitable template for the content
   */
  private findTemplate(content: ParsedContent): ComponentTemplate | undefined {
    // Try to find a template based on content type
    if (content.type) {
      const typeTemplate = this.templates.find(t => t.type === content.type);
      if (typeTemplate) return typeTemplate;
    }

    // Default to the first template
    return this.templates[0];
  }
}
