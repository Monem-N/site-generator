#!/usr/bin/env node

/**
 * This script fixes all import paths in TypeScript files to be compatible with ES modules
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
    let newContent = content;
    let modified = false;

    // 1. Fix relative imports without extensions
    const relativeImportRegex =
      /import\s+(?:{[^}]*}|\*\s+as\s+[^;]+|[^;{]*)\s+from\s+['"](\.[^'"]+)['"]/g;
    let match;
    while ((match = relativeImportRegex.exec(content)) !== null) {
      const [fullMatch, importPath] = match;

      // Skip if the import path already has a file extension
      if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
        continue;
      }

      // Add .js extension to the import path
      const newImportPath = `${importPath}.js`;
      const newImport = fullMatch
        .replace(`"${importPath}"`, `"${newImportPath}"`)
        .replace(`'${importPath}'`, `'${newImportPath}'`);

      newContent = newContent.replace(fullMatch, newImport);
      modified = true;
    }

    // 2. Fix logger imports
    if (
      file.includes('/utils/') &&
      newContent.includes("import { logger } from './utils/logger.js';")
    ) {
      newContent = newContent.replace(
        "import { logger } from './utils/logger.js';",
        "import { logger } from './logger.js';"
      );
      modified = true;
    }

    // 3. Add missing logger imports
    if (newContent.includes('logger.') && !newContent.includes('import { logger }')) {
      // Calculate the relative path to utils/logger.ts
      const filePath = path.dirname(file);
      const loggerPath = path.join(rootDir, 'src/utils/logger.ts');
      const relativePath = path.relative(filePath, path.dirname(loggerPath));
      const normalizedPath = relativePath.replace(/\\/g, '/');

      // Add the import at the top of the file
      const importStatement = `import { logger } from '${normalizedPath}/logger.js';\n`;

      // Find the position to insert the import
      const lines = newContent.split('\n');
      let insertIndex = 0;

      // Find the last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        }
      }

      // Insert the import statement
      lines.splice(insertIndex, 0, importStatement.trim());
      newContent = lines.join('\n');
      modified = true;
    }

    // 4. Fix shebang position
    if (
      newContent.includes('#!/usr/bin/env node') &&
      !newContent.startsWith('#!/usr/bin/env node')
    ) {
      // Remove the shebang from its current position
      newContent = newContent.replace('#!/usr/bin/env node', '');
      // Add it at the beginning of the file
      newContent = '#!/usr/bin/env node\n' + newContent;
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
