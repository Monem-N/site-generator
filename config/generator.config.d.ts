import { DesignSystemConfig, ParserConfig, GeneratorConfig, CMSConfig } from '../types';
export interface WebsiteGeneratorConfig {
    projectName: string;
    outputDir: string;
    sourceDir: string;
    logging?: {
        enabled?: boolean;
        level?: 'debug' | 'info' | 'warn' | 'error';
        format?: 'json' | 'text';
    };
    parser: ParserConfig & {
        plugins?: string[];
        customFormats?: {
            [key: string]: {
                parser: string;
                options?: Record<string, any>;
            };
        };
    };
    generator: GeneratorConfig & {
        templates: {
            [key: string]: string;
        };
        componentNaming?: {
            prefix?: string;
            suffix?: string;
            style: 'PascalCase' | 'camelCase';
        };
    };
    designSystem: DesignSystemConfig & {
        name: string;
        importPath: string;
        theme?: Record<string, any>;
        components: {
            [key: string]: {
                import: string;
                props?: Record<string, any>;
            };
        };
        styles: {
            global?: string;
            components?: Record<string, string>;
        };
    };
    cms?: CMSConfig;
    testing: {
        framework: 'jest' | 'vitest';
        coverage: {
            enabled: boolean;
            threshold?: number;
        };
        components: {
            unit: boolean;
            integration: boolean;
            e2e?: boolean;
        };
    };
    build: {
        optimization: {
            minify: boolean;
            splitChunks: boolean;
            treeshaking: boolean;
        };
        assets: {
            images: {
                optimize: boolean;
                formats: string[];
            };
            fonts: {
                preload: boolean;
                formats: string[];
            };
        };
    };
    performance: {
        lazyLoading: boolean;
        prefetching: boolean;
        caching: {
            enabled: boolean;
            strategy: 'memory' | 'filesystem';
        };
    };
    accessibility: {
        wcag: {
            level: 'A' | 'AA' | 'AAA';
            automated: boolean;
        };
        aria: boolean;
        keyboard: boolean;
    };
    plugins?: Array<{
        name: string;
        options?: Record<string, any>;
    }>;
}
export declare const defaultConfig: WebsiteGeneratorConfig;
