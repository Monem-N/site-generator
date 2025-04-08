#!/usr/bin/env node

/**
 * This script helps identify and fix module system issues:
 * - @typescript-eslint/no-var-requires
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get a list of files with require statements
const getFilesWithRequires = () => {
  try {
    const output = execSync(
      "npx eslint --format json 'src/**/*.ts' | jq '.[] | select(.messages[] | .ruleId == \"@typescript-eslint/no-var-requires\") | .filePath'"
    ).toString();

    return output
      .split('\n')
      .filter(Boolean)
      .map(file => file.replace(/"/g, ''));
  } catch (error) {
    console.error('Error getting files with require statements:', error);
    return [];
  }
};

// Main function
const main = () => {
  const files = getFilesWithRequires();

  console.log(`Found ${files.length} files with require statements.`);

  if (files.length === 0) {
    console.log('No files to fix. Exiting.');
    return;
  }

  console.log('\nFiles with require statements:');
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${path.relative(process.cwd(), file)}`);
  });

  console.log('\nTo fix these issues:');
  console.log('1. Replace require() with import statements');
  console.log('2. For dynamic requires, use dynamic imports or add ESLint disable comments');

  console.log('\nExample:');
  console.log('// Before:');
  console.log('const module = require("module");');
  console.log('\n// After:');
  console.log('import module from "module";');
  console.log('// or for CommonJS modules:');
  console.log('import * as module from "module";');
};

main();
