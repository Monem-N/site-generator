import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

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
}

/**
 * A development server for the generated website
 */
export class DevServer {
  private options: DevServerOptions;
  private server: http.Server | null = null;
  private watcher: chokidar.FSWatcher | null = null;

  constructor(options: DevServerOptions = {}) {
    this.options = {
      port: 3000,
      rootDir: './public',
      watchDir: './src',
      livereload: true,
      ...options,
    };
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    // Create the server
    this.server = http.createServer(this.handleRequest.bind(this));

    // Start the server
    await new Promise<void>(resolve => {
      this.server!.listen(this.options.port, () => {
        console.log(`Server started at http://localhost:${this.options.port}`);
        resolve();
      });
    });

    // Watch for file changes
    if (this.options.watchDir) {
      this.watcher = chokidar.watch(this.options.watchDir, {
        ignored: /(^|[/\\])\..|node_modules/,
        persistent: true,
      });

      this.watcher.on('change', path => {
        console.log(`File ${path} changed`);
        this.notifyClients();
      });
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    // Stop the server
    if (this.server) {
      await new Promise<void>(resolve => {
        this.server!.close(() => {
          console.log('Server stopped');
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
   * Handle HTTP requests
   */
  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // Get the URL
    const url = req.url || '/';

    // Get the file path
    const filePath = path.join(this.options.rootDir || '', url === '/' ? 'index.html' : url);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
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

      // Read the file
      let content = fs.readFileSync(filePath, 'utf-8');

      // Inject live reload script if enabled and the file is HTML
      if (this.options.livereload && ext === '.html') {
        content = this.injectLiveReloadScript(content);
      }

      // Send the response
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else if (
      fs.existsSync(this.options.rootDir || '') &&
      fs.statSync(this.options.rootDir || '').isDirectory()
    ) {
      // Check if the URL is a directory
      const dirPath = path.join(this.options.rootDir || '', url);

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

          // Send the response
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        } else {
          // Send a directory listing
          const listing = `
            <html>
              <head>
                <title>Directory Listing</title>
              </head>
              <body>
                <h1>Directory Listing</h1>
                <ul>
                  ${files
                    .map(file => `<li><a href="${path.join(url, file)}">${file}</a></li>`)
                    .join('')}
                </ul>
              </body>
            </html>
          `;

          // Send the response
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(listing);
        }
      } else {
        // Send a 404 response
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      }
    } else {
      // Send a 404 response
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }

  /**
   * Inject live reload script into HTML content
   */
  private injectLiveReloadScript(content: string): string {
    // Check if the script is already injected
    if (content.includes('livereload.js')) {
      return content;
    }

    // Inject the script before the closing </body> tag
    const script = `<script>document.write('<script src="http://' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1"></script>')</script>`;

    return content.replace('</body>', `${script}</body>`);
  }

  /**
   * Notify clients to reload
   */
  private notifyClients(): void {
    // This would normally send a message to connected WebSocket clients
    console.log('Notifying clients to reload');
  }
}
