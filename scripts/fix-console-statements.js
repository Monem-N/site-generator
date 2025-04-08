#!/usr/bin/env node

/**
 * This script replaces console statements with logger methods
 * It handles:
 * - console.log -> logger.debug
 * - console.info -> logger.info
 * - console.warn -> logger.warn
 * - console.error -> logger.error
 * 
 * It also adds the logger import if needed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace console statements with logger methods
const fixConsoleStatements = (filePath) => {
  console.log(`Fixing console statements in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if the file has console statements
  if (content.includes('console.log') || 
      content.includes('console.info') || 
      content.includes('console.warn') || 
      content.includes('console.error')) {
    
    // Check if logger is already imported
    const hasLoggerImport = content.includes('import { logger }') || 
                           content.includes('import logger') ||
                           content.includes('const logger = ') ||
                           content.includes('let logger = ') ||
                           content.includes('var logger = ');
    
    // Add logger import if needed
    if (!hasLoggerImport) {
      // Find the last import statement
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfImport = content.indexOf(';', lastImportIndex);
        if (endOfImport !== -1) {
          content = content.substring(0, endOfImport + 1) + 
                    "\nimport { logger } from './utils/logger.js';" + 
                    content.substring(endOfImport + 1);
          modified = true;
        }
      } else {
        // No imports found, add at the beginning of the file
        content = "import { logger } from './utils/logger.js';\n\n" + content;
        modified = true;
      }
    }
    
    // Replace console statements with logger methods
    const replacements = [
      { pattern: /console\.log\(/g, replacement: 'logger.debug(' },
      { pattern: /console\.info\(/g, replacement: 'logger.info(' },
      { pattern: /console\.warn\(/g, replacement: 'logger.warn(' },
      { pattern: /console\.error\(/g, replacement: 'logger.error(' }
    ];
    
    for (const { pattern, replacement } of replacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  Updated ${filePath}`);
      return true;
    }
  }
  
  return false;
};

// Process a single file
const processFile = (filePath) => {
  const ext = path.extname(filePath);
  if (ext !== '.ts') {
    return false;
  }
  
  return fixConsoleStatements(filePath);
};

// Process all TypeScript files in a directory
const processDirectory = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let modifiedCount = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      modifiedCount += processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      if (processFile(fullPath)) {
        modifiedCount++;
      }
    }
  }
  
  return modifiedCount;
};

// Main function
const main = () => {
  const rootDir = path.resolve(__dirname, '..');
  
  // Check if a directory was specified as a command-line argument
  const targetDir = process.argv[2];
  
  console.log('Fixing console statements...');
  
  let modifiedCount = 0;
  
  if (targetDir) {
    // Process only the specified directory
    const fullPath = path.resolve(rootDir, targetDir);
    console.log(`Processing directory: ${fullPath}`);
    modifiedCount += processDirectory(fullPath);
  } else {
    // Process all directories
    const srcDir = path.join(rootDir, 'src');
    modifiedCount += processDirectory(srcDir);
  }
  
  console.log(`\nFixed console statements in ${modifiedCount} files.`);
};

main();
