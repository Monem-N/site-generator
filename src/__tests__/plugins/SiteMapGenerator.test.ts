import { SiteMapGenerator } from '../../plugins/SiteMapGenerator';
import { ParsedContent } from '../../../types/parser';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('SiteMapGenerator', () => {
  let generator: SiteMapGenerator;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock fs.promises.writeFile to do nothing
    (fs.promises as any) = {
      writeFile: jest.fn().mockResolvedValue(undefined),
    };

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) => paths.join('/'));

    // Create the generator
    generator = new SiteMapGenerator({
      baseUrl: 'https://example.com',
    });
  });

  test('should initialize with default options', () => {
    expect(generator).toBeDefined();
    expect(generator.name).toBe('sitemap-generator');
    expect(generator.description).toBe('Generates a sitemap.xml file for the website');
  });

  test('should initialize with custom options', () => {
    const customGenerator = new SiteMapGenerator({
      baseUrl: 'https://example.com',
      outputPath: 'custom-sitemap.xml',
      defaultChangeFreq: 'daily',
      defaultPriority: 0.8,
      includeLastMod: false,
      exclude: ['private/*', 'admin.html'],
    });

    expect(customGenerator).toBeDefined();
  });

  test('should collect URL information after parsing', () => {
    // Create mock parsed content
    const parsedContent: ParsedContent = {
      title: 'Test Page',
      description: 'Test description',
      content: 'Test content',
      metadata: {
        originalPath: '/content/test-page.md',
        lastModified: 1625097600000, // 2021-07-01
      },
      sections: [],
      assets: [],
      references: [],
    };

    // Apply the afterParse hook
    generator.hooks.afterParse(parsedContent);

    // Verify that the URL was added
    expect((generator as any).urls).toHaveLength(1);
    expect((generator as any).urls[0].loc).toBe('https://example.com/content/test-page/');
    expect((generator as any).urls[0].lastmod).toBe('2021-07-01');
    expect((generator as any).urls[0].changefreq).toBe('weekly');
    expect((generator as any).urls[0].priority).toBe(0.5);
  });

  test('should handle index files correctly', () => {
    // Create mock parsed content for an index file
    const parsedContent: ParsedContent = {
      title: 'Home Page',
      description: 'Home page description',
      content: 'Home page content',
      metadata: {
        originalPath: '/content/index.md',
        lastModified: 1625097600000, // 2021-07-01
      },
      sections: [],
      assets: [],
      references: [],
    };

    // Apply the afterParse hook
    generator.hooks.afterParse(parsedContent);

    // Verify that the URL was added with the correct path
    expect((generator as any).urls).toHaveLength(1);
    expect((generator as any).urls[0].loc).toBe('https://example.com/content/');
  });

  test('should exclude paths based on patterns', () => {
    // Create a generator with exclude patterns
    const excludeGenerator = new SiteMapGenerator({
      baseUrl: 'https://example.com',
      exclude: ['private/*', 'admin.html'],
    });

    // Create mock parsed content for excluded paths
    const privateContent: ParsedContent = {
      title: 'Private Page',
      description: 'Private page description',
      content: 'Private page content',
      metadata: {
        originalPath: 'private/secret.md',
      },
      sections: [],
      assets: [],
      references: [],
    };

    const adminContent: ParsedContent = {
      title: 'Admin Page',
      description: 'Admin page description',
      content: 'Admin page content',
      metadata: {
        originalPath: 'admin.html',
      },
      sections: [],
      assets: [],
      references: [],
    };

    const publicContent: ParsedContent = {
      title: 'Public Page',
      description: 'Public page description',
      content: 'Public page content',
      metadata: {
        originalPath: 'public/page.md',
      },
      sections: [],
      assets: [],
      references: [],
    };

    // Apply the afterParse hook to all content
    excludeGenerator.hooks.afterParse(privateContent);
    excludeGenerator.hooks.afterParse(adminContent);
    excludeGenerator.hooks.afterParse(publicContent);

    // Verify that only the public page was added
    expect((excludeGenerator as any).urls).toHaveLength(1);
    expect((excludeGenerator as any).urls[0].loc).toBe('https://example.com/public/page/');
  });

  test('should use custom change frequency and priority from metadata', () => {
    // Create mock parsed content with custom metadata
    const parsedContent: ParsedContent = {
      title: 'Important Page',
      description: 'Important page description',
      content: 'Important page content',
      metadata: {
        originalPath: 'important.md',
        changefreq: 'daily',
        priority: 0.9,
      },
      sections: [],
      assets: [],
      references: [],
    };

    // Apply the afterParse hook
    generator.hooks.afterParse(parsedContent);

    // Verify that the custom values were used
    expect((generator as any).urls).toHaveLength(1);
    expect((generator as any).urls[0].changefreq).toBe('daily');
    expect((generator as any).urls[0].priority).toBe(0.9);
  });

  test('should generate sitemap.xml after build', async () => {
    // Create mock parsed content
    const parsedContent1: ParsedContent = {
      title: 'Home Page',
      description: 'Home page description',
      content: 'Home page content',
      metadata: {
        originalPath: 'index.md',
        lastModified: 1625097600000, // 2021-07-01
      },
      sections: [],
      assets: [],
      references: [],
    };

    const parsedContent2: ParsedContent = {
      title: 'About Page',
      description: 'About page description',
      content: 'About page content',
      metadata: {
        originalPath: 'about.md',
        lastModified: 1625184000000, // 2021-07-02
      },
      sections: [],
      assets: [],
      references: [],
    };

    // Apply the afterParse hook to collect URLs
    generator.hooks.afterParse(parsedContent1);
    generator.hooks.afterParse(parsedContent2);

    // Mock process.cwd() to return a test directory
    const originalCwd = process.cwd;
    process.cwd = jest.fn().mockReturnValue('/test');

    // Apply the afterBuild hook to generate the sitemap
    await generator.hooks.afterBuild();

    // Verify that the sitemap was generated
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      '/test/sitemap.xml',
      expect.stringContaining('<?xml version="1.0" encoding="UTF-8"?>'),
      'utf-8'
    );

    // Verify the sitemap content
    const sitemapContent = (fs.promises.writeFile as jest.Mock).mock.calls[0][1];
    expect(sitemapContent).toContain('<loc>https://example.com/</loc>');
    expect(sitemapContent).toContain('<lastmod>2021-07-01</lastmod>');
    expect(sitemapContent).toContain('<loc>https://example.com/about/</loc>');
    expect(sitemapContent).toContain('<lastmod>2021-07-02</lastmod>');
    expect(sitemapContent).toContain('<changefreq>weekly</changefreq>');
    expect(sitemapContent).toContain('<priority>0.5</priority>');

    // Verify that the URLs list was reset
    expect((generator as any).urls).toHaveLength(0);

    // Restore process.cwd
    process.cwd = originalCwd;
  });

  test('should handle different lastModified formats', () => {
    // Create mock parsed content with different lastModified formats
    const dateString: ParsedContent = {
      title: 'Date String',
      description: 'Date string description',
      content: 'Date string content',
      metadata: {
        originalPath: 'date-string.md',
        lastModified: '2021-07-01',
      },
      sections: [],
      assets: [],
      references: [],
    };

    const dateObject: ParsedContent = {
      title: 'Date Object',
      description: 'Date object description',
      content: 'Date object content',
      metadata: {
        originalPath: 'date-object.md',
        lastModified: new Date('2021-07-02'),
      },
      sections: [],
      assets: [],
      references: [],
    };

    const noLastMod: ParsedContent = {
      title: 'No Last Mod',
      description: 'No last mod description',
      content: 'No last mod content',
      metadata: {
        originalPath: 'no-last-mod.md',
      },
      sections: [],
      assets: [],
      references: [],
    };

    // Mock Date.now to return a fixed date
    const originalDateNow = Date.now;
    Date.now = jest.fn().mockReturnValue(1625270400000); // 2021-07-03

    // Apply the afterParse hook
    generator.hooks.afterParse(dateString);
    generator.hooks.afterParse(dateObject);
    generator.hooks.afterParse(noLastMod);

    // Verify the lastmod values
    expect((generator as any).urls[0].lastmod).toBe('2021-07-01');
    expect((generator as any).urls[1].lastmod).toBe('2021-07-02');
    expect((generator as any).urls[2].lastmod).toBe('2021-07-03');

    // Restore Date.now
    Date.now = originalDateNow;
  });

  test('should not include lastmod when disabled', () => {
    // Create a generator with lastmod disabled
    const noLastModGenerator = new SiteMapGenerator({
      baseUrl: 'https://example.com',
      includeLastMod: false,
    });

    // Create mock parsed content
    const parsedContent: ParsedContent = {
      title: 'Test Page',
      description: 'Test description',
      content: 'Test content',
      metadata: {
        originalPath: 'test.md',
        lastModified: 1625097600000, // 2021-07-01
      },
      sections: [],
      assets: [],
      references: [],
    };

    // Apply the afterParse hook
    noLastModGenerator.hooks.afterParse(parsedContent);

    // Verify that lastmod is undefined
    expect((noLastModGenerator as any).urls[0].lastmod).toBeUndefined();
  });

  test('should escape XML special characters in URLs', async () => {
    // Create mock parsed content with special characters
    const parsedContent: ParsedContent = {
      title: 'Special Characters',
      description: 'Special characters description',
      content: 'Special characters content',
      metadata: {
        originalPath: 'special&<>"\'.md',
      },
      sections: [],
      assets: [],
      references: [],
    };

    // Apply the afterParse hook
    generator.hooks.afterParse(parsedContent);

    // Mock process.cwd() to return a test directory
    const originalCwd = process.cwd;
    process.cwd = jest.fn().mockReturnValue('/test');

    // Apply the afterBuild hook to generate the sitemap
    await generator.hooks.afterBuild();

    // Verify that the special characters were escaped
    const sitemapContent = (fs.promises.writeFile as jest.Mock).mock.calls[0][1];
    expect(sitemapContent).toContain(
      '<loc>https://example.com/special&amp;&lt;&gt;&quot;&apos;/</loc>'
    );

    // Restore process.cwd
    process.cwd = originalCwd;
  });
});
