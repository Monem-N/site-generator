import { ContentModel, ComponentTemplate, DesignSystem } from './types';
export declare class ComponentGenerator {
    private designSystem;
    private templateRegistry;
    constructor(designSystem: DesignSystem);
    private registerDefaultTemplates;
    registerTemplate(type: string, template: ComponentTemplate): void;
    generateComponent(contentElement: any): Promise<string>;
    private applyDesignSystem;
    private generateImports;
    generatePage(contentModel: ContentModel): Promise<string>;
    private assemblePage;
    private generatePageImports;
    private sanitizeComponentName;
}
interface ComponentTemplate {
    generate(element: any, designSystem: DesignSystem): Promise<string>;
}
export {};
