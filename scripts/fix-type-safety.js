#!/usr/bin/env node

/**
 * This script helps identify and fix type safety issues:
 * - @typescript-eslint/no-explicit-any
 * - @typescript-eslint/no-unused-vars
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get a list of files with type safety issues
const getFilesWithTypeIssues = () => {
  try {
    const output = execSync(
      'npx eslint --format json \'src/**/*.ts\' | jq \'.[] | select(.messages[] | .ruleId == "@typescript-eslint/no-explicit-any" or .ruleId == "@typescript-eslint/no-unused-vars") | .filePath\''
    ).toString();

    return output
      .split('\n')
      .filter(Boolean)
      .map(file => file.replace(/"/g, ''));
  } catch (error) {
    console.error('Error getting files with type issues:', error);
    return [];
  }
};

// Main function
const main = () => {
  const files = getFilesWithTypeIssues();

  console.log(`Found ${files.length} files with type safety issues.`);

  if (files.length === 0) {
    console.log('No files to fix. Exiting.');
    return;
  }

  console.log('\nFiles with type safety issues:');
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${path.relative(process.cwd(), file)}`);
  });

  console.log('\nTo fix these issues:');
  console.log('1. Replace "any" types with more specific types');
  console.log('2. Remove unused variables or prefix them with underscore');
  console.log('3. Run "npx eslint --fix" on specific files');

  console.log('\nExample commands:');
  console.log(
    'npx eslint --fix ' +
      files
        .slice(0, 3)
        .map(f => `"${f}"`)
        .join(' ')
  );
};

main();
