import { Plugin, ParsedContent, ComponentTemplate } from '../../types';

interface DocsifyPluginOptions {
  basePath?: string;
  coverpage?: boolean;
  navbar?: boolean;
  sidebar?: boolean;
  themeable?: {
    responsiveTables: boolean;
    readyTransition: boolean;
  };
}

export class DocsifyPlugin implements Plugin {
  private options: DocsifyPluginOptions;

  constructor(options: DocsifyPluginOptions = {}) {
    this.options = {
      basePath: '/',
      coverpage: true,
      navbar: true,
      sidebar: true,
      themeable: {
        responsiveTables: true,
        readyTransition: true,
      },
      ...options
    };
  }

  hooks = {
    beforeParse: async (content: string): Promise<string> => {
      // Handle docsify-specific markdown extensions
      return this.processDocsifyMarkdown(content);
    },

    afterParse: async (parsed: ParsedContent): Promise<ParsedContent> => {
      // Add docsify-specific metadata and structure
      return this.enhanceWithDocsifyFeatures(parsed);
    },

    beforeGenerate: async (components: ComponentTemplate[]): Promise<ComponentTemplate[]> => {
      // Add docsify-specific components and styling
      return this.addDocsifyComponents(components);
    }
  };

  private processDocsifyMarkdown(content: string): string {
    // Process docsify-specific markdown features
    content = this.processEmbeds(content);
    content = this.processAlerts(content);
    content = this.processCodeTabs(content);
    return content;
  }

  private processEmbeds(content: string): string {
    // Handle [!embed] syntax
    return content.replace(/\[!embed\]\((.*?)\)/g, (match, url) => {
      return `<div class="embed-container">
        <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
      </div>`;
    });
  }

  private processAlerts(content: string): string {
    // Handle docsify alert blocks
    const alertTypes = ['info', 'tip', 'warning', 'danger'];
    alertTypes.forEach(type => {
      const regex = new RegExp(`> \[!${type}\]\n([\s\S]*?)(?=\n(?:>|$))`, 'g');
      content = content.replace(regex, (match, text) => {
        return `<div class="alert alert-${type}">${text.trim()}</div>`;
      });
    });
    return content;
  }

  private processCodeTabs(content: string): string {
    // Handle code tabs syntax
    return content.replace(/```tabs([\s\S]*?)```/g, (match, content) => {
      const tabs = content.split('====').map(tab => tab.trim());
      return this.generateCodeTabsHTML(tabs);
    });
  }

  private generateCodeTabsHTML(tabs: string[]): string {
    const tabButtons = tabs.map((tab, index) => {
      const title = tab.split('\n')[0];
      return `<button class="tab-button${index === 0 ? ' active' : ''}" data-tab="${index}">${title}</button>`;
    }).join('');

    const tabContents = tabs.map((tab, index) => {
      const content = tab.split('\n').slice(1).join('\n');
      return `<div class="tab-content${index === 0 ? ' active' : ''}" data-tab="${index}">${content}</div>`;
    }).join('');

    return `<div class="tabs-container">
      <div class="tab-buttons">${tabButtons}</div>
      <div class="tab-contents">${tabContents}</div>
    </div>`;
  }

  private enhanceWithDocsifyFeatures(parsed: ParsedContent): ParsedContent {
    return {
      ...parsed,
      metadata: {
        ...parsed.metadata,
        docsify: {
          ...this.options,
          plugins: ['search', 'zoom-image', 'copy-code']
        }
      }
    };
  }

  private addDocsifyComponents(components: ComponentTemplate[]): ComponentTemplate[] {
    // Add docsify-specific components (navbar, sidebar, etc.)
    if (this.options.navbar) {
      components.unshift(this.createNavbarComponent());
    }
    if (this.options.sidebar) {
      components.unshift(this.createSidebarComponent());
    }
    if (this.options.coverpage) {
      components.unshift(this.createCoverpageComponent());
    }
    return components;
  }

  private createNavbarComponent(): ComponentTemplate {
    return {
      type: 'navbar',
      content: '<nav class="app-nav"></nav>',
      metadata: { docsify: true }
    };
  }

  private createSidebarComponent(): ComponentTemplate {
    return {
      type: 'sidebar',
      content: '<aside class="sidebar"></aside>',
      metadata: { docsify: true }
    };
  }

  private createCoverpageComponent(): ComponentTemplate {
    return {
      type: 'coverpage',
      content: '<section class="cover show"></section>',
      metadata: { docsify: true }
    };
  }
}