import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import WebSocket from 'ws';
import chalk from 'chalk';

/**
 * Creates and starts a development server for the generated website
 * @param outputDir The directory containing the generated website
 * @param port The port to run the server on
 * @returns A function to stop the server
 */
export function startDevServer(outputDir: string, port = 3000): () => void {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  // Serve static files from the output directory
  app.use(express.static(outputDir));

  // Serve index.html for all routes (SPA support)
  app.get('*', (req, res) => {
    const indexPath = path.join(outputDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not found');
    }
  });

  // Start the server
  server.listen(port, () => {
    console.log(chalk.green(`[SUCCESS] Development server started at http://localhost:${port}`));
    console.log(chalk.blue(`[INFO] Serving files from ${outputDir}`));
  });

  // WebSocket for live reload
  wss.on('connection', ws => {
    console.log(chalk.blue('[INFO] Client connected to live reload'));

    ws.on('error', error => {
      console.log(chalk.red(`[ERROR] WebSocket error: ${error.message}`));
    });

    ws.on('close', () => {
      console.log(chalk.blue('[INFO] Client disconnected from live reload'));
    });
  });

  // Function to notify clients to reload
  const notifyReload = () => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'reload' }));
      }
    });
  };

  // Return a function to stop the server
  return () => {
    server.close();
    console.log(chalk.blue('[INFO] Development server stopped'));
  };
}

/**
 * Injects live reload script into HTML files
 * @param outputDir The directory containing the generated website
 */
export function injectLiveReloadScript(outputDir: string, port = 3000): void {
  const liveReloadScript = `
<script>
  (function() {
    const socket = new WebSocket('ws://localhost:${port}');
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'reload') {
        console.log('Reloading page...');
        window.location.reload();
      }
    });
    socket.addEventListener('close', () => {
      console.log('Live reload disconnected. Attempting to reconnect in 5 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    });
  })();
</script>
`;

  // Find all HTML files in the output directory
  const findHtmlFiles = (dir: string): string[] => {
    const results: string[] = [];
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        results.push(...findHtmlFiles(filePath));
      } else if (file.endsWith('.html')) {
        results.push(filePath);
      }
    }

    return results;
  };

  const htmlFiles = findHtmlFiles(outputDir);

  // Inject the live reload script into each HTML file
  for (const file of htmlFiles) {
    let content = fs.readFileSync(file, 'utf-8');

    // Check if the script is already injected
    if (!content.includes("new WebSocket('ws://localhost:")) {
      // Inject before the closing </body> tag
      content = content.replace('</body>', `${liveReloadScript}</body>`);
      fs.writeFileSync(file, content);
    }
  }
}
