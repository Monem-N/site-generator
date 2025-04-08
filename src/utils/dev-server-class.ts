import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { WebSocketServer, WebSocket as WS } from 'ws';
import { logger } from './utils/logger.js';

/**
 * Options for the DevServer
 */
export interface DevServerOptions {
  /**
   * The port to run the server on
   */
  port?: number;

  /**
   * The root directory to serve files from
   */
  rootDir?: string;

  /**
   * The directory to watch for changes
   */
  watchDir?: string;

  /**
   * Whether to enable live reload
   */
  livereload?: boolean;

  /**
   * Whether to use HTTPS
   */
  https?: boolean;
}

/**
 * A development server for the generated website
 */
export class DevServer {
  private options: DevServerOptions;
  private server: http.Server | null = null;
  private watcher: chokidar.FSWatcher | null = null;
  private wsServer: WebSocketServer | null = null;
  private clients: Set<WS> = new Set();

  constructor(options: DevServerOptions = {}) {
    this.options = {
      port: 3000,
      rootDir: './public',
      watchDir: './src',
      livereload: true,
      https: false,
      ...options,
    };
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    // Create the server
    if (this.options.https) {
      try {
        // Look for certificates in the current directory and a potential 'certs' directory
        const certPaths = [
          { key: 'server.key', cert: 'server.cert' },
          { key: './certs/server.key', cert: './certs/server.cert' },
        ];

        let httpsOptions = null;

        // Try each path until we find valid certificates
        for (const paths of certPaths) {
          if (fs.existsSync(paths.key) && fs.existsSync(paths.cert)) {
            httpsOptions = {
              key: fs.readFileSync(paths.key),
              cert: fs.readFileSync(paths.cert),
              // Add secure defaults
              minVersion: 'TLSv1.2',
              ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256',
            };
            break;
          }
        }

        if (httpsOptions) {
          this.server = https.createServer(httpsOptions, this.handleRequest.bind(this));
        } else {
          throw new Error('HTTPS certificates not found');
        }
      } catch (error) {
        logger.error('Failed to load HTTPS certificates, falling back to HTTP:', error);
        this.options.https = false;
        this.server = http.createServer(this.handleRequest.bind(this));
      }
    } else {
      this.server = http.createServer(this.handleRequest.bind(this));
      logger.warn('Warning: Server running in HTTP mode. This is not secure for production use.');
    }

    // Start the server
    await new Promise<void>(resolve => {
      this.server?.listen(this.options.port, () => {
        const protocol = this.options.https ? 'https' : 'http';
        process.stdout.write(`Server started at ${protocol}://localhost:${this.options.port}\n`);
        resolve();
      });
    });

    // Setup WebSocket server for live reload if enabled
    if (this.options.livereload && this.server) {
      this.wsServer = new WebSocketServer({ server: this.server });

      this.wsServer.on('connection', (ws: WS) => {
        this.clients.add(ws);

        ws.on('close', () => {
          this.clients.delete(ws);
        });
      });
    }

    // Watch for file changes
    if (this.options.watchDir) {
      this.watcher = chokidar.watch(this.options.watchDir, {
        ignored: /(^|[/\\])\..|node_modules/,
        persistent: true,
      });

      this.watcher.on('change', path => {
        process.stdout.write(`File ${path} changed\n`);
        this.notifyClients();
      });
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    // Close all WebSocket connections
    if (this.wsServer) {
      for (const client of this.clients) {
        client.close();
      }
      this.clients.clear();

      await new Promise<void>(resolve => {
        if (this.wsServer) {
          this.wsServer.close(() => {
            this.wsServer = null;
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    // Stop the server
    if (this.server) {
      await new Promise<void>(resolve => {
        if (this.server)
          this.server.close(() => {
            process.stdout.write('Server stopped\n');
            this.server = null;
            resolve();
          });
      });
    }

    // Stop the watcher
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  /**
   * Rate limiter to prevent excessive file operations
   * Maps client IPs to timestamps of their last request
   */
  private requestTimestamps: Map<string, number> = new Map();
  private requestLimitMs = 100; // Minimum time between requests from same IP

  /**
   * Handle HTTP requests
   */
  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // Apply rate limiting
    const clientIp = req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const lastRequest = this.requestTimestamps.get(clientIp) || 0;

    if (now - lastRequest < this.requestLimitMs) {
      res.writeHead(429, { 'Content-Type': 'text/plain' });
      res.end('Too Many Requests');
      return;
    }

    this.requestTimestamps.set(clientIp, now);

    // Get the URL
    const url = req.url || '/';

    // Normalize and sanitize the URL to prevent path traversal
    const normalizedUrl = this.sanitizePath(url);

    // Get the file path
    const filePath = path.join(
      this.options.rootDir || '',
      normalizedUrl === '/' ? 'index.html' : normalizedUrl
    );

    // Check if the file exists and is within the root directory
    if (this.isPathSafe(filePath) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      // Get the file extension
      const ext = path.extname(filePath);

      // Set the content type
      let contentType = 'text/plain';

      switch (ext) {
        case '.html':
          contentType = 'text/html';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.js':
          contentType = 'application/javascript';
          break;
        case '.json':
          contentType = 'application/json';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
      }

      // Check file size before reading to prevent serving extremely large files
      const stats = fs.statSync(filePath);
      const maxFileSizeBytes = 10 * 1024 * 1024; // 10MB limit

      if (stats.size > maxFileSizeBytes) {
        res.writeHead(413, {
          'Content-Type': 'text/plain',
          'X-Content-Type-Options': 'nosniff',
        });
        res.end('File too large to serve');
        return;
      }

      // Read the file
      let content: string | Buffer = fs.readFileSync(filePath);

      // Only process as text if it's a text file
      const isTextFile = ['.html', '.css', '.js', '.json', '.svg'].includes(ext);

      if (isTextFile) {
        content = content.toString('utf-8');

        // Inject live reload script if enabled and the file is HTML
        if (this.options.livereload && ext === '.html') {
          content = this.injectLiveReloadScript(content);
        }
      }

      // Send the response
      res.writeHead(200, {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Content-Security-Policy':
          "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:;",
      });
      res.end(content);
    } else if (
      this.isPathSafe(path.join(this.options.rootDir || '', normalizedUrl)) &&
      fs.existsSync(this.options.rootDir || '') &&
      fs.statSync(this.options.rootDir || '').isDirectory()
    ) {
      // Check if the URL is a directory
      const dirPath = path.join(this.options.rootDir || '', normalizedUrl);

      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        // Get the directory contents
        const files = fs.readdirSync(dirPath);

        // Check if there's an index.html file
        if (files.includes('index.html')) {
          // Read the index.html file
          let content = fs.readFileSync(path.join(dirPath, 'index.html'), 'utf-8');

          // Inject live reload script if enabled
          if (this.options.livereload) {
            content = this.injectLiveReloadScript(content);
          }

          // Send the response with security headers
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN',
            'Content-Security-Policy':
              "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:;",
          });
          res.end(content);
        } else {
          // Send a directory listing with sanitized links
          // Ensure normalizedUrl is properly sanitized for display
          const sanitizedDirPath = this.encodeHTML(normalizedUrl);

          const listing = `
            <html>
              <head>
                <title>Directory Listing: ${sanitizedDirPath}</title>
                <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:;">
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  ul { list-style-type: none; padding: 0; }
                  li { margin: 5px 0; }
                  a { text-decoration: none; color: #0366d6; }
                  a:hover { text-decoration: underline; }
                </style>
              </head>
              <body>
                <h1>Directory Listing: ${sanitizedDirPath}</h1>
                <ul>
                  ${files
                    .map(file => {
                      const encodedFile = this.encodeHTML(file);
                      // Create URL safely using proper URL encoding
                      const safeUrl = encodeURIComponent(
                        path.join(normalizedUrl, file).replace(/\\/g, '/')
                      );
                      return `<li><a href="${safeUrl}">${encodedFile}</a></li>`;
                    })
                    .join('')}
                </ul>
              </body>
            </html>
          `;

          // Send the response with security headers
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN',
            'Content-Security-Policy':
              "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' ws: wss:;",
          });
          res.end(listing);
        }
      } else {
        // Send a 404 response with security headers
        res.writeHead(404, {
          'Content-Type': 'text/plain',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
        });
        res.end('404 Not Found');
      }
    } else {
      // Send a 404 response with security headers
      res.writeHead(404, {
        'Content-Type': 'text/plain',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      });
      res.end('404 Not Found');
    }
  }

  /**
   * Sanitize a path to prevent path traversal attacks
   */
  private sanitizePath(inputPath: string): string {
    // Normalize the path to resolve '..' and '.' segments
    const normalized = path.normalize(inputPath);

    // Remove any leading '../' or './' to prevent escaping the root directory
    return normalized.replace(/^(\.\.(\/|\\)|\.?(\/|\\))+/, '');
  }

  /**
   * Check if a path is safe (within the root directory)
   */
  private isPathSafe(filePath: string): boolean {
    const rootDir = path.resolve(this.options.rootDir || '');
    const resolvedPath = path.resolve(filePath);
    return resolvedPath.startsWith(rootDir);
  }

  /**
   * Encode HTML special characters to prevent XSS
   */
  private encodeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Notify clients to reload
   */
  private notifyClients(): void {
    if (this.clients.size > 0) {
      const message = JSON.stringify({ type: 'reload' });
      for (const client of this.clients) {
        if (client.readyState === WS.OPEN) {
          client.send(message);
        }
      }
    }
  }

  /**
   * Injects live reload script into HTML content
   * @param content The HTML content to inject the script into
   * @returns The HTML content with the live reload script injected
   */
  private injectLiveReloadScript(content: string): string {
    const liveReloadScript = `
<script>
  (function() {
    const socket = new WebSocket('ws://' + window.location.hostname + ':${this.options.port}');
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'reload') {
        logger.debug('Reloading page...');
        window.location.reload();
      }
    });
    socket.addEventListener('close', () => {
      logger.debug('Live reload disconnected. Attempting to reconnect in 5 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    });
  })();
</script>
`;

    // Inject before the closing </body> tag if it exists, otherwise append to the end
    if (content.includes('</body>')) {
      return content.replace('</body>', `${liveReloadScript}</body>`);
    } else {
      return content + liveReloadScript;
    }
  }
}
