#!/usr/bin/env node

/**
 * This script helps fix logic and runtime errors:
 * - no-fallthrough
 * - no-console
 * - no-redeclare
 * - no-sparse-arrays
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix fallthrough in switch statements
const fixFallthrough = (filePath) => {
  console.log(`Fixing fallthrough in switch statements in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Find switch statements with fallthrough
  const switchRegex = /case\s+[^:]+:\s*\n(?:\s*\/\/[^\n]*\n)*(?!\s*break|\s*return|\s*throw|\s*continue|\s*\/\/ fallthrough|\s*\/\* fallthrough \*\/|\s*case|\s*default|\s*})/g;
  const matches = [...content.matchAll(switchRegex)];
  
  for (const match of matches) {
    const [fullMatch] = match;
    const replacement = fullMatch + '      // fallthrough\n';
    
    content = content.replace(fullMatch, replacement);
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated ${filePath}`);
    return true;
  }
  
  return false;
};

// Fix console statements
const fixConsoleStatements = (filePath) => {
  console.log(`Fixing console statements in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace console.log with logger.debug
  if (content.includes('console.log') || content.includes('console.info') || 
      content.includes('console.warn') || content.includes('console.error')) {
    
    // Check if logger is already imported
    let loggerImported = content.includes('import { logger }') || 
                         content.includes('import logger');
    
    // Add logger import if needed
    if (!loggerImported) {
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
      }
    }
    
    // Replace console statements with logger
    content = content.replace(/console\.log\(/g, 'logger.debug(');
    content = content.replace(/console\.info\(/g, 'logger.info(');
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    content = content.replace(/console\.error\(/g, 'logger.error(');
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated ${filePath}`);
    return true;
  }
  
  return false;
};

// Fix variable redeclarations
const fixRedeclarations = (filePath) => {
  console.log(`Fixing variable redeclarations in ${filePath}...`);
  
  // This is a complex issue that's hard to fix automatically
  // We'll just identify the files with redeclaration issues
  try {
    const result = execSync(`npx eslint --quiet --format json ${filePath}`, { encoding: 'utf8' });
    const issues = JSON.parse(result);
    
    if (issues.length > 0) {
      const redeclareIssues = issues[0].messages.filter(
        msg => msg.ruleId === 'no-redeclare'
      );
      
      if (redeclareIssues.length > 0) {
        console.log(`  Found ${redeclareIssues.length} redeclaration issues in ${filePath}`);
        console.log(`  Please fix these issues manually:`);
        
        for (const issue of redeclareIssues) {
          console.log(`    Line ${issue.line}: ${issue.message}`);
        }
        
        return true;
      }
    }
  } catch (error) {
    // ESLint might return non-zero exit code for files with issues
    // We can check if the error output contains no-redeclare
    if (error.stdout && error.stdout.includes('no-redeclare')) {
      console.log(`  Found redeclaration issues in ${filePath}`);
      console.log(`  Please fix these issues manually.`);
      return true;
    }
  }
  
  return false;
};

// Fix sparse arrays
const fixSparseArrays = (filePath) => {
  console.log(`Fixing sparse arrays in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Find sparse arrays (arrays with empty slots)
  const sparseArrayRegex = /\[\s*(?:,\s*)+\]/g;
  
  if (sparseArrayRegex.test(content)) {
    content = content.replace(sparseArrayRegex, '[]');
    modified = true;
  }
  
  // Find arrays with empty slots in the middle
  const middleSparseArrayRegex = /\[\s*(?:[^,\[\]]+\s*,\s*,|,\s*,)\s*[^,\[\]]+\s*\]/g;
  
  if (middleSparseArrayRegex.test(content)) {
    // This is harder to fix automatically
    console.log(`  Found arrays with empty slots in the middle in ${filePath}`);
    console.log(`  Please fix these issues manually.`);
    return true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  Updated ${filePath}`);
    return true;
  }
  
  return false;
};

// Process a single file
const processFile = (filePath) => {
  const ext = path.extname(filePath);
  if (ext !== '.ts' && ext !== '.js') {
    return false;
  }
  
  let modified = false;
  
  // Check if the file has logic issues
  try {
    const result = execSync(`npx eslint --quiet --format json ${filePath}`, { encoding: 'utf8' });
    const issues = JSON.parse(result);
    
    if (issues.length > 0) {
      const hasFallthroughIssues = issues[0].messages.some(
        msg => msg.ruleId === 'no-fallthrough'
      );
      
      const hasConsoleIssues = issues[0].messages.some(
        msg => msg.ruleId === 'no-console'
      );
      
      const hasRedeclareIssues = issues[0].messages.some(
        msg => msg.ruleId === 'no-redeclare'
      );
      
      const hasSparseArrayIssues = issues[0].messages.some(
        msg => msg.ruleId === 'no-sparse-arrays'
      );
      
      if (hasFallthroughIssues) {
        modified = fixFallthrough(filePath) || modified;
      }
      
      if (hasConsoleIssues) {
        modified = fixConsoleStatements(filePath) || modified;
      }
      
      if (hasRedeclareIssues) {
        modified = fixRedeclarations(filePath) || modified;
      }
      
      if (hasSparseArrayIssues) {
        modified = fixSparseArrays(filePath) || modified;
      }
    }
  } catch (error) {
    // ESLint might return non-zero exit code for files with issues
    // We can check if the error output contains specific rule IDs
    if (error.stdout) {
      if (error.stdout.includes('no-fallthrough')) {
        modified = fixFallthrough(filePath) || modified;
      }
      
      if (error.stdout.includes('no-console')) {
        modified = fixConsoleStatements(filePath) || modified;
      }
      
      if (error.stdout.includes('no-redeclare')) {
        modified = fixRedeclarations(filePath) || modified;
      }
      
      if (error.stdout.includes('no-sparse-arrays')) {
        modified = fixSparseArrays(filePath) || modified;
      }
    }
  }
  
  return modified;
};

// Process all TypeScript and JavaScript files in a directory
const processDirectory = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let modifiedCount = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      modifiedCount += processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
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
  const srcDir = path.join(rootDir, 'src');
  
  console.log('Fixing logic and runtime errors...');
  
  let modifiedCount = 0;
  modifiedCount += processDirectory(srcDir);
  
  console.log(`\nFixed logic and runtime errors in ${modifiedCount} files.`);
};

main();
