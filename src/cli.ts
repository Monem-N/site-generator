#!/usr/bin/env node

import { DocsifyWebsiteGenerator } from './DocsifyWebsiteGenerator';
import path from 'path';
import fs from 'fs';

// Parse command line arguments
const args = process.argv.slice(2);
const options: any = {
  sourceDir: '.',
  outputDir: './dist',
  theme: 'vue',
  ignorePatterns: ['node_modules', '.git', '.github', '.vscode']
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--source' || arg === '-s') {
    options.sourceDir = args[++i];
  } else if (arg === '--output' || arg === '-o') {
    options.outputDir = args[++i];
  } else if (arg === '--theme' || arg === '-t') {
    options.theme = args[++i];
  } else if (arg === '--ignore' || arg === '-i') {
    options.ignorePatterns = args[++i].split(',');
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

// Show help
function showHelp() {
  console.log(`
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
  console.error(`Error: Source directory "${options.sourceDir}" does not exist.`);
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
    ignorePatterns: options.ignorePatterns
  },
  designSystem: {
    name: options.theme,
    type: 'custom'
  }
};

// Create generator
const generator = new DocsifyWebsiteGenerator(config);

// Generate website
console.log(`Generating website from ${options.sourceDir} to ${options.outputDir}...`);

generator.generate()
  .then(() => {
    console.log('Website generated successfully!');
  })
  .catch((error) => {
    console.error('Error generating website:', error);
    process.exit(1);
  });
