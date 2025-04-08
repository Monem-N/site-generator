/**
 * Configuration for content parsers
 */
export interface ParserConfig {
  defaultFormat?: string;
  extensions?: string[];
  ignorePatterns?: string[];
  metadata?: {
    required?: string[];
    optional?: string[];
  };
}
/**
 * Parsed content structure
 */
export interface ParsedContent {
  title: string;
  description: string;
  content?: string;
  metadata: Record<string, unknown>;
  sections: ContentNode[];
  assets: Asset[];
  references: Reference[];
  type?: string;
  html?: string;
}
/**
 * Content node in parsed content
 */
export interface ContentNode {
  type: string;
  title?: string;
  content: string | ContentNode[];
  attributes?: Record<string, unknown>;
  children?: ContentNode[];
  level?: number;
}
/**
 * Asset in parsed content
 */
export interface Asset {
  type: 'image' | 'video' | 'document' | 'other';
  path: string;
  mimeType?: string;
  size?: number;
  metadata?: Record<string, unknown>;
}
/**
 * Reference in parsed content
 */
export interface Reference {
  type: 'internal' | 'external';
  source: string;
  target: string;
  attributes?: Record<string, unknown>;
}
/**
 * Parser interface for different content formats
 */
export interface Parser {
  parse(content: string, filePath?: string): Promise<ParsedContent>;
}
/**
 * Factory for creating parsers
 */
export interface ParserFactoryInterface {
  getParser(format: string): Parser;
  registerParser(format: string, parser: Parser): void;
}
