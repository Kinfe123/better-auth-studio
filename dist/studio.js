import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error - No types available
import babelPresetReact from '@babel/preset-react';
// @ts-expect-error - No types available
import babelPresetTypeScript from '@babel/preset-typescript';
import { loadConfig } from 'c12';
import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import open from 'open';
import { WebSocketServer } from 'ws';
import { getPathAliases } from './config.js';
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
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: true, limit: '50mb' }));
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
    let studioEnabled = false;
    let studioConfigPath = null;
    const possibleFiles = [
        'studio.config.ts',
        'studio.config.js',
        'studio.config.mjs',
        'studio.config.cjs',
    ];
    for (const file of possibleFiles) {
        const path = join(process.cwd(), file);
        if (existsSync(path)) {
            studioEnabled = true;
            studioConfigPath = path;
            break;
        }
    }
    let eventsStatus = null;
    if (studioConfigPath) {
        try {
            const alias = getPathAliases(process.cwd()) || {};
            const jitiOptions = {
                debug: false,
                transformOptions: {
                    babel: {
                        presets: [
                            [
                                babelPresetTypeScript,
                                {
                                    isTSX: true,
                                    allExtensions: true,
                                },
                            ],
                            [babelPresetReact, { runtime: 'automatic' }],
                        ],
                    },
                },
                extensions: ['.ts', '.js', '.tsx', '.jsx'],
                alias,
                interopDefault: true,
            };
            const { config } = await loadConfig({
                configFile: studioConfigPath,
                cwd: process.cwd(),
                dotenv: true,
                jitiOptions,
            });
            const studioConfig = config?.default || config?.config || config;
            if (studioConfig?.events) {
                const eventsConfig = studioConfig.events;
                const enabled = eventsConfig.enabled === true;
                const hasProvider = !!eventsConfig.provider;
                const hasClient = !!eventsConfig.client && !!eventsConfig.clientType;
                const configured = hasProvider || hasClient || !!studioConfig.auth; // If auth exists, can fallback to adapter
                eventsStatus = {
                    enabled,
                    configured,
                    clientType: eventsConfig.clientType,
                };
            }
            else {
                eventsStatus = {
                    enabled: false,
                    configured: false,
                };
            }
        }
        catch (_error) { }
    }
    app.use('/assets', express.static(join(publicDir, 'assets'), {
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public, max-age=31536000');
        },
    }));
    app.get('/vite.svg', (_req, res) => {
        res.sendFile(join(publicDir, 'vite.svg'));
    });
    app.get('/favicon.svg', (_req, res) => {
        res.sendFile(join(publicDir, 'favicon.svg'));
    });
    app.get('/logo.png', (_req, res) => {
        res.sendFile(join(publicDir, 'logo.png'));
    });
    app.get('*', (_req, res) => {
        const html = serveIndexHtml(publicDir, {
            basePath: '', // CLI studio uses root path
            metadata: {
                title: 'Better Auth Studio',
                theme: 'dark',
            },
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
            if (studioEnabled) {
                process.stdout.write(chalk.white('📋 Studio config found: studio.config.ts\n'));
                process.stdout.write('\n');
            }
            if (eventsStatus) {
                if (eventsStatus.enabled) {
                    if (eventsStatus.configured) {
                        const clientTypeInfo = eventsStatus.clientType ? ` (${eventsStatus.clientType})` : '';
                        process.stdout.write(chalk.green(`✅ Events enabled${clientTypeInfo} - configuration is valid\n`));
                    }
                    else {
                        process.stdout.write(chalk.yellow('⚠️  Events enabled but not fully configured - ensure you have a client/provider set up\n'));
                    }
                }
                else {
                    process.stdout.write(chalk.gray('ℹ️  Events are disabled\n'));
                }
                process.stdout.write('\n');
            }
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