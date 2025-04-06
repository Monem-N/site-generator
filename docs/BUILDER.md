# Builder Component Documentation

## Overview

The Builder component is responsible for compiling and optimizing the generated components into a production-ready website. It represents the final stage in the 5-step pipeline process of the Website Generator system.

## Responsibilities

- Preparing the output directory for the build
- Generating entry points for the application
- Configuring the build process based on optimization settings
- Executing the build using Rollup
- Processing assets (images, fonts) according to configuration
- Generating a service worker for offline capabilities (when enabled)

## Key Features

### Build Configuration

The Builder accepts a comprehensive `BuildConfig` object that controls various aspects of the build process:

```typescript
export interface BuildConfig {
  target: 'development' | 'production' | 'preview';
  outDir: string;
  assets?: {
    images?: {
      optimize?: boolean;
      formats?: string[];
    };
    fonts?: {
      preload?: boolean;
      formats?: string[];
    };
  };
  optimization?: {
    minify?: boolean;
    treeshake?: boolean;
    splitChunks?: boolean;
  };
}
```

### Code Optimization

The Builder implements several optimization techniques:

- **Minification**: Reduces the size of JavaScript and CSS files using terser and cssnano
- **Tree-shaking**: Eliminates unused code from the final bundle
- **Code splitting**: Divides the application into smaller chunks for better loading performance
- **Asset optimization**: Processes images and fonts for optimal delivery

### Asset Processing

The Builder handles various types of assets:

- **Images**: Optimizes images and converts them to modern formats (WebP, AVIF) when configured
- **Fonts**: Preloads fonts and converts them to efficient formats (WOFF2) when configured
- **CSS**: Processes CSS with PostCSS, applying autoprefixer and optimization plugins

### Service Worker Generation

When code splitting is enabled, the Builder can generate a service worker for offline capabilities and improved performance:

- Caches static assets
- Implements a cache-first strategy for assets
- Provides offline fallback pages

## Implementation

The Builder uses Rollup as its underlying build tool, with a variety of plugins to handle different aspects of the build process:

```typescript
import { rollup } from 'rollup';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import image from '@rollup/plugin-image';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
```

## Core Methods

### build(components)

The main entry point that orchestrates the entire build process:

```typescript
public async build(components: ComponentTemplate[]): Promise<void> {
  try {
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

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    throw error;
  }
}
```

### prepareOutputDirectory()

Cleans and creates the output directory:

```typescript
private async prepareOutputDirectory(): Promise<void> {
  await fs.rm(this.config.outDir, { recursive: true, force: true });
  await fs.mkdir(this.config.outDir, { recursive: true });
}
```

### generateEntryPoints(components)

Creates entry points for the application, including code splitting when enabled:

```typescript
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
```

### executeBuild(buildConfig)

Executes the Rollup build process with the configured plugins and settings:

```typescript
private async executeBuild(buildConfig: any): Promise<void> {
  const bundle = await rollup(buildConfig);
  await bundle.write({
    dir: this.config.outDir,
    format: 'esm',
    sourcemap: this.config.target !== 'production',
    entryFileNames: this.config.target === 'production'
      ? 'assets/js/[name].[hash].js'
      : 'assets/js/[name].js',
    chunkFileNames: 'assets/js/[name].[hash].js',
    assetFileNames: 'assets/[ext]/[name].[hash][extname]',
  });
  await bundle.close();
}
```

## Integration with the Pipeline

The Builder is the final component in the Website Generator pipeline:

1. The WebsiteGenerator calls the Builder's `build()` method with the styled components
2. The Builder processes these components and generates a production-ready website
3. The resulting website is output to the configured directory

## Extensibility

The Builder is designed to be extensible through configuration:

- Different optimization strategies can be enabled or disabled
- Asset processing can be customized
- The build target can be changed for different environments

## Conclusion

The Builder component provides a powerful and flexible way to compile and optimize the generated components into a production-ready website. Its integration with modern build tools and optimization techniques ensures that the resulting website is performant and efficient.
