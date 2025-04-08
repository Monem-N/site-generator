import { ParsedContent } from '../types/index.js';
import { Parser } from './parsers/Parser.js';
import { logger } from 'utils/logger.js';
// Using require for SwaggerParser due to TypeScript compatibility issues
const SwaggerParser = require('swagger-parser');

export class OpenAPIParser implements Parser {
  async parse(source: string, options?: Record<string, unknown>): Promise<ParsedContent> {
    try {
      // Parse the OpenAPI content using SwaggerParser
      // Pass options to SwaggerParser if provided
      const swaggerOptions = (options as Record<string, unknown>) || {};
      const api = (await SwaggerParser.parse(source, swaggerOptions)) as {
        openapi: string;
        info: {
          title: string;
          description?: string;
        };
        paths: {
          [path: string]: {
            [method: string]: {
              summary?: string;
              description?: string;
              parameters?: unknown[];
            };
          };
        };
      };

      // Extract relevant information from OpenAPI object
      const title = api.info.title;
      const description = api.info.description;
      const paths = api.paths;

      // Structure the extracted information into ParsedContent format
      const parsedContent: ParsedContent = {
        title: title || 'API Documentation',
        description: description || '',
        metadata: {},
        sections: [
          {
            type: 'section',
            title: 'Overview',
            content: description || 'No overview available.',
          },
          {
            type: 'section',
            title: 'API Endpoints',
            content: this.generateEndpointsContent(paths),
          },
        ],
        assets: [],
        references: [],
      };

      return parsedContent;
    } catch (error) {
      logger.error('Error parsing OpenAPI content:', error);
      throw error;
    }
  }

  private generateEndpointsContent(
    paths: Record<
      string,
      {
        [method: string]: {
          summary?: string;
          description?: string;
          parameters?: unknown[];
        };
      }
    >
  ): string {
    let endpointsContent = '';
    for (const path in paths as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(paths, path)) {
        const pathItem = paths[path];
        for (const method in pathItem) {
          if (Object.prototype.hasOwnProperty.call(pathItem, method)) {
            const operation = pathItem[method];
            endpointsContent += `### ${method.toUpperCase()} ${path}\n`;
            endpointsContent += `${operation.summary || 'No summary available.'}\n\n`;
            endpointsContent += `${operation.description || 'No description available.'}\n\n`;
          }
        }
      }
    }
    return endpointsContent;
  }
}
