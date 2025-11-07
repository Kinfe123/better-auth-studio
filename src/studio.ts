import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import open from 'open';
import { WebSocketServer } from 'ws';
import type { AuthConfig } from './config.js';
import { createRoutes } from './routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface StudioOptions {
  port: number;
  host: string;
  openBrowser: boolean;
  authConfig: AuthConfig;
  configPath?: string;
  watchMode?: boolean;
  geoDbPath?: string;
}

export async function startStudio(options: StudioOptions) {
  const { port, host, openBrowser, authConfig, configPath, watchMode, geoDbPath } = options;
  const app = express();
  const server = createServer(app);

  app.use(
    cors({
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  let wss: WebSocketServer | null = null;

  // Only start WebSocket server in watch mode
  if (watchMode) {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
      const heartbeat = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws.on('close', () => {
        clearInterval(heartbeat);
      });

      ws.on('error', (_error) => {
        clearInterval(heartbeat);
      });

      // Send initial connection message
      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'Connected to Better Auth Studio (watch mode)',
        })
      );
    });
  }

  app.use(createRoutes(authConfig, configPath, geoDbPath));

  app.use(express.static(join(__dirname, '../public')));

  app.get('*', (_req, res) => {
    res.sendFile(join(__dirname, '../public/index.html'));
  });

  server.listen(port, host, () => {
    const url = `http://${host}:${port}`;

    console.log(chalk.green('✅ Better Auth Studio is running!'));
    console.log(chalk.blue(`🌐 Open your browser and navigate to: ${url}`));
    console.log(chalk.gray(`📊 Dashboard available at: ${url}`));
    console.log(chalk.gray(`🔧 API endpoints available at: ${url}/api`));
    if (watchMode) {
      console.log(chalk.yellow('👀 Watch mode enabled - studio will reload on config changes'));
    }
    console.log(chalk.gray('\nPress Ctrl+C to stop the studio\n'));

    if (openBrowser) {
      setTimeout(() => {
        open(url).catch(() => {});
      }, 1000);
    }
  });

  process.on('SIGINT', () => {
    server.close(() => {
      process.exit(0);
    });
  });

  return { server, wss };
}
