import { ParsedContent, ContentNode } from '../../types/parser.js';
import { ComponentTemplate } from '../../types/component.js';
import { DesignSystem } from '../../types/design.js';
import { ContentElement } from '../../types/cms.js';

/**
 * Create a mock parsed content object
 */
export function createMockParsedContent(overrides: Partial<ParsedContent> = {}): ParsedContent {
  return {
    title: 'Test Document',
    description: 'Test description',
    content: 'Test content',
    metadata: {},
    sections: [],
    assets: [],
    references: [],
    ...overrides,
  };
}

/**
 * Create a mock content node
 */
export function createMockContentNode(overrides: Partial<ContentNode> = {}): ContentNode {
  return {
    type: 'section',
    title: 'Test Section',
    content: 'Test content',
    level: 1,
    ...overrides,
  };
}

/**
 * Create a mock design system
 */
export function createMockDesignSystem(overrides: Partial<DesignSystem> = {}): DesignSystem {
  // Create a base mock object
  const mock = {
    type: 'custom' as const,
    name: 'Test Design System',
    importPath: '@/test-design-system',
    classNames: {
      container: 'test-container',
      heading1: 'test-heading-1',
      heading2: 'test-heading-2',
    },
    // Add the optional method with proper implementation
    getConfigForType: (elementType: string) => {
      // Use the parameter to avoid unused variable warning
      const componentType = elementType || 'default';
      return {
        classMapping: {
          container: 'test-container',
          heading: 'test-heading',
        },
        components: [`Test${componentType}Component`],
      };
    },
    ...overrides,
  };

  return mock as DesignSystem;
}

/**
 * Create a mock component template
 */
export function createMockComponentTemplate(
  overrides: Partial<ComponentTemplate> = {}
): ComponentTemplate {
  // Create a base mock object
  const mock = {
    type: 'component',
    name: 'test-template',
    path: '/test',
    content: '<div>Test Component</div>',
    metadata: {},
    id: 'test-id', // This is optional in the interface
    generate: jest
      .fn()
      .mockImplementation((element: ContentElement, designSystem: DesignSystem) => {
        // Use the parameters to avoid unused variable warnings
        const elementType = element.type || 'default';
        const theme = designSystem.theme || {};
        return Promise.resolve(
          `<div class="${theme.className || 'default'}">Test ${elementType} Component</div>`
        );
      }),
    ...overrides,
  };

  return mock as ComponentTemplate;
}

/**
 * Create a mock file system
 */
export function createMockFileSystem() {
  return {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn(),
    stat: jest.fn(),
    exists: jest.fn(),
  };
}

/**
 * Wait for a specified time
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a mock for fs module
 */
export function createMockFs() {
  const mockFiles: Record<string, string> = {};

  return {
    promises: {
      readFile: jest.fn().mockImplementation((path: string) => {
        if (mockFiles[path]) {
          return Promise.resolve(mockFiles[path]);
        }
        return Promise.reject(new Error(`ENOENT: no such file or directory, open '${path}'`));
      }),
      writeFile: jest.fn().mockImplementation((path: string, content: string) => {
        mockFiles[path] = content;
        return Promise.resolve();
      }),
      readdir: jest.fn().mockImplementation((path: string) => {
        const dirPath = path.endsWith('/') ? path : `${path}/`;
        const files = Object.keys(mockFiles)
          .filter(filePath => filePath.startsWith(dirPath))
          .map(filePath => filePath.replace(dirPath, '').split('/')[0])
          .filter((value, _index, _self) => _self.indexOf(value) === _index);

        return Promise.resolve(files);
      }),
      mkdir: jest.fn().mockResolvedValue(undefined),
      stat: jest.fn().mockImplementation((path: string) => {
        if (mockFiles[path]) {
          return Promise.resolve({
            isDirectory: () => false,
            isFile: () => true,
            mtime: new Date(),
          });
        }

        // Check if it's a directory
        const dirPath = path.endsWith('/') ? path : `${path}/`;
        const isDir = Object.keys(mockFiles).some(filePath => filePath.startsWith(dirPath));

        if (isDir) {
          return Promise.resolve({
            isDirectory: () => true,
            isFile: () => false,
            mtime: new Date(),
          });
        }

        return Promise.reject(new Error(`ENOENT: no such file or directory, stat '${path}'`));
      }),
    },
    // Add a file to the mock file system
    addMockFile: (path: string, content: string) => {
      mockFiles[path] = content;
    },
    // Get all mock files
    getMockFiles: () => ({ ...mockFiles }),
    // Clear all mock files
    clearMockFiles: () => {
      Object.keys(mockFiles).forEach(key => delete mockFiles[key]);
    },
  };
}
