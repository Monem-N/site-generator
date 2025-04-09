import { Parser } from './Parser.js';
import { ParsedContent, ContentNode } from '../../types/parser.js';
// Define OpenAPI types inline for now
interface OpenAPISpec {
  openapi?: string;
  swagger?: string; // For OpenAPI 2.0
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
}

interface PathItem {
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
  // Allow indexing with string
  [key: string]: OperationObject | string | undefined;
}

interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: unknown[];
  requestBody?: {
    content: Record<string, MediaTypeObject>;
    description?: string;
    required?: boolean;
  };
  responses?: Record<string, unknown>;
  // Allow indexing with string
  [key: string]: unknown;
}

interface SchemaObject {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
}

interface MediaTypeObject {
  schema?: SchemaObject;
  example?: unknown;
  examples?: Record<string, unknown>;
}

interface ParameterObject {
  name?: string;
  in?: string;
  required?: boolean;
  schema?: {
    type?: string;
  };
  description?: string;
}

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
// Import error types if needed
// import { FileSystemError, ParserError } from '../utils/errors.js';

/**
 * Options for the OpenAPIParser
 */
export interface OpenAPIParserOptions {
  validateSchema?: boolean;
  includeExamples?: boolean;
}

/**
 * Parser for OpenAPI specifications
 */
export class OpenAPIParser implements Parser {
  options: OpenAPIParserOptions;

  /**
   * Create a new OpenAPIParser
   * @param options Parser options
   */
  constructor(options: OpenAPIParserOptions = {}) {
    this.options = {
      validateSchema: false,
      includeExamples: true,
      ...options,
    };
  }

  /**
   * Parse an OpenAPI specification file
   * @param filePath Path to the OpenAPI specification file
   * @returns Parsed content
   */
  parse(filePath: string): ParsedContent {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse OpenAPI specification based on file extension
    const extension = path.extname(filePath).toLowerCase();
    let spec: OpenAPISpec;

    try {
      if (extension === '.json') {
        spec = JSON.parse(content) as OpenAPISpec;
      } else if (extension === '.yaml' || extension === '.yml') {
        spec = yaml.load(content) as OpenAPISpec;
      } else {
        throw new Error(`Unsupported file extension: ${extension}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to parse OpenAPI specification: ${errorMessage}`);
    }

    // Validate schema if enabled
    if (this.options.validateSchema) {
      this.validateSchema(spec);
    }

    // Extract API information
    const title = spec.info?.title || path.basename(filePath, extension);
    const description = spec.info?.description || '';
    const version = spec.info?.version || '';

    // Create sections for paths
    const sections: ContentNode[] = [];

    // Add info section
    sections.push({
      type: 'section',
      title: 'API Information',
      content: `
# ${title}

${description}

**Version:** ${version}
`,
      level: 1,
    });

    // Add sections for paths
    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        const pathContent = this.generatePathContent(path, pathItem);
        sections.push({
          type: 'section',
          title: path,
          content: pathContent,
          level: 2,
        });
      }
    }

    // Add sections for schemas
    if (spec.components?.schemas) {
      for (const [name, schema] of Object.entries(spec.components.schemas)) {
        const schemaContent = this.generateSchemaContent(name, schema);
        sections.push({
          type: 'section',
          title: `${name} Schema`,
          content: schemaContent,
          level: 2,
        });
      }
    }

    // Create metadata
    const metadata: Record<string, unknown> = {
      originalPath: filePath,
      title,
      description,
      version,
      openapi: spec.openapi || spec.swagger,
    };

    // Include examples if enabled
    if (this.options.includeExamples) {
      metadata.examples = this.extractExamples(spec);
    }

    return {
      title,
      description,
      content: description,
      sections,
      metadata,
      assets: [],
      references: [],
    };
  }

  /**
   * Validate the OpenAPI schema
   * @param spec OpenAPI specification
   */
  validateSchema(spec: OpenAPISpec): void {
    // Basic validation
    if (!spec) {
      throw new Error('Invalid OpenAPI specification: empty or null');
    }

    // Check for OpenAPI version
    if (!spec.openapi && !spec.swagger) {
      throw new Error('Invalid OpenAPI specification: missing openapi or swagger version');
    }

    // Check for info section
    if (!spec.info) {
      throw new Error('Invalid OpenAPI specification: missing info section');
    }

    // Check for paths section
    if (!spec.paths) {
      throw new Error('Invalid OpenAPI specification: missing paths section');
    }
  }

  /**
   * Generate content for a path
   * @param path API path
   * @param pathItem Path item object
   * @returns Markdown content for the path
   */
  private generatePathContent(path: string, pathItem: PathItem): string {
    let content = `## ${path}\n\n`;

    // Add operations
    const operations = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
    for (const operation of operations) {
      if (pathItem[operation]) {
        const operationObj = pathItem[operation] as OperationObject;
        content += this.generateOperationContent(operation, operationObj);
      }
    }

    return content;
  }

  /**
   * Generate content for an operation
   * @param method HTTP method
   * @param operation Operation object
   * @returns Markdown content for the operation
   */
  private generateOperationContent(method: string, operation: OperationObject): string {
    let content = `### ${method.toUpperCase()}\n\n`;

    // Add summary and description
    if (operation.summary) {
      content += `**Summary:** ${operation.summary}\n\n`;
    }

    if (operation.description) {
      content += `${operation.description}\n\n`;
    }

    // Add parameters
    if (operation.parameters && operation.parameters.length > 0) {
      content += '#### Parameters\n\n';
      content += '| Name | In | Required | Type | Description |\n';
      content += '| ---- | -- | -------- | ---- | ----------- |\n';

      for (const param of operation.parameters as ParameterObject[]) {
        const name = param.name || '';
        const inType = param.in || '';
        const required = param.required ? 'Yes' : 'No';
        const type = param.schema?.type || '';
        const description = param.description || '';

        content += `| ${name} | ${inType} | ${required} | ${type} | ${description} |\n`;
      }

      content += '\n';
    }

    // Add request body
    if (operation.requestBody) {
      content += '#### Request Body\n\n';

      if (operation.requestBody.description) {
        content += `${operation.requestBody.description}\n\n`;
      }

      if (operation.requestBody.content) {
        for (const [mediaType, mediaTypeObj] of Object.entries(operation.requestBody.content)) {
          content += `**Media Type:** ${mediaType}\n\n`;

          // Add type assertion for mediaTypeObj
          const typedMediaObj = mediaTypeObj as MediaTypeObject;
          if (typedMediaObj.schema) {
            content += '```json\n';
            content += JSON.stringify(typedMediaObj.schema, null, 2);
            content += '\n```\n\n';
          }
        }
      }
    }

    // Add responses
    if (operation.responses) {
      content += '#### Responses\n\n';
      content += '| Status | Description | Content Type |\n';
      content += '| ------ | ----------- | ------------ |\n';

      for (const [status, response] of Object.entries(operation.responses)) {
        // Add type assertion for response
        const typedResponse = response as {
          description?: string;
          content?: Record<string, unknown>;
        };
        const description = typedResponse.description || '';
        const contentTypes = typedResponse.content
          ? Object.keys(typedResponse.content).join(', ')
          : '';

        content += `| ${status} | ${description} | ${contentTypes} |\n`;
      }

      content += '\n';
    }

    return content;
  }

  /**
   * Generate content for a schema
   * @param name Schema name
   * @param schema Schema object
   * @returns Markdown content for the schema
   */
  private generateSchemaContent(name: string, schema: SchemaObject): string {
    let content = `## ${name}\n\n`;

    if (schema.description) {
      content += `${schema.description}\n\n`;
    }

    // Add properties
    if (schema.properties) {
      content += '### Properties\n\n';
      content += '| Name | Type | Required | Description |\n';
      content += '| ---- | ---- | -------- | ----------- |\n';

      const required = schema.required || [];

      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        // Add type assertion for propSchema
        const typedPropSchema = propSchema as { type?: string; description?: string };
        const type = typedPropSchema.type || '';
        const isRequired = required.includes(propName) ? 'Yes' : 'No';
        const description = typedPropSchema.description || '';

        content += `| ${propName} | ${type} | ${isRequired} | ${description} |\n`;
      }

      content += '\n';
    }

    // Add schema as JSON
    content += '### Schema\n\n';
    content += '```json\n';
    content += JSON.stringify(schema, null, 2);
    content += '\n```\n\n';

    return content;
  }

  /**
   * Extract examples from the OpenAPI specification
   * @param spec OpenAPI specification
   * @returns Examples object
   */
  private extractExamples(spec: OpenAPISpec): Record<string, unknown> {
    const examples: Record<string, unknown> = {};

    // Extract examples from paths
    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        const operations = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

        for (const operation of operations) {
          // Add type assertion for pathItem
          const typedPathItem = pathItem as Record<string, unknown>;
          if (typedPathItem[operation]) {
            const operationObj = typedPathItem[operation] as OperationObject;

            // Extract examples from request body
            if (operationObj.requestBody?.content) {
              for (const [mediaType, mediaTypeObj] of Object.entries(
                operationObj.requestBody.content
              )) {
                // Add type assertion for mediaTypeObj
                const typedMediaObj = mediaTypeObj as MediaTypeObject;
                if (typedMediaObj.examples) {
                  examples[`${path}.${operation}.request.${mediaType}`] = typedMediaObj.examples;
                } else if (typedMediaObj.example) {
                  examples[`${path}.${operation}.request.${mediaType}`] = typedMediaObj.example;
                }
              }
            }

            // Extract examples from responses
            if (operationObj.responses) {
              for (const [status, response] of Object.entries(operationObj.responses)) {
                // Add type assertion for response
                const typedResponse = response as { content?: Record<string, unknown> };
                if (typedResponse.content) {
                  for (const [mediaType, mediaTypeObj] of Object.entries(typedResponse.content)) {
                    // Add type assertion for mediaTypeObj
                    const typedMediaObj = mediaTypeObj as MediaTypeObject;
                    if (typedMediaObj.examples) {
                      examples[`${path}.${operation}.response.${status}.${mediaType}`] =
                        typedMediaObj.examples;
                    } else if (typedMediaObj.example) {
                      examples[`${path}.${operation}.response.${status}.${mediaType}`] =
                        typedMediaObj.example;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    return examples;
  }
}
