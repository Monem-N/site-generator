// Type definitions for parser-implementation.js

import { ParsedContent } from './types';

declare class Parser {
  parse(source: string, options?: Record<string, unknown>): Promise<ParsedContent>;
}

declare class MarkdownParser extends Parser {
  constructor();
  plugins: unknown[];
  use(plugin: unknown): this;
  parse(source: string, options?: Record<string, unknown>): Promise<ParsedContent>;
  parseToAST(source: string): unknown;
  transformToContentModel(ast: unknown): unknown;
  processContent(contentLines: string[]): unknown[];
  extractMetadata(ast: unknown): { title: string; description: string; tags: string[] };
}

declare class ContentfulParser extends Parser {
  constructor();
  parse(source: string, options?: Record<string, unknown>): Promise<ParsedContent>;
}

declare class JSDocParser extends Parser {
  constructor();
  parse(source: string, options?: Record<string, unknown>): Promise<ParsedContent>;
}

declare class OpenAPIParser extends Parser {
  constructor();
  parse(source: string, options?: Record<string, unknown>): Promise<ParsedContent>;
}

declare class CustomFormatParser extends Parser {
  constructor();
  parse(source: string, options?: Record<string, unknown>): Promise<ParsedContent>;
}

export declare class DocumentationParserFactory {
  static prototype: {
    register(format: string, parser: Parser): DocumentationParserFactory;
    getParser(format: string): Parser;
  };

  parsers: Map<string, Parser>;
  constructor();
  registerCoreFormats(): void;
  register(format: string, parser: Parser): this;
  getParser(format: string): Parser;
  parse(source: string, format: string, options?: Record<string, unknown>): Promise<ParsedContent>;
}
