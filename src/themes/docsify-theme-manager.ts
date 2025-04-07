import { DesignSystem } from '../../types';

export interface DocsifyThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    codeBackground: string;
    borderColor: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    headings: {
      fontFamily: string;
      fontWeight: string;
      lineHeight: string;
    };
  };
  spacing: {
    unit: string;
    container: string;
    content: string;
    sidebar: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  animation: {
    duration: string;
    timing: string;
  };
}

export class DocsifyThemeManager {
  private config: DocsifyThemeConfig;
  private designSystem: DesignSystem;

  constructor(designSystem: DesignSystem, customConfig?: Partial<DocsifyThemeConfig>) {
    this.designSystem = designSystem;
    this.config = this.mergeWithDefaultConfig(customConfig);
  }

  private mergeWithDefaultConfig(customConfig?: Partial<DocsifyThemeConfig>): DocsifyThemeConfig {
    const defaultConfig: DocsifyThemeConfig = {
      colors: {
        primary: '#42b983',
        secondary: '#34495e',
        accent: '#475c6f',
        background: '#ffffff',
        text: '#2c3e50',
        codeBackground: '#f8f8f8',
        borderColor: '#eaecef',
      },
      typography: {
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        fontSize: '16px',
        lineHeight: '1.7',
        headings: {
          fontFamily: 'inherit',
          fontWeight: '600',
          lineHeight: '1.25',
        },
      },
      spacing: {
        unit: '16px',
        container: '800px',
        content: '60px',
        sidebar: '300px',
      },
      breakpoints: {
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px',
      },
      animation: {
        duration: '0.3s',
        timing: 'ease-in-out',
      },
    };

    return {
      ...defaultConfig,
      ...customConfig,
      colors: { ...defaultConfig.colors, ...customConfig?.colors },
      typography: { ...defaultConfig.typography, ...customConfig?.typography },
      spacing: { ...defaultConfig.spacing, ...customConfig?.spacing },
      breakpoints: { ...defaultConfig.breakpoints, ...customConfig?.breakpoints },
      animation: { ...defaultConfig.animation, ...customConfig?.animation },
    };
  }

  public generateThemeStyles(): string {
    return `
      :root {
        ${this.generateCSSVariables()}
      }

      body {
        font-family: var(--font-family);
        font-size: var(--font-size);
        line-height: var(--line-height);
        color: var(--text-color);
        background-color: var(--background-color);
      }

      ${this.generateResponsiveStyles()}
      ${this.generateComponentStyles()}
      ${this.generateAccessibilityStyles()}
      ${this.generateAnimationStyles()}
    `;
  }

  private generateCSSVariables(): string {
    return `
      --primary-color: ${this.config.colors.primary};
      --secondary-color: ${this.config.colors.secondary};
      --accent-color: ${this.config.colors.accent};
      --background-color: ${this.config.colors.background};
      --text-color: ${this.config.colors.text};
      --code-background: ${this.config.colors.codeBackground};
      --border-color: ${this.config.colors.borderColor};

      --font-family: ${this.config.typography.fontFamily};
      --font-size: ${this.config.typography.fontSize};
      --line-height: ${this.config.typography.lineHeight};
      --heading-font-family: ${this.config.typography.headings.fontFamily};
      --heading-font-weight: ${this.config.typography.headings.fontWeight};
      --heading-line-height: ${this.config.typography.headings.lineHeight};

      --spacing-unit: ${this.config.spacing.unit};
      --container-width: ${this.config.spacing.container};
      --content-width: ${this.config.spacing.content};
      --sidebar-width: ${this.config.spacing.sidebar};

      --animation-duration: ${this.config.animation.duration};
      --animation-timing: ${this.config.animation.timing};
    `;
  }

  private generateResponsiveStyles(): string {
    return `
      @media (max-width: ${this.config.breakpoints.mobile}) {
        :root {
          --font-size: calc(${this.config.typography.fontSize} * 0.9);
          --sidebar-width: 100%;
        }
      }

      @media (max-width: ${this.config.breakpoints.tablet}) {
        .content {
          padding: calc(var(--spacing-unit) * 2);
        }

        .sidebar {
          width: 100%;
          position: static;
          transform: none;
        }
      }
    `;
  }

  private generateComponentStyles(): string {
    return `
      .markdown-section {
        max-width: var(--container-width);
        margin: 0 auto;
        padding: var(--spacing-unit);
      }

      .sidebar {
        width: var(--sidebar-width);
        background-color: var(--background-color);
        border-right: 1px solid var(--border-color);
      }

      .content {
        padding-left: var(--content-width);
      }

      pre, code {
        background-color: var(--code-background);
        border-radius: 4px;
      }

      a {
        color: var(--primary-color);
        text-decoration: none;
        transition: color var(--animation-duration) var(--animation-timing);
      }

      a:hover {
        color: var(--accent-color);
      }
    `;
  }

  private generateAccessibilityStyles(): string {
    return `
      /* High contrast mode */
      @media (prefers-contrast: high) {
        :root {
          --primary-color: #006600;
          --text-color: #000000;
          --background-color: #ffffff;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      /* Focus styles */
      :focus {
        outline: 3px solid var(--primary-color);
        outline-offset: 2px;
      }

      /* Skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--primary-color);
        color: white;
        padding: 8px;
        z-index: 100;
      }

      .skip-link:focus {
        top: 0;
      }
    `;
  }

  private generateAnimationStyles(): string {
    return `
      .fade-enter {
        opacity: 0;
      }

      .fade-enter-active {
        opacity: 1;
        transition: opacity var(--animation-duration) var(--animation-timing);
      }

      .fade-exit {
        opacity: 1;
      }

      .fade-exit-active {
        opacity: 0;
        transition: opacity var(--animation-duration) var(--animation-timing);
      }

      .slide-enter {
        transform: translateX(-100%);
      }

      .slide-enter-active {
        transform: translateX(0);
        transition: transform var(--animation-duration) var(--animation-timing);
      }

      .slide-exit {
        transform: translateX(0);
      }

      .slide-exit-active {
        transform: translateX(-100%);
        transition: transform var(--animation-duration) var(--animation-timing);
      }
    `;
  }

  public applyThemeToDesignSystem(): void {
    // Update design system with theme configuration
    // Check if updateTheme method exists before calling it
    if (this.designSystem.updateTheme) {
      this.designSystem.updateTheme({
        colors: this.config.colors,
        typography: this.config.typography,
        spacing: this.config.spacing,
        breakpoints: this.config.breakpoints,
      });
    }
  }
}
