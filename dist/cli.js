#!/usr/bin/env node
import chalk from 'chalk';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import chokidar from 'chokidar';
import { Command } from 'commander';
import { findAuthConfig } from './config.js';
import { startStudio } from './studio.js';
import { detectDatabaseWithDialect } from './utils/database-detection.js';
async function findAuthConfigPath() {
    const possibleConfigFiles = [
        'auth.ts',
        'auth.js',
        'src/auth.ts',
        'src/auth.js',
        'lib/auth.ts',
        'lib/auth.js',
        'better-auth.config.ts',
        'better-auth.config.js',
        'better-auth.config.json',
        'auth.config.ts',
        'auth.config.js',
        'auth.config.json',
        'studio-config.json',
    ];
    let currentDir = process.cwd();
    const maxDepth = 10;
    let depth = 0;
    while (currentDir && depth < maxDepth) {
        for (const configFile of possibleConfigFiles) {
            const configPath = join(currentDir, configFile);
            if (existsSync(configPath)) {
                return configPath;
            }
        }
        const parentDir = dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
        depth++;
    }
    return null;
}
let currentStudio = null;
let watcher = null;
let webSocketServer = null;
async function startStudioWithWatch(options) {
    const { port, host, openBrowser, authConfig, configPath, watchMode, geoDbPath } = options;
    const studioResult = await startStudio({
        port,
        host,
        openBrowser,
        authConfig,
        configPath,
        watchMode,
        geoDbPath,
    });
    currentStudio = studioResult.server;
    webSocketServer = studioResult.wss;
    if (configPath) {
        const resolvedPath = join(process.cwd(), configPath);
        watcher = chokidar.watch(resolvedPath, {
            persistent: true,
            ignoreInitial: true,
        });
        watcher.on('change', async (_path) => {
            try {
                // Stop current studio
                if (currentStudio && typeof currentStudio.close === 'function') {
                    await currentStudio.close();
                }
                // Reload config
                const newAuthConfig = await findAuthConfig(configPath);
                if (!newAuthConfig) {
                    return;
                }
                const newStudioResult = await startStudio({
                    port,
                    host,
                    openBrowser: false,
                    authConfig: newAuthConfig,
                    configPath,
                    watchMode,
                    geoDbPath,
                });
                currentStudio = newStudioResult.server;
                webSocketServer = newStudioResult.wss;
                if (webSocketServer?.clients) {
                    webSocketServer.clients.forEach((client) => {
                        if (client.readyState === 1) {
                            // WebSocket.OPEN
                            try {
                                client.send(JSON.stringify({
                                    type: 'config_changed',
                                    message: 'Configuration has been reloaded',
                                }));
                            }
                            catch (_error) { }
                        }
                    });
                }
                else {
                }
            }
            catch (_error) { }
        });
        watcher.on('error', (_error) => { });
    }
    else {
    }
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        if (watcher) {
            await watcher.close();
        }
        if (webSocketServer) {
            webSocketServer.close();
        }
        if (currentStudio && typeof currentStudio.close === 'function') {
            await currentStudio.close();
        }
        process.exit(0);
    });
}
const program = new Command();
function getPackageVersion() {
    try {
        const __dirname = dirname(fileURLToPath(import.meta.url));
        const packageJsonPath = join(__dirname, '../package.json');
        if (existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            return packageJson.version || '1.0.0';
        }
    }
    catch (_error) { }
    return '1.0.0';
}
program
    .name('better-auth-studio')
    .description('Better Auth Studio - Admin dashboard for Better Auth')
    .version(getPackageVersion());
program
    .command('start')
    .description('Start Better Auth Studio')
    .option('-p, --port <port>', 'Port to run the studio on', '3002')
    .option('-h, --host <host>', 'Host to run the studio on', 'localhost')
    .option('-c, --config <path>', 'Path to the auth configuration file')
    .option('--geo-db <path>', 'Path to MaxMind GeoLite2 database file (.mmdb)')
    .option('-w, --watch', 'Watch for changes in auth config file and reload server')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
    try {
        console.log(chalk.blue('🔐 Better Auth Studio'));
        console.log(chalk.gray('Starting Better Auth Studio...\n'));
        const authConfig = await findAuthConfig(options.config);
        if (!authConfig) {
            console.error(chalk.red('❌ No Better Auth configuration found.'));
            if (options.config) {
                console.log(chalk.yellow(`Could not find or load config file: ${options.config}`));
                console.log(chalk.gray(`Current working directory: ${process.cwd()}`));
                console.log(chalk.gray(`Tried paths:`));
                console.log(chalk.gray(`  - ${join(process.cwd(), options.config)}`));
                console.log(chalk.gray(`  - ${join(process.cwd(), '..', options.config)}`));
                console.log(chalk.gray(`  - ${join(process.cwd(), '../..', options.config)}`));
            }
            else {
                console.log(chalk.yellow('Make sure you have a Better Auth configuration file in your project.'));
                console.log(chalk.yellow('Supported files: auth.ts, auth.js, better-auth.config.ts, etc.'));
            }
            process.exit(1);
        }
        console.log(chalk.green('✅ Found Better Auth configuration'));
        let databaseInfo = 'Not configured';
        // Try to auto-detect database first
        try {
            const detectedDb = await detectDatabaseWithDialect();
            if (detectedDb) {
                databaseInfo = `${detectedDb.name.charAt(0).toUpperCase() + detectedDb.name.slice(1)} (${detectedDb.dialect}) v${detectedDb.version}`;
            }
        }
        catch (_error) { }
        // Fallback to existing logic if auto-detection fails
        if (databaseInfo === 'Not configured' && authConfig.database) {
            const configPath = await findAuthConfigPath();
            if (configPath) {
                const content = readFileSync(configPath, 'utf-8');
                if (content.includes('drizzleAdapter')) {
                    databaseInfo = 'Drizzle';
                }
                else if (content.includes('prismaAdapter')) {
                    databaseInfo = 'Prisma';
                }
                else if (authConfig.database.adapter && authConfig.database.provider) {
                    const adapter = authConfig.database.adapter;
                    const adapterName = adapter.charAt(0).toUpperCase() + adapter.slice(1);
                    databaseInfo = adapterName;
                }
                else if (authConfig.database.type) {
                    databaseInfo = authConfig.database.type;
                }
                else if (authConfig.database.adapter) {
                    databaseInfo = authConfig.database.adapter;
                }
            }
            else {
                if (authConfig.database.adapter && authConfig.database.provider) {
                    const adapter = authConfig.database.adapter;
                    const adapterName = adapter.charAt(0).toUpperCase() + adapter.slice(1);
                    databaseInfo = adapterName;
                }
                else if (authConfig.database.type) {
                    databaseInfo = authConfig.database.type;
                }
                else if (authConfig.database.adapter) {
                    databaseInfo = authConfig.database.adapter;
                }
            }
        }
        let providersInfo = 'None';
        if (authConfig.socialProviders && typeof authConfig.socialProviders === 'object') {
            const providerNames = Object.keys(authConfig.socialProviders);
            if (providerNames.length > 0) {
                providersInfo = providerNames.join(', ');
            }
        }
        else if (authConfig.providers && Array.isArray(authConfig.providers)) {
            const providerNames = authConfig.providers.map((p) => p.type || p.name).filter(Boolean);
            if (providerNames.length > 0) {
                providersInfo = providerNames.join(', ');
            }
        }
        console.log(chalk.gray(`Database: ${databaseInfo}`));
        console.log(chalk.gray(`Providers: ${providersInfo}\n`));
        if (options.watch) {
            await startStudioWithWatch({
                port: parseInt(options.port, 10),
                host: options.host,
                openBrowser: options.open,
                authConfig,
                configPath: options.config,
                watchMode: true,
                geoDbPath: options.geoDb,
            });
        }
        else {
            await startStudio({
                port: parseInt(options.port, 10),
                host: options.host,
                openBrowser: options.open,
                authConfig,
                configPath: options.config,
                watchMode: false,
                geoDbPath: options.geoDb,
            });
        }
    }
    catch (_error) {
        process.exit(1);
    }
});
program.parse();
//# sourceMappingURL=cli.js.map