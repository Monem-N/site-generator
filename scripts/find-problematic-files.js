#!/usr/bin/env node

/**
 * This script attempts to find problematic TypeScript files by compiling them individually
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { execSync } from 'child_process';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Get all TypeScript files
const tsFiles = glob.sync('src/**/*.ts');

console.log(`Found ${tsFiles.length} TypeScript files to check.`);

// Check each file individually
let problematicFiles = [];

for (const file of tsFiles) {
  try {
    console.log(`Checking ${file}...`);

    // Try to compile the file with a timeout
    const command = `npx tsc ${file} --noEmit --skipLibCheck`;

    try {
      execSync(command, { timeout: 5000 });
      console.log(`✅ ${file} compiled successfully.`);
    } catch (error) {
      if (error.signal === 'SIGTERM') {
        console.log(`⚠️ ${file} timed out during compilation.`);
        problematicFiles.push({ file, reason: 'timeout' });
      } else {
        console.log(`❌ ${file} failed to compile: ${error.message}`);
        problematicFiles.push({ file, reason: 'error', message: error.message });
      }
    }
  } catch (error) {
    console.log(`Error processing ${file}: ${error.message}`);
  }
}

// Report results
console.log('\n--- Results ---');
console.log(`Found ${problematicFiles.length} problematic files:`);

for (const { file, reason, message } of problematicFiles) {
  console.log(`- ${file}: ${reason}${message ? ` (${message})` : ''}`);
}

if (problematicFiles.length === 0) {
  console.log('No problematic files found.');
}
