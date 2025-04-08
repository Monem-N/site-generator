import { createClient, ContentfulClientApi } from 'contentful';
import { ParsedContent } from '../types/parser.js';
import { logger } from './utils/logger.js';

export class CMSIntegrationModule {
  private client: ContentfulClientApi<any>;

  constructor(spaceId: string, accessToken: string) {
    this.client = createClient({
      space: spaceId,
      accessToken: accessToken,
    });
  }

  // Implement the Parser interface's parse method
  async parse(source: string, _options?: Record<string, unknown>): Promise<ParsedContent> {
    try {
      // Assuming source is an entry ID
      return await this.getEntry(source);
    } catch (error) {
      logger.error('Error parsing Contentful entry:', error);
      throw error;
    }
  }

  async getEntry(entryId: string): Promise<ParsedContent> {
    try {
      const entry = await this.client.getEntry(entryId);

      // Extract relevant information from Contentful entry
      // Add type assertions for entry fields
      const title = String(entry.fields.title || '');
      const description = String(entry.fields.description || '');
      const content = String(entry.fields.content || '');

      // Structure the extracted information into ParsedContent format
      const parsedContent: ParsedContent = {
        title: title || 'Contentful Entry',
        description: description || '',
        metadata: {},
        sections: [
          {
            type: 'section',
            title: 'Content',
            content: content || 'No content available.',
          },
        ],
        assets: [],
        references: [],
      };

      return parsedContent;
    } catch (error) {
      logger.error('Error fetching Contentful entry:', error);
      throw error;
    }
  }
}
