# Plugin System Documentation

## Overview

The Plugin System is a fundamental component of the Website Generator architecture, providing extension points throughout the generation pipeline for customization and enhancement. It enables developers to modify the behavior of the system without changing the core codebase, following the open-closed principle of software design.

## Responsibilities

- Providing lifecycle hooks at various stages of the generation pipeline
- Supporting dynamic plugin loading and registration
- Managing plugin configuration options
- Enabling content transformation and enhancement
- Facilitating integration with external systems and tools

## Architecture

The Plugin System follows a hooks-based architecture, where plugins can register handlers for specific lifecycle events in the generation pipeline.

```
┌───────────────────┐
│   Plugin System   │
└─────────┬─────────┘
          │ provides
          ▼
┌─────────────────────────┐
│     Lifecycle Hooks     │
└─────────┬───────────────┘
          │ implemented by
          ▼
┌─────────┬─────────┬─────────┬─────────┐
│Plugin A │Plugin B │Plugin C │Plugin D │
└─────────┴─────────┴─────────┴─────────┘
```

## Key Components

### Plugin Interface

The core interface that all plugins must implement:

```typescript
export interface Plugin {
  name: string;
  version: string;
  hooks?: {
    beforeParse?: (content: string) => Promise<string>;
    afterParse?: (content: ParsedContent) => Promise<ParsedContent>;
    beforeGenerate?: (components: ComponentTemplate[]) => Promise<ComponentTemplate[]>;
    afterGenerate?: (output: string) => Promise<string>;
  };
  options?: Record<string, any>;
}
```

### Plugin Initialization

The WebsiteGenerator initializes plugins during construction:

```typescript
private async initializePlugins(): Promise<void> {
  if (!this.config.plugins) return;

  for (const pluginConfig of this.config.plugins) {
    try {
      const plugin = await import(pluginConfig.name);
      this.plugins.push({
        ...plugin.default,
        options: pluginConfig.options,
      });
    } catch (error) {
      console.error(`Failed to load plugin ${pluginConfig.name}:`, error);
    }
  }
}
```

### Lifecycle Hooks

The Plugin System provides hooks at various stages of the generation pipeline:

1. **beforeParse**: Executed before content is parsed, allowing for pre-processing of raw content
2. **afterParse**: Executed after content is parsed, allowing for modification of the parsed content model
3. **beforeGenerate**: Executed before components are generated, allowing for modification of component templates
4. **afterGenerate**: Executed after components are generated, allowing for post-processing of generated code

## Plugin Execution

Plugins are executed at specific points in the generation pipeline:

### During Parsing

```typescript
// Apply plugins' beforeParse hooks
let processedContent = content;
for (const plugin of this.plugins) {
  if (plugin.hooks?.beforeParse) {
    processedContent = await plugin.hooks.beforeParse(processedContent);
  }
}

// Parse content
const parser = this.parserFactory.prototype.getParser(format);
let parsed = await parser.parse(processedContent);

// Apply plugins' afterParse hooks
for (const plugin of this.plugins) {
  if (plugin.hooks?.afterParse) {
    parsed = await plugin.hooks.afterParse(parsed);
  }
}
```

### During Component Generation

```typescript
// Apply plugins' beforeGenerate hooks
let currentComponents = await this.componentGenerator.generateComponent(content);

for (const plugin of this.plugins) {
  if (plugin.hooks?.beforeGenerate) {
    currentComponents = await plugin.hooks.beforeGenerate(currentComponents);
  }
}
```

## Plugin Configuration

Plugins are configured through the `plugins` section of the `WebsiteGeneratorConfig`:

```typescript
plugins?: Array<{
  name: string;
  options?: Record<string, any>;
}>;
```

This configuration allows the system to:

- Load plugins dynamically from specified paths or packages
- Pass configuration options to plugins
- Enable or disable specific plugins

## Example Plugins

### Docsify Plugin

A plugin that integrates with the Docsify documentation framework:

```typescript
// src/plugins/docsify-plugin.ts
export default {
  name: 'docsify-plugin',
  version: '1.0.0',
  hooks: {
    beforeParse: async (content: string) => {
      // Add Docsify-specific frontmatter
      return `---
docsify: true
---
${content}`;
    },
    afterParse: async (content: ParsedContent) => {
      // Add Docsify-specific metadata
      return {
        ...content,
        metadata: {
          ...content.metadata,
          docsify: true,
        },
      };
    },
    beforeGenerate: async (components: ComponentTemplate[]) => {
      // Modify components for Docsify compatibility
      return components.map(component => ({
        ...component,
        content: component.content.replace(/class=/g, 'className='),
      }));
    },
  },
  options: {
    theme: 'vue',
    loadSidebar: true,
    subMaxLevel: 2,
  },
};
```

## Use Cases

The Plugin System enables various use cases:

1. **Content Transformation**: Plugins can transform content before or after parsing, enabling support for custom syntax or formats.

2. **Component Enhancement**: Plugins can add functionality to generated components, such as analytics, accessibility features, or interactive elements.

3. **Integration with External Systems**: Plugins can integrate with external systems like CMS platforms, analytics services, or deployment tools.

4. **Custom Styling**: Plugins can apply custom styling or theming to generated components.

5. **Code Optimization**: Plugins can optimize generated code for performance, accessibility, or SEO.

## Extensibility

The Plugin System is designed to be highly extensible:

1. **Custom Hooks**: The system can be extended with additional hooks for more granular control over the generation pipeline.

2. **Plugin Composition**: Plugins can be composed to create more complex functionality.

3. **Plugin Dependencies**: Plugins can depend on other plugins, creating a plugin ecosystem.

4. **Plugin Configuration**: Plugins can accept configuration options to customize their behavior.

## Integration with the Pipeline

The Plugin System is integrated throughout the Website Generator pipeline:

1. During the parsing phase, plugins can transform content before and after parsing.
2. During the component generation phase, plugins can modify component templates.
3. During the build phase, plugins can transform the final output.

## Conclusion

The Plugin System is a powerful feature of the Website Generator architecture, enabling extensibility and customization without modifying the core codebase. Its hooks-based architecture provides clear extension points at various stages of the generation pipeline, allowing developers to enhance the system's functionality in a modular and maintainable way.