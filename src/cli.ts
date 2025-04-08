#!/usr/bin/env node

import { DocsifyWebsiteGenerator } from './DocsifyWebsiteGenerator.js';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from 'utils/logger.js';

// Parse command line arguments
const args = process.argv.slice(2);

interface Options {
  sourceDir: string;
  outputDir: string;
  theme: string;
  ignorePatterns: string[];
}
const options: Options = {
  sourceDir: '.',
  outputDir: './dist',
  theme: 'vue',
  ignorePatterns: ['node_modules', '.git', '.github', '.vscode'],
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--source' || arg === '-s') {
    options.sourceDir = args[i + 1];
    i++;
  } else if (arg === '--output' || arg === '-o') {
    options.outputDir = args[i + 1];
    i++;
  } else if (arg === '--theme' || arg === '-t') {
    options.theme = args[i + 1];
    i++;
  } else if (arg === '--ignore' || arg === '-i') {
    options.ignorePatterns = args[i + 1].split(',');
    i++;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

// Show help
function showHelp() {
  logger.debug(`
Site Generator CLI

Usage:
  site-generator [options]

Options:
  --source, -s     Source directory (default: current directory)
  --output, -o     Output directory (default: ./dist)
  --theme, -t      Theme to use (default: vue)
  --ignore, -i     Comma-separated list of directories to ignore
  --help, -h       Show this help message
  
Themes:
  vue              Vue theme (default)
  dark             Dark theme
  buble            Buble theme
  pure             Pure theme
  dolphin          Dolphin theme
  `);
}

// Check if source directory exists
if (!fs.existsSync(options.sourceDir)) {
  logger.error(`Error: Source directory "${options.sourceDir}" does not exist.`);
  process.exit(1);
}

// Resolve paths
options.sourceDir = path.resolve(options.sourceDir);
options.outputDir = path.resolve(options.outputDir);

// Create generator config
const config = {
  projectName: 'site-generator',
  sourceDir: options.sourceDir,
  outputDir: options.outputDir,
  parser: {
    extensions: ['md', 'markdown'],
    ignorePatterns: options.ignorePatterns,
  },
  designSystem: {
    name: options.theme,
    type: 'custom' as const,
    importPath: '',
    theme: {},
    components: {},
    styles: {},
  },
};

// Create generator
const generator = new DocsifyWebsiteGenerator(config);

// Generate website
logger.debug(`Generating website from ${options.sourceDir} to ${options.outputDir}...`);

generator
  .generate()
  .then(() => {
    logger.debug('Website generated successfully!');
  })
  .catch(error => {
    logger.error('Error generating website:', error);
    process.exit(1);
  });
