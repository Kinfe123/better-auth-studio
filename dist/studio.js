import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import open from 'open';
import { WebSocketServer } from 'ws';
import { createRoutes } from './routes.js';
import { serveIndexHtml } from './utils/html-injector.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const createClickableLink = (url, styledText) => {
    return `\x1b]8;;${url}\x1b\\${styledText}\x1b]8;;\x1b\\`;
};
export async function startStudio(options) {
    const { port, host, openBrowser, authConfig, configPath, watchMode, geoDbPath, onWatchConnection, logStartup = true, } = options;
    const app = express();
    const server = createServer(app);
    app.use(cors({
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
        credentials: true,
    }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    let wss = null;
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
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Connected to Better Auth Studio (watch mode)',
            }));
            if (typeof onWatchConnection === 'function') {
                try {
                    onWatchConnection(ws);
                }
                catch (_error) { }
            }
        });
    }
    app.use(createRoutes(authConfig, configPath, geoDbPath));
    const publicDir = existsSync(join(__dirname, '../public'))
        ? join(__dirname, '../public')
        : join(__dirname, '../../public');
    app.use('/assets', express.static(join(publicDir, 'assets'), {
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
    }));
    app.get('/vite.svg', (_req, res) => {
        res.sendFile(join(publicDir, 'vite.svg'));
    });
    app.get('*', (_req, res) => {
        const html = serveIndexHtml(publicDir, {
            basePath: '', // CLI studio uses root path
            metadata: {
                title: 'Better Auth Studio',
                theme: 'dark',
            }
        });
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    });
    server.listen(port, host, () => {
        const url = `http://${host}:${port}`;
        if (logStartup) {
            process.stdout.write('\n');
            process.stdout.write(chalk.green('✔ Better Auth Studio is running!\n'));
            process.stdout.write('\n');
            process.stdout.write(chalk.white(`🌐 Open your browser and navigate to: `));
            const styledUrl1 = chalk.green(chalk.underline(url));
            process.stdout.write(createClickableLink(url, styledUrl1));
            process.stdout.write('\n');
            process.stdout.write(chalk.white(`📊 Dashboard available at: `));
            const styledUrl2 = chalk.green(chalk.underline(url));
            process.stdout.write(createClickableLink(url, styledUrl2));
            process.stdout.write('\n');
            process.stdout.write(chalk.white(`🔧 API endpoints available at: `));
            const apiUrl = `${url}/api`;
            const styledApiUrl = chalk.green(chalk.underline(apiUrl));
            process.stdout.write(createClickableLink(apiUrl, styledApiUrl));
            process.stdout.write('\n');
            if (watchMode) {
                process.stdout.write(chalk.white('👀 Watch mode enabled - config changes will reload automatically\n'));
                process.stdout.write('\n');
            }
            process.stdout.write('\n');
            process.stdout.write(chalk.gray('Press Ctrl+C to stop the studio\n'));
            process.stdout.write('\n');
        }
        if (openBrowser) {
            setTimeout(() => {
                open(url).catch(() => { });
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
//# sourceMappingURL=studio.js.map