import { ContentModel } from './types/cms';
import { DesignSystem } from './types/design';
export declare class ComponentGenerator {
  private designSystem;
  private templateRegistry;
  constructor(designSystem: DesignSystem);
  private registerDefaultTemplates;
  registerTemplate(type: string, template: IComponentTemplate): void;
  generateComponent(contentElement: any): Promise<string>;
  private applyDesignSystem;
  private generateImports;
  generatePage(contentModel: ContentModel): Promise<string>;
  private assemblePage;
  private generatePageImports;
  private sanitizeComponentName;
}
interface IComponentTemplate {
  generate(element: any, designSystem: DesignSystem): Promise<string>;
}
export {};
