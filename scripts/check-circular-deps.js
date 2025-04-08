#!/usr/bin/env node

/**
 * This script checks for potential circular dependencies in TypeScript files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Get all TypeScript files
const tsFiles = glob.sync('src/**/*.ts');

// Regular expression to match import statements
const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+[^;]+|[^;{]*)\s+from\s+['"]([^'"]+)['"]/g;

// Map of file paths to their imports
const importMap = {};

// Build the import map
tsFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  const imports = [];
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Skip node_modules imports
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      continue;
    }

    // Resolve the import path to an absolute path
    let resolvedPath;
    if (importPath.startsWith('.')) {
      resolvedPath = path.resolve(path.dirname(filePath), importPath);
    } else {
      resolvedPath = path.resolve(importPath);
    }

    // Add .ts extension if missing
    if (!resolvedPath.endsWith('.ts') && !resolvedPath.endsWith('.js')) {
      resolvedPath += '.ts';
    }

    // Normalize the path
    resolvedPath = path.normalize(resolvedPath);

    // Add to imports
    imports.push(resolvedPath);
  }

  importMap[filePath] = imports;
});

// Function to check for circular dependencies
function checkCircularDeps(filePath, visited = new Set(), path = []) {
  if (visited.has(filePath)) {
    const cycleIndex = path.indexOf(filePath);
    if (cycleIndex !== -1) {
      console.log('Circular dependency detected:');
      const cycle = path.slice(cycleIndex).concat(filePath);
      cycle.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
      return true;
    }
    return false;
  }

  visited.add(filePath);
  path.push(filePath);

  const imports = importMap[filePath] || [];
  for (const importPath of imports) {
    if (checkCircularDeps(importPath, visited, path)) {
      return true;
    }
  }

  path.pop();
  return false;
}

// Check each file for circular dependencies
let foundCircular = false;
for (const filePath of Object.keys(importMap)) {
  if (checkCircularDeps(filePath)) {
    foundCircular = true;
    console.log('\n');
  }
}

if (!foundCircular) {
  console.log('No circular dependencies detected.');
}
