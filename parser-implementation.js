// Core parser factory with plugin architecture
class DocumentationParserFactory {
  constructor() {
    this.parsers = new Map();
    this.registerCoreFormats();
  }

  registerCoreFormats() {
    this.register('markdown', new MarkdownParser());
    this.register('openapi', new (require('./src/OpenAPIParser').OpenAPIParser)());
    this.register('contentful', new (require('./src/CMSIntegrationModule').CMSIntegrationModule)());
    this.register('jsdoc', new JSDocParser());
    this.register('custom', new CustomFormatParser());
  }

  register(format, parser) {
    this.parsers.set(format, parser);
    return this; // For method chaining
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

// Example implementation of a Markdown parser
class MarkdownParser {
  constructor() {
    this.plugins = [];
  }

  use(plugin) {
    this.plugins.push(plugin);
    return this;
  }

  async parse(source, options = {}) {
    try {
      // Basic content parsing
      let ast = this.parseToAST(source);
      
      // Apply plugins for additional processing
      for (const plugin of this.plugins) {
        ast = await plugin.process(ast, options);
      }
      
      // Transform to normalized content model
      const contentModel = this.transformToContentModel(ast);
      
      // Extract metadata
      const metadata = this.extractMetadata(ast);
      
      return {
        contentModel,
        metadata,
        format: 'markdown',
        originalSource: source
      };
    } catch (error) {
      throw new Error(`Markdown parsing failed: ${error.message}`);
    }
  }

  parseToAST(source) {
    // Implementation would use a library like remark or marked
    // This is a simplified placeholder
    const sections = [];
    const lines = source.split('\n');
    
    let currentSection = null;
    
    for (const line of lines) {
      if (line.startsWith('# ')) {
        // New h1 section
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          type: 'section',
          title: line.substring(2),
          level: 1,
          content: []
        };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return { type: 'document', sections };
  }

  transformToContentModel(ast) {
    // Transform AST to standardized content model
    // This would map markdown-specific structures to our unified model
    return {
      type: 'document',
      elements: ast.sections.map(section => ({
        type: 'section',
        title: section.title,
        level: section.level,
        content: this.processContent(section.content)
      }))
    };
  }

  processContent(contentLines) {
    // Process content lines into structured content elements
    // This is simplified; real implementation would be more comprehensive
    const elements = [];
    let codeBlock = null;
    let paragraph = null;

    for (const line of contentLines) {
      if (line.startsWith('```')) {
        if (codeBlock) {
          // End code block
          elements.push(codeBlock);
          codeBlock = null;
        } else {
          // Start code block
          const language = line.substring(3).trim();
          codeBlock = {
            type: 'code',
            language,
            content: []
          };
        }
      } else if (codeBlock) {
        codeBlock.content.push(line);
      } else if (line.trim() === '') {
        if (paragraph) {
          elements.push(paragraph);
          paragraph = null;
        }
      } else {
        if (!paragraph) {
          paragraph = {
            type: 'paragraph',
            content: []
          };
        }
        paragraph.content.push(line);
      }
    }

    // Add any remaining paragraph or code block
    if (paragraph) elements.push(paragraph);
    if (codeBlock) elements.push(codeBlock);

    return elements;
  }

  extractMetadata(ast) {
    // Extract common metadata patterns like frontmatter
    // Simplified implementation
    const metadata = {
      title: '',
      description: '',
      tags: []
    };

    if (ast.sections.length > 0) {
      metadata.title = ast.sections[0].title;
    }

    return metadata;
  }
}

// Similar implementations would exist for other parser types
class ContentfulParser {
  async parse(source, options = {}) {
    // Contentful-specific parsing logic
    // Would convert Contentful entries to our common content model
  }
}

class JSDocParser {
  async parse(source, options = {}) {
    // JSDoc-specific parsing logic
  }
}

class CustomFormatParser {
  async parse(source, options = {}) {
    // Extensible parser for custom documentation formats
  }
}

// Example plugin for extracting API endpoints from markdown
class APIEndpointExtractorPlugin {
  async process(ast, options) {
    // Find and tag API endpoint descriptions in the AST
    // This would enhance the AST with API-specific metadata
    return ast;
  }
}

// Export the factory
module.exports = {
  DocumentationParserFactory,
  plugins: {
    APIEndpointExtractorPlugin
  }
};
