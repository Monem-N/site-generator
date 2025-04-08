import { DocsifyMarkdownParser } from './DocsifyMarkdownParser.js';
import { OpenAPIParser } from '../OpenAPIParser.js';
import { CMSIntegrationModule } from '../CMSIntegrationModule.js';
import { Parser } from './Parser.js';
import { logger } from '../utils/logger.js';

export class ParserFactory {
  private parsers: Map<string, Parser> = new Map();

  constructor() {
    this.registerCoreFormats();
  }

  registerCoreFormats() {
    // Register the new DocsifyMarkdownParser for markdown files
    this.register('markdown', new DocsifyMarkdownParser());
    this.register('md', new DocsifyMarkdownParser()); // Also register for .md extension

    // Register other parsers
    this.register('openapi', new OpenAPIParser());
    this.register('yaml', new OpenAPIParser()); // For OpenAPI YAML files
    this.register('json', new OpenAPIParser()); // For OpenAPI JSON files

    // Register CMS integration if available
    try {
      this.register('contentful', new CMSIntegrationModule('', ''));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Contentful integration not available:', { error: errorMessage });
    }
  }

  register(format: string, parser: Parser) {
    this.parsers.set(format.toLowerCase(), parser);
    return this; // For method chaining
  }

  getParser(format: string) {
    const parser = this.parsers.get(format.toLowerCase());
    if (!parser) {
      throw new Error(`No parser registered for format: ${format}`);
    }
    return parser;
  }

  async parse(source: string, format: string, options = {}) {
    const parser = this.getParser(format);
    return await parser.parse(source, options);
  }
}
