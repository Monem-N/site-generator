#!/usr/bin/env node

/**
 * This script helps fix module system issues:
 * - @typescript-eslint/no-var-requires
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix require statements
const fixRequireStatements = (filePath) => {
  console.log(`Fixing require statements in ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Replace require statements with import statements
  const requireRegex = /const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);?/g;
  const matches = [...content.matchAll(requireRegex)];
  
  for (const match of matches) {
    const [fullMatch, varName, modulePath] = match;
    
    // Convert to import statement
    let importStatement;
    
    // Handle special cases for common libraries
    if (modulePath.startsWith('.')) {
      // Local module - add .js extension if missing
      const modulePathWithExt = modulePath.endsWith('.js') ? modulePath : `${modulePath}.js`;
      importStatement = `import ${varName} from '${modulePathWithExt}';`;
    } else {
      // External module
      importStatement = `import ${varName} from '${modulePath}';`;
    }
    
    content = content.replace(fullMatch, importStatement);
    modified = true;
  }
  
  // Replace destructuring require statements
  const destructuringRequireRegex = /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\(['"]([^'"]+)['"]\);?/g;
  const destructuringMatches = [...content.matchAll(destructuringRequireRegex)];
  
  for (const match of destructuringMatches) {
    const [fullMatch, imports, modulePath] = match;
    
    // Convert to import statement
    let importStatement;
    
    // Handle special cases for common libraries
    if (modulePath.startsWith('.')) {
      // Local module - add .js extension if missing
      const modulePathWithExt = modulePath.endsWith('.js') ? modulePath : `${modulePath}.js`;
      importStatement = `import { ${imports} } from '${modulePathWithExt}';`;
    } else {
      // External module
      importStatement = `import { ${imports} } from '${modulePath}';`;
    }
    
    content = content.replace(fullMatch, importStatement);
    modified = true;
  }
  
  // Fix dynamic requires
  const dynamicRequireRegex = /require\(['"]([^'"]+)['"]\)/g;
  const dynamicMatches = [...content.matchAll(dynamicRequireRegex)];
  
  for (const match of dynamicMatches) {
    const [fullMatch, modulePath] = match;
    
    // Convert to dynamic import
    let importStatement;
    
    // Handle special cases for common libraries
    if (modulePath.startsWith('.')) {
      // Local module - add .js extension if missing
      const modulePathWithExt = modulePath.endsWith('.js') ? modulePath : `${modulePath}.js`;
      importStatement = `await import('${modulePathWithExt}')`;
    } else {
      // External module
      importStatement = `await import('${modulePath}')`;
    }
    
    content = content.replace(fullMatch, importStatement);
    modified = true;
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
  
  // Check if the file has require statements
  try {
    const result = execSync(`npx eslint --quiet --format json ${filePath}`, { encoding: 'utf8' });
    const issues = JSON.parse(result);
    
    if (issues.length > 0) {
      const hasRequireIssues = issues[0].messages.some(
        msg => msg.ruleId === '@typescript-eslint/no-var-requires'
      );
      
      if (hasRequireIssues) {
        return fixRequireStatements(filePath);
      }
    }
  } catch (error) {
    // ESLint might return non-zero exit code for files with issues
    // We can check if the error output contains no-var-requires
    if (error.stdout && error.stdout.includes('@typescript-eslint/no-var-requires')) {
      return fixRequireStatements(filePath);
    }
  }
  
  return false;
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
  
  console.log('Fixing module system issues...');
  
  let modifiedCount = 0;
  modifiedCount += processDirectory(srcDir);
  
  console.log(`\nFixed module system issues in ${modifiedCount} files.`);
};

main();
