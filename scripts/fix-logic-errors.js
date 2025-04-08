#!/usr/bin/env node

/**
 * This script helps identify and fix logic and runtime errors:
 * - no-fallthrough
 * - no-console
 * - no-sparse-arrays
 * - no-redeclare
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get a list of files with logic errors
const getFilesWithLogicErrors = () => {
  try {
    const output = execSync(
      'npx eslint --format json \'src/**/*.ts\' | jq \'.[] | select(.messages[] | .ruleId == "no-fallthrough" or .ruleId == "no-console" or .ruleId == "no-sparse-arrays" or .ruleId == "no-redeclare") | .filePath\''
    ).toString();

    return output
      .split('\n')
      .filter(Boolean)
      .map(file => file.replace(/"/g, ''));
  } catch (error) {
    console.error('Error getting files with logic errors:', error);
    return [];
  }
};

// Main function
const main = () => {
  const files = getFilesWithLogicErrors();

  console.log(`Found ${files.length} files with logic and runtime errors.`);

  if (files.length === 0) {
    console.log('No files to fix. Exiting.');
    return;
  }

  console.log('\nFiles with logic and runtime errors:');
  files.forEach((file, index) => {
    console.log(`${index + 1}. ${path.relative(process.cwd(), file)}`);
  });

  console.log('\nTo fix these issues:');
  console.log(
    '1. For no-fallthrough: Add break statements or // fallthrough comments in switch cases'
  );
  console.log(
    '2. For no-console: Replace console.log with a logger or remove debugging statements'
  );
  console.log('3. For no-sparse-arrays: Fix array declarations with empty slots');
  console.log('4. For no-redeclare: Rename variables or use let/const instead of var');
};

main();
