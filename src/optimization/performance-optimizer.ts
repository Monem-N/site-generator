import { BuildConfig } from '../../types/index.js';

export interface PerformanceConfig {
  lazyLoading: {
    enabled: boolean;
    threshold: number; // Viewport distance threshold for loading
    placeholder: string; // Placeholder component while loading
  };
  codeOptimization: {
    minify: boolean;
    splitChunks: boolean;
    treeshaking: boolean;
  };
  caching: {
    strategy: 'memory' | 'filesystem';
    maxAge: number;
    revalidate: boolean;
  };
  assets: {
    imageOptimization: {
      enabled: boolean;
      quality: number;
      formats: string[];
    };
    fontOptimization: {
      preload: boolean;
      formats: string[];
    };
  };
}

export class PerformanceOptimizer {
  private config: PerformanceConfig;
  // Build configuration (currently unused but kept for future use)

  constructor(config: Partial<PerformanceConfig>) {
    this.config = this.mergeWithDefaultConfig(config);
  }

  private mergeWithDefaultConfig(config: Partial<PerformanceConfig>): PerformanceConfig {
    return {
      lazyLoading: {
        enabled: true,
        threshold: 100,
        placeholder: 'loading',
        ...config.lazyLoading,
      },
      codeOptimization: {
        minify: true,
        splitChunks: true,
        treeshaking: true,
        ...config.codeOptimization,
      },
      caching: {
        strategy: 'memory',
        maxAge: 3600,
        revalidate: true,
        ...config.caching,
      },
      assets: {
        imageOptimization: {
          enabled: true,
          quality: 85,
          formats: ['webp', 'avif'],
          ...config.assets?.imageOptimization,
        },
        fontOptimization: {
          preload: true,
          formats: ['woff2', 'woff'],
          ...config.assets?.fontOptimization,
        },
      },
    };
  }

  public generateLazyLoadingWrapper(componentPath: string): string {
    if (!this.config.lazyLoading.enabled) {
      return `import Component from '${componentPath}';
export default Component;`;
    }

    return `
import { lazy, Suspense } from 'react';
import LoadingPlaceholder from '../components/${this.config.lazyLoading.placeholder}.js';

const Component = lazy(() => import('${componentPath}'));

export default function LazyComponent(props) {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <Component {...props} />
    </Suspense>
  );
}
`;
  }

  public generateBuildConfig(): Record<string, any> {
    return {
      optimization: {
        minimize: this.config.codeOptimization.minify,
        splitChunks: this.config.codeOptimization.splitChunks
          ? {
              chunks: 'all',
              minSize: 20000,
              maxSize: 40000,
              cacheGroups: {
                vendor: {
                  test: /[\\]node_modules[\\]/,
                  name: 'vendors',
                  chunks: 'all',
                },
              },
            }
          : false,
        usedExports: this.config.codeOptimization.treeshaking,
      },
      output: {
        filename: '[name].[contenthash].js',
        chunkFilename: '[name].[contenthash].chunk.js',
      },
      cache: this.generateCacheConfig(),
      module: {
        rules: [...this.generateAssetRules()],
      },
    };
  }

  private generateCacheConfig(): Record<string, any> {
    return {
      type: this.config.caching.strategy,
      maxAge: this.config.caching.maxAge * 1000, // Convert to milliseconds
      store: this.config.caching.strategy === 'filesystem' ? 'pack' : 'memory',
      buildDependencies: {
        config: [__filename],
      },
    };
  }

  private generateAssetRules(): Array<Record<string, any>> {
    const rules = [];

    if (this.config.assets.imageOptimization.enabled) {
      rules.push({
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                quality: this.config.assets.imageOptimization.quality,
              },
              webp: {
                quality: this.config.assets.imageOptimization.quality,
              },
              avif: {
                quality: this.config.assets.imageOptimization.quality,
              },
            },
          },
        ],
      });
    }

    if (this.config.assets.fontOptimization.preload) {
      rules.push({
        test: /\.(woff2?|eot|ttf|otf)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[hash].[ext]',
              outputPath: 'fonts/',
            },
          },
        ],
      });
    }

    return rules;
  }

  public generatePreloadDirectives(): string[] {
    const directives: string[] = [];

    if (this.config.assets.fontOptimization.preload) {
      this.config.assets.fontOptimization.formats.forEach(format => {
        directives.push(
          `<link rel="preload" href="fonts/font-name.${format}" as="font" type="font/${format}" crossorigin>`
        );
      });
    }

    return directives;
  }

  public async optimizeImages(imagePath: string): Promise<void> {
    if (!this.config.assets.imageOptimization.enabled) return;

    // Import sharp dynamically to avoid requiring it as a dependency
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default;
    const formats = this.config.assets.imageOptimization.formats;
    const quality = this.config.assets.imageOptimization.quality;

    for (const format of formats) {
      await sharp(imagePath)
        .toFormat(format as any, { quality })
        .toFile(`${imagePath}.${format}`);
    }
  }

  public generateServiceWorker(): string {
    return `
const CACHE_NAME = 'documentation-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
`;
  }
}
