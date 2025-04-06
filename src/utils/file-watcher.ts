import chokidar from 'chokidar';
import path from 'path';
import chalk from 'chalk';

/**
 * Watches for file changes in the source directory
 * @param sourceDir The directory to watch for changes
 * @param ignorePatterns Patterns to ignore
 * @param onChange Callback function to execute when files change
 * @returns A function to stop watching
 */
export function watchFiles(
  sourceDir: string,
  ignorePatterns: string[] = [],
  onChange: (changedFiles: string[]) => void
): () => void {
  // Convert ignore patterns to absolute paths
  const absoluteIgnorePatterns = ignorePatterns.map(pattern => {
    if (pattern.startsWith('/')) {
      return pattern;
    }
    return path.join(sourceDir, pattern);
  });

  // Add node_modules and .git to ignore patterns if not already included
  if (!absoluteIgnorePatterns.some(pattern => pattern.includes('node_modules'))) {
    absoluteIgnorePatterns.push(path.join(sourceDir, 'node_modules'));
  }

  if (!absoluteIgnorePatterns.some(pattern => pattern.includes('.git'))) {
    absoluteIgnorePatterns.push(path.join(sourceDir, '.git'));
  }

  // Create a watcher
  const watcher = chokidar.watch(sourceDir, {
    ignored: absoluteIgnorePatterns,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  // Track changed files
  const changedFiles: Set<string> = new Set();
  let debounceTimer: NodeJS.Timeout | null = null;

  // Helper function to debounce changes
  const debounceChanges = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
      if (changedFiles.size > 0) {
        const files = Array.from(changedFiles);
        changedFiles.clear();
        onChange(files);
      }
    }, 500);
  };

  // Watch for file changes
  watcher
    .on('add', filePath => {
      console.log(chalk.blue(`[INFO] File added: ${path.relative(sourceDir, filePath)}`));
      changedFiles.add(filePath);
      debounceChanges();
    })
    .on('change', filePath => {
      console.log(chalk.blue(`[INFO] File changed: ${path.relative(sourceDir, filePath)}`));
      changedFiles.add(filePath);
      debounceChanges();
    })
    .on('unlink', filePath => {
      console.log(chalk.blue(`[INFO] File deleted: ${path.relative(sourceDir, filePath)}`));
      changedFiles.add(filePath);
      debounceChanges();
    })
    .on('error', error => {
      console.log(chalk.red(`[ERROR] Watcher error: ${error}`));
    });

  console.log(chalk.blue(`[INFO] Watching for changes in ${sourceDir}`));
  console.log(chalk.blue(`[INFO] Ignoring patterns: ${ignorePatterns.join(', ')}`));

  // Return a function to stop watching
  return () => {
    watcher.close();
    console.log(chalk.blue('[INFO] File watcher stopped'));
  };
}
