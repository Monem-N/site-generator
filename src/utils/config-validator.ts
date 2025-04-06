import { WebsiteGeneratorConfig } from '../../config/generator.config';
import fs from 'fs';
import path from 'path';

/**
 * Validates a WebsiteGeneratorConfig object
 * @param config The configuration to validate
 * @throws Error if the configuration is invalid
 */
export function validateConfig(config: WebsiteGeneratorConfig): void {
  const errors: string[] = [];

  // Required fields
  if (!config.projectName) {
    errors.push('Missing required field: projectName');
  }

  if (!config.sourceDir) {
    errors.push('Missing required field: sourceDir');
  } else if (!fs.existsSync(config.sourceDir)) {
    errors.push(`Source directory does not exist: ${config.sourceDir}`);
  }

  if (!config.outputDir) {
    errors.push('Missing required field: outputDir');
  } else {
    // Ensure output directory is writable
    try {
      const testDir = path.resolve(config.outputDir);
      const parentDir = path.dirname(testDir);

      if (!fs.existsSync(parentDir)) {
        errors.push(`Parent directory of output directory does not exist: ${parentDir}`);
      } else {
        // Check if we can write to the parent directory
        try {
          fs.accessSync(parentDir, fs.constants.W_OK);
        } catch (error) {
          errors.push(`Cannot write to parent directory of output directory: ${parentDir}`);
        }
      }
    } catch (error) {
      errors.push(`Invalid output directory path: ${config.outputDir}`);
    }
  }

  // Parser configuration
  if (!config.parser) {
    errors.push('Missing required field: parser');
  } else {
    // Validate parser plugins
    if (config.parser.plugins) {
      if (!Array.isArray(config.parser.plugins)) {
        errors.push('parser.plugins must be an array');
      }
    }

    // Validate custom formats
    if (config.parser.customFormats) {
      if (typeof config.parser.customFormats !== 'object') {
        errors.push('parser.customFormats must be an object');
      } else {
        for (const [format, config] of Object.entries(config.parser.customFormats)) {
          if (!config.parser) {
            errors.push(`Missing parser for custom format: ${format}`);
          }
        }
      }
    }
  }

  // Generator configuration
  if (!config.generator) {
    errors.push('Missing required field: generator');
  } else {
    // Validate templates
    if (!config.generator.templates) {
      errors.push('Missing required field: generator.templates');
    } else if (typeof config.generator.templates !== 'object') {
      errors.push('generator.templates must be an object');
    } else {
      // Check if required templates exist
      const requiredTemplates = ['page', 'section'];
      for (const template of requiredTemplates) {
        if (!config.generator.templates[template]) {
          errors.push(`Missing required template: ${template}`);
        }
      }
    }

    // Validate component naming
    if (config.generator.componentNaming) {
      if (
        config.generator.componentNaming.style &&
        !['PascalCase', 'camelCase'].includes(config.generator.componentNaming.style)
      ) {
        errors.push('generator.componentNaming.style must be either "PascalCase" or "camelCase"');
      }
    }
  }

  // Design system configuration
  if (!config.designSystem) {
    errors.push('Missing required field: designSystem');
  } else {
    if (!config.designSystem.name) {
      errors.push('Missing required field: designSystem.name');
    }

    if (!config.designSystem.importPath) {
      errors.push('Missing required field: designSystem.importPath');
    }

    if (!config.designSystem.components) {
      errors.push('Missing required field: designSystem.components');
    } else if (typeof config.designSystem.components !== 'object') {
      errors.push('designSystem.components must be an object');
    }
  }

  // Testing configuration
  if (!config.testing) {
    errors.push('Missing required field: testing');
  } else {
    if (!config.testing.framework) {
      errors.push('Missing required field: testing.framework');
    } else if (!['jest', 'vitest'].includes(config.testing.framework)) {
      errors.push('testing.framework must be either "jest" or "vitest"');
    }

    if (!config.testing.coverage) {
      errors.push('Missing required field: testing.coverage');
    } else {
      if (typeof config.testing.coverage.enabled !== 'boolean') {
        errors.push('testing.coverage.enabled must be a boolean');
      }

      if (
        config.testing.coverage.threshold !== undefined &&
        (typeof config.testing.coverage.threshold !== 'number' ||
          config.testing.coverage.threshold < 0 ||
          config.testing.coverage.threshold > 100)
      ) {
        errors.push('testing.coverage.threshold must be a number between 0 and 100');
      }
    }

    if (!config.testing.components) {
      errors.push('Missing required field: testing.components');
    } else {
      if (typeof config.testing.components.unit !== 'boolean') {
        errors.push('testing.components.unit must be a boolean');
      }

      if (typeof config.testing.components.integration !== 'boolean') {
        errors.push('testing.components.integration must be a boolean');
      }

      if (
        config.testing.components.e2e !== undefined &&
        typeof config.testing.components.e2e !== 'boolean'
      ) {
        errors.push('testing.components.e2e must be a boolean');
      }
    }
  }

  // Build configuration
  if (!config.build) {
    errors.push('Missing required field: build');
  } else {
    if (!config.build.optimization) {
      errors.push('Missing required field: build.optimization');
    } else {
      if (typeof config.build.optimization.minify !== 'boolean') {
        errors.push('build.optimization.minify must be a boolean');
      }

      if (typeof config.build.optimization.splitChunks !== 'boolean') {
        errors.push('build.optimization.splitChunks must be a boolean');
      }

      if (typeof config.build.optimization.treeshaking !== 'boolean') {
        errors.push('build.optimization.treeshaking must be a boolean');
      }
    }

    if (!config.build.assets) {
      errors.push('Missing required field: build.assets');
    } else {
      if (!config.build.assets.images) {
        errors.push('Missing required field: build.assets.images');
      } else {
        if (typeof config.build.assets.images.optimize !== 'boolean') {
          errors.push('build.assets.images.optimize must be a boolean');
        }

        if (!Array.isArray(config.build.assets.images.formats)) {
          errors.push('build.assets.images.formats must be an array');
        }
      }

      if (!config.build.assets.fonts) {
        errors.push('Missing required field: build.assets.fonts');
      } else {
        if (typeof config.build.assets.fonts.preload !== 'boolean') {
          errors.push('build.assets.fonts.preload must be a boolean');
        }

        if (!Array.isArray(config.build.assets.fonts.formats)) {
          errors.push('build.assets.fonts.formats must be an array');
        }
      }
    }
  }

  // Performance configuration
  if (!config.performance) {
    errors.push('Missing required field: performance');
  } else {
    if (typeof config.performance.lazyLoading !== 'boolean') {
      errors.push('performance.lazyLoading must be a boolean');
    }

    if (typeof config.performance.prefetching !== 'boolean') {
      errors.push('performance.prefetching must be a boolean');
    }

    if (!config.performance.caching) {
      errors.push('Missing required field: performance.caching');
    } else {
      if (typeof config.performance.caching.enabled !== 'boolean') {
        errors.push('performance.caching.enabled must be a boolean');
      }

      if (!['memory', 'filesystem'].includes(config.performance.caching.strategy)) {
        errors.push('performance.caching.strategy must be either "memory" or "filesystem"');
      }
    }
  }

  // Accessibility configuration
  if (!config.accessibility) {
    errors.push('Missing required field: accessibility');
  } else {
    if (!config.accessibility.wcag) {
      errors.push('Missing required field: accessibility.wcag');
    } else {
      if (!['A', 'AA', 'AAA'].includes(config.accessibility.wcag.level)) {
        errors.push('accessibility.wcag.level must be one of "A", "AA", or "AAA"');
      }

      if (typeof config.accessibility.wcag.automated !== 'boolean') {
        errors.push('accessibility.wcag.automated must be a boolean');
      }
    }

    if (typeof config.accessibility.aria !== 'boolean') {
      errors.push('accessibility.aria must be a boolean');
    }

    if (typeof config.accessibility.keyboard !== 'boolean') {
      errors.push('accessibility.keyboard must be a boolean');
    }
  }

  // Plugins configuration
  if (config.plugins !== undefined) {
    if (!Array.isArray(config.plugins)) {
      errors.push('plugins must be an array');
    } else {
      for (let i = 0; i < config.plugins.length; i++) {
        const plugin = config.plugins[i];
        if (!plugin.name) {
          errors.push(`Plugin at index ${i} is missing required field: name`);
        }
      }
    }
  }

  // If there are any errors, throw an error with all the validation messages
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.map(e => `- ${e}`).join('\n')}`);
  }
}
