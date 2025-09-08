import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import open from 'open';
import chalk from 'chalk';
import { createRoutes } from './routes.js';
import { AuthConfig } from './config.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface StudioOptions {
  port: number;
  host: string;
  openBrowser: boolean;
  authConfig: AuthConfig;
}

export async function startStudio(options: StudioOptions) {
  const { port, host, openBrowser, authConfig } = options;
  const app = express();
  const server = createServer(app);

  // CORS configuration
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws) => {
    console.log(chalk.gray('🔌 WebSocket client connected'));
    
    const heartbeat = setInterval(() => {
      ws.ping();
    }, 30000);

    ws.on('close', () => {
      console.log(chalk.gray('🔌 WebSocket client disconnected'));
      clearInterval(heartbeat);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(heartbeat);
    });
  });

  app.use(createRoutes(authConfig));

  app.use(express.static(join(__dirname, '../public')));

  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../public/index.html'));
  });

  server.listen(port, host, () => {
    const url = `http://${host}:${port}`;
    console.log(chalk.green('✅ Better Auth Studio is running!'));
    console.log(chalk.blue(`🌐 Dashboard: ${url}`));
    console.log(chalk.gray(`📊 API: ${url}/api`));
    console.log(chalk.gray(`🔌 WebSocket: ws://${host}:${port}`));
    console.log(chalk.yellow('\nPress Ctrl+C to stop the server\n'));

    if (openBrowser) {
      setTimeout(() => {
        open(url).catch(() => {
          console.log(chalk.yellow('Could not open browser automatically. Please visit:'), url);
        });
      }, 1000);
    }
  });

  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n🛑 Shutting down Better Auth Studio...'));
    server.close(() => {
      console.log(chalk.green('✅ Server stopped'));
      process.exit(0);
    });
  });

  return server;
}
