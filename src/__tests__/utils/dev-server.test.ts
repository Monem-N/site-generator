import { DevServer } from '../../utils/dev-server-class.js';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { logger } from './utils/logger.js';

// Mock dependencies
jest.mock('http');
jest.mock('fs');
jest.mock('path');
jest.mock('chokidar');

describe('DevServer', () => {
  let devServer: DevServer;
  let mockServer: jest.Mocked<http.Server>;
  let mockWatcher: jest.Mocked<chokidar.FSWatcher>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock http.createServer
    mockServer = {
      listen: jest.fn().mockImplementation(function (this: any, port, callback) {
        if (callback) callback();
        return this;
      }),
      close: jest.fn().mockImplementation(function (this: any, callback) {
        if (callback) callback();
        return this;
      }),
      on: jest.fn().mockReturnThis(),
      once: jest.fn().mockReturnThis(),
      addListener: jest.fn().mockReturnThis(),
      removeListener: jest.fn().mockReturnThis(),
      off: jest.fn().mockReturnThis(),
      emit: jest.fn().mockReturnThis(),
      prependListener: jest.fn().mockReturnThis(),
      prependOnceListener: jest.fn().mockReturnThis(),
      listeners: jest.fn().mockReturnValue([]),
      rawListeners: jest.fn().mockReturnValue([]),
      listenerCount: jest.fn().mockReturnValue(0),
      eventNames: jest.fn().mockReturnValue([]),
      getMaxListeners: jest.fn().mockReturnValue(10),
      setMaxListeners: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<http.Server>;

    (http.createServer as jest.Mock).mockReturnValue(mockServer);

    // Mock chokidar.watch
    mockWatcher = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockReturnThis(),
      unwatch: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<chokidar.FSWatcher>;

    (chokidar.watch as jest.Mock).mockReturnValue(mockWatcher);

    // Mock fs.existsSync to return true for directories
    (fs.existsSync as jest.Mock).mockReturnValue(true);

    // Mock fs.readFileSync to return HTML content
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.endsWith('.html')) {
        return '<html><body>Test</body></html>';
      }
      if (filePath.endsWith('.css')) {
        return 'body { color: red; }';
      }
      if (filePath.endsWith('.js')) {
        return 'logger.debug("test");';
      }
      return '';
    });

    // Mock fs.statSync to return file stats
    (fs.statSync as jest.Mock).mockImplementation((filePath: string) => {
      return {
        isDirectory: () => filePath.indexOf('.') === -1,
        isFile: () => filePath.indexOf('.') !== -1,
        mtime: new Date(),
      };
    });

    // Mock path.join to concatenate paths
    (path.join as jest.Mock).mockImplementation((...paths: string[]) => paths.join('/'));

    // Mock path.extname to return the file extension
    (path.extname as jest.Mock).mockImplementation((filePath: string) => {
      const parts = filePath.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    });

    // Create the dev server
    devServer = new DevServer({
      port: 3000,
      rootDir: '/test/public',
      watchDir: '/test/src',
      livereload: true,
    });
  });

  test('should initialize with default options', () => {
    const defaultDevServer = new DevServer();
    expect(defaultDevServer).toBeDefined();
  });

  test('should initialize with custom options', () => {
    expect(devServer).toBeDefined();
    expect((devServer as any).options.port).toBe(3000);
    expect((devServer as any).options.rootDir).toBe('/test/public');
    expect((devServer as any).options.watchDir).toBe('/test/src');
    expect((devServer as any).options.livereload).toBe(true);
  });

  test('should start the server', async () => {
    // Start the server
    await devServer.start();

    // Verify that the server was started
    expect(http.createServer).toHaveBeenCalled();
    expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });

  test('should stop the server', async () => {
    // Start the server
    await devServer.start();

    // Stop the server
    await devServer.stop();

    // Verify that the server was stopped
    expect(mockServer.close).toHaveBeenCalled();
    expect(mockWatcher.close).toHaveBeenCalled();
  });

  test('should watch for file changes', async () => {
    // Start the server
    await devServer.start();

    // Verify that the watcher was set up
    expect(chokidar.watch).toHaveBeenCalledWith('/test/src', expect.any(Object));
    expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('should handle HTTP requests', async () => {
    // Create a mock request and response
    const mockRequest = {
      url: '/index.html',
      method: 'GET',
    } as http.IncomingMessage;

    const mockResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    // Start the server
    await devServer.start();

    // Get the request handler
    const requestHandler = (http.createServer as jest.Mock).mock.calls[0][0];

    // Call the request handler
    requestHandler(mockRequest, mockResponse);

    // Verify that the response was sent
    expect(mockResponse.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/html',
    });
    expect(mockResponse.end).toHaveBeenCalledWith(expect.stringContaining('<html><body>Test'));
  });

  test('should handle 404 errors', async () => {
    // Mock fs.existsSync to return false for the requested file
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return !filePath.includes('not-found.html');
    });

    // Create a mock request and response
    const mockRequest = {
      url: '/not-found.html',
      method: 'GET',
    } as http.IncomingMessage;

    const mockResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    // Start the server
    await devServer.start();

    // Get the request handler
    const requestHandler = (http.createServer as jest.Mock).mock.calls[0][0];

    // Call the request handler
    requestHandler(mockRequest, mockResponse);

    // Verify that a 404 response was sent
    expect(mockResponse.writeHead).toHaveBeenCalledWith(404, {
      'Content-Type': 'text/plain',
    });
    expect(mockResponse.end).toHaveBeenCalledWith('404 Not Found');
  });

  test('should handle different content types', async () => {
    // Create mock requests and responses for different file types
    const testCases = [
      {
        url: '/styles.css',
        contentType: 'text/css',
        content: 'body { color: red; }',
      },
      {
        url: '/script.js',
        contentType: 'application/javascript',
        content: 'logger.debug("test");',
      },
      {
        url: '/image.png',
        contentType: 'image/png',
        content: '',
      },
    ];

    // Start the server
    await devServer.start();

    // Get the request handler
    const requestHandler = (http.createServer as jest.Mock).mock.calls[0][0];

    // Test each case
    for (const testCase of testCases) {
      const mockRequest = {
        url: testCase.url,
        method: 'GET',
      } as http.IncomingMessage;

      const mockResponse = {
        writeHead: jest.fn(),
        end: jest.fn(),
      } as unknown as http.ServerResponse;

      // Call the request handler
      requestHandler(mockRequest, mockResponse);

      // Verify the response
      expect(mockResponse.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': testCase.contentType,
      });
      expect(mockResponse.end).toHaveBeenCalledWith(testCase.content);
    }
  });

  test('should handle directory requests', async () => {
    // Mock fs.readdirSync to return directory contents
    (fs.readdirSync as jest.Mock).mockReturnValue(['index.html', 'styles.css', 'script.js']);

    // Create a mock request and response
    const mockRequest = {
      url: '/',
      method: 'GET',
    } as http.IncomingMessage;

    const mockResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    // Start the server
    await devServer.start();

    // Get the request handler
    const requestHandler = (http.createServer as jest.Mock).mock.calls[0][0];

    // Call the request handler
    requestHandler(mockRequest, mockResponse);

    // Verify that the index.html file was served
    expect(mockResponse.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/html',
    });
    expect(mockResponse.end).toHaveBeenCalledWith(expect.stringContaining('<html><body>Test'));
  });

  test('should inject livereload script', async () => {
    // Mock fs.readFileSync to return HTML content
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.endsWith('.html')) {
        return '<html><head></head><body>Test</body></html>';
      }
      return '';
    });

    // Create a mock request and response
    const mockRequest = {
      url: '/index.html',
      method: 'GET',
    } as http.IncomingMessage;

    const mockResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    // Start the server
    await devServer.start();

    // Get the request handler
    const requestHandler = (http.createServer as jest.Mock).mock.calls[0][0];

    // Call the request handler
    requestHandler(mockRequest, mockResponse);

    // Verify that the livereload script was injected
    expect(mockResponse.end).toHaveBeenCalledWith(expect.stringContaining('livereload.js'));
  });

  test('should not inject livereload script when disabled', async () => {
    // Create a dev server with livereload disabled
    const noLivereloadServer = new DevServer({
      port: 3000,
      rootDir: '/test/public',
      watchDir: '/test/src',
      livereload: false,
    });

    // Mock fs.readFileSync to return HTML content
    (fs.readFileSync as jest.Mock).mockImplementation((filePath: string) => {
      if (filePath.endsWith('.html')) {
        return '<html><head></head><body>Test</body></html>';
      }
      return '';
    });

    // Create a mock request and response
    const mockRequest = {
      url: '/index.html',
      method: 'GET',
    } as http.IncomingMessage;

    const mockResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    // Start the server
    await noLivereloadServer.start();

    // Get the request handler
    const requestHandler = (http.createServer as jest.Mock).mock.calls[0][0];

    // Call the request handler
    requestHandler(mockRequest, mockResponse);

    // Verify that the livereload script was not injected
    expect(mockResponse.end).toHaveBeenCalledWith('<html><head></head><body>Test</body></html>');
  });
});
