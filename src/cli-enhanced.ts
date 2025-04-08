#!/usr/bin/env node
import { logger as systemLogger } from './utils/logger.js';

import { DocsifyWebsiteGenerator } from './DocsifyWebsiteGenerator.js';
import { WebsiteGeneratorConfig, defaultConfig } from '../config/generator.config.js';
import { validateConfig } from './utils/config-validator.js';
import { loadPreset } from './utils/config-presets.js';
import * as path from 'path';
import * as fs from 'fs';
import * as chalk from 'chalk';

// Set up logger
const logger = {
  info: (message: string) => process.stdout.write(chalk.blue(`[INFO] ${message}\n`)),
  success: (message: string) => process.stdout.write(chalk.green(`[SUCCESS] ${message}\n`)),
  warning: (message: string) => process.stdout.write(chalk.yellow(`[WARNING] ${message}\n`)),
  error: (message: string) => process.stderr.write(chalk.red(`[ERROR] ${message}\n`)),
  debug: (message: string, data?: unknown) => {
    if (options.verbose) {
      process.stdout.write(chalk.gray(`[DEBUG] ${message}\n`));
      if (data) process.stdout.write(chalk.gray(JSON.stringify(data, null, 2) + '\n'));
    }
  },
};

// Parse command line arguments
const args = process.argv.slice(2);
interface CliOptions {
  sourceDir: string;
  outputDir: string;
  theme: string;
  ignorePatterns: string[];
  preset: string | null;
  configFile: string | null;
  verbose: boolean;
  validate: boolean;
  plugins: string[];
  watch: boolean;
  serve: boolean;
  port: number;
}

const options: CliOptions = {
  sourceDir: '.',
  outputDir: './dist',
  theme: 'vue',
  ignorePatterns: ['node_modules', '.git', '.github', '.vscode'],
  preset: null,
  configFile: null,
  verbose: false,
  validate: true,
  plugins: [],
  watch: false,
  serve: false,
  port: 3000,
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  switch (arg) {
    case '--source':
    case '-s':
      options.sourceDir = args[++i];
      break;
    case '--output':
    case '-o':
      options.outputDir = args[++i];
      break;
    case '--theme':
    case '-t':
      options.theme = args[++i];
      break;
    case '--ignore':
    case '-i':
      options.ignorePatterns = args[++i].split(',');
      break;
    case '--preset':
    case '-p':
      options.preset = args[++i];
      break;
    case '--config':
    case '-c':
      options.configFile = args[++i];
      break;
    case '--verbose':
    case '-v':
      options.verbose = true;
      break;
    case '--no-validate':
      options.validate = false;
      break;
    case '--plugin':
      options.plugins.push(args[++i]);
      break;
    case '--watch':
    case '-w':
      options.watch = true;
      break;
    case '--serve':
      options.serve = true;
      break;
    case '--port':
      options.port = parseInt(args[++i], 10);
      break;
    case '--help':
    case '-h':
      showHelp();
      process.exit(0);
      break;
    default:
      logger.error(`Unknown option: ${arg}`);
      showHelp();
      process.exit(1);
  }
}

// Show help
function showHelp() {
  logger.debug(`
${chalk.bold('Site Generator CLI')}

${chalk.bold('Usage:')}
  site-generator [options]

${chalk.bold('Options:')}
  --source, -s     Source directory (default: current directory)
  --output, -o     Output directory (default: ./dist)
  --theme, -t      Theme to use (default: vue)
  --ignore, -i     Comma-separated list of directories to ignore
  --preset, -p     Use a predefined configuration preset (docs, blog, api)
  --config, -c     Path to a custom configuration file
  --verbose, -v    Enable verbose logging
  --no-validate    Skip configuration validation
  --plugin         Add a plugin (can be used multiple times)
  --watch, -w      Watch for changes and rebuild
  --serve          Start a development server
  --port           Port for development server (default: 3000)
  --help, -h       Show this help message

${chalk.bold('Themes:')}
  vue              Vue theme (default)
  dark             Dark theme
  buble            Buble theme
  pure             Pure theme
  dolphin          Dolphin theme

${chalk.bold('Presets:')}
  docs             Documentation site with sidebar navigation
  blog             Blog site with posts and tags
  api              API documentation site with OpenAPI support
  `);
}

// Load configuration
let config: Partial<WebsiteGeneratorConfig> = {};

// Start with default config
config = { ...defaultConfig };

// Apply preset if specified
if (options.preset) {
  try {
    logger.info(`Loading preset: ${options.preset}`);
    const presetConfig = loadPreset(options.preset);
    config = { ...config, ...presetConfig };
    logger.debug('Preset config loaded', presetConfig);
  } catch (error) {
    logger.error(`Failed to load preset: ${options.preset}`);
    logger.error((error as Error).message);
    process.exit(1);
  }
}

// Load custom config file if specified
if (options.configFile) {
  try {
    logger.info(`Loading configuration from: ${options.configFile}`);
    const configPath = path.resolve(options.configFile);

    if (!fs.existsSync(configPath)) {
      logger.error(`Configuration file not found: ${configPath}`);
      process.exit(1);
    }

    const customConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config = { ...config, ...customConfig };
    logger.debug('Custom config loaded', customConfig);
  } catch (error) {
    logger.error(`Failed to load configuration file: ${options.configFile}`);
    logger.error((error as Error).message);
    process.exit(1);
  }
}

// Override with command line options
config.sourceDir = options.sourceDir;
config.outputDir = options.outputDir;
if (config.designSystem) {
  config.designSystem.name = options.theme;
}
if (config.parser) {
  config.parser.ignorePatterns = options.ignorePatterns;
}

// Add plugins
if (options.plugins.length > 0) {
  config.plugins = [
    ...(config.plugins || []),
    ...options.plugins.map((name: string) => ({ name })),
  ];
}

// Check if source directory exists
if (!fs.existsSync(options.sourceDir)) {
  logger.error(`Source directory "${options.sourceDir}" does not exist.`);
  process.exit(1);
}

// Resolve paths
// Sanitize input paths
const sanitizedSource = path.resolve(process.cwd(), options.sourceDir);
if (!sanitizedSource.startsWith(process.cwd())) {
  logger.error(`Invalid source directory: ${options.sourceDir}`);
  process.exit(1);
}
options.sourceDir = sanitizedSource;
const sanitizedOutput = path.resolve(process.cwd(), options.outputDir);
if (!sanitizedOutput.startsWith(process.cwd())) {
  logger.error(`Invalid output directory: ${options.outputDir}`);
  process.exit(1);
}
options.outputDir = sanitizedOutput;

// Validate configuration
if (options.validate) {
  try {
    logger.info('Validating configuration...');
    validateConfig(config as WebsiteGeneratorConfig);
    logger.success('Configuration is valid');
  } catch (error) {
    logger.error('Configuration validation failed:');
    logger.error((error as Error).message);
    process.exit(1);
  }
}

// Log configuration in verbose mode
logger.debug('Final configuration:', config);

// Create generator
const generator = new DocsifyWebsiteGenerator(config as WebsiteGeneratorConfig);

// Generate website
logger.info(`Generating website from ${options.sourceDir} to ${options.outputDir}...`);

// Watch mode
if (options.watch) {
  logger.info('Watch mode enabled. Watching for changes...');
  // TODO: Implement watch mode
}

// Generate website
generator
  .generate()
  .then(() => {
    logger.success('Website generated successfully!');

    // Start development server if requested
    if (options.serve) {
      logger.info(`Starting development server on port ${options.port}...`);
      // TODO: Implement development server
    }
  })
  .catch(error => {
    logger.error('Error generating website:');
    logger.error(error.message);
    if (options.verbose) {
      logger.debug('Error details:', error);
    }
    process.exit(1);
  });
