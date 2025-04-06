export interface ThemeStyles {
  stylesheet: string;
  variables: Record<string, string>;
  additionalCSS?: string;
}

export class DocsifyThemeAdapter {
  private theme: string;

  constructor(theme = 'vue') {
    this.theme = theme.toLowerCase();
  }

  getThemeStyles(): ThemeStyles {
    switch (this.theme) {
      case 'vue':
        return this.getVueTheme();
      case 'dark':
        return this.getDarkTheme();
      case 'buble':
        return this.getBubleTheme();
      case 'pure':
        return this.getPureTheme();
      case 'dolphin':
        return this.getDolphinTheme();
      default:
        return this.getVueTheme();
    }
  }

  getVueTheme(): ThemeStyles {
    return {
      stylesheet: 'https://cdn.jsdelivr.net/npm/docsify@4/lib/themes/vue.css',
      variables: {
        '--theme-color': '#42b983',
        '--theme-color-dark': '#33a06f',
        '--text-color-base': '#2c3e50',
        '--text-color-secondary': '#646473',
        '--text-color-tertiary': '#81818e',
      },
    };
  }

  getDarkTheme(): ThemeStyles {
    return {
      stylesheet: 'https://cdn.jsdelivr.net/npm/docsify@4/lib/themes/dark.css',
      variables: {
        '--theme-color': '#ea6f5a',
        '--theme-color-dark': '#c85849',
        '--text-color-base': '#b4b4b4',
        '--text-color-secondary': '#efefef',
        '--text-color-tertiary': '#eee',
        '--background-color': '#252529',
      },
    };
  }

  getBubleTheme(): ThemeStyles {
    return {
      stylesheet: 'https://cdn.jsdelivr.net/npm/docsify@4/lib/themes/buble.css',
      variables: {
        '--theme-color': '#0074d9',
        '--theme-color-dark': '#0059a6',
        '--text-color-base': '#333',
        '--text-color-secondary': '#555',
        '--text-color-tertiary': '#777',
      },
    };
  }

  getPureTheme(): ThemeStyles {
    return {
      stylesheet: 'https://cdn.jsdelivr.net/npm/docsify@4/lib/themes/pure.css',
      variables: {
        '--theme-color': '#0074d9',
        '--theme-color-dark': '#0059a6',
        '--text-color-base': '#333',
        '--text-color-secondary': '#555',
        '--text-color-tertiary': '#777',
      },
    };
  }

  getDolphinTheme(): ThemeStyles {
    return {
      stylesheet: 'https://cdn.jsdelivr.net/npm/docsify-themeable@0/dist/css/theme-simple.css',
      variables: {
        '--theme-color': '#1E90FF',
        '--theme-color-dark': '#0077ea',
        '--text-color-base': '#333',
        '--text-color-secondary': '#555',
        '--text-color-tertiary': '#777',
        '--sidebar-background': '#f8f8f8',
        '--sidebar-nav-link-color': '#444',
        '--sidebar-nav-link-color--active': '#1E90FF',
        '--sidebar-name-color': '#1E90FF',
      },
      additionalCSS: `
        .sidebar {
          border-right: 1px solid rgba(0,0,0,0.07);
        }
        .markdown-section code {
          border-radius: 3px;
          background-color: #f8f8f8;
          color: #e96900;
        }
      `,
    };
  }

  generateThemeCSS(): string {
    const { variables, additionalCSS } = this.getThemeStyles();

    let css = ':root {\n';

    // Add theme variables
    for (const [key, value] of Object.entries(variables)) {
      css += `  ${key}: ${value};\n`;
    }

    css += '}\n';

    // Add additional CSS if provided
    if (additionalCSS) {
      css += additionalCSS;
    }

    return css;
  }
}
