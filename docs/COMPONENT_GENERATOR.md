# Component Generator Documentation

## Overview

The Component Generator is a crucial component in the Website Generator system, responsible for transforming parsed content into React components based on templates and design system specifications. It represents the second step in the 5-step pipeline process.

## Responsibilities

- Transforming parsed content nodes into React components
- Applying design system styling and components
- Managing component templates for different content types
- Generating code for components and pages
- Handling component composition and nesting

## Architecture

The Component Generator follows a template-based approach, where each content type (section, code block, table, etc.) has a corresponding template that defines how it should be rendered as a React component.

```
┌───────────────────┐
│ComponentGenerator │
└─────────┬─────────┘
          │ uses
          ▼
┌─────────────────────┐
│  Template Registry   │
└─────────┬───────────┘
          │ contains
          ▼
┌─────────┬─────────┬─────────┬─────────┐
│Section  │CodeBlock│API      │Table    │
│Template │Template │Endpoint │Template │
└─────────┴─────────┴─────────┴─────────┘
```

## Key Components

### ComponentGenerator Class

The main class responsible for generating components from parsed content:

```typescript
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
  
  // Additional methods...
}
```

### Component Templates

Each content type has a corresponding template that defines how it should be rendered:

- **SectionTemplate**: Renders section headings and content
- **CodeBlockTemplate**: Renders code snippets with syntax highlighting
- **APIEndpointTemplate**: Renders API documentation
- **TableTemplate**: Renders tabular data
- **NavigationTemplate**: Renders navigation elements

Each template implements a common interface with a `generate` method that transforms a content element into React component code.

### Design System Integration

The Component Generator applies design system styling and components to the generated code:

```typescript
private applyDesignSystem(componentCode: string, elementType: string): string {
  // Apply design system styling and components
  const dsConfig = this.designSystem.getConfigForType(elementType);
  
  // Replace placeholder classes with design system classes
  let styledCode = componentCode;
  for (const [placeholder, actualClass] of Object.entries(dsConfig.classMapping)) {
    styledCode = styledCode.replace(
      new RegExp(`{${placeholder}}`, 'g'),
      actualClass as string
    );
  }
  
  // Add design system imports if needed
  const imports = this.generateImports(dsConfig.components);
  
  return `${imports}\n\n${styledCode}`;
}
```

## Data Structures

### ComponentTemplate

Represents a template for generating components:

```typescript
export interface ComponentTemplate {
  name: string;
  path: string;
  content: string;
  variables?: Record<string, any>;
  dependencies?: string[];
}
```

### DesignSystemConfig

Configuration for the design system:

```typescript
export interface DesignSystemConfig {
  type: 'material-ui' | 'chakra-ui' | 'custom';
  theme?: ThemeConfig;
  components?: Record<string, ComponentConfig>;
  utilities?: Record<string, string>;
}
```

## Component Generation Process

The component generation process follows these steps:

1. **Content Analysis**: The system analyzes the parsed content to determine its structure and types.

2. **Template Selection**: For each content element, the appropriate template is selected based on its type.

3. **Plugin Pre-Processing**: If plugins are registered, their `beforeGenerate` hooks are applied to the components.

4. **Component Generation**: The template generates the React component code for the content element.

5. **Design System Application**: The design system styling and components are applied to the generated code.

6. **Page Assembly**: Individual components are assembled into complete pages.

```typescript
private async generateComponents(parsedContent: ParsedContent[]): Promise<ComponentTemplate[]> {
  const components: ComponentTemplate[] = [];

  for (const content of parsedContent) {
    // Apply plugins' beforeGenerate hooks
    let currentComponents = await this.componentGenerator.generateComponent(content);
    
    for (const plugin of this.plugins) {
      if (plugin.hooks?.beforeGenerate) {
        currentComponents = await plugin.hooks.beforeGenerate(currentComponents);
      }
    }

    components.push(...currentComponents);
  }

  return components;
}
```

## Configuration

The Component Generator is configured through the `GeneratorConfig` section of the `WebsiteGeneratorConfig`:

```typescript
export interface GeneratorConfig {
  outputFormat?: 'react' | 'next' | 'gatsby';
  typescript?: boolean;
  cssFramework?: 'css-modules' | 'styled-components' | 'emotion' | 'tailwind';
  optimization?: {
    minify?: boolean;
    treeshake?: boolean;
    splitChunks?: boolean;
  };
}
```

Additional configuration options include:

```typescript
generator: GeneratorConfig & {
  templates: {
    [key: string]: string; // Template name -> path mapping
  };
  componentNaming?: {
    prefix?: string;
    suffix?: string;
    style: 'PascalCase' | 'camelCase';
  };
};
```

## Design System Integration

The Component Generator integrates with the design system through the `DesignSystemConfig`:

```typescript
designSystem: DesignSystemConfig & {
  name: string;
  importPath: string;
  theme?: Record<string, any>;
  components: {
    [key: string]: {
      import: string;
      props?: Record<string, any>;
    };
  };
  styles: {
    global?: string;
    components?: Record<string, string>;
  };
};
```

This configuration allows the Component Generator to:

- Import the appropriate design system components
- Apply design system styling to generated components
- Configure component props based on design system requirements

## Extensibility

The Component Generator is designed to be extensible in several ways:

1. **Custom Templates**: New templates can be registered for additional content types.

2. **Plugin Hooks**: Plugins can modify the components before and after generation.

3. **Design System Integration**: The system can be extended to support various design systems.

4. **Custom Component Naming**: The configuration can specify custom naming conventions for generated components.

## Integration with the Pipeline

The Component Generator is the second component in the Website Generator pipeline:

1. The WebsiteGenerator calls the `generateComponents()` method with the parsed content from the DocumentationParser.
2. The generated components are passed to the TestGenerator for test generation.
3. The Plugin System provides hooks for customization at various stages of the component generation process.

## Conclusion

The Component Generator component provides a flexible, extensible system for transforming parsed content into React components. Its template-based approach and design system integration allow for customization to meet specific requirements while maintaining a consistent interface for subsequent components in the pipeline.