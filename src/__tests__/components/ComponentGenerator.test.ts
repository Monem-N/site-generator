import { ComponentGenerator } from '../../component-generator';
import { ParsedContent } from '../../../types/parser';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('ComponentGenerator', () => {
  // Sample parsed content
  const sampleParsedContent: ParsedContent = {
    title: 'Test Document',
    content: 'This is a test document with some content.',
    sections: [
      {
        level: 1,
        title: 'Test Document',
        content: 'This is a test document with some content.',
      },
      {
        level: 2,
        title: 'Section 1',
        content: 'Content for section 1.',
      },
      {
        level: 3,
        title: 'Subsection 1.1',
        content: 'Content for subsection 1.1.',
      },
      {
        level: 2,
        title: 'Section 2',
        content: 'Content for section 2.',
      },
    ],
    metadata: {
      originalPath: '/test/document.md',
      title: 'Test Document',
      description: 'This is a test document',
    },
  };

  // Sample templates
  const sampleTemplates = {
    page: 'export const {{componentName}} = () => {\n  return (\n    <div>\n      <h1>{{title}}</h1>\n      <div>{{content}}</div>\n    </div>\n  );\n};\n',
    section:
      'export const {{componentName}} = () => {\n  return (\n    <section>\n      <h{{level}}>{{title}}</h{{level}}>\n      <div>{{content}}</div>\n    </section>\n  );\n};\n',
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync to return true
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // Mock fs.readFileSync to return the sample templates
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('page.tsx')) {
        return sampleTemplates.page;
      } else if (filePath.includes('section.tsx')) {
        return sampleTemplates.section;
      }
      return '';
    });

    // Mock path.resolve to return the input path
    (path.resolve as jest.Mock).mockImplementation((path: string) => path);

    // Mock path.basename to return the filename
    (path.basename as jest.Mock).mockImplementation((path: string, ext?: string) => {
      const parts = path.split('/');
      let filename = parts[parts.length - 1];
      if (ext && filename.endsWith(ext)) {
        filename = filename.slice(0, -ext.length);
      }
      return filename;
    });

    // Mock path.dirname to return the directory
    (path.dirname as jest.Mock).mockImplementation((path: string) => {
      const parts = path.split('/');
      parts.pop();
      return parts.join('/');
    });

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) => {
      return paths.join('/').replace(/\/+/g, '/');
    });
  });

  test('should initialize with valid configuration', () => {
    const config = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
        prefix: 'Doc',
      },
    };

    const generator = new ComponentGenerator(config);

    expect(generator).toBeDefined();
  });

  test('should generate a component from parsed content', async () => {
    const config = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
        prefix: 'Doc',
      },
    };

    const generator = new ComponentGenerator(config);

    const component = await generator.generateComponent(sampleParsedContent);

    expect(component).toBeDefined();
    expect(component.name).toBe('DocTestDocument');
    expect(component.content).toContain('<h1>Test Document</h1>');
    expect(component.content).toContain('This is a test document with some content.');
  });

  test('should generate a page component', async () => {
    const config = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
      },
    };

    const generator = new ComponentGenerator(config);

    const page = await generator.generatePage(sampleParsedContent);

    expect(page).toBeDefined();
    expect(page.name).toBe('TestDocument');
    expect(page.content).toContain('<h1>Test Document</h1>');
    expect(page.content).toContain('This is a test document with some content.');
  });

  test('should generate section components', async () => {
    const config = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
      },
    };

    const generator = new ComponentGenerator(config);

    const sections = await generator.generateSections(sampleParsedContent);

    expect(sections).toBeDefined();
    expect(sections.length).toBe(4);

    // Check first section (main heading)
    expect(sections[0].name).toBe('TestDocumentSection');
    expect(sections[0].content).toContain('<h1>Test Document</h1>');

    // Check second section
    expect(sections[1].name).toBe('Section1Section');
    expect(sections[1].content).toContain('<h2>Section 1</h2>');

    // Check third section (subsection)
    expect(sections[2].name).toBe('Subsection11Section');
    expect(sections[2].content).toContain('<h3>Subsection 1.1</h3>');

    // Check fourth section
    expect(sections[3].name).toBe('Section2Section');
    expect(sections[3].content).toContain('<h2>Section 2</h2>');
  });

  test('should apply component naming conventions correctly', async () => {
    // Test PascalCase
    const pascalCaseConfig = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
        prefix: 'Doc',
      },
    };

    const pascalCaseGenerator = new ComponentGenerator(pascalCaseConfig);
    const pascalCaseComponent = await pascalCaseGenerator.generateComponent(sampleParsedContent);

    expect(pascalCaseComponent.name).toBe('DocTestDocument');

    // Test camelCase
    const camelCaseConfig = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'camelCase' as const,
        prefix: 'doc',
      },
    };

    const camelCaseGenerator = new ComponentGenerator(camelCaseConfig);
    const camelCaseComponent = await camelCaseGenerator.generateComponent(sampleParsedContent);

    expect(camelCaseComponent.name).toBe('docTestDocument');
  });

  test('should handle special characters in component names', async () => {
    const contentWithSpecialChars: ParsedContent = {
      ...sampleParsedContent,
      title: 'Test & Document with Spaces!',
    };

    const config = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
      },
    };

    const generator = new ComponentGenerator(config);
    const component = await generator.generateComponent(contentWithSpecialChars);

    expect(component.name).toBe('TestDocumentWithSpaces');
  });

  test('should handle template variables correctly', async () => {
    const config = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
      },
    };

    const generator = new ComponentGenerator(config);
    const component = await generator.generateComponent(sampleParsedContent);

    expect(component.content).toContain('<h1>Test Document</h1>');
    expect(component.content).toContain('<div>This is a test document with some content.</div>');
  });

  test('should handle missing templates gracefully', async () => {
    // Mock fs.existsSync to return false for templates
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const config = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
      },
    };

    const generator = new ComponentGenerator(config);

    await expect(generator.generateComponent(sampleParsedContent)).rejects.toThrow();
  });

  test('should handle custom templates', async () => {
    // Add a custom template
    const customTemplate =
      'export const {{componentName}} = () => {\n  return (\n    <custom>\n      <title>{{title}}</title>\n      <content>{{content}}</content>\n    </custom>\n  );\n};\n';

    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.includes('page.tsx')) {
        return sampleTemplates.page;
      } else if (filePath.includes('section.tsx')) {
        return sampleTemplates.section;
      } else if (filePath.includes('custom.tsx')) {
        return customTemplate;
      }
      return '';
    });

    const config = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
        custom: '/test/templates/custom.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
      },
    };

    const generator = new ComponentGenerator(config);

    // Use the custom template
    const component = await generator.generateComponentWithTemplate(sampleParsedContent, 'custom');

    expect(component).toBeDefined();
    expect(component.content).toContain('<custom>');
    expect(component.content).toContain('<title>Test Document</title>');
    expect(component.content).toContain(
      '<content>This is a test document with some content.</content>'
    );
  });

  test('should handle errors when reading templates', async () => {
    // Mock fs.readFileSync to throw an error
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Failed to read template');
    });

    const config = {
      templates: {
        page: '/test/templates/page.tsx',
        section: '/test/templates/section.tsx',
      },
      componentNaming: {
        style: 'PascalCase' as const,
      },
    };

    const generator = new ComponentGenerator(config);

    await expect(generator.generateComponent(sampleParsedContent)).rejects.toThrow(
      'Failed to read template'
    );
  });
});
