import { createClient, ContentfulClientApi } from 'contentful';
import { ParsedContent } from '../types';

export class CMSIntegrationModule {
  private client: ContentfulClientApi;

  constructor(spaceId: string, accessToken: string) {
    this.client = createClient({
      space: spaceId,
      accessToken: accessToken,
    });
  }

  async getEntry(entryId: string): Promise<ParsedContent> {
    try {
      const entry = await this.client.getEntry(entryId);

      // Extract relevant information from Contentful entry
      const title = entry.fields.title;
      const description = entry.fields.description;
      const content = entry.fields.content;

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
      console.error('Error fetching Contentful entry:', error);
      throw error;
    }
  }
}
