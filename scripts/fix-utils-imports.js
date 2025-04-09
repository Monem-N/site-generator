#!/usr/bin/env node

/**
 * This script fixes import paths in the utils directory
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Get all TypeScript files in the utils directory
const tsFiles = glob.sync('src/utils/*.ts');

console.log(`Found ${tsFiles.length} TypeScript files in utils to process.`);

// Process each file
let modifiedCount = 0;

for (const file of tsFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    let modified = false;
    let newContent = content;

    // Fix incorrect logger imports
    if (newContent.includes("import { logger } from './utils/logger.js';")) {
      // Replace the import path
      newContent = newContent.replace(
        "import { logger } from './utils/logger.js';",
        `import { logger } from './logger.js';`
      );
      modified = true;
    }

    // Add missing logger imports in cache.ts
    if (
      file.includes('cache.ts') &&
      newContent.includes('logger.') &&
      !newContent.includes('import { logger }')
    ) {
      // Add the import at the top of the file
      const importStatement = `import { logger } from './logger.js';\n`;
      newContent = importStatement + newContent;
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated imports in ${file}`);
      modifiedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${file}: ${error.message}`);
  }
}

console.log(`\nUpdated imports in ${modifiedCount} files.`);
