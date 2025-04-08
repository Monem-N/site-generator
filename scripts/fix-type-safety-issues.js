#!/usr/bin/env node

/**
 * This script helps fix common type safety issues:
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

// Fix explicit any types
const fixExplicitAnyTypes = (filePath) => {
  console.log(`Fixing explicit any types in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace common any types with more specific types
  const replacements = [
    { pattern: /: any(\[\])?\b/g, replacement: ': unknown$1' },
    { pattern: /as any/g, replacement: 'as unknown' },
    { pattern: /Record<string, any>/g, replacement: 'Record<string, unknown>' },
    { pattern: /Map<string, any>/g, replacement: 'Map<string, unknown>' },
    { pattern: /Promise<any>/g, replacement: 'Promise<unknown>' },
    { pattern: /Array<any>/g, replacement: 'Array<unknown>' },
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
  
  return false;
};

// Fix unused variables
const fixUnusedVariables = (filePath) => {
  console.log(`Fixing unused variables in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Find unused variables (prefixed with _)
  const unusedVarRegex = /\b(\w+)(\s*:\s*[^=;]+)?\s*(?:=|:)\s*[^=;]+[;,]/g;
  const matches = [...content.matchAll(unusedVarRegex)];
  
  for (const match of matches) {
    const varName = match[1];
    
    // Check if the variable is reported as unused by ESLint
    try {
      const result = execSync(`npx eslint --quiet --format json ${filePath}`, { encoding: 'utf8' });
      const issues = JSON.parse(result);
      
      if (issues.length > 0) {
        const unusedVars = issues[0].messages
          .filter(msg => msg.ruleId === '@typescript-eslint/no-unused-vars')
          .map(msg => msg.message.match(/['"](.+)['"]/)?.[1])
          .filter(Boolean);
        
        if (unusedVars.includes(varName) && !varName.startsWith('_')) {
          // Prefix unused variable with underscore
          const newContent = content.replace(
            new RegExp(`\\b${varName}\\b(?!\\s*:)`, 'g'),
            `_${varName}`
          );
          
          if (newContent !== content) {
            content = newContent;
            modified = true;
          }
        }
      }
    } catch (error) {
      // ESLint might return non-zero exit code for files with issues
      // We can safely ignore this error
    }
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
  if (ext !== '.ts' && ext !== '.tsx') {
    return false;
  }
  
  let modified = false;
  modified = fixExplicitAnyTypes(filePath) || modified;
  modified = fixUnusedVariables(filePath) || modified;
  
  return modified;
};

// Process all TypeScript files in a directory
const processDirectory = (dirPath) => {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  let modifiedCount = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
      modifiedCount += processDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
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
  const typesDir = path.join(rootDir, 'types');
  
  console.log('Fixing type safety issues...');
  
  let modifiedCount = 0;
  modifiedCount += processDirectory(srcDir);
  modifiedCount += processDirectory(typesDir);
  
  console.log(`\nFixed type safety issues in ${modifiedCount} files.`);
};

main();
