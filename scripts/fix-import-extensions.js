#!/usr/bin/env node

/**
 * This script adds .js extensions to all relative import statements
 * when using ES modules with moduleResolution: 'node16'
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all TypeScript files
const getAllTypeScriptFiles = dir => {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory() && file !== 'node_modules' && file !== 'dist') {
      results = results.concat(getAllTypeScriptFiles(filePath));
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      results.push(filePath);
    }
  });

  return results;
};

// Fix import statements in a file
const fixImportStatements = filePath => {
  console.log(`Processing ${filePath}...`);

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Match import statements with relative paths
  const importRegex = /from\s+['"](\.[^'"]*)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Skip if already has an extension
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      continue;
    }

    // Add .js extension
    const newImportPath = `${importPath}.js`;
    const newContent =
      content.substring(0, match.index) +
      `from '${newImportPath}'` +
      content.substring(match.index + match[0].length);

    content = newContent;
    modified = true;

    // Reset regex to continue from the current position
    importRegex.lastIndex = match.index + `from '${newImportPath}'`.length;
  }

  // Fix dynamic imports
  const dynamicImportRegex = /import\s*\(\s*['"](\.[^'"]*)['"]\s*\)/g;

  while ((match = dynamicImportRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Skip if already has an extension
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      continue;
    }

    // Add .js extension
    const newImportPath = `${importPath}.js`;
    const newContent =
      content.substring(0, match.index) +
      `import('${newImportPath}')` +
      content.substring(match.index + match[0].length);

    content = newContent;
    modified = true;

    // Reset regex to continue from the current position
    dynamicImportRegex.lastIndex = match.index + `import('${newImportPath}')`.length;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated ${filePath}`);
    return 1;
  }

  return 0;
};

// Main function
const main = () => {
  const rootDir = process.cwd();
  const files = getAllTypeScriptFiles(rootDir);

  console.log(`Found ${files.length} TypeScript files.`);

  let updatedCount = 0;

  files.forEach(file => {
    updatedCount += fixImportStatements(file);
  });

  console.log(`\nUpdated ${updatedCount} files with .js extensions.`);
};

main();
