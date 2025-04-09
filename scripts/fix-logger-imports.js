#!/usr/bin/env node

/**
 * This script fixes logger import paths in TypeScript files
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

// Process each file
let modifiedCount = 0;

for (const file of tsFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    let modified = false;
    let newContent = content;

    // Fix incorrect logger imports
    if (
      newContent.includes("import { logger } from './utils/logger.js';") &&
      !file.includes('/utils/')
    ) {
      // Calculate the relative path to utils/logger.ts
      const filePath = path.dirname(file);
      const loggerPath = path.join(rootDir, 'src/utils/logger.ts');
      const relativePath = path.relative(filePath, path.dirname(loggerPath));
      const normalizedPath = relativePath.replace(/\\/g, '/');

      // Replace the import path
      newContent = newContent.replace(
        "import { logger } from './utils/logger.js';",
        `import { logger } from '${normalizedPath}/logger.js';`
      );
      modified = true;
    }

    // Add missing logger imports
    if (newContent.includes('logger.') && !newContent.includes('import { logger }')) {
      // Calculate the relative path to utils/logger.ts
      const filePath = path.dirname(file);
      const loggerPath = path.join(rootDir, 'src/utils/logger.ts');
      const relativePath = path.relative(filePath, path.dirname(loggerPath));
      const normalizedPath = relativePath.replace(/\\/g, '/');

      // Add the import at the top of the file
      const importStatement = `import { logger } from '${normalizedPath}/logger.js';\n`;
      newContent = importStatement + newContent;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated logger imports in ${file}`);
      modifiedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
  }
}

console.log(`\nUpdated logger imports in ${modifiedCount} files.`);
