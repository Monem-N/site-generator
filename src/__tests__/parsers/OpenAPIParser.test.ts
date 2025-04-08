import { OpenAPIParser } from '../../parsers/OpenAPIParser';
import { ParsedContent } from '../../../types/parser';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
jest.mock('fs');
jest.mock('path');

describe('OpenAPIParser', () => {
  // Sample OpenAPI specification
  const sampleOpenAPISpec = {
    openapi: '3.0.0',
    info: {
      title: 'Test API',
      version: '1.0.0',
      description: 'A test API for OpenAPIParser',
    },
    paths: {
      '/users': {
        get: {
          summary: 'Get all users',
          description: 'Returns a list of users',
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/User',
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a user',
          description: 'Creates a new user',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'User created',
            },
          },
        },
      },
      '/users/{id}': {
        get: {
          summary: 'Get user by ID',
          description: 'Returns a single user',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'integer',
              },
            },
          ],
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/User',
                  },
                },
              },
            },
            '404': {
              description: 'User not found',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              format: 'int64',
            },
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
          },
          required: ['name', 'email'],
        },
      },
    },
  };

  // Sample OpenAPI JSON string
  const sampleOpenAPIJSON = JSON.stringify(sampleOpenAPISpec, null, 2);

  // Sample OpenAPI YAML string
  const sampleOpenAPIYAML = `
openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
  description: A test API for OpenAPIParser
paths:
  /users:
    get:
      summary: Get all users
      description: Returns a list of users
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      summary: Create a user
      description: Creates a new user
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/User'
      responses:
        '201':
          description: User created
  /users/{id}:
    get:
      summary: Get user by ID
      description: Returns a single user
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
      responses:
        '200':
          description: Successful operation
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: User not found
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
        email:
          type: string
          format: email
      required:
        - name
        - email
`;

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync to return true for files
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return true;
    });

    // Mock fs.readFileSync to return sample OpenAPI spec
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.endsWith('.json')) {
        return sampleOpenAPIJSON;
      } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        return sampleOpenAPIYAML;
      }
      throw new Error(`Unexpected file extension: ${filePath}`);
    });

    // Mock path.extname to return the correct extension
    (path.extname as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.endsWith('.json')) {
        return '.json';
      } else if (filePath.endsWith('.yaml')) {
        return '.yaml';
      } else if (filePath.endsWith('.yml')) {
        return '.yml';
      }
      return '';
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
  });

  test('should initialize with default options', () => {
    const parser = new OpenAPIParser();
    expect(parser).toBeDefined();
  });

  test('should initialize with custom options', () => {
    const options = {
      validateSchema: true,
      includeExamples: true,
    };

    const parser = new OpenAPIParser(options);
    expect(parser.options).toEqual(options);
  });

  test('should parse OpenAPI JSON file', () => {
    const parser = new OpenAPIParser();
    const result = parser.parse('/test/api.json');

    expect(result).toBeDefined();
    expect(result.title).toBe('Test API');
    expect(result.content).toContain('A test API for OpenAPIParser');
    expect(result.sections).toBeDefined();
    expect(result.sections.length).toBeGreaterThan(0);
  });

  test('should parse OpenAPI YAML file', () => {
    const parser = new OpenAPIParser();
    const result = parser.parse('/test/api.yaml');

    expect(result).toBeDefined();
    expect(result.title).toBe('Test API');
    expect(result.content).toContain('A test API for OpenAPIParser');
    expect(result.sections).toBeDefined();
    expect(result.sections.length).toBeGreaterThan(0);
  });

  test('should extract API paths as sections', () => {
    const parser = new OpenAPIParser();
    const result = parser.parse('/test/api.json');

    // Check that paths are extracted as sections
    const pathSections = result.sections.filter(
      section => section.title === '/users' || section.title === '/users/{id}'
    );

    expect(pathSections.length).toBe(2);

    // Check /users path
    const usersSection = pathSections.find(section => section.title === '/users');
    expect(usersSection).toBeDefined();
    expect(usersSection?.content).toContain('Get all users');
    expect(usersSection?.content).toContain('Create a user');

    // Check /users/{id} path
    const userByIdSection = pathSections.find(section => section.title === '/users/{id}');
    expect(userByIdSection).toBeDefined();
    expect(userByIdSection?.content).toContain('Get user by ID');
  });

  test('should extract schemas as sections', () => {
    const parser = new OpenAPIParser();
    const result = parser.parse('/test/api.json');

    // Check that schemas are extracted as sections
    const schemaSection = result.sections.find(section => section.title === 'User Schema');

    expect(schemaSection).toBeDefined();
    expect(schemaSection?.content).toContain('id');
    expect(schemaSection?.content).toContain('name');
    expect(schemaSection?.content).toContain('email');
  });

  test('should handle non-existent files', () => {
    // Mock fs.existsSync to return false
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const parser = new OpenAPIParser();

    expect(() => {
      parser.parse('/test/non-existent.json');
    }).toThrow('File not found: /test/non-existent.json');
  });

  test('should handle invalid JSON', () => {
    // Mock fs.readFileSync to return invalid JSON
    (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');

    const parser = new OpenAPIParser();

    expect(() => {
      parser.parse('/test/invalid.json');
    }).toThrow('Failed to parse OpenAPI specification');
  });

  test('should handle invalid YAML', () => {
    // Mock fs.readFileSync to return invalid YAML
    (fs.readFileSync as jest.Mock).mockReturnValue('invalid: yaml: :');

    const parser = new OpenAPIParser();

    expect(() => {
      parser.parse('/test/invalid.yaml');
    }).toThrow('Failed to parse OpenAPI specification');
  });

  test('should validate schema when enabled', () => {
    const parser = new OpenAPIParser({ validateSchema: true });

    // Mock the validateSchema method
    parser.validateSchema = jest.fn();

    parser.parse('/test/api.json');

    expect(parser.validateSchema).toHaveBeenCalled();
  });

  test('should not validate schema when disabled', () => {
    const parser = new OpenAPIParser({ validateSchema: false });

    // Mock the validateSchema method
    parser.validateSchema = jest.fn();

    parser.parse('/test/api.json');

    expect(parser.validateSchema).not.toHaveBeenCalled();
  });

  test('should include examples when enabled', () => {
    const parser = new OpenAPIParser({ includeExamples: true });
    const result = parser.parse('/test/api.json');

    // Check that examples are included
    expect(result.metadata.examples).toBeDefined();
  });

  test('should not include examples when disabled', () => {
    const parser = new OpenAPIParser({ includeExamples: false });
    const result = parser.parse('/test/api.json');

    // Check that examples are not included
    expect(result.metadata.examples).toBeUndefined();
  });

  test('should handle OpenAPI 2.0 (Swagger) specifications', () => {
    // Mock fs.readFileSync to return Swagger 2.0 spec
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify({
        swagger: '2.0',
        info: {
          title: 'Swagger API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get all users',
            },
          },
        },
      })
    );

    const parser = new OpenAPIParser();
    const result = parser.parse('/test/swagger.json');

    expect(result).toBeDefined();
    expect(result.title).toBe('Swagger API');
    expect(result.sections.some(section => section.title === '/users')).toBe(true);
  });
});
