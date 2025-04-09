/**
 * Interface for parsed content
 */
export interface ParsedContent {
  /**
   * Content
   */
  content: string;

  /**
   * Title
   */
  title?: string;

  /**
   * Description
   */
  description?: string;

  /**
   * Metadata
   */
  metadata?: Record<string, unknown>;

  /**
   * Sections
   */
  sections?: ContentSection[];

  /**
   * Assets
   */
  assets?: ContentAsset[];

  /**
   * References
   */
  references?: ContentReference[];

  /**
   * Navigation
   */
  navigation?: unknown;

  /**
   * Theme
   */
  theme?: unknown;
}

/**
 * Interface for content reference
 */
export interface ContentReference {
  /**
   * Reference ID
   */
  id: string;

  /**
   * Reference title
   */
  title: string;

  /**
   * Reference URL
   */
  url: string;

  /**
   * Reference type
   */
  type?: 'internal' | 'external' | 'citation';

  /**
   * Reference description
   */
  description?: string;
}

/**
 * Interface for content asset
 */
export interface ContentAsset {
  /**
   * Asset path
   */
  path: string;

  /**
   * Asset type
   */
  type: 'image' | 'video' | 'audio' | 'document' | 'other';

  /**
   * Asset name
   */
  name: string;

  /**
   * Asset size in bytes
   */
  size?: number;

  /**
   * Asset metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for content section
 */
export interface ContentSection {
  /**
   * Section ID
   */
  id: string;

  /**
   * Section title
   */
  title: string;

  /**
   * Section content
   */
  content: string;

  /**
   * Section type
   */
  type?: string;

  /**
   * Section level
   */
  level?: number;

  /**
   * Section metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Interface for content node
 */
export interface ContentNode {
  /**
   * Content
   */
  content: string;

  /**
   * Title
   */
  title?: string;

  /**
   * Type
   */
  type?: string;

  /**
   * Level
   */
  level?: number;

  /**
   * Children
   */
  children?: ContentNode[];
}

/**
 * Interface for parser options
 */
export interface ParserOptions {
  /**
   * Source directory
   */
  sourceDir: string;

  /**
   * Output directory
   */
  outputDir: string;

  /**
   * File extensions to parse
   */
  extensions: string[];
}

/**
 * Interface for parser
 */
export interface Parser {
  /**
   * Parse content
   * @param content Content to parse
   * @param filePath File path
   */
  parse(content: string, filePath: string): ParsedContent;

  /**
   * Parse file
   * @param filePath File path
   */
  parseFile(filePath: string): Promise<ParsedContent>;

  /**
   * Parse directory
   * @param dirPath Directory path
   */
  parseDirectory(dirPath: string): Promise<ParsedContent[]>;
}
