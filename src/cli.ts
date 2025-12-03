#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { Command } from 'commander';
import { WebSocket } from 'ws';
import { findAuthConfig } from './config.js';
import { startStudio } from './studio.js';
import { detectDatabaseWithDialect } from './utils/database-detection.js';
import { possibleConfigFiles } from './utils.js';

async function findAuthConfigPath(): Promise<string | null> {
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

interface StudioWatchOptions {
  port: number;
  host: string;
  openBrowser: boolean;
  authConfig: any;
  configPath?: string;
  watchMode: boolean;
  geoDbPath?: string;
}

let currentStudio: any = null;
let watcher: any = null;
let webSocketServer: any = null;

type StoredWatchMessage = 'status' | 'change';

const createDefaultStatusPayload = () => ({
  type: 'studio_status',
  status: 'up_to_date',
  updatedAt: Date.now(),
});

let lastStatusMessage = JSON.stringify(createDefaultStatusPayload());
let lastConfigChangeMessage: string | null = null;

const handleWatchConnection = (ws: WebSocket) => {
  try {
    if (lastStatusMessage) {
      ws.send(lastStatusMessage);
    }
    if (lastConfigChangeMessage) {
      ws.send(lastConfigChangeMessage);
    }
  } catch (_error) {}
};

function broadcastWatchMessage(
  message: Record<string, any>,
  options?: { remember?: StoredWatchMessage }
) {
  const payload = JSON.stringify(message);

  if (options?.remember === 'status') {
    lastStatusMessage = payload;
  }
  if (options?.remember === 'change') {
    lastConfigChangeMessage = payload;
  }

  if (!webSocketServer?.clients || webSocketServer.clients.size === 0) {
    return;
  }

  webSocketServer.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload);
      } catch (_error) {}
    }
  });
}

function normalizeConfigPath(configPath?: string | null): string | null {
  if (!configPath) {
    return null;
  }
  if (isAbsolute(configPath) && existsSync(configPath)) {
    return configPath;
  }
  const absolutePath = join(process.cwd(), configPath);
  if (existsSync(absolutePath)) {
    return absolutePath;
  }
  return null;
}

function getFileDisplayInfo(filePath?: string | null) {
  if (!filePath) {
    return {
      fileName: undefined,
      filePath: undefined,
      absolutePath: undefined,
    };
  }

  const absolutePath = isAbsolute(filePath) ? filePath : join(process.cwd(), filePath);
  const relativePath = relative(process.cwd(), absolutePath);

  return {
    absolutePath,
    fileName: basename(absolutePath),
    filePath: relativePath || absolutePath,
  };
}

function formatChangeLabel(fileInfo: ReturnType<typeof getFileDisplayInfo>) {
  return fileInfo.filePath || fileInfo.fileName || 'auth config';
}

async function startStudioWithWatch(options: StudioWatchOptions) {
  const { port, host, openBrowser, authConfig, configPath, watchMode, geoDbPath } = options;

  const studioResult = await startStudio({
    port,
    host,
    openBrowser,
    authConfig,
    configPath,
    watchMode,
    geoDbPath,
    onWatchConnection: handleWatchConnection,
    logStartup: true,
  });
  currentStudio = studioResult.server;
  webSocketServer = studioResult.wss;

  if (configPath) {
    const resolvedPath = isAbsolute(configPath) ? configPath : join(process.cwd(), configPath);
    const fileInfo = getFileDisplayInfo(configPath);

    broadcastWatchMessage(
      {
        type: 'studio_status',
        status: 'up_to_date',
        updatedAt: Date.now(),
        fileName: fileInfo.fileName,
        filePath: fileInfo.filePath,
      },
      { remember: 'status' }
    );

    watcher = chokidar.watch(resolvedPath, {
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on('change', async (changedPath: string) => {
      const changeInfo = getFileDisplayInfo(changedPath || configPath);
      const changeLabel = formatChangeLabel(changeInfo);

      process.stdout.write(
        `${chalk.yellow(`\n↻ Reloading Better Auth Studio (changed ${changeLabel})`)}\n`
      );

      try {
        broadcastWatchMessage(
          {
            type: 'studio_status',
            status: 'refreshing',
            updatedAt: Date.now(),
            fileName: changeInfo.fileName,
            filePath: changeInfo.filePath,
          },
          { remember: 'status' }
        );

        broadcastWatchMessage({
          type: 'config_change_detected',
          message: 'Auth configuration change detected',
          fileName: changeInfo.fileName,
          filePath: changeInfo.filePath,
          changedAt: Date.now(),
        });

        await new Promise((resolve) => setTimeout(resolve, 75));

        if (currentStudio && typeof currentStudio.close === 'function') {
          await currentStudio.close();
        }

        const newAuthConfig = await findAuthConfig(configPath);
        if (!newAuthConfig) {
          broadcastWatchMessage(
            {
              type: 'studio_status',
              status: 'error',
              updatedAt: Date.now(),
              message: 'Unable to reload auth configuration.',
              fileName: changeInfo.fileName,
              filePath: changeInfo.filePath,
            },
            { remember: 'status' }
          );
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
          onWatchConnection: handleWatchConnection,
          logStartup: false,
        });
        currentStudio = newStudioResult.server;
        webSocketServer = newStudioResult.wss;

        broadcastWatchMessage(
          {
            type: 'studio_status',
            status: 'up_to_date',
            updatedAt: Date.now(),
            fileName: changeInfo.fileName,
            filePath: changeInfo.filePath,
          },
          { remember: 'status' }
        );

        broadcastWatchMessage(
          {
            type: 'config_changed',
            message: 'Configuration has been reloaded',
            fileName: changeInfo.fileName,
            filePath: changeInfo.filePath,
            changedAt: Date.now(),
          },
          { remember: 'change' }
        );

        process.stdout.write(`${chalk.green(`✔ Reload complete (${changeLabel})`)}\n`);
      } catch (error) {
        broadcastWatchMessage(
          {
            type: 'studio_status',
            status: 'error',
            updatedAt: Date.now(),
            message: error instanceof Error ? error.message : 'Unknown error',
            fileName: changeInfo.fileName,
            filePath: changeInfo.filePath,
          },
          { remember: 'status' }
        );

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        process.stdout.write(
          `${chalk.red(`✖ Reload failed (${changeLabel}) - ${errorMessage}`)}\n`
        );
      }
    });

    watcher.on('error', (_error: any) => {});
  } else {
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

function getPackageVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = join(__dirname, '../package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      return packageJson.version || '1.0.0';
    }
  } catch (_error) {}
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
      const resolvedConfigPath =
        normalizeConfigPath(options.config) || (await findAuthConfigPath());
      const configPathForRoutes = resolvedConfigPath
        ? relative(process.cwd(), resolvedConfigPath) || resolvedConfigPath
        : undefined;

      const authConfig = await findAuthConfig(configPathForRoutes);
      if (!authConfig) {
        if (options.config) {
        } else {
        }
        process.exit(1);
      }

      let databaseInfo = 'Not configured';

      try {
        const detectedDb = await detectDatabaseWithDialect();
        if (detectedDb) {
          databaseInfo = `${detectedDb.name.charAt(0).toUpperCase() + detectedDb.name.slice(1)} (${detectedDb.dialect}) v${detectedDb.version}`;
        }
      } catch (_error) {}

      // Fallback to existing logic if auto-detection fails
      if (databaseInfo === 'Not configured' && authConfig.database) {
        const configPath = await findAuthConfigPath();
        if (configPath) {
          const content = readFileSync(configPath, 'utf-8');
          if (content.includes('drizzleAdapter')) {
            databaseInfo = 'Drizzle';
          } else if (content.includes('prismaAdapter')) {
            databaseInfo = 'Prisma';
          } else if (authConfig.database.adapter && authConfig.database.provider) {
            const adapter = authConfig.database.adapter;
            const adapterName = adapter.charAt(0).toUpperCase() + adapter.slice(1);
            databaseInfo = adapterName;
          } else if (authConfig.database.type) {
            databaseInfo = authConfig.database.type;
          } else if (authConfig.database.adapter) {
            databaseInfo = authConfig.database.adapter;
          }
        } else {
          if (authConfig.database.adapter && authConfig.database.provider) {
            const adapter = authConfig.database.adapter;
            const adapterName = adapter.charAt(0).toUpperCase() + adapter.slice(1);
            databaseInfo = adapterName;
          } else if (authConfig.database.type) {
            databaseInfo = authConfig.database.type;
          } else if (authConfig.database.adapter) {
            databaseInfo = authConfig.database.adapter;
          }
        }
      }

      let _providersInfo = 'None';
      if (authConfig.socialProviders && typeof authConfig.socialProviders === 'object') {
        const providerNames = Object.keys(authConfig.socialProviders);
        if (providerNames.length > 0) {
          _providersInfo = providerNames.join(', ');
        }
      } else if (authConfig.providers && Array.isArray(authConfig.providers)) {
        const providerNames = authConfig.providers.map((p) => p.type || p.name).filter(Boolean);
        if (providerNames.length > 0) {
          _providersInfo = providerNames.join(', ');
        }
      }

      if (options.watch && !configPathForRoutes) {
        console.warn(
          '⚠ Unable to locate your auth config file. Watch mode will be disabled for this session.'
        );
      }

      if (options.watch && configPathForRoutes) {
        await startStudioWithWatch({
          port: parseInt(options.port, 10),
          host: options.host,
          openBrowser: options.open,
          authConfig,
          configPath: configPathForRoutes,
          watchMode: true,
          geoDbPath: options.geoDb,
        });
      } else {
        await startStudio({
          port: parseInt(options.port, 10),
          host: options.host,
          openBrowser: options.open,
          authConfig,
          configPath: configPathForRoutes,
          watchMode: false,
          geoDbPath: options.geoDb,
        });
      }
    } catch (_error) {
      process.exit(1);
    }
  });

program.parse();
