# Documentation Parser Component

## Overview

The Documentation Parser is a critical component in the Website Generator system, responsible for transforming documentation from various formats (Markdown, OpenAPI, JSDoc, etc.) into a standardized content model that can be processed by subsequent components in the pipeline.

## Architecture

The Documentation Parser follows a factory pattern through the `DocumentationParserFactory` class, which manages the registration and retrieval of format-specific parsers. This design allows for extensibility, enabling the system to support new documentation formats without modifying the core parsing logic.

```
┌─────────────────────────┐
│DocumentationParserFactory│
└───────────┬─────────────┘
            │ creates
            ▼
┌─────────────────────┐
│    Parser Interface  │
└─────────┬───────────┘
          │
          │ implements
          ▼
┌─────────┬─────────┬─────────┬─────────┐
│Markdown │OpenAPI  │JSDoc    │Custom   │
│Parser   │Parser   │Parser   │Parser   │
└─────────┴─────────┴─────────┴─────────┘
```

## Key Components

### DocumentationParserFactory

The factory class responsible for managing parser registration and retrieval:

```javascript
class DocumentationParserFactory {
  constructor() {
    this.parsers = new Map();
    this.registerCoreFormats();
  }

  registerCoreFormats() {
    this.register('markdown', new MarkdownParser());
    this.register('openapi', new OpenAPIParser());
    this.register('jsdoc', new JSDocParser());
    this.register('custom', new CustomFormatParser());
  }

  register(format, parser) {
    this.parsers.set(format, parser);
    return this;
  }

  getParser(format) {
    const parser = this.parsers.get(format);
    if (!parser) {
      throw new Error(`No parser registered for format: ${format}`);
    }
    return parser;
  }

  async parse(source, format, options = {}) {
    const parser = this.getParser(format);
    return await parser.parse(source, options);
  }
}
```

### Format-Specific Parsers

Each supported documentation format has a dedicated parser implementation:

- **MarkdownParser**: Parses Markdown documentation
- **OpenAPIParser**: Parses OpenAPI/Swagger specifications
- **JSDocParser**: Parses JSDoc comments from JavaScript/TypeScript code
- **CustomFormatParser**: A flexible parser for custom documentation formats

Each parser implements a common interface with a `parse` method that transforms the source content into the standardized `ParsedContent` structure.

### CMS Integration

The parser system also supports integration with Content Management Systems (CMS) like Contentful:

```javascript
if (this.config.cms?.type === 'contentful' && this.config.cms.spaceId && this.config.cms.accessToken) {
  import('./CMSIntegrationModule').then(CMSIntegrationModule => {
    const cmsModule = new CMSIntegrationModule.CMSIntegrationModule(this.config.cms.spaceId || '', this.config.cms.accessToken || '');
    this.parserFactory.prototype.register('contentful', cmsModule);
  });
}
```

## Data Structures

### ParsedContent

The standardized representation of parsed documentation:

```typescript
export interface ParsedContent {
  title: string;
  description: string;
  metadata: Record<string, any>;
  sections: ContentNode[];
  assets: Asset[];
  references: Reference[];
}
```

### ContentNode

A hierarchical structure representing content elements:

```typescript
export interface ContentNode {
  type: string;
  title?: string;
  content: string | ContentNode[];
  attributes?: Record<string, any>;
  children?: ContentNode[];
}
```

### Asset

Representation of external assets (images, videos, etc.):

```typescript
export interface Asset {
  type: 'image' | 'video' | 'document' | 'other';
  path: string;
  mimeType?: string;
  size?: number;
  metadata?: Record<string, any>;
}
```

### Reference

Links between content elements:

```typescript
export interface Reference {
  type: 'internal' | 'external';
  source: string;
  target: string;
  attributes?: Record<string, any>;
}
```

## Parsing Process

The parsing process follows these steps:

1. **File Identification**: The system identifies documentation files based on their extensions and the configuration.

2. **Plugin Pre-Processing**: If plugins are registered, their `beforeParse` hooks are applied to the content.

3. **Format Detection**: The system determines the format of the documentation based on the file extension.

4. **Parsing**: The appropriate parser is selected and used to transform the content into the standardized model.

5. **Plugin Post-Processing**: If plugins are registered, their `afterParse` hooks are applied to the parsed content.

6. **Result Collection**: The parsed content is collected and returned for further processing by the ComponentGenerator.

```javascript
private async parseDocumentation(): Promise<ParsedContent[]> {
  const sourceDir = path.resolve(this.config.sourceDir);
  const files = await this.getDocumentationFiles(sourceDir);
  const parsedContent: ParsedContent[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const format = path.extname(file).slice(1);

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

    parsedContent.push(parsed);
  }

  return parsedContent;
}
```

## Configuration

The parser system is configured through the `ParserConfig` section of the `WebsiteGeneratorConfig`:

```typescript
export interface ParserConfig {
  defaultFormat?: string;
  extensions?: string[];
  ignorePatterns?: string[];
  metadata?: {
    required?: string[];
    optional?: string[];
  };
}
```

Additional configuration options include:

```typescript
parser: ParserConfig & {
  plugins?: string[];
  customFormats?: {
    [key: string]: {
      parser: string;
      options?: Record<string, any>;
    };
  };
};
```

## Extensibility

The Documentation Parser is designed to be extensible in several ways:

1. **Custom Parsers**: New parsers can be registered for additional formats.

2. **Plugin Hooks**: Plugins can modify the content before and after parsing.

3. **CMS Integration**: The system can be extended to support various CMS platforms.

4. **Custom Format Mapping**: The configuration can map file extensions to specific parsers.

## Integration with the Pipeline

The Documentation Parser is the first component in the Website Generator pipeline:

1. The WebsiteGenerator calls the `parseDocumentation()` method to start the process.
2. The parsed content is passed to the ComponentGenerator for transformation into React components.
3. The Plugin System provides hooks for customization at various stages of the parsing process.

## Conclusion

The Documentation Parser component provides a flexible, extensible foundation for transforming documentation from various formats into a standardized content model. Its modular design and plugin architecture allow for customization to meet specific requirements while maintaining a consistent interface for subsequent components in the pipeline.