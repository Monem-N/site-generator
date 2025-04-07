import { Parser } from './Parser';
import { ParsedContent, ContentNode } from '../../types/parser';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file content
      const content = fs.readFileSync(filePath, 'utf-8');

      // Parse OpenAPI specification based on file extension
      const extension = path.extname(filePath).toLowerCase();
      let spec: any;

      try {
        if (extension === '.json') {
          spec = JSON.parse(content);
        } else if (extension === '.yaml' || extension === '.yml') {
          spec = yaml.load(content);
        } else {
          throw new Error(`Unsupported file extension: ${extension}`);
        }
      } catch (error: any) {
        throw new Error(`Failed to parse OpenAPI specification: ${error.message}`);
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
      const metadata: Record<string, any> = {
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
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Validate the OpenAPI schema
   * @param spec OpenAPI specification
   */
  validateSchema(spec: any): void {
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
  private generatePathContent(path: string, pathItem: any): string {
    let content = `## ${path}\n\n`;

    // Add operations
    const operations = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
    for (const operation of operations) {
      if (pathItem[operation]) {
        const operationObj = pathItem[operation];
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
  private generateOperationContent(method: string, operation: any): string {
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

      for (const param of operation.parameters) {
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
          const typedMediaObj = mediaTypeObj as { schema?: any };
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
        const typedResponse = response as { description?: string; content?: Record<string, any> };
        const description = typedResponse.description || '';
        const contentTypes = typedResponse.content ? Object.keys(typedResponse.content).join(', ') : '';

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
  private generateSchemaContent(name: string, schema: any): string {
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
  private extractExamples(spec: any): Record<string, any> {
    const examples: Record<string, any> = {};

    // Extract examples from paths
    if (spec.paths) {
      for (const [path, pathItem] of Object.entries(spec.paths)) {
        const operations = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];

        for (const operation of operations) {
          // Add type assertion for pathItem
          const typedPathItem = pathItem as Record<string, any>;
          if (typedPathItem[operation]) {
            const operationObj = typedPathItem[operation];

            // Extract examples from request body
            if (operationObj.requestBody?.content) {
              for (const [mediaType, mediaTypeObj] of Object.entries(operationObj.requestBody.content)) {
                // Add type assertion for mediaTypeObj
                const typedMediaObj = mediaTypeObj as { examples?: any; example?: any };
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
                const typedResponse = response as { content?: Record<string, any> };
                if (typedResponse.content) {
                  for (const [mediaType, mediaTypeObj] of Object.entries(typedResponse.content)) {
                    // Add type assertion for mediaTypeObj
                    const typedMediaObj = mediaTypeObj as { examples?: any; example?: any };
                    if (typedMediaObj.examples) {
                      examples[`${path}.${operation}.response.${status}.${mediaType}`] = typedMediaObj.examples;
                    } else if (typedMediaObj.example) {
                      examples[`${path}.${operation}.response.${status}.${mediaType}`] = typedMediaObj.example;
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
