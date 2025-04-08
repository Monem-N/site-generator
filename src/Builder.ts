import { BuildConfig, ComponentTemplate } from '../types/index.js';
import type { InputOptions, OutputOptions, RollupBuild, ManualChunksOption } from 'rollup';
import * as path from 'path';
import * as fs from 'fs/promises';
import { rollup } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { logger } from './utils/logger.js';

// Import these dynamically to avoid ESM issues
let babel;
let commonjs;
let terser;
let image;
let postcss;
let autoprefixer;
let cssnano;

// Load plugins dynamically
async function loadPlugins() {
  const babelModule = await import('@rollup/plugin-babel');
  babel = babelModule.babel;

  const commonjsModule = await import('@rollup/plugin-commonjs');
  commonjs = commonjsModule.default;

  const terserModule = await import('rollup-plugin-terser');
  terser = terserModule.terser;

  const imageModule = await import('@rollup/plugin-image');
  image = imageModule.default;

  const postcssModule = await import('rollup-plugin-postcss');
  postcss = postcssModule.default;

  const autoprefixerModule = await import('autoprefixer');
  autoprefixer = autoprefixerModule.default;

  const cssnanoModule = await import('cssnano');
  cssnano = cssnanoModule.default;
}

export class Builder {
  private config: BuildConfig;

  constructor(config: BuildConfig) {
    this.config = config;
  }

  public async build(components: ComponentTemplate[]): Promise<void> {
    try {
      // 0. Load plugins
      await loadPlugins();

      // 1. Prepare output directory
      await this.prepareOutputDirectory();

      // 2. Generate entry points
      const entryPoints = await this.generateEntryPoints(components);

      // 3. Configure build
      const buildConfig = this.createBuildConfig(entryPoints);

      // 4. Execute build
      await this.executeBuild(buildConfig);

      // 5. Process assets
      await this.processAssets();

      // 6. Generate service worker if needed
      if (this.config.optimization?.splitChunks) {
        await this.generateServiceWorker();
      }

      logger.info('Build completed successfully!');
    } catch (error) {
      logger.error('Build failed:', { error });
      throw error;
    }
  }

  private async prepareOutputDirectory(): Promise<void> {
    await fs.rm(this.config.outDir, { recursive: true, force: true });
    await fs.mkdir(this.config.outDir, { recursive: true });
  }

  private async generateEntryPoints(components: ComponentTemplate[]): Promise<Map<string, string>> {
    const entryPoints = new Map<string, string>();
    const srcDir = path.join(this.config.outDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });

    // Generate main entry point
    const mainEntry = this.generateMainEntry(components);
    await fs.writeFile(path.join(srcDir, 'index.tsx'), mainEntry, 'utf-8');
    entryPoints.set('main', path.join(srcDir, 'index.tsx'));

    // Generate component entry points for code splitting
    if (this.config.optimization?.splitChunks) {
      for (const component of components) {
        const componentPath = path.join(srcDir, `${component.name}.tsx`);
        await fs.writeFile(componentPath, component.content, 'utf-8');
        entryPoints.set(component.name, componentPath);
      }
    }

    return entryPoints;
  }

  private generateMainEntry(_components: ComponentTemplate[]): string {
    return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
  }

  private createBuildConfig(entryPoints: Map<string, string>): InputOptions {
    const plugins = [
      nodeResolve({
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      }),
      commonjs(),
      babel({
        presets: ['@babel/preset-react', '@babel/preset-typescript'],
        babelHelpers: 'bundled',
      }),
      postcss({
        plugins: [autoprefixer(), this.config.optimization?.minify ? cssnano() : false].filter(
          Boolean
        ),
        minimize: this.config.optimization?.minify,
      }),
      image(),
    ];

    if (this.config.optimization?.minify) {
      plugins.push(terser());
    }

    return {
      input: Object.fromEntries(entryPoints),
      plugins,
    } as InputOptions;
  }

  private generateChunkConfig(): ManualChunksOption {
    return (id: string) => {
      if (id.includes('node_modules')) {
        return 'vendor';
      }
      return undefined;
    };
  }

  private async executeBuild(config: InputOptions): Promise<void> {
    const outputOptions: OutputOptions = {
      dir: this.config.outDir,
      format: 'esm',
      sourcemap: true,
      manualChunks: this.config.optimization?.splitChunks ? this.generateChunkConfig() : undefined,
    };
    const bundle: RollupBuild = await rollup(config as InputOptions);
    bundle.write(outputOptions);
    await bundle.close();
  }

  private async processAssets(): Promise<void> {
    if (this.config.assets?.images?.optimize) {
      await this.optimizeImages();
    }

    if (this.config.assets?.fonts?.preload) {
      await this.processFonts();
    }
  }

  private async optimizeImages(): Promise<void> {
    const sharp = await import('sharp');
    const assetsDir = path.join(this.config.outDir, 'assets');
    const images = await fs.readdir(assetsDir);

    for (const image of images) {
      if (!/\.(jpe?g|png|gif|webp)$/i.test(image)) continue;

      // Process image with sharp
      const imagePath = path.join(assetsDir, image);
      const optimizedImage = await sharp
        .default(imagePath)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toFormat('webp', { quality: 80 })
        .toBuffer();
      await fs.writeFile(imagePath.replace(/\.[^.]+$/, '.webp'), optimizedImage);
    }
  }

  private async processFonts(): Promise<void> {
    const fontsDir = path.join(this.config.outDir, 'fonts');
    const fonts = await fs.readdir(fontsDir);

    // Generate preload links for fonts
    const preloadLinks = fonts
      .filter(font => /\.(woff2?)$/i.test(font))
      .map(
        font =>
          `<link rel="preload" href="/fonts/${font}" as="font" type="font/${font
            .split('.')
            .pop()}" crossorigin>`
      );

    // Inject preload links into HTML
    const htmlPath = path.join(this.config.outDir, 'index.html');
    let html = await fs.readFile(htmlPath, 'utf-8');
    html = html.replace('</head>', `${preloadLinks.join('\n')}\n</head>`);
    await fs.writeFile(htmlPath, html, 'utf-8');
  }

  private async generateServiceWorker(): Promise<void> {
    const workbox = await import('workbox-build');
    await workbox.generateSW({
      swDest: path.join(this.config.outDir, 'service-worker.js'),
      globDirectory: this.config.outDir,
      globPatterns: ['**/*.{js,css,html,png,jpg,jpeg,gif,svg,woff,woff2}'],
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
          },
        },
        {
          urlPattern: /\.(?:js|css)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources',
          },
        },
      ],
    });
  }
}
