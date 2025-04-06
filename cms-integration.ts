import axios from 'axios';
import { CMSConfig, ContentModel, PageTemplate } from './types';

/**
 * CMSIntegrationService handles connecting to various CMS systems
 * and synchronizing content between the CMS and generated website
 */
export class CMSIntegrationService {
  private cmsType: string;
  private config: CMSConfig;
  private client: any;
  private templateRegistry: Map<string, PageTemplate>;

  constructor(cmsType: string, config: CMSConfig) {
    this.cmsType = cmsType;
    this.config = config;
    this.templateRegistry = new Map();

    this.initialize();
  }

  private initialize(): void {
    // Set up CMS client based on type
    switch (this.cmsType) {
      case 'contentful':
        this.initializeContentful();
        break;
      case 'strapi':
        this.initializeStrapi();
        break;
      case 'sanity':
        this.initializeSanity();
        break;
      case 'custom':
        this.initializeCustomCMS();
        break;
      default:
        throw new Error(`Unsupported CMS type: ${this.cmsType}`);
    }

    // Register default templates
    this.registerDefaultTemplates();
  }

  private initializeContentful(): void {
    // Initialize Contentful client
    const { spaceId, accessToken, environment = 'master' } = this.config;

    if (!spaceId || !accessToken) {
      throw new Error('Contentful integration requires spaceId and accessToken');
    }

    // Would use contentful.js in actual implementation
    this.client = {
      spaceId,
      accessToken,
      environment,
      // Mock methods for illustration
      getEntries: async (query: any) => {
        return axios
          .get(`https://cdn.contentful.com/spaces/${spaceId}/environments/${environment}/entries`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: query,
          })
          .then(response => response.data);
      },
    };
  }

  private initializeStrapi(): void {
    // Initialize Strapi client
    const { apiUrl, apiToken } = this.config;

    if (!apiUrl) {
      throw new Error('Strapi integration requires apiUrl');
    }

    // Simple client using axios
    this.client = {
      apiUrl,
      apiToken,
      // Mock methods for illustration
      getEntries: async (contentType: string, query: any = {}) => {
        return axios
          .get(`${apiUrl}/api/${contentType}`, {
            headers: apiToken
              ? {
                  Authorization: `Bearer ${apiToken}`,
                }
              : {},
            params: query,
          })
          .then(response => response.data);
      },
    };
  }

  private initializeSanity(): void {
    // Initialize Sanity client
    const { projectId, dataset, token } = this.config;

    if (!projectId || !dataset) {
      throw new Error('Sanity integration requires projectId and dataset');
    }

    // Would use @sanity/client in actual implementation
    this.client = {
      projectId,
      dataset,
      token,
      useCdn: true,
    };
  }

  private initializeCustomCMS(): void {
    // Initialize custom CMS client
    const { apiUrl, apiToken, customConfig } = this.config;

    if (!apiUrl) {
      throw new Error('Custom CMS integration requires apiUrl');
    }

    this.client = {
      apiUrl,
      apiToken,
      customConfig,
      // Implement custom methods based on the CMS API
      getEntries: async (contentType: string, query: any = {}) => {
        return axios
          .get(`${apiUrl}/content/${contentType}`, {
            headers: apiToken
              ? {
                  Authorization: `Bearer ${apiToken}`,
                }
              : {},
            params: query,
          })
          .then(response => response.data);
      },
    };
  }

  private registerDefaultTemplates(): void {
    // Register default templates for common content types
    this.registerTemplate('page', {
      name: 'Default Page',
      contentType: 'page',
      template: 'default-page',
    });

    this.registerTemplate('blogPost', {
      name: 'Blog Post',
      contentType: 'blogPost',
      template: 'blog-post',
    });

    this.registerTemplate('documentation', {
      name: 'Documentation Page',
      contentType: 'documentation',
      template: 'documentation',
    });
  }

  public registerTemplate(key: string, template: PageTemplate): void {
    this.templateRegistry.set(key, template);
  }

  public getTemplate(key: string): PageTemplate | undefined {
    return this.templateRegistry.get(key);
  }

  public async fetchContent(contentType: string, query: any = {}): Promise<ContentModel[]> {
    try {
      switch (this.cmsType) {
        case 'contentful':
          return this.fetchContentfulContent(contentType, query);
        case 'strapi':
          return this.fetchStrapiContent(contentType, query);
        case 'sanity':
          return this.fetchSanityContent(contentType, query);
        case 'custom':
          return this.fetchCustomContent(contentType, query);
        default:
          throw new Error(`Unsupported CMS type: ${this.cmsType}`);
      }
    } catch (error) {
      console.error(`Error fetching content from ${this.cmsType}:`, error);
      throw error;
    }
  }

  private async fetchContentfulContent(
    contentType: string,
    query: any = {}
  ): Promise<ContentModel[]> {
    const entries = await this.client.getEntries({
      content_type: contentType,
      ...query,
    });

    return entries.items.map((item: any) => this.mapContentfulToContentModel(item));
  }

  private async fetchStrapiContent(contentType: string, query: any = {}): Promise<ContentModel[]> {
    const entries = await this.client.getEntries(contentType, query);

    return entries.data.map((item: any) => this.mapStrapiToContentModel(item));
  }

  private async fetchSanityContent(contentType: string, query: any = {}): Promise<ContentModel[]> {
    // In a real implementation, this would use GROQ queries
    const sanityQuery = `*[_type == "${contentType}"]${query.filter ? ` && ${query.filter}` : ''}`;

    // Mock implementation
    const entries = await Promise.resolve({ result: [] });

    return entries.result.map((item: any) => this.mapSanityToContentModel(item));
  }

  private async fetchCustomContent(contentType: string, query: any = {}): Promise<ContentModel[]> {
    const entries = await this.client.getEntries(contentType, query);

    return entries.map((item: any) => this.mapCustomToContentModel(item));
  }

  private mapContentfulToContentModel(item: any): ContentModel {
    return {
      id: item.sys.id,
      contentType: item.sys.contentType.sys.id,
      title: item.fields.title,
      slug: item.fields.slug,
      content: item.fields.content,
      metadata: {
        createdAt: item.sys.createdAt,
        updatedAt: item.sys.updatedAt,
        locale: item.sys.locale,
      },
      fields: item.fields,
    };
  }

  private mapStrapiToContentModel(item: any): ContentModel {
    return {
      id: item.id,
      contentType: item.type,
      title: item.attributes.title,
      slug: item.attributes.slug,
      content: item.attributes.content,
      metadata: {
        createdAt: item.attributes.createdAt,
        updatedAt: item.attributes.updatedAt,
        locale: item.attributes.locale,
      },
      fields: item.attributes,
    };
  }

  private mapSanityToContentModel(item: any): ContentModel {
    return {
      id: item._id,
      contentType: item._type,
      title: item.title,
      slug: item.slug?.current,
      content: item.content,
      metadata: {
        createdAt: item._createdAt,
        updatedAt: item._updatedAt,
        locale: item.locale || 'en',
      },
      fields: item,
    };
  }

  private mapCustomToContentModel(item: any): ContentModel {
    // Customize this mapping based on your custom CMS structure
    return {
      id: item.id,
      contentType: item.type,
      title: item.title,
      slug: item.slug,
      content: item.content,
      metadata: {
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        locale: item.locale || 'en',
      },
      fields: item,
    };
  }
}
