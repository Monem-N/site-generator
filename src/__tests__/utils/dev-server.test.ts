import { DevServer, DevServerOptions } from '../../utils/dev-server-class.js';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

// Mock dependencies
jest.mock('http');
jest.mock('fs');
jest.mock('path');
jest.mock('chokidar');

// Define interfaces for testing to avoid using 'any'

interface MockHttpServer extends http.Server {
  listen: jest.Mock;
  close: jest.Mock;
  on: jest.Mock;
  once: jest.Mock;
  addListener: jest.Mock;
  removeListener: jest.Mock;
  off: jest.Mock;
  emit: jest.Mock;
  prependListener: jest.Mock;
  prependOnceListener: jest.Mock;
  listeners: jest.Mock;
  rawListeners: jest.Mock;
  listenerCount: jest.Mock;
  eventNames: jest.Mock;
  getMaxListeners: jest.Mock;
  setMaxListeners: jest.Mock;
}

interface MockWatcher extends chokidar.FSWatcher {
  on: jest.Mock;
  close: jest.Mock;
  add: jest.Mock;
  unwatch: jest.Mock;
}

describe('DevServer', () => {
  let devServer: DevServer;
  let mockServer: MockHttpServer;
  let mockWatcher: MockWatcher;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock http.createServer
    mockServer = {
      listen: jest.fn().mockImplementation(function (port, callback) {
        if (callback) callback();
        return this;
      }),
      close: jest.fn().mockImplementation(function (callback) {
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
    } as unknown as MockHttpServer;

    (http.createServer as jest.Mock).mockReturnValue(mockServer);

    // Mock chokidar.watch
    mockWatcher = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockReturnThis(),
      unwatch: jest.fn().mockReturnThis(),
    } as unknown as MockWatcher;

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
    // Access options through private property with type assertion
    const options = (devServer as unknown as { options: DevServerOptions }).options;
    expect(options.port).toBe(3000);
    expect(options.rootDir).toBe('/test/public');
    expect(options.watchDir).toBe('/test/src');
    expect(options.livereload).toBe(true);
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
    expect(mockResponse.writeHead).toHaveBeenCalled();
    expect(mockResponse.end).toHaveBeenCalled();
  });

  test('should handle 404 errors', async () => {
    // Create a mock request and response
    const mockRequest = {
      url: '/nonexistent.html',
      method: 'GET',
    } as http.IncomingMessage;

    const mockResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    // Mock fs.existsSync to return false for the file
    (fs.existsSync as jest.Mock).mockImplementation((filePath: string) => {
      return !filePath.includes('nonexistent');
    });

    // Start the server
    await devServer.start();

    // Get the request handler
    const requestHandler = (http.createServer as jest.Mock).mock.calls[0][0];

    // Call the request handler
    requestHandler(mockRequest, mockResponse);

    // Verify that a 404 response was sent
    expect(mockResponse.writeHead).toHaveBeenCalledWith(404, expect.any(Object));
    expect(mockResponse.end).toHaveBeenCalled();
  });

  test('should handle different file types', async () => {
    // Test HTML file
    const htmlRequest = {
      url: '/index.html',
      method: 'GET',
    } as http.IncomingMessage;

    const htmlResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    // Test CSS file
    const cssRequest = {
      url: '/styles.css',
      method: 'GET',
    } as http.IncomingMessage;

    const cssResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    // Test JavaScript file
    const jsRequest = {
      url: '/script.js',
      method: 'GET',
    } as http.IncomingMessage;

    const jsResponse = {
      writeHead: jest.fn(),
      end: jest.fn(),
    } as unknown as http.ServerResponse;

    // Start the server
    await devServer.start();

    // Get the request handler
    const requestHandler = (http.createServer as jest.Mock).mock.calls[0][0];

    // Call the request handler for each file type
    requestHandler(htmlRequest, htmlResponse);
    requestHandler(cssRequest, cssResponse);
    requestHandler(jsRequest, jsResponse);

    // Verify that the correct content types were set
    expect(htmlResponse.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'text/html',
      })
    );

    expect(cssResponse.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'text/css',
      })
    );

    expect(jsResponse.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'application/javascript',
      })
    );
  });
});
