import { NavigationGenerator } from '../../navigation/NavigationGenerator';
import { ParsedContent } from '../../../types/parser';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('NavigationGenerator', () => {
  // Sample parsed content
  const sampleParsedContent: ParsedContent[] = [
    {
      title: 'Home',
      content: 'Home page content',
      sections: [
        {
          level: 1,
          title: 'Home',
          content: 'Home page content',
        },
      ],
      metadata: {
        originalPath: '/test/source/index.md',
      },
    },
    {
      title: 'Getting Started',
      content: 'Getting started guide',
      sections: [
        {
          level: 1,
          title: 'Getting Started',
          content: 'Getting started guide',
        },
        {
          level: 2,
          title: 'Installation',
          content: 'Installation instructions',
        },
        {
          level: 2,
          title: 'Configuration',
          content: 'Configuration instructions',
        },
      ],
      metadata: {
        originalPath: '/test/source/getting-started.md',
      },
    },
    {
      title: 'API Reference',
      content: 'API documentation',
      sections: [
        {
          level: 1,
          title: 'API Reference',
          content: 'API documentation',
        },
      ],
      metadata: {
        originalPath: '/test/source/api/index.md',
      },
    },
    {
      title: 'Users API',
      content: 'Users API documentation',
      sections: [
        {
          level: 1,
          title: 'Users API',
          content: 'Users API documentation',
        },
        {
          level: 2,
          title: 'Get Users',
          content: 'Get users endpoint',
        },
        {
          level: 2,
          title: 'Create User',
          content: 'Create user endpoint',
        },
      ],
      metadata: {
        originalPath: '/test/source/api/users.md',
      },
    },
  ];

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock path.dirname to return the directory
    (path.dirname as jest.Mock).mockImplementation((filePath: string) => {
      const parts = filePath.split('/');
      parts.pop();
      return parts.join('/');
    });

    // Mock path.basename to return the filename
    (path.basename as jest.Mock).mockImplementation((filePath: string, ext?: string) => {
      const parts = filePath.split('/');
      let filename = parts[parts.length - 1];
      if (ext && filename.endsWith(ext)) {
        filename = filename.slice(0, -ext.length);
      }
      return filename;
    });

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) => {
      return paths.join('/').replace(/\/+/g, '/');
    });

    // Mock path.relative to return relative path
    (path.relative as jest.Mock).mockImplementation((from: string, to: string) => {
      // Simple implementation for test purposes
      const paths: Record<string, string> = {
        '/test/source/index.md': 'index.md',
        '/test/source/getting-started.md': 'getting-started.md',
        '/test/source/api/index.md': 'api/index.md',
        '/test/source/api/users.md': 'api/users.md',
      };

      if (_from === '/test/source' && to in paths) {
        return paths[to];
      }

      return to.replace(from + '/', '');
    });
  });

  test('should initialize with default options', () => {
    const generator = new NavigationGenerator('/test/source');
    expect(generator).toBeDefined();
  });

  test('should initialize with custom options', () => {
    const options = {
      maxDepth: 3,
      includeIndex: true,
      sortByTitle: true,
    };

    const generator = new NavigationGenerator('/test/source', options);
    expect(generator.options).toEqual(options);
  });

  test('should generate navigation from parsed content', () => {
    const generator = new NavigationGenerator('/test/source');
    const navigation = generator.generateNavigation(sampleParsedContent);

    expect(navigation).toBeDefined();
    expect(navigation.items).toBeDefined();
    expect(navigation.items.length).toBeGreaterThan(0);
  });

  test('should organize navigation by directory structure', () => {
    const generator = new NavigationGenerator('/test/source');
    const navigation = generator.generateNavigation(sampleParsedContent);

    // Check top-level items
    expect(navigation.items.length).toBe(3); // Home, Getting Started, API

    // Check that API has children
    const apiItem = navigation.items.find(item => item.title === 'API Reference');
    expect(apiItem).toBeDefined();
    expect(apiItem?.children).toBeDefined();
    expect(apiItem?.children?.length).toBe(1); // Users API

    // Check API children
    const usersApiItem = apiItem?.children?.[0];
    expect(usersApiItem?.title).toBe('Users API');
  });

  test('should handle index files correctly', () => {
    const generator = new NavigationGenerator('/test/source', { includeIndex: true });
    const navigation = generator.generateNavigation(sampleParsedContent);

    // Check that index files are included
    const homeItem = navigation.items.find(item => item.title === 'Home');
    expect(homeItem).toBeDefined();

    const apiItem = navigation.items.find(item => item.title === 'API Reference');
    expect(apiItem).toBeDefined();
  });

  test('should exclude index files when configured', () => {
    const generator = new NavigationGenerator('/test/source', { includeIndex: false });
    const navigation = generator.generateNavigation(sampleParsedContent);

    // Check that index files are excluded
    const homeItem = navigation.items.find(item => item.title === 'Home');
    expect(homeItem).toBeUndefined();

    // API Reference should still be included because it has children
    const apiItem = navigation.items.find(item => item.title === 'API Reference');
    expect(apiItem).toBeDefined();
  });

  test('should limit navigation depth', () => {
    const generator = new NavigationGenerator('/test/source', { maxDepth: 1 });
    const navigation = generator.generateNavigation(sampleParsedContent);

    // Check that only top-level items are included
    expect(navigation.items.length).toBeGreaterThan(0);

    // Check that no items have children
    for (const item of navigation.items) {
      expect(item.children).toBeUndefined();
    }
  });

  test('should sort navigation items by title', () => {
    const generator = new NavigationGenerator('/test/source', { sortByTitle: true });
    const navigation = generator.generateNavigation(sampleParsedContent);

    // Check that items are sorted alphabetically
    const titles = navigation.items.map(item => item.title);
    const sortedTitles = [...titles].sort();
    expect(titles).toEqual(sortedTitles);
  });

  test('should sort navigation items by filename when not sorting by title', () => {
    const generator = new NavigationGenerator('/test/source', { sortByTitle: false });
    const navigation = generator.generateNavigation(sampleParsedContent);

    // Check that items are in the original order
    expect(navigation.items[0].title).toBe('Home');
    expect(navigation.items[1].title).toBe('Getting Started');
    expect(navigation.items[2].title).toBe('API Reference');
  });

  test('should generate navigation links correctly', () => {
    const generator = new NavigationGenerator('/test/source');
    const navigation = generator.generateNavigation(sampleParsedContent);

    // Check links
    const homeItem = navigation.items.find(item => item.title === 'Home');
    expect(homeItem?.link).toBe('/');

    const gettingStartedItem = navigation.items.find(item => item.title === 'Getting Started');
    expect(gettingStartedItem?.link).toBe('/getting-started');

    const apiItem = navigation.items.find(item => item.title === 'API Reference');
    expect(apiItem?.link).toBe('/api/');

    const usersApiItem = apiItem?.children?.[0];
    expect(usersApiItem?.link).toBe('/api/users');
  });

  test('should handle empty content list', () => {
    const generator = new NavigationGenerator('/test/source');
    const navigation = generator.generateNavigation([]);

    expect(navigation).toBeDefined();
    expect(navigation.items).toEqual([]);
  });

  test('should handle content without originalPath', () => {
    const contentWithoutPath: ParsedContent[] = [
      {
        title: 'No Path',
        content: 'Content without path',
        sections: [],
        metadata: {},
      },
    ];

    const generator = new NavigationGenerator('/test/source');
    const navigation = generator.generateNavigation(contentWithoutPath);

    // Content without path should be excluded
    expect(navigation.items).toEqual([]);
  });

  test('should generate sidebar navigation', () => {
    const generator = new NavigationGenerator('/test/source');
    const sidebar = generator.generateSidebar(sampleParsedContent);

    expect(sidebar).toBeDefined();
    expect(sidebar).toContain('* [Home](/)');
    expect(sidebar).toContain('* [Getting Started](/getting-started)');
    expect(sidebar).toContain('* [API Reference](/api/)');
    expect(sidebar).toContain('  * [Users API](/api/users)');
  });

  test('should generate navbar navigation', () => {
    const generator = new NavigationGenerator('/test/source');
    const navbar = generator.generateNavbar(sampleParsedContent);

    expect(navbar).toBeDefined();
    expect(navbar).toContain('* [Home](/)');
    expect(navbar).toContain('* [Getting Started](/getting-started)');
    expect(navbar).toContain('* [API Reference](/api/)');
  });
});
