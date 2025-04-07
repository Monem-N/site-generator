import { ParsedContent } from '../../types/parser';

/**
 * Interface for document parsers
 */
export interface Parser {
  /**
   * Parse a document
   * @param source Source document path or content
   * @param options Optional parsing options
   * @returns Parsed content
   */
  parse(source: string, options?: Record<string, any>): ParsedContent | Promise<ParsedContent>;
}
