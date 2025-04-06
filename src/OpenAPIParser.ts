import { ParsedContent } from '../types';
import SwaggerParser from 'swagger-parser';

export class OpenAPIParser {
  async parse(content: string): Promise<ParsedContent> {
    try {
      const api = await SwaggerParser.parse(content);

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
      console.error('Error parsing OpenAPI content:', error);
      throw error;
    }
  }

  private generateEndpointsContent(paths: any): string {
    let endpointsContent = '';
    for (const path in paths) {
      if (paths.hasOwnProperty(path)) {
        const pathItem = paths[path];
        for (const method in pathItem) {
          if (pathItem.hasOwnProperty(method)) {
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
