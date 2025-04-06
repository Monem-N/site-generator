import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileSystemError } from './errors';

/**
 * File state for tracking changes
 */
interface FileState {
  path: string;
  hash: string;
  lastModified: number;
  size: number;
  dependencies?: string[];
}

/**
 * Build state for incremental builds
 */
interface BuildState {
  timestamp: number;
  files: Record<string, FileState>;
  outputFiles: Record<string, string[]>;
}

/**
 * Options for incremental generation
 */
export interface IncrementalOptions {
  enabled: boolean;
  stateFile: string;
  forceRebuild?: boolean;
}

/**
 * Incremental generation manager
 * Tracks file changes to enable incremental builds
 */
export class IncrementalManager {
  private options: IncrementalOptions;
  private state: BuildState;
  private dirty: boolean;

  constructor(options: IncrementalOptions) {
    this.options = {
      enabled: true,
      stateFile: '.incremental-state.json',
      forceRebuild: false,
      ...options,
    };

    this.state = {
      timestamp: 0,
      files: {},
      outputFiles: {},
    };

    this.dirty = false;

    // Load previous state if available
    this.loadState();
  }

  /**
   * Load the previous build state
   */
  private loadState(): void {
    if (!this.options.enabled) return;

    try {
      if (fs.existsSync(this.options.stateFile)) {
        const content = fs.readFileSync(this.options.stateFile, 'utf-8');
        this.state = JSON.parse(content);
      }
    } catch (error) {
      // If loading fails, start with a fresh state
      console.warn(`Failed to load incremental state: ${error}`);
      this.state = {
        timestamp: 0,
        files: {},
        outputFiles: {},
      };
    }
  }

  /**
   * Save the current build state
   */
  saveState(): void {
    if (!this.options.enabled || !this.dirty) return;

    try {
      this.state.timestamp = Date.now();
      fs.writeFileSync(this.options.stateFile, JSON.stringify(this.state, null, 2), 'utf-8');
      this.dirty = false;
    } catch (error) {
      throw new FileSystemError(`Failed to save incremental state: ${error}`, {
        stateFile: this.options.stateFile,
        error,
      });
    }
  }

  /**
   * Check if a file has changed since the last build
   */
  hasFileChanged(filePath: string): boolean {
    if (!this.options.enabled || this.options.forceRebuild) {
      return true;
    }

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        // If the file was in the previous state, it's been deleted
        return this.state.files[filePath] !== undefined;
      }

      // Get file stats
      const stats = fs.statSync(filePath);

      // Check if file is in the state
      if (!this.state.files[filePath]) {
        return true;
      }

      const prevState = this.state.files[filePath];

      // Quick check based on size and modification time
      if (stats.size !== prevState.size || stats.mtimeMs !== prevState.lastModified) {
        return true;
      }

      // If size and mtime match, compute hash for certainty
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = this.hashContent(content);

      return hash !== prevState.hash;
    } catch (error) {
      // If there's an error checking the file, assume it changed
      console.warn(`Error checking file ${filePath}: ${error}`);
      return true;
    }
  }

  /**
   * Update the file state
   */
  updateFileState(filePath: string, dependencies: string[] = []): void {
    if (!this.options.enabled) return;

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        // If the file was in the previous state, remove it
        if (this.state.files[filePath]) {
          delete this.state.files[filePath];
          this.dirty = true;
        }
        return;
      }

      // Get file stats
      const stats = fs.statSync(filePath);

      // Read file content and compute hash
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = this.hashContent(content);

      // Update state
      this.state.files[filePath] = {
        path: filePath,
        hash,
        lastModified: stats.mtimeMs,
        size: stats.size,
        dependencies,
      };

      this.dirty = true;
    } catch (error) {
      console.warn(`Error updating file state for ${filePath}: ${error}`);
    }
  }

  /**
   * Track output files generated from an input file
   */
  trackOutputFiles(inputFile: string, outputFiles: string[]): void {
    if (!this.options.enabled) return;

    this.state.outputFiles[inputFile] = outputFiles;
    this.dirty = true;
  }

  /**
   * Get output files that need to be regenerated
   */
  getFilesToRegenerate(changedFiles: string[]): string[] {
    if (!this.options.enabled || this.options.forceRebuild) {
      return Object.keys(this.state.files);
    }

    const filesToRegenerate = new Set<string>();

    // Add changed files
    for (const file of changedFiles) {
      filesToRegenerate.add(file);
    }

    // Add files that depend on changed files
    for (const [filePath, fileState] of Object.entries(this.state.files)) {
      if (fileState.dependencies) {
        for (const dependency of fileState.dependencies) {
          if (changedFiles.includes(dependency)) {
            filesToRegenerate.add(filePath);
            break;
          }
        }
      }
    }

    // Add files that generate output files that need to be regenerated
    for (const [inputFile, outputFiles] of Object.entries(this.state.outputFiles)) {
      for (const outputFile of outputFiles) {
        if (filesToRegenerate.has(outputFile)) {
          filesToRegenerate.add(inputFile);
          break;
        }
      }
    }

    return Array.from(filesToRegenerate);
  }

  /**
   * Get all files that have changed since the last build
   */
  getChangedFiles(directory: string): string[] {
    if (!this.options.enabled) {
      return this.getAllFiles(directory);
    }

    if (this.options.forceRebuild) {
      const allFiles = this.getAllFiles(directory);

      // Update state for all files
      for (const file of allFiles) {
        this.updateFileState(file);
      }

      return allFiles;
    }

    const changedFiles: string[] = [];
    const allFiles = this.getAllFiles(directory);

    // Check each file for changes
    for (const file of allFiles) {
      if (this.hasFileChanged(file)) {
        changedFiles.push(file);
        this.updateFileState(file);
      }
    }

    // Check for deleted files
    for (const filePath of Object.keys(this.state.files)) {
      if (!fs.existsSync(filePath)) {
        changedFiles.push(filePath);
        delete this.state.files[filePath];
        this.dirty = true;
      }
    }

    return changedFiles;
  }

  /**
   * Get all files in a directory recursively
   */
  private getAllFiles(directory: string): string[] {
    const files: string[] = [];

    const readDir = (dir: string) => {
      const entries = fs.readdirSync(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          readDir(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };

    readDir(directory);
    return files;
  }

  /**
   * Compute a hash of the content
   */
  private hashContent(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
  }
}
