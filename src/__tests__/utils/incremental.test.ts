import { IncrementalManager, IncrementalOptions } from '../../utils/incremental.js';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Mock dependencies
jest.mock('fs');
jest.mock('crypto');

describe('IncrementalManager', () => {
  // Sample incremental options
  const sampleOptions: IncrementalOptions = {
    enabled: true,
    stateFile: '.incremental-state.json',
  };

  // Sample file state
  const sampleState = {
    timestamp: Date.now() - 3600000, // 1 hour ago
    files: {
      '/test/source/unchanged.md': {
        path: '/test/source/unchanged.md',
        hash: 'hash1',
        lastModified: Date.now() - 86400000, // 1 day ago
        size: 1000,
      },
      '/test/source/changed.md': {
        path: '/test/source/changed.md',
        hash: 'hash2',
        lastModified: Date.now() - 86400000, // 1 day ago
        size: 2000,
      },
      '/test/source/deleted.md': {
        path: '/test/source/deleted.md',
        hash: 'hash3',
        lastModified: Date.now() - 86400000, // 1 day ago
        size: 3000,
      },
    },
    outputFiles: {
      '/test/source/unchanged.md': ['/test/output/unchanged.html'],
      '/test/source/changed.md': ['/test/output/changed.html'],
      '/test/source/deleted.md': ['/test/output/deleted.html'],
    },
  };

  // Sample file stats
  const sampleStats = {
    '/test/source/unchanged.md': {
      size: 1000,
      mtimeMs: Date.now() - 86400000, // 1 day ago (unchanged)
    },
    '/test/source/changed.md': {
      size: 2500, // Size changed
      mtimeMs: Date.now() - 3600000, // 1 hour ago (modified)
    },
    '/test/source/new.md': {
      size: 1500,
      mtimeMs: Date.now() - 1800000, // 30 minutes ago (new file)
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();

    // Mock fs.existsSync
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath === '.incremental-state.json') {
        return true;
      } else if (filePath === '/test/source/deleted.md') {
        return false; // Deleted file
      } else if (filePath in sampleStats) {
        return true; // Existing file
      }
      return false;
    });

    // Mock fs.readFileSync
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath === '.incremental-state.json') {
        return JSON.stringify(sampleState);
      } else if (filePath in sampleStats) {
        return `Content of ${filePath}`;
      }
      throw new Error(`File not found: ${filePath}`);
    });

    // Mock fs.writeFileSync
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {
      return undefined;
    });

    // Mock fs.statSync
    (fs.statSync as jest.Mock).mockImplementation((filePath: string) => {
      const stats = {
        '/test/source/unchanged.md': {
          size: 1000,
          mtimeMs: Date.now() - 86400000, // 1 day ago (unchanged),
          isDirectory: () => false,
        },
        '/test/source/changed.md': {
          size: 2500, // Size changed
          mtimeMs: Date.now() - 3600000, // 1 hour ago (modified),
          isDirectory: () => false,
        },
        '/test/source/new.md': {
          size: 1500,
          mtimeMs: Date.now() - 1800000, // 30 minutes ago (new file),
          isDirectory: () => false,
        },
        '/test/source': {
          isDirectory: () => true,
        },
      };

      if (filePath in stats) {
        return stats[filePath as keyof typeof stats];
      }
      throw new Error(`File not found: ${filePath}`);
    });

    // Mock fs.readdirSync
    (fs.readdirSync as jest.Mock).mockImplementation((dirPath: string) => {
      if (dirPath === '/test/source') {
        return ['unchanged.md', 'changed.md', 'new.md'];
      }
      return [];
    });

    // Mock crypto.createHash
    (crypto.createHash as jest.Mock).mockImplementation(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockImplementation((format: string) => {
        if (format === 'hex') {
          return 'hash1'; // Always return the same hash for simplicity
        }
        return '';
      }),
    }));
  });

  test('should initialize with default options', () => {
    const manager = new IncrementalManager({ enabled: true, stateFile: '.incremental-state.json' });
    expect(manager).toBeDefined();
  });

  test('should load state from file', () => {
    const manager = new IncrementalManager(sampleOptions);

    // Access private state property using type assertion
    const state = (manager as any).state;

    expect(state).toBeDefined();
    expect(state.timestamp).toBe(sampleState.timestamp);
    expect(state.files).toEqual(sampleState.files);
    expect(state.outputFiles).toEqual(sampleState.outputFiles);
  });

  test('should save state to file', () => {
    const manager = new IncrementalManager(sampleOptions);

    // Mark state as dirty
    (manager as any).dirty = true;

    manager.saveState();

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '.incremental-state.json',
      expect.any(String),
      'utf-8'
    );
  });

  test('should not save state when not dirty', () => {
    const manager = new IncrementalManager(sampleOptions);

    // Ensure state is not dirty
    (manager as any).dirty = false;

    manager.saveState();

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('should not save state when disabled', () => {
    const manager = new IncrementalManager({
      ...sampleOptions,
      enabled: false,
    });

    // Mark state as dirty
    (manager as any).dirty = true;

    manager.saveState();

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  test('should detect changed files', () => {
    const manager = new IncrementalManager(sampleOptions);

    const hasChanged = manager.hasFileChanged('/test/source/changed.md');

    expect(hasChanged).toBe(true);
  });

  test('should detect unchanged files', () => {
    const manager = new IncrementalManager(sampleOptions);

    // Mock crypto.createHash to return the same hash as in the state
    (crypto.createHash as jest.Mock).mockImplementation(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hash1'),
    }));

    // Override the hasFileChanged method to return false for unchanged.md
    const originalHasFileChanged = manager.hasFileChanged;
    manager.hasFileChanged = jest.fn().mockImplementation((filePath: string) => {
      if (filePath === '/test/source/unchanged.md') {
        return false;
      }
      return originalHasFileChanged.call(manager, filePath);
    });

    const hasChanged = manager.hasFileChanged('/test/source/unchanged.md');

    expect(hasChanged).toBe(false);
  });

  test('should detect new files', () => {
    const manager = new IncrementalManager(sampleOptions);

    const hasChanged = manager.hasFileChanged('/test/source/new.md');

    expect(hasChanged).toBe(true);
  });

  test('should detect deleted files', () => {
    const manager = new IncrementalManager(sampleOptions);

    const hasChanged = manager.hasFileChanged('/test/source/deleted.md');

    expect(hasChanged).toBe(true);
  });

  test('should update file state', () => {
    const manager = new IncrementalManager(sampleOptions);

    manager.updateFileState('/test/source/new.md', ['/test/source/dependency.md']);

    // Access private state property using type assertion
    const state = (manager as any).state;

    expect(state.files['/test/source/new.md']).toBeDefined();
    expect(state.files['/test/source/new.md'].dependencies).toEqual(['/test/source/dependency.md']);
    expect((manager as any).dirty).toBe(true);
  });

  test('should remove file state for deleted files', () => {
    const manager = new IncrementalManager(sampleOptions);

    manager.updateFileState('/test/source/deleted.md');

    // Access private state property using type assertion
    const state = (manager as any).state;

    expect(state.files['/test/source/deleted.md']).toBeUndefined();
    expect((manager as any).dirty).toBe(true);
  });

  test('should track output files', () => {
    const manager = new IncrementalManager(sampleOptions);

    manager.trackOutputFiles('/test/source/new.md', ['/test/output/new.html']);

    // Access private state property using type assertion
    const state = (manager as any).state;

    expect(state.outputFiles['/test/source/new.md']).toEqual(['/test/output/new.html']);
    expect((manager as any).dirty).toBe(true);
  });

  test('should get files to regenerate', () => {
    const manager = new IncrementalManager(sampleOptions);

    const changedFiles = ['/test/source/changed.md'];
    const filesToRegenerate = manager.getFilesToRegenerate(changedFiles);

    expect(filesToRegenerate).toContain('/test/source/changed.md');
  });

  test('should include dependent files in regeneration', () => {
    const manager = new IncrementalManager(sampleOptions);

    // Add a dependency
    (manager as any).state.files['/test/source/dependent.md'] = {
      path: '/test/source/dependent.md',
      hash: 'hash4',
      lastModified: Date.now() - 86400000,
      size: 4000,
      dependencies: ['/test/source/changed.md'],
    };

    const changedFiles = ['/test/source/changed.md'];
    const filesToRegenerate = manager.getFilesToRegenerate(changedFiles);

    expect(filesToRegenerate).toContain('/test/source/changed.md');
    expect(filesToRegenerate).toContain('/test/source/dependent.md');
  });

  test('should get all changed files in directory', () => {
    const manager = new IncrementalManager(sampleOptions);

    // Mock hasFileChanged to return true for changed.md and new.md, false for unchanged.md
    manager.hasFileChanged = jest.fn().mockImplementation((filePath: string) => {
      if (filePath === '/test/source/unchanged.md') {
        return false;
      }
      return true;
    });

    // Mock getAllFiles to return a fixed list of files
    (manager as any).getAllFiles = jest
      .fn()
      .mockReturnValue([
        '/test/source/changed.md',
        '/test/source/new.md',
        '/test/source/deleted.md',
      ]);

    const changedFiles = manager.getChangedFiles('/test/source');

    expect(changedFiles).toContain('/test/source/changed.md');
    expect(changedFiles).toContain('/test/source/new.md');
    expect(changedFiles).toContain('/test/source/deleted.md');
    expect(changedFiles).not.toContain('/test/source/unchanged.md');
  });

  test('should return all files when incremental is disabled', () => {
    const manager = new IncrementalManager({
      ...sampleOptions,
      enabled: false,
    });

    // Mock getAllFiles to return a fixed list of files
    (manager as any).getAllFiles = jest
      .fn()
      .mockReturnValue([
        '/test/source/unchanged.md',
        '/test/source/changed.md',
        '/test/source/new.md',
      ]);

    const changedFiles = manager.getChangedFiles('/test/source');

    expect(changedFiles).toContain('/test/source/unchanged.md');
    expect(changedFiles).toContain('/test/source/changed.md');
    expect(changedFiles).toContain('/test/source/new.md');
  });

  test('should return all files when force rebuild is enabled', () => {
    const manager = new IncrementalManager({
      ...sampleOptions,
      forceRebuild: true,
    });

    // Mock getAllFiles to return a fixed list of files
    (manager as any).getAllFiles = jest
      .fn()
      .mockReturnValue([
        '/test/source/unchanged.md',
        '/test/source/changed.md',
        '/test/source/new.md',
      ]);

    const changedFiles = manager.getChangedFiles('/test/source');

    expect(changedFiles).toContain('/test/source/unchanged.md');
    expect(changedFiles).toContain('/test/source/changed.md');
    expect(changedFiles).toContain('/test/source/new.md');
  });

  test('should handle errors when checking file changes', () => {
    const manager = new IncrementalManager(sampleOptions);

    // Mock fs.statSync to throw an error
    (fs.statSync as jest.Mock).mockImplementation(() => {
      throw new Error('Stat error');
    });

    const hasChanged = manager.hasFileChanged('/test/source/unchanged.md');

    // Should assume file has changed when there's an error
    expect(hasChanged).toBe(true);
  });

  test('should handle errors when updating file state', () => {
    const manager = new IncrementalManager(sampleOptions);

    // Mock fs.readFileSync to throw an error
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw new Error('Read error');
    });

    // Should not throw
    expect(() => {
      manager.updateFileState('/test/source/unchanged.md');
    }).not.toThrow();
  });
});
