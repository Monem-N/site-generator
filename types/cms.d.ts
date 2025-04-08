/**
 * Configuration for CMS integration
 */
export interface CMSConfig {
  type: 'contentful' | 'strapi' | 'sanity' | 'custom';
  spaceId?: string;
  accessToken?: string;
  environment?: string;
  apiUrl?: string;
  apiToken?: string;
  projectId?: string;
  dataset?: string;
  token?: string;
  customConfig?: Record<string, unknown>;
}
/**
 * Content model representing a content entry from a CMS
 */
export interface ContentModel {
  id: string;
  contentType: string;
  title: string;
  slug: string;
  content: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    locale: string;
    [key: string]: string;
  };
  fields: Record<string, unknown>;
  elements?: ContentElement[];
}
/**
 * Content element within a content model
 */
export interface ContentElement {
  type: string;
  title?: string;
  level?: number;
  content?: string | string[] | ContentElement[];
  language?: string;
  method?: string;
  endpoint?: string;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  responses?: Record<
    string,
    {
      description: string;
      example?: unknown;
    }
  >;
  headers?: string[];
  rows?: string[][];
  items?: NavItem[];
  [key: string]: unknown;
}
/**
 * Navigation item for menus and navigation components
 */
export interface NavItem {
  label: string;
  path: string;
  active?: boolean;
  children?: NavItem[];
}
/**
 * Template for a page in the CMS
 */
export interface PageTemplate {
  name: string;
  contentType: string;
  template: string;
  [key: string]: unknown;
}
/**
 * CMS client interface for different CMS providers
 */
export interface CMSClient {
  getEntries: (contentType: string, query?: Record<string, unknown>) => Promise<unknown>;
  [key: string]: unknown;
}
