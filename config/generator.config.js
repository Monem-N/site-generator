"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
// Default configuration
exports.defaultConfig = {
    projectName: 'documentation-site',
    outputDir: './dist',
    sourceDir: './docs',
    parser: {
        plugins: ['frontmatter', 'code-blocks', 'links'],
        customFormats: {},
    },
    generator: {
        templates: {
            page: './templates/page.tsx',
            section: './templates/section.tsx',
            navigation: './templates/navigation.tsx',
        },
        componentNaming: {
            style: 'PascalCase',
        },
    },
    designSystem: {
        type: 'material-ui',
        name: 'material-ui',
        importPath: '@mui/material',
        components: {
            Button: {
                import: '@mui/material/Button',
            },
            Typography: {
                import: '@mui/material/Typography',
            },
        },
        styles: {
            global: './styles/global.css',
        },
    },
    testing: {
        framework: 'vitest',
        coverage: {
            enabled: true,
            threshold: 80,
        },
        components: {
            unit: true,
            integration: true,
            e2e: false,
        },
    },
    build: {
        optimization: {
            minify: true,
            splitChunks: true,
            treeshaking: true,
        },
        assets: {
            images: {
                optimize: true,
                formats: ['webp', 'avif'],
            },
            fonts: {
                preload: true,
                formats: ['woff2', 'woff'],
            },
        },
    },
    performance: {
        lazyLoading: true,
        prefetching: true,
        caching: {
            enabled: true,
            strategy: 'memory',
        },
    },
    accessibility: {
        wcag: {
            level: 'AA',
            automated: true,
        },
        aria: true,
        keyboard: true,
    },
    plugins: [],
};
//# sourceMappingURL=generator.config.js.map