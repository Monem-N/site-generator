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
  metadata?: Record<string, any>;

  /**
   * Sections
   */
  sections?: any[];

  /**
   * Assets
   */
  assets?: any[];

  /**
   * References
   */
  references?: any[];
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
