#!/usr/bin/env node

/**
 * This script fixes import paths in TypeScript files by adding .js extensions
 * to local imports, which is required for ES modules
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Get all TypeScript files
const tsFiles = glob.sync('src/**/*.ts');

console.log(`Found ${tsFiles.length} TypeScript files to process.`);

// Regular expression to match import statements with relative paths
const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^;]+|[^;{]*)\s+from\s+['"](\.[^'"]+)['"]/g;

// Process each file
let modifiedCount = 0;

for (const file of tsFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    let modified = false;
    let newContent = content;
    
    // Find all import statements with relative paths
    const matches = [...content.matchAll(importRegex)];
    
    for (const match of matches) {
      const [fullMatch, importPath] = match;
      
      // Skip if the import path already has a file extension
      if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
        continue;
      }
      
      // Add .js extension to the import path
      const newImportPath = `${importPath}.js`;
      const newImport = fullMatch.replace(`"${importPath}"`, `"${newImportPath}"`).replace(`'${importPath}'`, `'${newImportPath}'`);
      
      newContent = newContent.replace(fullMatch, newImport);
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated import paths in ${file}`);
      modifiedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
  }
}

console.log(`\nUpdated import paths in ${modifiedCount} files.`);
