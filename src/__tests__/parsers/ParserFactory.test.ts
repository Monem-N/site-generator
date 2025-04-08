import { ParserFactory } from '../../parsers/ParserFactory.js';
import { DocsifyMarkdownParser } from '../../parsers/DocsifyMarkdownParser.js';

describe('ParserFactory', () => {
  let parserFactory: ParserFactory;

  beforeEach(() => {
    parserFactory = new ParserFactory();
  });

  test('should initialize with no parsers', () => {
    expect(parserFactory).toBeDefined();
    expect(parserFactory.getParsers()).toEqual({});
  });

  test('should register a parser', () => {
    const parser = new DocsifyMarkdownParser();
    parserFactory.register('md', parser);

    expect(parserFactory.getParsers()).toHaveProperty('md');
    expect(parserFactory.getParsers()['md']).toBe(parser);
  });

  test('should register multiple parsers', () => {
    const markdownParser = new DocsifyMarkdownParser();
    const jsonParser = { parse: jest.fn() };

    parserFactory.register('md', markdownParser);
    parserFactory.register('json', jsonParser as any);

    expect(parserFactory.getParsers()).toHaveProperty('md');
    expect(parserFactory.getParsers()).toHaveProperty('json');
    expect(parserFactory.getParsers()['md']).toBe(markdownParser);
    expect(parserFactory.getParsers()['json']).toBe(jsonParser);
  });

  test('should get a registered parser', () => {
    const parser = new DocsifyMarkdownParser();
    parserFactory.register('md', parser);

    const retrievedParser = parserFactory.getParser('md');
    expect(retrievedParser).toBe(parser);
  });

  test('should throw error when getting an unregistered parser', () => {
    expect(() => {
      parserFactory.getParser('unknown');
    }).toThrow('No parser registered for extension: unknown');
  });

  test('should check if a parser is registered', () => {
    const parser = new DocsifyMarkdownParser();
    parserFactory.register('md', parser);

    expect(parserFactory.hasParser('md')).toBe(true);
    expect(parserFactory.hasParser('unknown')).toBe(false);
  });

  test('should unregister a parser', () => {
    const parser = new DocsifyMarkdownParser();
    parserFactory.register('md', parser);
    expect(parserFactory.hasParser('md')).toBe(true);

    parserFactory.unregister('md');
    expect(parserFactory.hasParser('md')).toBe(false);
  });

  test('should do nothing when unregistering a non-existent parser', () => {
    expect(() => {
      parserFactory.unregister('unknown');
    }).not.toThrow();
  });

  test('should get parser for file by extension', () => {
    const parser = new DocsifyMarkdownParser();
    parserFactory.register('md', parser);

    const retrievedParser = parserFactory.getParserForFile('document.md');
    expect(retrievedParser).toBe(parser);
  });

  test('should throw error when getting parser for file with unknown extension', () => {
    expect(() => {
      parserFactory.getParserForFile('document.unknown');
    }).toThrow('No parser registered for file: document.unknown');
  });

  test('should handle file paths with multiple dots', () => {
    const parser = new DocsifyMarkdownParser();
    parserFactory.register('md', parser);

    const retrievedParser = parserFactory.getParserForFile('path/to/document.v1.md');
    expect(retrievedParser).toBe(parser);
  });

  test('should handle file paths with no extension', () => {
    expect(() => {
      parserFactory.getParserForFile('document');
    }).toThrow('No parser registered for file: document');
  });

  test('should register default parsers', () => {
    parserFactory.registerDefaultParsers();

    expect(parserFactory.hasParser('md')).toBe(true);
    expect(parserFactory.hasParser('markdown')).toBe(true);
  });

  test('should clear all parsers', () => {
    const parser = new DocsifyMarkdownParser();
    parserFactory.register('md', parser);
    parserFactory.register('markdown', parser);
    expect(parserFactory.hasParser('md')).toBe(true);
    expect(parserFactory.hasParser('markdown')).toBe(true);

    parserFactory.clear();
    expect(parserFactory.hasParser('md')).toBe(false);
    expect(parserFactory.hasParser('markdown')).toBe(false);
  });
});
