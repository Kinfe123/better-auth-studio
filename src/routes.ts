import { createHmac, randomBytes } from 'node:crypto';
import {
  existsSync,
  readFileSync as readFile,
  readFileSync,
  unlinkSync,
  writeFileSync as writeFile,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, join as pathJoin, sep as pathSep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// @ts-expect-error
import { hex } from '@better-auth/utils/hex';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { type Request, type Response, Router } from 'express';
import { createJiti } from 'jiti';
import {
  createMockAccount,
  createMockSession,
  createMockUser,
  createMockVerification,
  getAuthAdapter,
} from './auth-adapter.js';
import type { AuthConfig } from './config.js';
import { possiblePaths } from './config.js';
import { getAuthData } from './data.js';
import { initializeGeoService, resolveIPLocation, setGeoDbPath } from './geo-service.js';
import { detectDatabaseWithDialect } from './utils/database-detection.js';

const config = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};
async function generateKey(password: string, salt: string) {
  return await scryptAsync(password.normalize('NFKC'), salt, {
    N: config.N,
    p: config.p,
    r: config.r,
    dkLen: config.dkLen,
    maxmem: 128 * config.N * config.r * 2,
  });
}

function getStudioVersion(): string {
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

function _resolveModuleWithExtensions(id: string, parent: string): string {
  if (!id.startsWith('./') && !id.startsWith('../')) {
    return id;
  }

  const parentDir = dirname(parent);
  const basePath = join(parentDir, id);

  const extensions = ['.ts', '.js', '.mjs', '.cjs'];

  for (const ext of extensions) {
    const fullPath = basePath + ext;
    if (existsSync(fullPath)) {
      return pathToFileURL(fullPath).href;
    }
  }

  if (existsSync(basePath)) {
    for (const ext of extensions) {
      const indexPath = join(basePath, `index${ext}`);
      if (existsSync(indexPath)) {
        return pathToFileURL(indexPath).href;
      }
    }
  }

  return id;
}

export async function safeImportAuthConfig(authConfigPath: string, noCache = false): Promise<any> {
  try {
    if (authConfigPath.endsWith('.ts')) {
      const aliases: Record<string, string> = {};
      const authConfigDir = dirname(authConfigPath);

      let projectDir = authConfigDir;
      let tsconfigPath = join(projectDir, 'tsconfig.json');
      while (!existsSync(tsconfigPath) && projectDir !== dirname(projectDir)) {
        projectDir = dirname(projectDir);
        tsconfigPath = join(projectDir, 'tsconfig.json');
      }

      const content = readFileSync(authConfigPath, 'utf-8');

      const { getPathAliases } = await import('./config.js');
      const tsconfigAliases = getPathAliases(projectDir) || {};

      const relativeImportRegex = /import\s+.*?\s+from\s+['"](\.\/[^'"]+)['"]/g;
      const dynamicImportRegex = /import\s*\(\s*['"](\.\/[^'"]+)['"]\s*\)/g;
      const foundImports = new Set<string>();

      let match;
      while ((match = relativeImportRegex.exec(content)) !== null) {
        foundImports.add(match[1]);
      }

      while ((match = dynamicImportRegex.exec(content)) !== null) {
        foundImports.add(match[1]);
      }
      for (const importPath of foundImports) {
        const importName = importPath.replace('./', '');
        const possiblePaths = [
          join(authConfigDir, `${importName}.ts`),
          join(authConfigDir, `${importName}.js`),
          join(authConfigDir, `${importName}.mjs`),
          join(authConfigDir, `${importName}.cjs`),
          join(authConfigDir, importName, 'index.ts'),
          join(authConfigDir, importName, 'index.js'),
          join(authConfigDir, importName, 'index.mjs'),
          join(authConfigDir, importName, 'index.cjs'),
        ];

        for (const path of possiblePaths) {
          if (existsSync(path)) {
            aliases[importPath] = pathToFileURL(path).href;
            break;
          }
        }
      }

      // Handle path aliases like $lib/db
      const pathAliasRegex = /import\s+.*?\s+from\s+['"](\$[^'"]+)['"]/g;
      while ((match = pathAliasRegex.exec(content)) !== null) {
        const aliasPath = match[1];
        const aliasBase = aliasPath.split('/')[0];
        if (tsconfigAliases[aliasBase]) {
          const remainingPath = aliasPath.replace(aliasBase, '').replace(/^\//, '');
          const resolvedPath = join(tsconfigAliases[aliasBase], remainingPath);
          const possiblePaths = [
            `${resolvedPath}.ts`,
            `${resolvedPath}.js`,
            `${resolvedPath}.mjs`,
            `${resolvedPath}.cjs`,
            join(resolvedPath, 'index.ts'),
            join(resolvedPath, 'index.js'),
            join(resolvedPath, 'index.mjs'),
            join(resolvedPath, 'index.cjs'),
          ];
          for (const path of possiblePaths) {
            if (existsSync(path)) {
              aliases[aliasPath] = pathToFileURL(path).href;
              break;
            }
          }
        }
      }

      const jiti = createJiti(import.meta.url, {
        debug: false,
        fsCache: noCache ? false : true,
        moduleCache: noCache ? false : true,
        interopDefault: true,
        alias: aliases,
      });
      try {
        return await jiti.import(authConfigPath);
      } catch (_importError: any) {
        const content = readFileSync(authConfigPath, 'utf-8');

        return {
          auth: {
            options: {
              _content: content,
            },
          },
        };
      }
    }

    return await import(authConfigPath);
  } catch (importError) {
    try {
      const { dirname, join } = await import('node:path');
      const { existsSync, readFileSync, writeFileSync, mkdtempSync, unlinkSync, rmdirSync } =
        await import('node:fs');
      const { tmpdir } = await import('node:os');

      const projectDir = dirname(authConfigPath);
      const content = readFileSync(authConfigPath, 'utf-8');

      let resolvedContent = content;

      let currentDir = projectDir;
      let nodeModulesPath = null;

      while (currentDir && currentDir !== dirname(currentDir)) {
        const potentialNodeModules = join(currentDir, 'node_modules');
        if (existsSync(potentialNodeModules)) {
          nodeModulesPath = potentialNodeModules;
          break;
        }
        currentDir = dirname(currentDir);
      }

      resolvedContent = '';

      resolvedContent = resolvedContent.replace(
        /import\s+([^"']*)\s+from\s+["']\.\/[^"']*["'];/g,
        '// Ignored local import'
      );

      resolvedContent = resolvedContent.replace(
        /import\s+{\s*magicLink\s*}\s+from\s+["']\.\/magic-link["'];/g,
        `const magicLink = () => ({ id: 'magic-link', name: 'Magic Link' });`
      );

      if (nodeModulesPath) {
        const tempDir = mkdtempSync(join(tmpdir(), 'better-auth-studio-'));
        const tempFile = join(tempDir, 'resolved-auth-config.js');

        let commonJsContent = resolvedContent
          .replace(/export\s+const\s+(\w+)\s*=/g, 'const $1 =')
          .replace(/export\s+default\s+/g, 'module.exports = ')
          .replace(/export\s+type\s+.*$/gm, '// $&')
          .replace(/import\s+type\s+.*$/gm, '// $&');

        if (!commonJsContent.includes('module.exports')) {
          commonJsContent += '\nmodule.exports = { auth };';
        }

        writeFileSync(tempFile, commonJsContent);

        const originalCwd = process.cwd();
        const originalNodePath = process.env.NODE_PATH;

        try {
          process.env.NODE_PATH = nodeModulesPath;
          process.chdir(projectDir);

          const authModule = await import(tempFile);

          unlinkSync(tempFile);
          rmdirSync(tempDir);

          return authModule;
        } finally {
          process.chdir(originalCwd);
          if (originalNodePath) {
            process.env.NODE_PATH = originalNodePath;
          } else {
            delete process.env.NODE_PATH;
          }
        }
      } else {
        throw new Error('No node_modules found');
      }
    } catch (_resolveError) {
      throw importError;
    }
  }
}

async function findAuthConfigPath(): Promise<string | null> {
  const { join, dirname } = await import('node:path');
  const { existsSync } = await import('node:fs');

  for (const path of possiblePaths) {
    const fullPath = join(process.cwd(), path);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

export function createRoutes(
  authConfig: AuthConfig,
  configPath?: string,
  geoDbPath?: string
): Router {
  const router = Router();
  const base64UrlEncode = (value: Buffer | string) =>
    Buffer.from(value)
      .toString('base64')
      .replace(/=+$/u, '')
      .replace(/\+/gu, '-')
      .replace(/\//gu, '_');
  const base64UrlDecode = (value: string) => {
    const normalized = value.replace(/-/gu, '+').replace(/_/gu, '/');
    const padded = normalized + '==='.slice((normalized.length + 3) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
  };
  const formatRelativeDuration = (ms: number) => {
    const absMs = Math.abs(ms);
    const mins = Math.floor(absMs / 60000);
    if (mins >= 1) {
      return `${mins} min${mins === 1 ? '' : 's'}`;
    }
    const secs = Math.max(1, Math.floor(absMs / 1000));
    return `${secs}s`;
  };

  if (geoDbPath) {
    setGeoDbPath(geoDbPath);
  }

  initializeGeoService().catch(console.error);

  const getAuthAdapterWithConfig = () => getAuthAdapter(configPath);

  router.get('/api/health', (_req: Request, res: Response) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      system: {
        studioVersion: '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: `${hours}h ${minutes}m ${seconds}s`,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        pid: process.pid,
        cwd: process.cwd(),
      },
    });
  });

  router.get('/api/version-check', async (_req: Request, res: Response) => {
    try {
      const __dirname = dirname(fileURLToPath(import.meta.url));
      const projectRoot = join(__dirname, '..');

      let currentVersion = '1.0.0';

      try {
        const betterAuthPkgPath = join(projectRoot, 'node_modules', 'better-auth', 'package.json');
        if (existsSync(betterAuthPkgPath)) {
          const betterAuthPkg = JSON.parse(readFileSync(betterAuthPkgPath, 'utf-8'));
          currentVersion = betterAuthPkg.version || '1.0.0';
        }
      } catch (_error) {
        try {
          const packageJsonPath = join(projectRoot, 'package.json');
          if (existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const versionString =
              packageJson.dependencies?.['better-auth'] ||
              packageJson.devDependencies?.['better-auth'] ||
              '1.0.0';
            currentVersion = versionString.replace(/[\^~>=<]/g, '');
          }
        } catch {}
      }

      let latestVersion = currentVersion;
      let isOutdated = false;

      try {
        const npmResponse = await fetch('https://registry.npmjs.org/better-auth/latest');
        if (npmResponse.ok) {
          const npmData = await npmResponse.json();
          latestVersion = (npmData as { version: string }).version || currentVersion;
          isOutdated = currentVersion !== latestVersion;
        }
      } catch (_fetchError) {
        latestVersion = currentVersion;
        isOutdated = false;
      }

      res.json({
        current: currentVersion,
        latest: latestVersion,
        isOutdated,
        updateCommand: 'npm install better-auth@latest',
      });
    } catch (_error) {
      res.status(500).json({
        error: 'Failed to check version',
        current: 'unknown',
        latest: 'unknown',
        isOutdated: false,
      });
    }
  });

  router.post('/api/geo/resolve', (req: Request, res: Response) => {
    try {
      const { ipAddress } = req.body;

      if (!ipAddress) {
        return res.status(400).json({
          success: false,
          error: 'IP address is required',
        });
      }

      const location = resolveIPLocation(ipAddress);

      if (!location) {
        return res.status(404).json({
          success: false,
          error: 'Location not found for IP address',
        });
      }

      res.json({
        success: true,
        location,
      });
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to resolve IP location',
      });
    }
  });

  router.get('/api/config', async (_req: Request, res: Response) => {
    let databaseType = 'unknown';
    let databaseDialect = 'unknown';
    let databaseAdapter = 'unknown';
    let databaseVersion = 'unknown';
    let adapterConfig: any = null;
    let adapterProvider: any = null;
    try {
      const adapterResult = await getAuthAdapterWithConfig();
      if (adapterResult && (adapterResult as any).options?.adapterConfig) {
        adapterConfig = (adapterResult as any).options.adapterConfig;
        adapterProvider = (adapterResult as any).options.provider;
      }
    } catch (_error) {}

    try {
      const detectedDb = await detectDatabaseWithDialect();
      if (detectedDb) {
        databaseType = detectedDb.name.charAt(0).toUpperCase() + detectedDb.name.slice(1);
        databaseDialect = detectedDb.dialect || detectedDb.name;
        databaseAdapter = detectedDb.adapter || detectedDb.name;
        databaseVersion = detectedDb.version;
      }
    } catch (_error) {}

    if (databaseType === 'unknown') {
      const configPath = await findAuthConfigPath();
      if (configPath) {
        const content = readFileSync(configPath, 'utf-8');
        if (content.includes('drizzleAdapter')) {
          databaseType = 'Drizzle';
        } else if (content.includes('prismaAdapter')) {
          databaseType = 'Prisma';
        } else if (content.includes('better-sqlite3') || content.includes('new Database(')) {
          databaseType = 'SQLite';
        }
      }

      if (databaseType === 'unknown') {
        let type = authConfig.database?.type || authConfig.database?.adapter || 'unknown';
        if (type && type !== 'unknown') {
          type = type.charAt(0).toUpperCase() + type.slice(1);
        }
        databaseType = type;
      }
    }
    const config = {
      appName: authConfig.appName || 'Better Auth',
      baseURL: authConfig.baseURL || process.env.BETTER_AUTH_URL,
      basePath: authConfig.basePath || '/api/auth',
      secret: authConfig.secret ? 'Configured' : 'Not set',

      database: {
        type: databaseType,
        adapter: authConfig.database?.adapter || databaseAdapter,
        version: databaseVersion,
        casing: authConfig.database?.casing || 'camel',
        debugLogs: authConfig.database?.debugLogs || false,
        url: authConfig.database?.url,
        adapterConfig: adapterConfig,
        dialect: adapterProvider,
      },

      emailVerification: {
        sendOnSignUp: authConfig.emailVerification?.sendOnSignUp || false,
        sendOnSignIn: authConfig.emailVerification?.sendOnSignIn || false,
        autoSignInAfterVerification:
          authConfig.emailVerification?.autoSignInAfterVerification || false,
        expiresIn: authConfig.emailVerification?.expiresIn || 3600,
      },

      emailAndPassword: {
        enabled: authConfig.emailAndPassword?.enabled ?? false,
        disableSignUp: authConfig.emailAndPassword?.disableSignUp ?? false,
        requireEmailVerification: authConfig.emailAndPassword?.requireEmailVerification ?? false,
        maxPasswordLength: authConfig.emailAndPassword?.maxPasswordLength ?? 128,
        minPasswordLength: authConfig.emailAndPassword?.minPasswordLength ?? 8,
        resetPasswordTokenExpiresIn:
          authConfig.emailAndPassword?.resetPasswordTokenExpiresIn ?? 3600,
        autoSignIn: authConfig.emailAndPassword?.autoSignIn ?? true, // defaults to true
        revokeSessionsOnPasswordReset:
          authConfig.emailAndPassword?.revokeSessionsOnPasswordReset ?? false,
      },

      socialProviders: authConfig.socialProviders
        ? authConfig.socialProviders.map((provider: any) => ({
            type: provider.id,
            clientId: provider.clientId,
            clientSecret: provider.clientSecret,
            redirectUri: provider.redirectUri,
            ...provider,
          }))
        : authConfig.providers || [],

      user: {
        modelName: authConfig.user?.modelName || 'user',
        changeEmail: {
          enabled: authConfig.user?.changeEmail?.enabled || false,
        },
        deleteUser: {
          enabled: authConfig.user?.deleteUser?.enabled || false,
          deleteTokenExpiresIn: authConfig.user?.deleteUser?.deleteTokenExpiresIn || 86400,
        },
      },

      session: {
        modelName: authConfig.session?.modelName || 'session',
        expiresIn: authConfig.session?.expiresIn || 604800, // 7 days
        updateAge: authConfig.session?.updateAge || 86400, // 1 day
        disableSessionRefresh: authConfig.session?.disableSessionRefresh || false,
        storeSessionInDatabase: authConfig.session?.storeSessionInDatabase || false,
        preserveSessionInDatabase: authConfig.session?.preserveSessionInDatabase || false,
        cookieCache: {
          enabled: authConfig.session?.cookieCache?.enabled || false,
          maxAge: authConfig.session?.cookieCache?.maxAge || 300,
        },
        freshAge: authConfig.session?.freshAge || 86400,
      },

      account: {
        modelName: authConfig.account?.modelName || 'account',
        updateAccountOnSignIn: authConfig.account?.updateAccountOnSignIn !== false, // defaults to true
        accountLinking: {
          enabled: authConfig.account?.accountLinking?.enabled !== false, // defaults to true
          trustedProviders: authConfig.account?.accountLinking?.trustedProviders || [],
          allowDifferentEmails: authConfig.account?.accountLinking?.allowDifferentEmails || false,
          allowUnlinkingAll: authConfig.account?.accountLinking?.allowUnlinkingAll || false,
          updateUserInfoOnLink: authConfig.account?.accountLinking?.updateUserInfoOnLink || false,
        },
        encryptOAuthTokens: authConfig.account?.encryptOAuthTokens || false,
      },

      verification: {
        modelName: authConfig.verification?.modelName || 'verification',
        disableCleanup: authConfig.verification?.disableCleanup || false,
      },

      trustedOrigins: Array.isArray(authConfig.trustedOrigins) ? authConfig.trustedOrigins : [],

      rateLimit: {
        enabled: authConfig.rateLimit?.enabled ?? false,
        window: authConfig.rateLimit?.window || 10,
        max: authConfig.rateLimit?.max || 100,
        storage: authConfig.rateLimit?.storage || 'memory',
        modelName: authConfig.rateLimit?.modelName || 'rateLimit',
        customStorage: authConfig.rateLimit?.customStorage || null,
        customRules: authConfig.rateLimit?.customRules || [],
      },

      advanced: {
        ipAddress: {
          ipAddressHeaders: authConfig.advanced?.ipAddress?.ipAddressHeaders || [],
          disableIpTracking: authConfig.advanced?.ipAddress?.disableIpTracking || false,
        },
        useSecureCookies: authConfig.advanced?.useSecureCookies || false,
        disableCSRFCheck: authConfig.advanced?.disableCSRFCheck || false,
        crossSubDomainCookies: {
          enabled: authConfig.advanced?.crossSubDomainCookies?.enabled || false,
          additionalCookies: authConfig.advanced?.crossSubDomainCookies?.additionalCookies || [],
          domain: authConfig.advanced?.crossSubDomainCookies?.domain,
        },
        cookies: authConfig.advanced?.cookies || {},
        defaultCookieAttributes: authConfig.advanced?.defaultCookieAttributes || {},
        cookiePrefix: authConfig.advanced?.cookiePrefix,
        database: {
          defaultFindManyLimit: authConfig.advanced?.database?.defaultFindManyLimit || 100,
          useNumberId: authConfig.advanced?.database?.useNumberId || false,
        },
      },

      disabledPaths: authConfig.disabledPaths || [],

      telemetry: {
        enabled: authConfig.telemetry?.enabled ?? false,
        debug: authConfig.telemetry?.debug || false,
      },
      studio: {
        version: getStudioVersion(),
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
      },
    };
    res.json(config);
  });

  router.get('/api/stats', async (_req: Request, res: Response) => {
    try {
      const stats = await getAuthData(authConfig, 'stats', undefined, configPath);
      res.json(stats);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  router.get('/api/analytics', async (req: Request, res: Response) => {
    try {
      const { period = 'ALL', type = 'users', from, to } = req.query;
      const analytics = await getAuthData(
        authConfig,
        'analytics',
        {
          period: period as string,
          type: type as string,
          from: from as string | undefined,
          to: to as string | undefined,
        },
        configPath
      );
      res.json(analytics);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  router.get('/api/counts', async (_req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapterWithConfig();
      let userCount = 0;
      let sessionCount = 0;
      let organizationCount = 0;
      let teamCount = 0;

      let organizationPluginEnabled = false;
      let teamsPluginEnabled = false;

      try {
        const authConfigPath = configPath || (await findAuthConfigPath());
        if (authConfigPath) {
          const { getConfig } = await import('./config.js');
          const betterAuthConfig = await getConfig({
            cwd: process.cwd(),
            configPath: authConfigPath,
            shouldThrowOnError: false,
            noCache: true, // Disable cache for real-time plugin checks
          });

          if (betterAuthConfig) {
            const plugins = betterAuthConfig.plugins || [];
            const organizationPlugin = plugins.find((plugin: any) => plugin.id === 'organization');
            organizationPluginEnabled = !!organizationPlugin;
            teamsPluginEnabled = !!organizationPlugin?.options?.teams?.enabled;
            if (organizationPlugin) {
              teamsPluginEnabled = organizationPlugin.options?.teams?.enabled === true;
            }
          }
        }
      } catch (_error) {
        organizationPluginEnabled = false;
        teamsPluginEnabled = false;
      }

      if (adapter) {
        try {
          if (typeof adapter.findMany === 'function') {
            const users = await adapter.findMany({ model: 'user', limit: 100000 });
            userCount = users?.length || 0;
          }
        } catch (_error) {}

        try {
          if (typeof adapter.findMany === 'function') {
            const sessions = await adapter.findMany({ model: 'session', limit: 100000 });
            sessionCount = sessions?.length || 0;
          }
        } catch (_error) {}

        if (organizationPluginEnabled) {
          try {
            if (typeof adapter.findMany === 'function') {
              const organizations = await adapter.findMany({ model: 'organization', limit: 10000 });
              organizationCount = organizations?.length || 0;
            }
          } catch (_error) {
            organizationCount = 0;
          }
        }

        if (teamsPluginEnabled) {
          try {
            if (typeof adapter.findMany === 'function') {
              const teams = await adapter.findMany({ model: 'team', limit: 10000 });
              teamCount = teams?.length || 0;
            }
          } catch (_error) {
            teamCount = 0;
          }
        }
      }

      res.json({
        users: userCount,
        sessions: sessionCount,
        organizations: organizationCount,
        teams: teamCount,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch counts' });
    }
  });
  router.get('/api/users/all', async (_req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      let users: any[] = [];
      if (adapter.findMany) {
        users = await adapter.findMany({ model: 'user', limit: 100000 }).catch(() => []);
      } else if (adapter.getUsers) {
        users = await adapter.getUsers();
      }

      res.json({ success: true, users });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  router.get('/api/users/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      const users = await adapter.findMany({
        model: 'user',
        where: [{ field: 'id', value: userId }],
        limit: 1,
      });
      const user = users && users.length > 0 ? users[0] : null;
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  router.put('/api/users/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { name, email, role } = req.body;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.update) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const updateData: any = { name, email };
      if (role !== undefined) {
        updateData.role = role;
      }

      const user = await adapter.update({
        model: 'user',
        where: [{ field: 'id', value: userId }],
        update: updateData,
      });

      res.json({ success: true, user });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });
  router.put('/api/users/:userId/password', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.update) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      let hashedPassword = password;
      try {
        const salt = hex.encode(crypto.getRandomValues(new Uint8Array(16)));
        const key = await generateKey(password, salt);
        hashedPassword = `${salt}:${hex.encode(key)}`;
      } catch {
        res.status(500).json({ error: 'Failed to hash password' });
      }
      const account = await adapter.update({
        model: 'account',
        where: [
          { field: 'userId', value: userId },
          { field: 'providerId', value: 'credential' },
        ],
        update: { password: hashedPassword },
      });

      res.json({ success: true, account });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update password', message: error?.message });
    }
  });
  router.delete('/api/users/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.delete) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      await adapter.delete({ model: 'user', where: [{ field: 'id', value: userId }] });
      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  router.get('/api/users/:userId/organizations', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const [memberships, organizations] = await Promise.all([
        adapter.findMany({ model: 'member', limit: 10000 }),
        adapter.findMany({ model: 'organization', limit: 10000 }),
      ]);

      const userMemberships = memberships.filter((membership: any) => membership.userId === userId);

      const formattedMemberships = userMemberships.map((membership: any) => {
        const organization = organizations.find((org: any) => org.id === membership.organizationId);
        return {
          id: membership.id,
          organization: organization
            ? {
                id: organization.id,
                name: organization.name || 'Unknown Organization',
                slug: organization.slug || 'unknown',
                image: organization.image,
                createdAt: organization.createdAt,
              }
            : {
                id: membership.organizationId,
                name: 'Unknown Organization',
                slug: 'unknown',
                createdAt: membership.createdAt,
              },
          role: membership.role || 'member',
          joinedAt: membership.createdAt,
        };
      });

      res.json({ memberships: formattedMemberships });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch user organizations' });
    }
  });

  router.get('/api/users/:userId/teams', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const [memberships, teams, organizations] = await Promise.all([
        adapter.findMany({ model: 'teamMember', limit: 10000 }),
        adapter.findMany({ model: 'team', limit: 10000 }),
        adapter.findMany({ model: 'organization', limit: 10000 }),
      ]);

      const userMemberships = memberships.filter((membership: any) => membership.userId === userId);

      const formattedMemberships = userMemberships.map((membership: any) => {
        const team = teams.find((t: any) => t.id === membership.teamId);
        const organization = team
          ? organizations.find((org: any) => org.id === team.organizationId)
          : null;

        return {
          id: membership.id,
          team: team
            ? {
                id: team.id,
                name: team.name || 'Unknown Team',
                organizationId: team.organizationId,
                organizationName: organization
                  ? organization.name || 'Unknown Organization'
                  : 'Unknown Organization',
                organizationSlug: organization ? organization.slug || 'unknown' : 'unknown',
              }
            : {
                id: membership.teamId,
                name: 'Unknown Team',
                organizationId: 'unknown',
                organizationName: 'Unknown Organization',
                organizationSlug: 'unknown',
              },
          role: membership.role || 'member',
          joinedAt: membership.createdAt,
        };
      });

      res.json({ memberships: formattedMemberships });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch user teams' });
    }
  });

  router.delete('/api/organizations/members/:membershipId', async (req: Request, res: Response) => {
    try {
      const { membershipId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.delete) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      await adapter.delete({
        model: 'member',
        where: [{ field: 'id', value: membershipId }],
      });
      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to remove user from organization' });
    }
  });

  router.delete('/api/teams/members/:membershipId', async (req: Request, res: Response) => {
    try {
      const { membershipId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.delete) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      await adapter.delete({
        model: 'teamMember',
        where: [{ field: 'id', value: membershipId }],
      });
      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to remove user from team' });
    }
  });

  router.post('/api/users/:userId/ban', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.update) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const user = await adapter.update({
        model: 'user',
        id: userId,
        data: { banned: true },
      });
      res.json({ success: true, user });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to ban user' });
    }
  });

  router.get('/api/users/:userId/accounts', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const accounts = await adapter.findMany({
        model: 'account',
        limit: 10000,
      });

      const userAccounts = accounts
        .filter((account: any) => account.userId === userId)
        .map((account: any) => ({
          id: account.id,
          providerId: account.providerId || account.provider || 'unknown',
          accountId: account.accountId || account.providerAccountId || account.id,
          createdAt: account.createdAt || account.created_at || null,
          updatedAt: account.updatedAt || account.updated_at || null,
          email: account.email || account.login?.email || null,
          image: account.image || account.profileImage || null,
          userId: account.userId,
        }));

      res.json({ accounts: userAccounts });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch user accounts' });
    }
  });

  router.delete('/api/users/:userId/accounts/:accountId', async (req: Request, res: Response) => {
    try {
      const { userId, accountId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany || !adapter.delete) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const existingAccounts = await adapter.findMany({
        model: 'account',
        where: [{ field: 'id', value: accountId }],
        limit: 1,
      });

      const account = existingAccounts?.[0];
      if (!account || account.userId !== userId) {
        return res.status(404).json({ error: 'Account not found for this user' });
      }

      await adapter.delete({ model: 'account', where: [{ field: 'id', value: accountId }] });
      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to unlink account' });
    }
  });

  router.get('/api/users/:userId/sessions', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const sessions = await adapter.findMany({
        model: 'session',
        limit: 10000,
      });

      const userSessions = sessions.filter((session: any) => session.userId === userId);

      const formattedSessions = userSessions.map((session: any) => ({
        id: session.id,
        token: session.token,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress || 'Unknown',
        userAgent: session.userAgent || 'Unknown',
        activeOrganizationId: session.activeOrganizationId,
        activeTeamId: session.activeTeamId,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }));

      res.json({ sessions: formattedSessions });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch user sessions' });
    }
  });

  router.delete('/api/sessions/:sessionId', async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.delete) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      await adapter.delete({ model: 'session', where: [{ field: 'id', value: sessionId }] });
      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });

  router.get('/api/teams/:teamId', async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const teams = await adapter.findMany({
        model: 'team',
        where: [{ field: 'id', value: teamId }],
        limit: 1,
      });

      const team = teams && teams.length > 0 ? teams[0] : null;

      if (!team) {
        return res.status(404).json({ success: false, error: 'Team not found' });
      }

      // Fetch organization details for the team
      let organization = null;
      try {
        const orgs = await adapter.findMany({
          model: 'organization',
          where: [{ field: 'id', value: team.organizationId }],
          limit: 1,
        });
        organization = orgs && orgs.length > 0 ? orgs[0] : null;
      } catch (_error) {}

      const transformedTeam = {
        id: team.id,
        name: team.name,
        organizationId: team.organizationId,
        metadata: team.metadata,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
        memberCount: team.memberCount || 0,
        organization: organization
          ? {
              id: organization.id,
              name: organization.name,
            }
          : null,
      };

      res.json({ success: true, team: transformedTeam });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch team' });
    }
  });

  router.get('/api/organizations/:orgId', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const organizations = await adapter.findMany({
        model: 'organization',
        where: [{ field: 'id', value: orgId }],
        limit: 1,
      });

      const organization = organizations && organizations.length > 0 ? organizations[0] : null;

      if (!organization) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const transformedOrganization = {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        metadata: organization.metadata,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt,
      };

      res.json({ success: true, organization: transformedOrganization });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  });

  router.get('/api/users', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string;
      try {
        const adapter = await getAuthAdapterWithConfig();
        if (adapter && typeof adapter.findMany === 'function') {
          const shouldPaginate = limit < 1000;
          const fetchLimit = shouldPaginate ? limit : undefined;

          const allUsers = await adapter.findMany({
            model: 'user',
            limit: fetchLimit || 100000,
          });
          let filteredUsers = allUsers || [];
          if (search) {
            filteredUsers = filteredUsers.filter(
              (user: any) =>
                user.email?.toLowerCase().includes(search.toLowerCase()) ||
                user.name?.toLowerCase().includes(search.toLowerCase())
            );
          }

          let paginatedUsers;
          if (shouldPaginate) {
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            paginatedUsers = filteredUsers.slice(startIndex, endIndex);
          } else {
            paginatedUsers = filteredUsers;
          }

          const transformedUsers = paginatedUsers.map((user: any) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            role: user.role,
            banned: user.banned,
            banReason: user.banReason,
            banExpires: user.banExpires,
          }));

          res.json({ users: transformedUsers });
          return;
        }
      } catch (_adapterError) {}

      const result = await getAuthData(authConfig, 'users', { page, limit, search }, configPath);

      const transformedUsers = (result.data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        ...user,
      }));

      res.json({ users: transformedUsers });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  router.get('/api/sessions', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const sessions = await getAuthData(authConfig, 'sessions', { page, limit }, configPath);
      res.json(sessions);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  router.get('/api/providers', async (_req: Request, res: Response) => {
    try {
      const providers = await getAuthData(authConfig, 'providers', undefined, configPath);
      res.json(providers);
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch providers' });
    }
  });

  router.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await getAuthData(authConfig, 'deleteUser', { id }, configPath);
      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  router.get('/api/plugins', async (_req: Request, res: Response) => {
    try {
      const authConfigPath = configPath
        ? join(process.cwd(), configPath)
        : await findAuthConfigPath();
      if (!authConfigPath) {
        return res.json({
          plugins: [],
          error: 'No auth config found',
          configPath: null,
        });
      }

      try {
        let authModule;
        try {
          authModule = await safeImportAuthConfig(authConfigPath, true); // Disable cache for real-time plugin checks
        } catch (_importError) {
          // Fallback: read file content directly
          const content = readFileSync(authConfigPath, 'utf-8');

          authModule = {
            auth: {
              options: {
                _content: content,
                plugins: [],
              },
            },
          };
        }
        const auth = authModule.auth || authModule.default;

        if (!auth) {
          return res.json({
            plugins: [],
            error: 'No auth export found',
            configPath: authConfigPath,
          });
        }
        const plugins = auth.options?.plugins || [];
        const pluginInfo = plugins.map((plugin: any) => ({
          id: plugin.id,
          name: plugin.name || plugin.id,
          description: plugin.description || `${plugin.id} plugin for Better Auth`,
          enabled: true,
        }));

        res.json({
          plugins: pluginInfo,
          configPath: authConfigPath,
          totalPlugins: pluginInfo.length,
        });
      } catch (_error) {
        res.json({
          plugins: [],
          error: 'Failed to load auth config - import failed and regex extraction unavailable',
          configPath: authConfigPath,
        });
      }
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch plugins' });
    }
  });

  router.get('/api/database/info', async (_req: Request, res: Response) => {
    try {
      const authConfigPath = configPath || (await findAuthConfigPath());
      if (!authConfigPath) {
        return res.json({
          database: null,
          error: 'No auth config found',
          configPath: null,
        });
      }

      try {
        const authModule = await safeImportAuthConfig(authConfigPath);
        const auth = authModule.auth || authModule.default;

        if (!auth) {
          return res.json({
            database: null,
            error: 'No auth export found',
            configPath: authConfigPath,
          });
        }

        const database = auth.options?.database;
        res.json({
          database: database,
          configPath: authConfigPath,
        });
      } catch (_error) {
        res.json({
          database: null,
          error: 'Failed to load auth config - import failed and regex extraction unavailable',
          configPath: authConfigPath,
        });
      }
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch database info' });
    }
  });

  router.get('/api/database/test', async (_req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      const result = await adapter.findMany({
        model: 'user',
        limit: 1,
      });
      return res.json({ success: true, result: result });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to test database connection',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/api/tools/migrations/run', async (req: Request, res: Response) => {
    try {
      const { provider, script } = req.body as { provider?: string; script?: string };

      if (!provider) {
        return res.status(400).json({ success: false, error: 'Migration provider is required' });
      }
      if (script) {
        // TODO: use more of sandbox environment to execute the script for security reasons
        const result = eval(script);
        return res.json({
          success: true,
          result: result,
        });
      } else {
        return res.status(400).json({ success: false, error: 'No script provided' });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to process migration request',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/api/tools/health-check', async (_req: Request, res: Response) => {
    try {
      const baseUrl =
        authConfig.baseURL?.replace(/\/$/, '') ||
        process.env.BETTER_AUTH_URL?.replace(/\/$/, '') ||
        'http://localhost:3000';
      const basePathRaw = authConfig.basePath || '/api/auth';
      const basePath =
        basePathRaw === '/' ? '' : basePathRaw.startsWith('/') ? basePathRaw : `/${basePathRaw}`;
      const endpointChecks = [
        {
          label: 'Sign In',
          method: 'POST',
          path: '/sign-in/email',
          body: JSON.stringify({
            email: `test-${Date.now()}@example.com`,
            password: 'test-password-123',
          }),
        },
        {
          label: 'Get Session',
          method: 'GET',
          path: '/get-session',
        },
      ] as const;

      const checks = await Promise.all(
        endpointChecks.map(async (check) => {
          const targetUrl = `${baseUrl}${basePath}${check.path}`;
          try {
            const fetchOptions: RequestInit = {
              method: check.method,
              headers: {
                'Content-Type': 'application/json',
              },
            };

            if (check.method === 'POST' && check.body) {
              fetchOptions.body = check.body;
            }

            const response = await fetch(targetUrl, fetchOptions);
            const ok = response.status !== 404 && response.status !== 302;
            if (!ok) {
              return {
                label: check.label,
                endpoint: check.path,
                ok: false,
                status: response.status,
                error: response.statusText,
              };
            }
            return {
              label: check.label,
              endpoint: check.path,
              ok,
              status: response.status,
            };
          } catch (error) {
            return {
              label: check.label,
              endpoint: check.path,
              ok: false,
              status: null,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      const allPassed = checks.every((check) => check.ok);
      const failedChecks = checks.filter((check) => !check.ok);

      if (allPassed) {
        res.json({
          success: true,
          message: 'All Better Auth endpoints are healthy',
        });
      } else {
        res.json({
          success: false,
          message: 'Some Better Auth endpoints failed health checks',
          failedEndpoints: failedChecks.map((check) => ({
            endpoint: check.endpoint,
            status: check.status,
            error: check.error,
          })),
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/api/tools/validate-config', async (_req: Request, res: Response) => {
    try {
      const results: Array<{
        category: string;
        check: string;
        status: 'pass' | 'fail' | 'warning';
        message: string;
        suggestion?: string;
        severity: 'error' | 'warning' | 'info';
      }> = [];

      const addResult = (
        category: string,
        check: string,
        status: 'pass' | 'fail' | 'warning',
        message: string,
        suggestion?: string,
        severity: 'error' | 'warning' | 'info' = status === 'fail'
          ? 'error'
          : status === 'warning'
            ? 'warning'
            : 'info'
      ) => {
        results.push({ category, check, status, message, suggestion, severity });
      };

      // 1. Core Configuration Checks
      const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;
      if (!secret) {
        addResult(
          'Core Config',
          'Secret Key',
          'fail',
          'BETTER_AUTH_SECRET or AUTH_SECRET environment variable is not set',
          'Set BETTER_AUTH_SECRET in your .env file with a strong random string (minimum 32 characters)',
          'error'
        );
      } else if (secret.length < 32) {
        addResult(
          'Core Config',
          'Secret Key',
          'warning',
          `Secret key is only ${secret.length} characters. Recommended minimum is 32 characters`,
          'Generate a longer secret key for better security',
          'warning'
        );
      } else {
        addResult(
          'Core Config',
          'Secret Key',
          'pass',
          'Secret key is configured and meets length requirements'
        );
      }

      const baseURL = authConfig.baseURL || process.env.BETTER_AUTH_URL;
      if (!baseURL) {
        addResult(
          'Core Config',
          'Base URL',
          'warning',
          'baseURL is not configured. Using default localhost:3000',
          'Set baseURL in your auth config or BETTER_AUTH_URL environment variable',
          'warning'
        );
      } else {
        try {
          new URL(baseURL);
          addResult('Core Config', 'Base URL', 'pass', `Base URL is valid: ${baseURL}`);
        } catch {
          addResult(
            'Core Config',
            'Base URL',
            'fail',
            `Base URL format is invalid: ${baseURL}`,
            'Ensure baseURL is a valid URL (e.g., https://example.com)',
            'error'
          );
        }
      }

      const basePath = authConfig.basePath || '/api/auth';
      if (!basePath.startsWith('/')) {
        addResult(
          'Core Config',
          'Base Path',
          'fail',
          `Base path must start with '/': ${basePath}`,
          'Change basePath to start with a forward slash (e.g., /api/auth)',
          'error'
        );
      } else {
        addResult('Core Config', 'Base Path', 'pass', `Base path is valid: ${basePath}`);
      }

      // 2. Database Configuration
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter) {
        addResult(
          'Database',
          'Adapter',
          'fail',
          'Database adapter is not available or not configured',
          'Ensure your database adapter is properly configured in your auth config',
          'error'
        );
      } else {
        addResult('Database', 'Adapter', 'pass', 'Database adapter is configured');

        // Test database connection
        try {
          if (adapter.findMany) {
            await adapter.findMany({
              model: 'user',
              limit: 1,
            });
            addResult('Database', 'Connection', 'pass', 'Database connection is working');
          } else {
            addResult(
              'Database',
              'Connection',
              'warning',
              'Cannot test database connection (findMany method not available)',
              undefined,
              'warning'
            );
          }
        } catch (error) {
          addResult(
            'Database',
            'Connection',
            'fail',
            `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            'Check your database connection string and ensure the database is accessible',
            'error'
          );
        }
      }

      const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.MYSQL_URL;
      if (!dbUrl && !authConfig.database?.url) {
        addResult(
          'Database',
          'Connection String',
          'warning',
          'No database connection string found in environment variables',
          'Set DATABASE_URL, POSTGRES_URL, or MYSQL_URL in your .env file',
          'warning'
        );
      } else {
        addResult(
          'Database',
          'Connection String',
          'pass',
          'Database connection string is configured'
        );
      }

      // 3. OAuth/Social Providers
      const socialProviders = authConfig.socialProviders || [];
      if (socialProviders.length === 0) {
        addResult(
          'OAuth Providers',
          'Providers',
          'warning',
          'No OAuth providers configured',
          'This is optional. Add social providers if you need OAuth authentication',
          'info'
        );
      } else {
        addResult(
          'OAuth Providers',
          'Providers',
          'pass',
          `${socialProviders.length} OAuth provider(s) configured`
        );

        socialProviders.forEach((provider) => {
          if (provider.enabled) {
            if (!provider.clientId) {
              addResult(
                'OAuth Providers',
                `${provider.name} - Client ID`,
                'fail',
                `${provider.name} is enabled but clientId is missing`,
                `Add clientId for ${provider.name} in your auth config`,
                'error'
              );
            } else {
              addResult(
                'OAuth Providers',
                `${provider.name} - Client ID`,
                'pass',
                'Client ID is configured'
              );
            }

            if (!provider.clientSecret) {
              addResult(
                'OAuth Providers',
                `${provider.name} - Client Secret`,
                'fail',
                `${provider.name} is enabled but clientSecret is missing`,
                `Add clientSecret for ${provider.name} in your auth config`,
                'error'
              );
            } else {
              addResult(
                'OAuth Providers',
                `${provider.name} - Client Secret`,
                'pass',
                'Client Secret is configured'
              );
            }

            if (provider.redirectURI) {
              const baseUrl =
                authConfig.baseURL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
              const expectedRedirect = `${baseUrl}${authConfig.basePath || '/api/auth'}/callback/${provider.id}`;
              if (!provider.redirectURI.includes(baseUrl)) {
                addResult(
                  'OAuth Providers',
                  `${provider.name} - Redirect URI`,
                  'warning',
                  `Redirect URI may not match baseURL: ${provider.redirectURI}`,
                  `Expected format: ${expectedRedirect}. Ensure this matches your OAuth provider settings`,
                  'warning'
                );
              } else {
                addResult(
                  'OAuth Providers',
                  `${provider.name} - Redirect URI`,
                  'pass',
                  'Redirect URI is configured'
                );
              }
            } else {
              addResult(
                'OAuth Providers',
                `${provider.name} - Redirect URI`,
                'warning',
                'Redirect URI is not explicitly set (will use default)',
                undefined,
                'warning'
              );
            }
          }
        });
      }

      // 4. Email & Password
      const emailAndPassword = authConfig.emailAndPassword;
      if (emailAndPassword?.enabled) {
        addResult(
          'Email & Password',
          'Enabled',
          'pass',
          'Email and password authentication is enabled'
        );

        if (emailAndPassword.minPasswordLength && emailAndPassword.minPasswordLength < 8) {
          addResult(
            'Email & Password',
            'Password Policy',
            'warning',
            `Minimum password length is ${emailAndPassword.minPasswordLength}. Recommended minimum is 8`,
            'Consider increasing minPasswordLength to 8 or higher',
            'warning'
          );
        } else {
          addResult('Email & Password', 'Password Policy', 'pass', 'Password policy is configured');
        }
      } else {
        addResult(
          'Email & Password',
          'Enabled',
          'warning',
          'Email and password authentication is disabled',
          'Enable emailAndPassword in your config if you need email/password auth',
          'info'
        );
      }

      // 5. Security Settings
      const advanced = authConfig.advanced || {};
      const cookieAttrs = advanced.defaultCookieAttributes || {};

      if (process.env.NODE_ENV === 'production') {
        if (cookieAttrs.secure !== true) {
          addResult(
            'Security',
            'Cookie Security',
            'fail',
            'Cookie secure flag is not set to true in production',
            'Set secure: true in defaultCookieAttributes for production',
            'error'
          );
        } else {
          addResult('Security', 'Cookie Security', 'pass', 'Cookie secure flag is enabled');
        }

        if (cookieAttrs.sameSite === 'none' && !cookieAttrs.secure) {
          addResult(
            'Security',
            'Cookie SameSite',
            'fail',
            'sameSite: "none" requires secure: true',
            'Set secure: true when using sameSite: "none"',
            'error'
          );
        }
      } else {
        if (cookieAttrs.secure === false) {
          addResult(
            'Security',
            'Cookie Security',
            'warning',
            'Cookie secure flag is false (acceptable for development)',
            'Ensure secure: true in production',
            'warning'
          );
        }
      }

      if (cookieAttrs.httpOnly !== false) {
        addResult('Security', 'Cookie HttpOnly', 'pass', 'HttpOnly flag is enabled (recommended)');
      } else {
        addResult(
          'Security',
          'Cookie HttpOnly',
          'warning',
          'HttpOnly flag is disabled',
          'Enable httpOnly: true for better security',
          'warning'
        );
      }

      // 6. Trusted Origins
      const trustedOriginsRaw = authConfig.trustedOrigins || [];
      const trustedOrigins = Array.isArray(trustedOriginsRaw) ? trustedOriginsRaw : [];
      if (trustedOrigins.length === 0) {
        addResult(
          'Security',
          'Trusted Origins',
          'warning',
          'No trusted origins configured',
          'Configure trustedOrigins to restrict CORS to specific domains',
          'warning'
        );
      } else {
        const invalidOrigins = trustedOrigins.filter((origin: string) => {
          try {
            new URL(origin);
            return false;
          } catch {
            return true;
          }
        });

        if (invalidOrigins.length > 0) {
          addResult(
            'Security',
            'Trusted Origins',
            'fail',
            `Invalid trusted origin(s): ${invalidOrigins.join(', ')}`,
            'Ensure all trusted origins are valid URLs',
            'error'
          );
        } else {
          addResult(
            'Security',
            'Trusted Origins',
            'pass',
            `${trustedOrigins.length} trusted origin(s) configured`
          );
        }
      }

      // 7. Environment Variables
      const requiredEnvVars = ['BETTER_AUTH_SECRET', 'AUTH_SECRET'];
      const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);
      if (missingEnvVars.length > 0) {
        addResult(
          'Environment',
          'Required Variables',
          'fail',
          `Missing required environment variables: ${missingEnvVars.join(', ')}`,
          'Set the required environment variables in your .env file',
          'error'
        );
      } else {
        addResult(
          'Environment',
          'Required Variables',
          'pass',
          'All required environment variables are set'
        );
      }

      // Summary
      const errors = results.filter((r) => r.severity === 'error').length;
      const warnings = results.filter((r) => r.severity === 'warning').length;
      const passes = results.filter((r) => r.status === 'pass').length;
      const infos = results.filter((r) => r.severity === 'info').length;

      res.json({
        success: errors === 0,
        summary: {
          total: results.length,
          passes,
          errors,
          warnings,
          infos,
        },
        results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to validate configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Database Detection endpoint - Auto-detect database from installed packages
  router.get('/api/database/detect', async (_req: Request, res: Response) => {
    try {
      const detectedDb = await detectDatabaseWithDialect();

      if (detectedDb) {
        res.json({
          success: true,
          database: {
            name: detectedDb.name,
            version: detectedDb.version,
            dialect: detectedDb.dialect,
            adapter: detectedDb.adapter,
            displayName: detectedDb.name.charAt(0).toUpperCase() + detectedDb.name.slice(1),
          },
        });
      } else {
        res.json({
          success: false,
          database: null,
          message: 'No supported database packages detected',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to detect database',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/api/db', async (_req: Request, res: Response) => {
    try {
      const detectedDb = await detectDatabaseWithDialect();

      if (detectedDb) {
        res.json({
          success: true,
          name: detectedDb.name,
          version: detectedDb.version,
          dialect: detectedDb.dialect,
          adapter: detectedDb.adapter,
          displayName: detectedDb.name.charAt(0).toUpperCase() + detectedDb.name.slice(1),
          autoDetected: true,
        });
      } else {
        res.json({
          success: false,
          name: 'unknown',
          version: 'unknown',
          dialect: 'unknown',
          adapter: 'unknown',
          displayName: 'Unknown',
          autoDetected: false,
          message: 'No supported database packages detected',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get database information',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/api/admin/ban-user', async (req: Request, res: Response) => {
    try {
      const authConfigPath = configPath || (await findAuthConfigPath());
      if (!authConfigPath) {
        return res.status(400).json({
          success: false,
          error: 'No auth config found',
        });
      }

      const { getConfig } = await import('./config.js');
      const auth = await getConfig({
        cwd: process.cwd(),
        configPath: authConfigPath,
        shouldThrowOnError: false,
      });

      if (!auth) {
        return res.status(400).json({
          success: false,
          error: 'Failed to load auth config',
        });
      }

      const plugins = auth.plugins || [];
      const adminPlugin = plugins.find((plugin: any) => plugin.id === 'admin');

      if (!adminPlugin) {
        return res.status(400).json({
          success: false,
          error:
            'Admin plugin is not enabled. Please enable the admin plugin in your Better Auth configuration.',
        });
      }
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.update) {
        return res.status(500).json({
          success: false,
          error: 'Auth adapter not available',
        });
      }
      const bannedUser = await adapter.update({
        model: 'user',
        where: [{ field: 'id', value: req.body.userId }],
        update: { banned: true, banReason: req.body.banReason, banExpires: req.body.banExpires },
      });

      res.json({ success: true, user: bannedUser });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to ban user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.post('/api/admin/unban-user', async (req: Request, res: Response) => {
    try {
      const authConfigPath = configPath || (await findAuthConfigPath());
      if (!authConfigPath) {
        return res.status(400).json({
          success: false,
          error: 'No auth config found',
        });
      }

      const { getConfig } = await import('./config.js');
      const auth = await getConfig({
        cwd: process.cwd(),
        configPath: authConfigPath,
        shouldThrowOnError: false,
      });

      if (!auth) {
        return res.status(400).json({
          success: false,
          error: 'Failed to load auth config',
        });
      }

      const plugins = auth.plugins || [];
      const adminPlugin = plugins.find((plugin: any) => plugin.id === 'admin');

      if (!adminPlugin) {
        return res.status(400).json({
          success: false,
          error:
            'Admin plugin is not enabled. Please enable the admin plugin in your Better Auth configuration.',
        });
      }
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.update) {
        return res.status(500).json({
          success: false,
          error: 'Auth adapter not available',
        });
      }
      const unbannedUser = await adapter.update({
        model: 'user',
        where: [{ field: 'id', value: req.body.userId }],
        update: { banned: false, banReason: null, banExpires: null },
      });
      res.json({ success: true, user: unbannedUser });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to unban user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/api/admin/status', async (_req: Request, res: Response) => {
    try {
      const authConfigPath = configPath || (await findAuthConfigPath());
      if (!authConfigPath) {
        return res.json({
          enabled: false,
          error: 'No auth config found',
          configPath: null,
        });
      }

      const { getConfig } = await import('./config.js');
      const betterAuthConfig = await getConfig({
        cwd: process.cwd(),
        configPath: authConfigPath,
        shouldThrowOnError: false,
      });

      if (!betterAuthConfig) {
        return res.json({
          enabled: false,
          error: 'Failed to load auth config',
          configPath: authConfigPath,
        });
      }

      const plugins = betterAuthConfig.plugins || [];
      const adminPlugin = plugins.find((plugin: any) => plugin.id === 'admin');

      res.json({
        enabled: !!adminPlugin,
        configPath: authConfigPath,
        adminPlugin: adminPlugin || null,
      });
    } catch (error) {
      res.status(500).json({
        enabled: false,
        error: 'Failed to check admin status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Database Schema Visualization endpoint
  // Schema definitions for different Better Auth plugins
  const BASE_SCHEMA = {
    user: {
      name: 'user',
      displayName: 'User',
      fields: [
        {
          name: 'id',
          type: 'string',
          required: true,
          primaryKey: true,
          description: 'Unique user identifier',
        },
        { name: 'name', type: 'string', required: true, description: 'User display name' },
        {
          name: 'email',
          type: 'string',
          required: true,
          unique: true,
          description: 'User email address',
        },
        {
          name: 'emailVerified',
          type: 'boolean',
          required: true,
          defaultValue: false,
          description: 'Email verification status',
        },
        { name: 'image', type: 'string', required: false, description: 'User profile image URL' },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
          description: 'Account creation timestamp',
        },
        { name: 'updatedAt', type: 'date', required: true, description: 'Last update timestamp' },
      ],
      relationships: [
        { type: 'one-to-many', target: 'session', field: 'userId' },
        { type: 'one-to-many', target: 'account', field: 'userId' },
      ],
    },
    session: {
      name: 'session',
      displayName: 'Session',
      fields: [
        {
          name: 'id',
          type: 'string',
          required: true,
          primaryKey: true,
          description: 'Unique session identifier',
        },
        {
          name: 'expiresAt',
          type: 'date',
          required: true,
          description: 'Session expiration timestamp',
        },
        {
          name: 'token',
          type: 'string',
          required: true,
          unique: true,
          description: 'Session token',
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
          description: 'Session creation timestamp',
        },
        { name: 'updatedAt', type: 'date', required: true, description: 'Last update timestamp' },
        { name: 'ipAddress', type: 'string', required: false, description: 'Client IP address' },
        { name: 'userAgent', type: 'string', required: false, description: 'Client user agent' },
        { name: 'userId', type: 'string', required: true, description: 'Associated user ID' },
      ],
      relationships: [{ type: 'many-to-one', target: 'user', field: 'userId' }],
    },
    account: {
      name: 'account',
      displayName: 'Account',
      fields: [
        {
          name: 'id',
          type: 'string',
          required: true,
          primaryKey: true,
          description: 'Unique account identifier',
        },
        { name: 'accountId', type: 'string', required: true, description: 'Provider account ID' },
        {
          name: 'providerId',
          type: 'string',
          required: true,
          description: 'Authentication provider',
        },
        { name: 'userId', type: 'string', required: true, description: 'Associated user ID' },
        { name: 'accessToken', type: 'string', required: false, description: 'OAuth access token' },
        {
          name: 'refreshToken',
          type: 'string',
          required: false,
          description: 'OAuth refresh token',
        },
        { name: 'idToken', type: 'string', required: false, description: 'OAuth ID token' },
        {
          name: 'accessTokenExpiresAt',
          type: 'date',
          required: false,
          description: 'Access token expiration',
        },
        {
          name: 'refreshTokenExpiresAt',
          type: 'date',
          required: false,
          description: 'Refresh token expiration',
        },
        { name: 'scope', type: 'string', required: false, description: 'OAuth scope' },
        {
          name: 'password',
          type: 'string',
          required: false,
          description: 'Hashed password (if applicable)',
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
          description: 'Account creation timestamp',
        },
        { name: 'updatedAt', type: 'date', required: true, description: 'Last update timestamp' },
      ],
      relationships: [{ type: 'many-to-one', target: 'user', field: 'userId' }],
    },
    verification: {
      name: 'verification',
      displayName: 'Verification',
      fields: [
        {
          name: 'id',
          type: 'string',
          required: true,
          primaryKey: true,
          description: 'Unique verification identifier',
        },
        {
          name: 'identifier',
          type: 'string',
          required: true,
          description: 'Email or phone being verified',
        },
        {
          name: 'value',
          type: 'string',
          required: true,
          description: 'Verification code or token',
        },
        {
          name: 'expiresAt',
          type: 'date',
          required: true,
          description: 'Verification expiration timestamp',
        },
        {
          name: 'createdAt',
          type: 'date',
          required: true,
          description: 'Verification creation timestamp',
        },
        { name: 'updatedAt', type: 'date', required: true, description: 'Last update timestamp' },
      ],
      relationships: [],
    },
  };

  // Plugin schemas that extend the base schema
  const PLUGIN_SCHEMAS = {
    organization: {
      tables: {
        organization: {
          name: 'organization',
          displayName: 'Organization',
          fields: [
            {
              name: 'id',
              type: 'string',
              required: true,
              primaryKey: true,
              description: 'Unique organization identifier',
            },
            { name: 'name', type: 'string', required: true, description: 'Organization name' },
            {
              name: 'slug',
              type: 'string',
              required: false,
              unique: true,
              description: 'Organization URL slug',
            },
            { name: 'logo', type: 'string', required: false, description: 'Organization logo URL' },
            {
              name: 'createdAt',
              type: 'date',
              required: true,
              description: 'Organization creation timestamp',
            },
            {
              name: 'metadata',
              type: 'json',
              required: false,
              description: 'Additional organization metadata',
            },
          ],
          relationships: [
            { type: 'one-to-many', target: 'member', field: 'organizationId' },
            { type: 'one-to-many', target: 'invitation', field: 'organizationId' },
          ],
        },
        member: {
          name: 'member',
          displayName: 'Member',
          fields: [
            {
              name: 'id',
              type: 'string',
              required: true,
              primaryKey: true,
              description: 'Unique member identifier',
            },
            {
              name: 'organizationId',
              type: 'string',
              required: true,
              description: 'Organization ID',
            },
            { name: 'userId', type: 'string', required: true, description: 'User ID' },
            {
              name: 'role',
              type: 'string',
              required: true,
              defaultValue: 'member',
              description: 'Member role in organization',
            },
            {
              name: 'createdAt',
              type: 'date',
              required: true,
              description: 'Membership creation timestamp',
            },
          ],
          relationships: [
            { type: 'many-to-one', target: 'organization', field: 'organizationId' },
            { type: 'many-to-one', target: 'user', field: 'userId' },
          ],
        },
        invitation: {
          name: 'invitation',
          displayName: 'Invitation',
          fields: [
            {
              name: 'id',
              type: 'string',
              required: true,
              primaryKey: true,
              description: 'Unique invitation identifier',
            },
            {
              name: 'organizationId',
              type: 'string',
              required: true,
              description: 'Organization ID',
            },
            { name: 'email', type: 'string', required: true, description: 'Invited email address' },
            { name: 'role', type: 'string', required: false, description: 'Invited role' },
            {
              name: 'status',
              type: 'string',
              required: true,
              defaultValue: 'pending',
              description: 'Invitation status',
            },
            {
              name: 'expiresAt',
              type: 'date',
              required: true,
              description: 'Invitation expiration timestamp',
            },
            {
              name: 'inviterId',
              type: 'string',
              required: true,
              description: 'User who sent the invitation',
            },
          ],
          relationships: [
            { type: 'many-to-one', target: 'organization', field: 'organizationId' },
            { type: 'many-to-one', target: 'user', field: 'inviterId' },
          ],
        },
      },
      userExtensions: {
        fields: [],
        relationships: [
          { type: 'one-to-many', target: 'member', field: 'userId' },
          { type: 'one-to-many', target: 'invitation', field: 'inviterId' },
        ],
      },
      sessionExtensions: {
        fields: [
          {
            name: 'activeOrganizationId',
            type: 'string',
            required: false,
            description: 'Active organization ID',
          },
        ],
        relationships: [],
      },
    },
    teams: {
      tables: {
        team: {
          name: 'team',
          displayName: 'Team',
          fields: [
            {
              name: 'id',
              type: 'string',
              required: true,
              primaryKey: true,
              description: 'Unique team identifier',
            },
            { name: 'name', type: 'string', required: true, description: 'Team name' },
            {
              name: 'organizationId',
              type: 'string',
              required: true,
              description: 'Organization ID',
            },
            {
              name: 'createdAt',
              type: 'date',
              required: true,
              description: 'Team creation timestamp',
            },
            {
              name: 'updatedAt',
              type: 'date',
              required: false,
              description: 'Last update timestamp',
            },
          ],
          relationships: [
            { type: 'many-to-one', target: 'organization', field: 'organizationId' },
            { type: 'one-to-many', target: 'teamMember', field: 'teamId' },
          ],
        },
        teamMember: {
          name: 'teamMember',
          displayName: 'Team Member',
          fields: [
            {
              name: 'id',
              type: 'string',
              required: true,
              primaryKey: true,
              description: 'Unique team member identifier',
            },
            { name: 'teamId', type: 'string', required: true, description: 'Team ID' },
            { name: 'userId', type: 'string', required: true, description: 'User ID' },
            {
              name: 'createdAt',
              type: 'date',
              required: false,
              description: 'Team membership creation timestamp',
            },
          ],
          relationships: [
            { type: 'many-to-one', target: 'team', field: 'teamId' },
            { type: 'many-to-one', target: 'user', field: 'userId' },
          ],
        },
      },
      organizationExtensions: {
        relationships: [{ type: 'one-to-many', target: 'team', field: 'organizationId' }],
      },
      sessionExtensions: {
        fields: [
          { name: 'activeTeamId', type: 'string', required: false, description: 'Active team ID' },
        ],
        relationships: [],
      },
    },
    twoFactor: {
      tables: {
        twoFactor: {
          name: 'twoFactor',
          displayName: 'Two Factor',
          fields: [
            {
              name: 'id',
              type: 'string',
              required: true,
              primaryKey: true,
              description: 'Unique two-factor authentication identifier',
            },
            { name: 'userId', type: 'string', required: true, description: 'Associated user ID' },
            {
              name: 'secret',
              type: 'string',
              required: true,
              description: 'Two-factor authentication secret',
            },
            {
              name: 'backupCodes',
              type: 'string',
              required: true,
              description: 'Backup codes for two-factor authentication',
            },
          ],
          relationships: [{ type: 'many-to-one', target: 'user', field: 'userId' }],
        },
      },
      userExtensions: {
        fields: [
          {
            name: 'twoFactorEnabled',
            type: 'boolean',
            required: false,
            description: 'Two-factor authentication enabled status',
          },
        ],
        relationships: [{ type: 'one-to-one', target: 'twoFactor', field: 'userId' }],
      },
    },
    apiKey: {
      tables: {
        apiKey: {
          name: 'apiKey',
          displayName: 'API Key',
          fields: [
            {
              name: 'id',
              type: 'string',
              required: true,
              primaryKey: true,
              description: 'Unique API key identifier',
            },
            { name: 'userId', type: 'string', required: true, description: 'Associated user ID' },
            { name: 'name', type: 'string', required: true, description: 'API key name' },
            {
              name: 'key',
              type: 'string',
              required: true,
              unique: true,
              description: 'API key value',
            },
            {
              name: 'expiresAt',
              type: 'date',
              required: false,
              description: 'API key expiration timestamp',
            },
            {
              name: 'lastUsedAt',
              type: 'date',
              required: false,
              description: 'Last usage timestamp',
            },
            {
              name: 'createdAt',
              type: 'date',
              required: true,
              description: 'API key creation timestamp',
            },
          ],
          relationships: [{ type: 'many-to-one', target: 'user', field: 'userId' }],
        },
      },
      userExtensions: {
        relationships: [{ type: 'one-to-many', target: 'apiKey', field: 'userId' }],
      },
    },
    passkey: {
      tables: {
        passkey: {
          name: 'passkey',
          displayName: 'Passkey',
          fields: [
            {
              name: 'id',
              type: 'string',
              required: true,
              primaryKey: true,
              description: 'Unique passkey identifier',
            },
            { name: 'userId', type: 'string', required: true, description: 'Associated user ID' },
            { name: 'name', type: 'string', required: true, description: 'Passkey name' },
            {
              name: 'credentialId',
              type: 'string',
              required: true,
              unique: true,
              description: 'WebAuthn credential ID',
            },
            { name: 'publicKey', type: 'string', required: true, description: 'Public key' },
            { name: 'counter', type: 'number', required: true, description: 'Usage counter' },
            {
              name: 'createdAt',
              type: 'date',
              required: true,
              description: 'Passkey creation timestamp',
            },
            {
              name: 'lastUsedAt',
              type: 'date',
              required: false,
              description: 'Last usage timestamp',
            },
          ],
          relationships: [{ type: 'many-to-one', target: 'user', field: 'userId' }],
        },
      },
      userExtensions: {
        relationships: [{ type: 'one-to-many', target: 'passkey', field: 'userId' }],
      },
    },
  };

  function generateStaticSchema(selectedPlugins: string[]) {
    const schema: { tables: any[] } = { tables: [] };

    const baseTables = Object.values(BASE_SCHEMA).map((table) => ({
      ...table,
      fields: [...table.fields],
      relationships: [...table.relationships],
    }));
    schema.tables.push(...baseTables);

    selectedPlugins.forEach((pluginName) => {
      const plugin = PLUGIN_SCHEMAS[pluginName as keyof typeof PLUGIN_SCHEMAS];
      if (!plugin) return;

      if (plugin.tables) {
        Object.values(plugin.tables).forEach((table: any) => {
          schema.tables.push({
            ...table,
            fields: [...table.fields],
            relationships: [...table.relationships],
          });
        });
      }

      if ('userExtensions' in plugin && plugin.userExtensions) {
        const userTable = schema.tables.find((t: any) => t.name === 'user');
        if (userTable && 'fields' in plugin.userExtensions) {
          (plugin.userExtensions.fields || []).forEach((field: any) => {
            if (!userTable.fields.some((f: any) => f.name === field.name)) {
              userTable.fields.push(field);
            }
          });
          (plugin.userExtensions.relationships || []).forEach((rel: any) => {
            if (
              !userTable.relationships.some(
                (r: any) => r.target === rel.target && r.field === rel.field && r.type === rel.type
              )
            ) {
              userTable.relationships.push(rel);
            }
          });
        }
      }

      if ('sessionExtensions' in plugin && plugin.sessionExtensions) {
        const sessionTable = schema.tables.find((t: any) => t.name === 'session');
        if (sessionTable && 'fields' in plugin.sessionExtensions) {
          (plugin.sessionExtensions.fields || []).forEach((field: any) => {
            if (!sessionTable.fields.some((f: any) => f.name === field.name)) {
              sessionTable.fields.push(field);
            }
          });
          (plugin.sessionExtensions.relationships || []).forEach((rel: any) => {
            if (
              !sessionTable.relationships.some(
                (r: any) => r.target === rel.target && r.field === rel.field && r.type === rel.type
              )
            ) {
              sessionTable.relationships.push(rel);
            }
          });
        }
      }

      if ('organizationExtensions' in plugin && plugin.organizationExtensions) {
        const orgTable = schema.tables.find((t: any) => t.name === 'organization');
        if (orgTable) {
          (plugin.organizationExtensions.relationships || []).forEach((rel: any) => {
            if (
              !orgTable.relationships.some(
                (r: any) => r.target === rel.target && r.field === rel.field && r.type === rel.type
              )
            ) {
              orgTable.relationships.push(rel);
            }
          });
        }
      }
    });

    return schema;
  }

  const CONTEXT_CORE_TABLES = new Set(['user', 'session', 'account', 'verification']);

  async function resolveSchemaConfigPath(): Promise<string | null> {
    if (configPath) {
      return configPath.startsWith('/') ? configPath : join(process.cwd(), configPath);
    }
    return await findAuthConfigPath();
  }

  async function loadContextTables() {
    try {
      const authConfigPath = await resolveSchemaConfigPath();
      if (!authConfigPath) {
        return null;
      }
      const authModule = await safeImportAuthConfig(authConfigPath);
      const authInstance = authModule?.auth || authModule?.default;
      if (!authInstance?.$context) {
        return null;
      }
      const context = await authInstance.$context;
      return context?.tables || null;
    } catch (_error) {
      return null;
    }
  }

  function formatDisplayName(name: string) {
    if (!name) return 'Unknown';
    return name
      .replace(/[_-]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (char) => char.toUpperCase());
  }

  function formatDefaultValue(value: any) {
    if (value === undefined || value === null) {
      return value;
    }
    if (typeof value === 'function') {
      return 'function';
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (_error) {
        return String(value);
      }
    }
    return value;
  }

  function addRelationshipIfMissing(list: any[], relationship: any) {
    if (
      !list.some(
        (rel: any) =>
          rel.type === relationship.type &&
          rel.target === relationship.target &&
          rel.field === relationship.field
      )
    ) {
      list.push(relationship);
    }
  }

  function inferTargetTable(fieldName: string, tableMap: Map<string, any>) {
    if (!fieldName) return null;
    const normalized = fieldName.toLowerCase();
    if (!normalized.endsWith('id')) {
      return null;
    }
    const candidate = normalized.slice(0, -2);
    const table = tableMap.get(candidate);
    return table ? table.name : null;
  }

  function buildSchemaFromContextTables(tables: Record<string, any> | null) {
    if (!tables) {
      return null;
    }

    const tableEntries: any[] = [];
    const tableLookupByLower = new Map<string, any>();

    Object.entries(tables).forEach(([key, raw]) => {
      const tableMeta = raw as any;
      const name = tableMeta?.modelName || key;
      const lowerName = name.toLowerCase();

      const fields = Object.entries(tableMeta?.fields || {}).map(([fieldName, fieldValue]) => {
        const meta = fieldValue as any;
        return {
          name: fieldName,
          type: meta?.type || 'unknown',
          required: Boolean(meta?.required),
          primaryKey: Boolean(meta?.primaryKey),
          unique: Boolean(meta?.unique),
          description: meta?.description || '',
          sortable: Boolean(meta?.sortable),
          defaultValue: formatDefaultValue(meta?.defaultValue),
        };
      });

      const table = {
        name,
        displayName: formatDisplayName(name),
        origin:
          tableMeta?.plugin?.id ||
          tableMeta?.pluginId ||
          (CONTEXT_CORE_TABLES.has(name) ? 'core' : 'extended'),
        order: tableMeta?.order ?? Number.MAX_SAFE_INTEGER,
        fields,
        relationships: [] as any[],
      };

      tableEntries.push(table);
      tableLookupByLower.set(lowerName, table);
    });

    tableEntries.forEach((table) => {
      table.fields.forEach((field: any) => {
        const target = inferTargetTable(field.name, tableLookupByLower);
        if (target && target !== table.name) {
          addRelationshipIfMissing(table.relationships, {
            type: 'many-to-one',
            target,
            field: field.name,
          });

          const targetTable = tableLookupByLower.get(target.toLowerCase());
          if (targetTable) {
            addRelationshipIfMissing(targetTable.relationships, {
              type: 'one-to-many',
              target: table.name,
              field: field.name,
            });
          }
        }
      });
    });

    tableEntries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return { tables: tableEntries };
  }

  async function generateSchemaFromContext(selectedTables?: string[]) {
    try {
      const tables = await loadContextTables();
      if (!tables) {
        return null;
      }
      const schema = buildSchemaFromContextTables(tables);
      if (!schema) {
        return null;
      }
      if (selectedTables && selectedTables.length > 0) {
        schema.tables = schema.tables.filter((table) => selectedTables.includes(table.name));
      }
      return schema;
    } catch (_error) {
      return null;
    }
  }

  router.get('/api/database/schema', async (req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapterWithConfig();
      const { plugins } = req.query;

      let selectedPlugins: any[] = [];
      if (plugins && typeof plugins === 'string') {
        selectedPlugins = plugins.split(',').filter(Boolean);
      }

      if (!adapter) {
        return res.json({
          schema: null,
          error: 'Auth adapter not available',
        });
      }

      const schema =
        (await generateSchemaFromContext(selectedPlugins)) || generateStaticSchema(selectedPlugins);

      res.json({
        success: true,
        schema: schema,
        availablePlugins: Object.keys(PLUGIN_SCHEMAS),
        selectedPlugins: selectedPlugins,
      });
    } catch (_error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch database schema',
      });
    }
  });

  router.get('/api/plugins/teams/status', async (_req: Request, res: Response) => {
    try {
      const authConfigPath = configPath || (await findAuthConfigPath());
      if (!authConfigPath) {
        return res.json({
          enabled: false,
          error: 'No auth config found',
          configPath: null,
        });
      }

      try {
        const { getConfig } = await import('./config.js');
        const betterAuthConfig = await getConfig({
          cwd: process.cwd(),
          configPath: authConfigPath,
          shouldThrowOnError: false,
          noCache: true, // Disable cache for real-time plugin status checks
        });
        if (betterAuthConfig) {
          const plugins = betterAuthConfig.plugins || [];
          const organizationPlugin = plugins.find((plugin: any) => plugin.id === 'organization');

          if (organizationPlugin) {
            const teamsEnabled = organizationPlugin.options?.teams?.enabled === true;
            return res.json({
              enabled: teamsEnabled,
              configPath: authConfigPath,
              organizationPlugin: organizationPlugin || null,
            });
          } else {
            return res.json({
              enabled: false,
              configPath: authConfigPath,
              organizationPlugin: null,
              error: 'Organization plugin not found',
            });
          }
        }
        res.json({
          enabled: false,
          error: 'Failed to load auth config - getConfig failed and regex extraction unavailable',
          configPath: authConfigPath,
        });
      } catch (_error) {
        res.status(500).json({ error: 'Failed to check teams status' });
      }
    } catch (_error) {
      res.status(500).json({ error: 'Failed to check teams status' });
    }
  });

  router.get('/api/organizations/:orgId/invitations', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (adapter && typeof adapter.findMany === 'function') {
        try {
          const invitations = await adapter.findMany({
            model: 'invitation',
            where: [
              { field: 'organizationId', value: orgId },
              { field: 'status', value: 'pending' },
            ],
          });
          const transformedInvitations = (invitations || []).map((invitation: any) => ({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role || 'member',
            status: invitation.status || 'pending',
            organizationId: invitation.organizationId,
            teamId: invitation.teamId,
            inviterId: invitation.inviterId,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
          }));
          res.json({ success: true, invitations: transformedInvitations });
          return;
        } catch (_error) {}
      }

      res.json({ success: true, invitations: [] });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch invitations' });
    }
  });

  router.get('/api/organizations/:orgId/members', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const adapter = await getAuthAdapterWithConfig();

      if (adapter && typeof adapter.findMany === 'function') {
        try {
          const members = await adapter.findMany({
            model: 'member',
            where: [{ field: 'organizationId', value: orgId }],
            limit: 10000,
          });
          const membersWithUsers = await Promise.all(
            (members || []).map(async (member: any) => {
              try {
                if (adapter.findMany) {
                  const users = await adapter.findMany({
                    model: 'user',
                    where: [{ field: 'id', value: member.userId }],
                    limit: 1,
                  });
                  const user = users?.[0];
                  return {
                    id: member.id,
                    userId: member.userId,
                    organizationId: member.organizationId,
                    role: member.role || 'member',
                    joinedAt: member.joinedAt || member.createdAt,
                    user: user
                      ? {
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          image: user.image,
                          emailVerified: user.emailVerified,
                        }
                      : null,
                  };
                }
                return null;
              } catch (_error) {
                return null;
              }
            })
          );

          const validMembers = membersWithUsers.filter((member) => member?.user);

          res.json({ success: true, members: validMembers });
          return;
        } catch (_error) {}
      }

      res.json({ success: true, members: [] });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  });

  router.post('/api/organizations/:orgId/seed-members', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const { count = 5 } = req.body;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      if (!adapter.findMany || !adapter.create) {
        return res.status(500).json({ error: 'Adapter findMany method not available' });
      }

      const generateRandomString = (length: number) => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const results = [];

      for (let i = 0; i < count; i++) {
        try {
          const randomString = generateRandomString(8);
          const email = `user${randomString}@example.com`;
          const name = `User ${randomString}`;

          const userData = {
            name,
            email,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const user = await adapter.create({
            model: 'user',
            data: userData,
          });

          const memberData = {
            organizationId: orgId,
            userId: user.id,
            role: 'member',
            createdAt: new Date(),
          };

          await adapter.create({
            model: 'member',
            data: memberData,
          });

          results.push({
            success: true,
            member: {
              userId: user.id,
              user: {
                name,
                email,
              },
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        message: `Added ${results.filter((r) => r.success).length} members`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to seed members' });
    }
  });

  router.post('/api/organizations/:orgId/seed-teams', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const { count = 3 } = req.body;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      if (!adapter.create) {
        return res.status(500).json({ error: 'Adapter create method not available' });
      }

      const generateRandomString = (length: number) => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const teamNames = [
        'Engineering',
        'Design',
        'Marketing',
        'Sales',
        'Support',
        'Product',
        'Operations',
        'Finance',
        'HR',
        'Legal',
      ];

      const results = [];

      for (let i = 0; i < count; i++) {
        try {
          const randomString = generateRandomString(6);
          const teamName = `${teamNames[i % teamNames.length]} ${randomString}`;

          const teamData = {
            name: teamName,
            organizationId: orgId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const team = await adapter.create({
            model: 'team',
            data: teamData,
          });

          results.push({
            success: true,
            team: {
              id: team.id,
              name: teamName,
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        message: `Created ${results.filter((r) => r.success).length} teams`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to seed teams' });
    }
  });

  router.delete('/api/members/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      if (!adapter.delete) {
        return res.status(500).json({ error: 'Adapter delete method not available' });
      }

      await adapter.delete({
        model: 'member',
        where: [{ field: 'id', value: id }],
      });

      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to remove member' });
    }
  });

  router.post('/api/invitations/:id/resend', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      if (!adapter.update) {
        return res.status(500).json({ error: 'Adapter update method not available' });
      }

      await adapter.update({
        model: 'invitation',
        where: [{ field: 'id', value: id }],
        update: {
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          updatedAt: new Date().toISOString(),
        },
      });

      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to resend invitation' });
    }
  });

  router.delete('/api/invitations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      if (!adapter.update) {
        return res.status(500).json({ error: 'Adapter update method not available' });
      }

      await adapter.update({
        model: 'invitation',
        where: [{ field: 'id', value: id }],
        update: {
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        },
      });

      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to cancel invitation' });
    }
  });

  router.post('/api/organizations/:orgId/invitations', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const { email, role = 'member', inviterId } = req.body;

      if (!inviterId) {
        return res.status(400).json({ error: 'Inviter ID is required' });
      }

      const adapter = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const invitationData = {
        email,
        role,
        organizationId: orgId,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date(),
        inviterId: inviterId,
      };

      const invitation = {
        id: `inv_${Date.now()}`,
        ...invitationData,
      };

      if (!adapter.create) {
        return res.status(500).json({ error: 'Adapter create method not available' });
      }

      await adapter.create({
        model: 'invitation',
        data: {
          organizationId: invitationData.organizationId,
          email: invitationData.email,
          role: invitationData.role,
          status: invitationData.status,
          inviterId: invitationData.inviterId,
          expiresAt: invitationData.expiresAt,
          createdAt: invitationData.createdAt,
        },
      });

      res.json({ success: true, invitation });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  });

  router.get('/api/organizations/:orgId/teams', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const adapter = await getAuthAdapterWithConfig();

      if (adapter && typeof adapter.findMany === 'function') {
        try {
          const teams = await adapter.findMany({
            model: 'team',
            where: [{ field: 'organizationId', value: orgId }],
            limit: 10000,
          });

          const transformedTeams = await Promise.all(
            (teams || []).map(async (team: any) => {
              if (!adapter.findMany) {
                return null;
              }
              const teamMembers = await adapter.findMany({
                model: 'teamMember',
                where: [{ field: 'teamId', value: team.id }],
                limit: 10000,
              });

              return {
                id: team.id,
                name: team.name,
                organizationId: team.organizationId,
                metadata: team.metadata,
                createdAt: team.createdAt,
                updatedAt: team.updatedAt,
                memberCount: teamMembers ? teamMembers.length : 0,
              };
            })
          );

          res.json({ success: true, teams: transformedTeams });
          return;
        } catch (_error) {}
      }

      res.json({ success: true, teams: [] });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  });

  router.post('/api/organizations/:orgId/teams', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const { name } = req.body;

      const adapter = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const teamData = {
        name,
        organizationId: orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
        memberCount: 0,
      };

      const team = {
        id: `team_${Date.now()}`,
        ...teamData,
      };
      if (!adapter.create) {
        return res.status(500).json({ error: 'Adapter create method not available' });
      }
      await adapter.create({
        model: 'team',
        data: {
          name: teamData.name,
          organizationId: teamData.organizationId,
          createdAt: teamData.createdAt,
          updatedAt: teamData.updatedAt,
        },
      });
      res.json({ success: true, team });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to create team' });
    }
  });

  router.get('/api/teams/:teamId/members', async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const adapter = await getAuthAdapterWithConfig();

      if (adapter && typeof adapter.findMany === 'function') {
        try {
          const teamMembers = await adapter.findMany({
            model: 'teamMember',
            where: [{ field: 'teamId', value: teamId }],
            limit: 10000,
          });

          const membersWithUsers = await Promise.all(
            (teamMembers || []).map(async (member: any) => {
              try {
                if (adapter.findMany) {
                  const users = await adapter.findMany({
                    model: 'user',
                    where: [{ field: 'id', value: member.userId }],
                    limit: 1,
                  });
                  const user = users?.[0];

                  return {
                    id: member.id,
                    userId: member.userId,
                    teamId: member.teamId,
                    role: member.role || 'member',
                    joinedAt: member.joinedAt || member.createdAt,
                    user: user
                      ? {
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          image: user.image,
                          emailVerified: user.emailVerified,
                        }
                      : null,
                  };
                }
                return null;
              } catch (_error) {
                return null;
              }
            })
          );

          const validMembers = membersWithUsers.filter((member) => member?.user);

          res.json({ success: true, members: validMembers });
          return;
        } catch (_error) {}
      }

      res.json({ success: true, members: [] });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch team members' });
    }
  });

  router.post('/api/teams/:teamId/members', async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const { userIds } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ error: 'userIds array is required' });
      }

      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.create) {
        return res.status(500).json({ error: 'Adapter not available' });
      }

      const results = [];
      for (const userId of userIds) {
        try {
          await adapter.create({
            model: 'teamMember',
            data: {
              teamId,
              userId,
              role: 'member',
              createdAt: new Date(),
            },
          });

          results.push({ success: true, userId });
        } catch (error) {
          results.push({
            success: false,
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        message: `Added ${results.filter((r) => r.success).length} members`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to add team members' });
    }
  });

  router.delete('/api/team-members/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter || !adapter.delete) {
        return res.status(500).json({ error: 'Adapter not available' });
      }

      await adapter.delete({
        model: 'teamMember',
        where: [{ field: 'id', value: id }],
      });

      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to remove team member' });
    }
  });

  router.put('/api/teams/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      const updatedTeam = {
        id,
        name,
      };
      if (!adapter.update) {
        return res.status(500).json({ error: 'Adapter update method not available' });
      }
      await adapter.update({
        model: 'team',
        where: [{ field: 'id', value: id }],
        update: {
          name: updatedTeam.name,
        },
      });
      res.json({ success: true, team: updatedTeam });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to update team' });
    }
  });

  router.delete('/api/teams/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      if (!adapter.delete) {
        return res.status(500).json({ error: 'Adapter delete method not available' });
      }
      await adapter.delete({
        model: 'team',
        where: [{ field: 'id', value: id }],
      });
      res.json({ success: true });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to delete team' });
    }
  });

  router.get('/api/plugins/organization/status', async (_req: Request, res: Response) => {
    try {
      const authConfigPath = configPath || (await findAuthConfigPath());
      if (!authConfigPath) {
        return res.json({
          enabled: false,
          error: 'No auth config found',
          configPath: null,
        });
      }

      try {
        const { getConfig } = await import('./config.js');
        const betterAuthConfig = await getConfig({
          cwd: process.cwd(),
          configPath: authConfigPath,
          shouldThrowOnError: false,
          noCache: true,
        });

        if (betterAuthConfig) {
          const plugins = betterAuthConfig?.plugins || [];
          const hasOrganizationPlugin = plugins.find((plugin: any) => plugin.id === 'organization');

          return res.json({
            enabled: !!hasOrganizationPlugin,
            configPath: authConfigPath,
            availablePlugins: plugins.map((p: any) => p.id) || [],
            organizationPlugin: hasOrganizationPlugin || null,
          });
        }
        res.json({
          enabled: false,
          error: 'Failed to load auth config - getConfig failed and regex extraction unavailable',
          configPath: authConfigPath,
        });
      } catch (_error) {
        res.status(500).json({ error: 'Failed to check plugin status' });
      }
    } catch (_error) {
      res.status(500).json({ error: 'Failed to check plugin status' });
    }
  });

  router.get('/api/organizations', async (req: Request, res: Response) => {
    try {
      const _page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const _search = req.query.search as string;

      try {
        const adapter = await getAuthAdapterWithConfig();
        if (adapter && typeof adapter.findMany === 'function') {
          const allOrganizations = await adapter.findMany({
            model: 'organization',
            limit: limit,
          });

          res.json({ organizations: allOrganizations });
        }
      } catch (_error) {
        res.status(500).json({ error: 'Failed to fetch organizations' });
      }
    } catch (_error) {
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  });

  router.post('/api/organizations', async (req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const orgData = req.body;

      if (!orgData.slug && orgData.name) {
        orgData.slug = orgData.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
      }

      const organization = await adapter.createOrganization(orgData);
      res.json({ success: true, organization });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to create organization' });
    }
  });

  router.put('/api/organizations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const orgData = req.body;
      const adapter: any = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      if (orgData.name && !orgData.slug) {
        orgData.slug = orgData.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
      }

      const updatedOrganization = {
        id,
        ...orgData,
        updatedAt: new Date().toISOString(),
      };
      const updatedOrg = await adapter.update({
        model: 'organization',
        where: [{ field: 'id', value: id }],
        update: updatedOrganization,
      });
      res.json({ success: true, organization: updatedOrg });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to update organization' });
    }
  });

  router.delete('/api/organizations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter: any = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      const deletedOrg = await adapter.delete({
        model: 'organization',
        where: [{ field: 'id', value: id }],
      });
      res.json({ success: true, organization: deletedOrg });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to delete organization' });
    }
  });

  router.post('/api/users', async (req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const userData = req.body;
      if (!adapter.createUser) {
        return res.status(500).json({ error: 'createUser method not available on adapter' });
      }
      const user = await adapter.createUser(userData);
      res.json({ success: true, user });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  router.put('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userData = req.body;

      const updatedUser = await getAuthData(authConfig, 'updateUser', { id, userData }, configPath);
      res.json({ success: true, user: updatedUser });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  router.post('/api/seed/users', async (req: Request, res: Response) => {
    try {
      const { count = 1, role } = req.body;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          if (typeof adapter.createUser !== 'function') {
            throw new Error('createUser method not available on adapter');
          }
          let userRole = role;
          if (role === 'mix') {
            userRole = Math.random() < 0.5 ? 'admin' : 'user';
          }
          const user = await createMockUser(adapter, i + 1, userRole);
          if (!user) {
            throw new Error('Failed to create user');
          }
          results.push({
            success: true,
            user: {
              ...user,
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      res.json({
        success: true,
        message: `Seeded ${results.filter((r) => r.success).length} users`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to seed users' });
    }
  });

  router.post('/api/seed/sessions', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      let user;
      try {
        user = await createMockUser(adapter, 1);
      } catch (_error) {
        return res.status(500).json({ error: 'Failed to create user for session' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          if (typeof adapter.createSession !== 'function') {
            throw new Error('createSession method not available on adapter');
          }
          if (!user) {
            throw new Error('Failed to create user');
          }
          const session = await createMockSession(adapter, user.id, i + 1);
          results.push({
            success: true,
            session: {
              id: session.id,
              userId: session.userId,
              expires: session.expires,
              sessionToken: session.sessionToken,
              createdAt: session.createdAt,
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter((r) => r.success).length} sessions`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to seed sessions' });
    }
  });

  router.post('/api/users/:userId/seed-sessions', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { count = 3 } = req.body;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      // @ts-expect-error
      const user = await adapter.findOne({
        model: 'user',
        where: [{ field: 'id', value: userId }],
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          if (typeof adapter.createSession !== 'function') {
            throw new Error('createSession method not available on adapter');
          }

          const session = await createMockSession(adapter, userId, i + 1);
          results.push({
            success: true,
            session: {
              id: session.id,
              userId: session.userId,
              expiresAt: session.expiresAt,
              token: session.token,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter((r) => r.success).length} sessions for user`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to seed sessions for user' });
    }
  });

  router.post('/api/users/:userId/seed-accounts', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { count = 1, providerId } = req.body;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      // @ts-expect-error
      const user = await adapter.findOne({
        model: 'user',
        where: [{ field: 'id', value: userId }],
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          if (typeof adapter.createAccount !== 'function') {
            throw new Error('createAccount method not available on adapter');
          }

          const account = await createMockAccount(adapter, userId, i + 1, providerId);
          if (!account) {
            throw new Error('Failed to create account');
          }

          results.push({
            success: true,
            account: {
              id: account.id,
              userId: account.userId,
              providerId: account.providerId || account.provider,
              provider: account.provider,
              accountId: account.accountId || account.providerAccountId,
              createdAt: account.createdAt,
              updatedAt: account.updatedAt,
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter((r) => r.success).length} accounts for user`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to seed accounts for user' });
    }
  });

  router.post('/api/seed/accounts', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      let user;
      try {
        user = await createMockUser(adapter, 1);
      } catch (_error) {
        return res.status(500).json({ error: 'Failed to create user for account' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          if (typeof adapter.createAccount !== 'function') {
            throw new Error('createAccount method not available on adapter');
          }
          if (!user) {
            throw new Error('Failed to create user');
          }
          const account = await createMockAccount(adapter, user.id, i + 1);
          results.push({
            success: true,
            account: {
              id: account.id,
              userId: account.userId,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              createdAt: account.createdAt,
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter((r) => r.success).length} accounts`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to seed accounts' });
    }
  });

  router.post('/api/seed/verifications', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          if (typeof adapter.createVerification !== 'function') {
            throw new Error('createVerification method not available on adapter');
          }

          const verification = await createMockVerification(
            adapter,
            `user${i + 1}@example.com`,
            i + 1
          );
          results.push({
            success: true,
            verification: {
              id: verification.id,
              identifier: verification.identifier,
              token: verification.token,
              expires: verification.expires,
              createdAt: verification.createdAt,
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter((r) => r.success).length} verifications`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to seed verifications' });
    }
  });

  router.post('/api/seed/organizations', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapterWithConfig();

      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          const randomSuffix = Math.random().toString(36).substring(2, 8);
          const organizationName = `organization-${randomSuffix}`;

          const generateSlug = (name: string): string => {
            return name
              .toLowerCase()
              .replace(/\s+/g, '-') // Replace spaces with hyphens
              .replace(/[^a-z0-9-]/g, '') // Remove special characters except hyphens
              .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
              .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
          };

          const organizationData = {
            name: organizationName,
            slug: generateSlug(organizationName),
            image: `https://api.dicebear.com/7.x/identicon/svg?seed=${randomSuffix}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const organization = await adapter.createOrganization(organizationData);
          results.push({
            success: true,
            organization: {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              image: organization.image,
              createdAt: organization.createdAt,
            },
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter((r) => r.success).length} organizations`,
        results,
      });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to seed organizations' });
    }
  });

  router.get('/api/tools/oauth/providers', async (_req: Request, res: Response) => {
    const _result = await getAuthAdapterWithConfig();
    try {
      const providers = authConfig.socialProviders || [];
      res.json({
        success: true,
        providers: providers.map((provider: any) => ({
          id: provider.id || provider.type,
          name: provider.name || provider.id || provider.type,
          type: provider.type || provider.id,
          enabled: provider.enabled !== false,
        })),
      });
    } catch (_error) {
      res.status(500).json({ success: false, error: 'Failed to fetch OAuth providers' });
    }
  });

  router.post('/api/tools/oauth/test', async (req: Request, res: Response) => {
    try {
      const { provider } = req.body;

      if (!provider) {
        return res.status(400).json({ success: false, error: 'Provider is required' });
      }

      const providers = authConfig.socialProviders || [];
      const selectedProvider = providers.find((p: any) => (p.id || p.type) === provider);

      if (!selectedProvider) {
        return res.status(404).json({ success: false, error: 'Provider not found' });
      }

      const testSessionId = `oauth-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      oauthTestSessions.set(testSessionId, {
        provider,
        startTime: Date.now(),
        status: 'pending',
      });

      const studioBaseUrl = `${req.protocol}://${req.get('host')}`;

      res.json({
        success: true,
        startUrl: `${studioBaseUrl}/api/tools/oauth/start?testSessionId=${encodeURIComponent(testSessionId)}&provider=${encodeURIComponent(provider)}`,
        testSessionId,
        provider: selectedProvider.name || selectedProvider.id || (selectedProvider as any).type,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to initiate OAuth test',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Store OAuth test sessions and results temporarily
  const oauthTestSessions = new Map<string, any>();
  const oauthTestResults = new Map<string, any>();

  router.get('/api/tools/oauth/start', async (req: Request, res: Response) => {
    try {
      const { testSessionId, provider } = req.query;

      if (!testSessionId || !provider) {
        return res
          .status(400)
          .send(
            '<html><body style="background:#000;color:#fff;font-family:monospace;padding:20px;">Missing test session or provider</body></html>'
          );
      }

      const session = oauthTestSessions.get(testSessionId as string);
      if (!session || session.provider !== provider) {
        return res
          .status(404)
          .send(
            '<html><body style="background:#000;color:#fff;font-family:monospace;padding:20px;">OAuth test session not found</body></html>'
          );
      }

      const authBaseUrl = authConfig.baseURL || 'http://localhost:3000';
      const basePath = authConfig.basePath || '/api/auth';

      const payload = {
        provider,
        additionalData: { testSessionId },
      };

      res.setHeader('Content-Type', 'text/html');
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Starting OAuth Test</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
              :root { color-scheme: dark; }
              body {
                background: #0b0b0f;
                color: #fff;
                font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
              }
              .box {
                text-align: center;
                max-width: 520px;
                font-family: "Geist Mono", monospace;
              }
              h1 {
                font-family: "Geist", sans-serif;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                font-weight: 500;
              }
              p {
                font-family: "Geist Mono", monospace;
                font-size: 13px;
                color: #9ca3af;
              }
              .spinner {
                border: 3px solid rgba(255,255,255,0.12);
                border-top: 3px solid #fff;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 24px auto;
              }
              @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
              button {
                background: #111118;
                border: 1px solid #27272a;
                color: #fff;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-family: "Geist", sans-serif;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                font-size: 12px;
              }
              button:hover { background: #1d1d26; }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>Preparing OAuth Test…</h1>
              <p id="status">Contacting Better Auth to generate a secure state.</p>
              <div class="spinner" id="spinner"></div>
              <button id="retry" style="display:none;">Retry</button>
            </div>
            <script>
              const payload = ${JSON.stringify(payload)};
              const endpoint = ${JSON.stringify(`${authBaseUrl}${basePath}/sign-in/social`)};
              const statusEl = document.getElementById('status');
              const retryBtn = document.getElementById('retry');
              const spinner = document.getElementById('spinner');

              const postToParent = (data) => {
                if (window.opener) {
                  try {
                    window.opener.postMessage({
                      type: 'oauth_test_state',
                      ...data,
                    }, window.location.origin);
                  } catch (err) {
                    console.error('postMessage failed', err);
                  }
                }
              };

              async function startOAuth() {
                try {
                  const response = await fetch(endpoint, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                  });

                  if (response.redirected) {
                    postToParent({ status: 'redirect', testSessionId: payload.additionalData?.testSessionId });
                    window.location.href = response.url;
                    return;
                  }

                  let data = null;
                  const contentType = response.headers.get('content-type') || '';
                  if (contentType.includes('application/json')) {
                    data = await response.json().catch(() => null);
                  }

                  const redirectUrl = data?.url || data?.redirect || data?.location;
                  if (redirectUrl) {
                    postToParent({ status: 'redirect', testSessionId: payload.additionalData?.testSessionId });
                    window.location.href = redirectUrl;
                    return;
                  }

                  if (response.status >= 400) {
                    throw new Error(data?.message || 'Better Auth returned an error');
                  }

                  throw new Error('Unable to determine OAuth redirect URL.');
                } catch (error) {
                  console.error('Failed to start OAuth test', error);
                  statusEl.textContent = 'Failed to start OAuth test: ' + (error?.message || error);
                  spinner.style.display = 'none';
                  retryBtn.style.display = 'inline-flex';
                  postToParent({
                    status: 'error',
                    testSessionId: payload.additionalData?.testSessionId,
                    error: error?.message || String(error),
                  });
                }
              }

              retryBtn.addEventListener('click', () => {
                spinner.style.display = 'block';
                retryBtn.style.display = 'none';
                statusEl.textContent = 'Retrying…';
                startOAuth();
              });

              startOAuth();
            </script>
          </body>
        </html>
      `);
    } catch (_error) {
      res
        .status(500)
        .send(
          '<html><body style="background:#000;color:#fff;font-family:monospace;padding:20px;">Failed to start OAuth test</body></html>'
        );
    }
  });

  router.get('/api/tools/oauth/callback', async (req: Request, res: Response) => {
    try {
      const { testSessionId, error: oauthError } = req.query;

      if (!testSessionId) {
        return res.send(`<html><body style="background:#000;color:#fff;text-align:center;">
          <h1>OAuth Test Failed</h1>
          <p>Missing test session</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body></html>`);
      }

      const testSession = oauthTestSessions.get(testSessionId as string);
      if (!testSession) {
        return res.send(`<html><body style="background:#000;color:#fff;text-align:center;">
          <h1>OAuth Test Failed</h1>
          <p>Test session not found or expired</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body></html>`);
      }

      const result = {
        testSessionId: testSessionId as string,
        provider: testSession.provider,
        success: !oauthError,
        error: oauthError as string | undefined,
        timestamp: new Date().toISOString(),
      };

      oauthTestResults.set(testSessionId as string, result);

      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Test ${oauthError ? 'Failed' : 'Success'}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #000;
              color: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
              margin: 0;
              padding: 24px;
            }
            h1 {
              font-weight: 500;
              letter-spacing: 0.1em;
              text-transform: uppercase;
            }
            p {
              font-family: "Geist Mono", monospace;
              font-size: 13px;
              color: #9ca3af;
            }
            .success { color: #4f4; }
            .error { color: #f44; }
            .box {
              max-width: 520px;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <h1 class="${oauthError ? 'error' : 'success'}">
              ${oauthError ? '❌ OAuth Test Failed' : '✅ OAuth Test Completed'}
            </h1>
            <p>${oauthError ? oauthError : 'Waiting for account creation...'}</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'oauth_test_result',
                result: ${JSON.stringify(result)}
              }, '*');
              setTimeout(() => window.close(), 1500);
            }
          </script>
        </body>
        </html>
      `);
    } catch (_error) {
      res.send(
        '<html><body style="background:#000;color:#fff;text-align:center;"><h1>OAuth Test Error</h1><p>Callback processing failed</p></body></html>'
      );
    }
  });

  router.get('/api/tools/oauth/status', async (req: Request, res: Response) => {
    try {
      const { testSessionId } = req.query;

      if (!testSessionId) {
        return res.json({ hasResult: false });
      }

      const cached = oauthTestResults.get(testSessionId as string);
      if (cached) {
        oauthTestResults.delete(testSessionId as string);
        return res.json({ hasResult: true, result: cached });
      }

      const session = oauthTestSessions.get(testSessionId as string);
      if (!session) {
        return res.json({ hasResult: false });
      }

      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.json({ hasResult: false });
      }
      const startTime = session.startTime as number;
      const provider = session.provider as string;

      const parseDate = (value: any) => {
        if (!value) return 0;
        const date = value instanceof Date ? value : new Date(value);
        return date.getTime();
      };
      const bufferMs = 5_000;
      const threshold = startTime - bufferMs;

      let recentAccount: any = null;
      let recentSession: any = null;

      try {
        const accounts = await adapter.findMany({
          model: 'account',
          where: [{ field: 'providerId', value: provider }],
          limit: 50,
        });

        const accountCandidate = accounts
          .map((account: any) => ({
            account,
            created: parseDate(
              account.createdAt || account.created_at || account.updatedAt || account.updated_at
            ),
          }))
          .filter((entry) => entry.created >= threshold)
          .sort((a, b) => b.created - a.created)[0];

        recentAccount = accountCandidate?.account ?? null;
      } catch (_accountError) {}

      try {
        const sessions = await adapter.findMany({
          model: 'session',
          limit: 50,
        });

        const sessionCandidate = sessions
          .map((sessionItem: any) => ({
            session: sessionItem,
            created: parseDate(
              sessionItem.createdAt ||
                sessionItem.created_at ||
                sessionItem.updatedAt ||
                sessionItem.updated_at
            ),
          }))
          .filter((entry) => entry.created >= threshold)
          .sort((a, b) => b.created - a.created)[0];

        recentSession = sessionCandidate?.session ?? null;
      } catch (_sessionError) {}

      if (recentAccount || recentSession) {
        let userInfo: any = null;
        try {
          const userId = recentAccount?.userId || recentSession?.userId;
          if (userId) {
            const users = await adapter.findMany({
              model: 'user',
              where: [{ field: 'id', value: userId }],
              limit: 1,
            });

            if (users && users.length > 0) {
              const user = users[0];
              userInfo = {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
              };
            }
          }
        } catch (_userError) {}
        const result = {
          testSessionId: testSessionId as string,
          provider,
          success: true,
          userInfo,
          account: recentAccount
            ? {
                id: recentAccount.id,
                userId: recentAccount.userId,
              }
            : null,
          session: recentSession
            ? {
                id: recentSession.id,
                userId: recentSession.userId,
              }
            : null,
          timestamp: new Date().toISOString(),
        };

        oauthTestResults.set(testSessionId as string, result);
        oauthTestSessions.delete(testSessionId as string);

        return res.json({ hasResult: true, result });
      }

      res.json({ hasResult: false });
    } catch (_error) {
      res.status(500).json({ hasResult: false, error: 'Failed to check status' });
    }
  });

  router.post('/api/tools/jwt/decode', async (req: Request, res: Response) => {
    try {
      const { token, secret } = req.body || {};

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'JWT token is required' });
      }

      const segments = token.split('.');
      if (segments.length < 2) {
        return res
          .status(400)
          .json({ success: false, error: 'Token must have at least header and payload' });
      }

      let header: Record<string, any> = {};
      let payload: Record<string, any> = {};

      try {
        header = JSON.parse(base64UrlDecode(segments[0]));
        payload = JSON.parse(base64UrlDecode(segments[1]));
      } catch (_error) {
        return res.status(400).json({ success: false, error: 'Invalid token encoding' });
      }

      const signature = segments[2] || null;
      let verified = false;
      let usedSecret: string | null = null;

      if (signature && header.alg === 'HS256') {
        const secretToUse =
          typeof secret === 'string' && secret.trim().length > 0 ? secret : authConfig.secret;
        if (secretToUse) {
          const signingInput = `${segments[0]}.${segments[1]}`;
          const expected = createHmac('sha256', secretToUse)
            .update(signingInput)
            .digest('base64url');
          verified = expected === signature;
          usedSecret = secretToUse === authConfig.secret ? 'authConfig.secret' : 'custom';
        }
      }

      const now = Date.now();
      const issuedAtSeconds = typeof payload.iat === 'number' ? payload.iat : null;
      const expiresAtSeconds = typeof payload.exp === 'number' ? payload.exp : null;
      const issuedAtFormatted = issuedAtSeconds
        ? new Date(issuedAtSeconds * 1000).toISOString()
        : null;
      const expiresAtFormatted = expiresAtSeconds
        ? new Date(expiresAtSeconds * 1000).toISOString()
        : null;
      const issuedAgo =
        issuedAtSeconds && issuedAtFormatted
          ? `${formatRelativeDuration(now - issuedAtSeconds * 1000)} ago`
          : null;
      const expiresInMs = expiresAtSeconds ? expiresAtSeconds * 1000 - now : null;
      const expiresIn =
        expiresInMs !== null
          ? expiresInMs > 0
            ? `${formatRelativeDuration(expiresInMs)} remaining`
            : `${formatRelativeDuration(expiresInMs)} ago`
          : null;
      const expired = expiresInMs !== null ? expiresInMs <= 0 : false;

      const standardClaims = new Set([
        'iss',
        'sub',
        'aud',
        'exp',
        'nbf',
        'iat',
        'jti',
        'auth_time',
      ]);
      const customClaims = Object.fromEntries(
        Object.entries(payload).filter(([key]) => !standardClaims.has(key))
      );

      res.json({
        success: true,
        header,
        payload,
        signature,
        verified,
        usedSecret,
        issuedAtFormatted,
        issuedAgo,
        expiresAtFormatted,
        expiresIn,
        expired,
        customClaims,
      });
    } catch (_error) {
      res.status(500).json({ success: false, error: 'Failed to decode JWT' });
    }
  });

  router.post('/api/tools/token-generator', async (req: Request, res: Response) => {
    try {
      const {
        type = 'api_key',
        subject,
        audience,
        expiresInMinutes = 15,
        customClaims,
        secretOverride,
      } = req.body || {};

      const safeType = typeof type === 'string' ? type : 'api_key';
      const expiresMinutes = Number.isFinite(Number(expiresInMinutes))
        ? Number(expiresInMinutes)
        : 15;
      const boundedMinutes = Math.min(Math.max(expiresMinutes, 1), 1440);
      const expiresAt = new Date(Date.now() + boundedMinutes * 60 * 1000).toISOString();

      if (safeType === 'api_key') {
        const token = `ba_api_${randomBytes(24).toString('base64url')}`;
        return res.json({
          success: true,
          type: safeType,
          token,
          expiresAt,
          metadata: {
            subject: subject || null,
          },
        });
      }

      if (safeType === 'jwt') {
        const claims =
          customClaims && typeof customClaims === 'object'
            ? (customClaims as Record<string, any>)
            : {};
        const nowSeconds = Math.floor(Date.now() / 1000);
        const payload = {
          iss: authConfig.baseURL || 'better-auth-studio',
          aud: audience || authConfig.baseURL || 'better-auth-studio',
          sub: subject || 'test-user',
          iat: nowSeconds,
          exp: nowSeconds + boundedMinutes * 60,
          jti: `studio_${Date.now()}`,
          ...claims,
        };
        const header = { alg: 'HS256', typ: 'JWT' };
        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedPayload = base64UrlEncode(JSON.stringify(payload));
        const secretToUse =
          typeof secretOverride === 'string' && secretOverride.trim().length > 0
            ? secretOverride
            : authConfig.secret || 'better-auth-secret';
        const signature = createHmac('sha256', secretToUse)
          .update(`${encodedHeader}.${encodedPayload}`)
          .digest('base64url');
        const token = `${encodedHeader}.${encodedPayload}.${signature}`;

        return res.json({
          success: true,
          type: safeType,
          token,
          expiresAt,
          metadata: {
            subject: payload.sub,
            audience: payload.aud,
            algorithm: header.alg,
          },
        });
      }

      res.status(400).json({ success: false, error: 'Unsupported token type' });
    } catch (_error) {
      res.status(500).json({ success: false, error: 'Failed to generate token' });
    }
  });

  router.post('/api/tools/plugin-generator', async (req: Request, res: Response) => {
    try {
      const {
        pluginName,
        description,
        clientFramework = 'react',
        tables = [],
        hooks = [],
        middleware = [],
        endpoints = [],
        rateLimit,
      } = req.body || {};

      if (!pluginName || typeof pluginName !== 'string' || pluginName.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Plugin name is required' });
      }

      const validNameRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
      if (!validNameRegex.test(pluginName.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Plugin name must be a valid JavaScript identifier (letters, numbers, _, $)',
        });
      }

      const sanitizedName = pluginName.trim();
      const camelCaseName = sanitizedName.charAt(0).toLowerCase() + sanitizedName.slice(1);
      const pascalCaseName = sanitizedName.charAt(0).toUpperCase() + sanitizedName.slice(1);

      // Generate schema
      const schemaCode =
        tables.length > 0
          ? tables
              .map((table: any) => {
                const fields =
                  table.fields
                    ?.filter((f: any) => f.name.trim())
                    .map((field: any) => {
                      const attrs: string[] = [`type: "${field.type}"`];
                      attrs.push(`required: ${field.required ? 'true' : 'false'}`);
                      attrs.push(`unique: ${field.unique ? 'true' : 'false'}`);
                      attrs.push('input: false');

                      // Handle defaultValue
                      if (
                        field.defaultValue !== undefined &&
                        field.defaultValue !== null &&
                        field.defaultValue !== ''
                      ) {
                        if (field.type === 'string') {
                          attrs.push(`defaultValue: "${field.defaultValue}"`);
                        } else if (field.type === 'boolean') {
                          attrs.push(
                            `defaultValue: ${field.defaultValue === 'true' || field.defaultValue === true}`
                          );
                        } else if (field.type === 'number') {
                          attrs.push(`defaultValue: ${field.defaultValue}`);
                        } else if (field.type === 'date') {
                          if (field.defaultValue === 'now()') {
                            attrs.push('defaultValue: new Date()');
                          } else {
                            attrs.push(`defaultValue: new Date("${field.defaultValue}")`);
                          }
                        }
                      } else if (field.type === 'boolean') {
                        // Default to false for boolean if no defaultValue specified
                        attrs.push('defaultValue: false');
                      }

                      const attrStr = attrs.join(',\n            ');
                      return `          ${field.name}: {\n            ${attrStr}\n          }`;
                    })
                    .join(',\n') || '';

                const tableName =
                  table.isExtending && table.extendedTableName
                    ? table.extendedTableName.trim()
                    : table.name.trim();

                return `      ${tableName}: {
        fields: {
${fields}
        },
      }`;
              })
              .join(',\n')
          : '';

      const preserveIndentation = (code: string, baseIndent: string): string => {
        if (!code.trim()) return '';

        const lines = code.split('\n');
        const nonEmptyLines = lines.filter((line) => line.trim());

        if (nonEmptyLines.length === 0) return '';

        const minIndent = Math.min(
          ...nonEmptyLines.map((line) => {
            const match = line.match(/^(\s*)/);
            return match ? match[1].length : 0;
          })
        );

        return lines
          .map((line) => {
            if (!line.trim()) return '';
            const currentIndent = line.match(/^(\s*)/)?.[1] || '';
            const relativeIndent = Math.max(0, currentIndent.length - minIndent);
            const content = line.trim();
            return baseIndent + ' '.repeat(relativeIndent) + content;
          })
          .filter(Boolean)
          .join('\n');
      };

      const beforeHooks = hooks
        .filter((h: any) => h.timing === 'before')
        .map((hook: any) => {
          let matcher = '';
          if (hook.action === 'sign-up') {
            matcher = `(ctx) => ctx.path.startsWith("/sign-up")`;
          } else if (hook.action === 'sign-in') {
            matcher = `(ctx) => ctx.path.startsWith("/sign-in")`;
          } else if (hook.action === 'custom' && hook.customPath) {
            matcher = `(ctx) => ctx.path === "${hook.customPath}"`;
            if (hook.customMatcher) {
              matcher = `(ctx) => ctx.path === "${hook.customPath}" && (${hook.customMatcher})`;
            }
          } else {
            matcher = `(ctx) => true`;
          }

          const formattedHookLogic = preserveIndentation(
            hook.hookLogic || '// Hook logic here',
            '            '
          );

          return `        {
          matcher: ${matcher},
          handler: createAuthMiddleware(async (ctx) => {
${formattedHookLogic}
          }),
        }`;
        });

      const afterHooks = hooks
        .filter((h: any) => h.timing === 'after')
        .map((hook: any) => {
          let matcher = '';
          if (hook.action === 'sign-up') {
            matcher = `(ctx) => ctx.path.startsWith("/sign-up")`;
          } else if (hook.action === 'sign-in') {
            matcher = `(ctx) => ctx.path.startsWith("/sign-in")`;
          } else if (hook.action === 'custom' && hook.customPath) {
            matcher = `(ctx) => ctx.path === "${hook.customPath}"`;
            if (hook.customMatcher) {
              matcher = `(ctx) => ctx.path === "${hook.customPath}" && (${hook.customMatcher})`;
            }
          } else {
            matcher = `(ctx) => true`;
          }

          const formattedHookLogic = preserveIndentation(
            hook.hookLogic || '// Hook logic here',
            '            '
          );

          return `        {
          matcher: ${matcher},
          handler: createAuthMiddleware(async (ctx) => {
${formattedHookLogic}
          }),
        }`;
        });

      const middlewareCode = middleware
        .map((mw: any) => {
          const formattedMiddlewareLogic = preserveIndentation(
            mw.middlewareLogic || '// Middleware logic here',
            '          '
          );

          return `      {
        path: "${mw.path}",
        middleware: createAuthMiddleware(async (ctx) => {
${formattedMiddlewareLogic}
        }),
      }`;
        })
        .join(',\n');

      const endpointsCode =
        endpoints.length > 0
          ? endpoints
              .map((endpoint: any) => {
                const endpointName =
                  endpoint.name?.trim() || `endpoint${endpoints.indexOf(endpoint) + 1}`;
                const sanitizedName = endpointName.replace(/[^a-zA-Z0-9]/g, '');
                const endpointPath = endpoint.path?.trim() || `/${camelCaseName}/${sanitizedName}`;
                const handlerLogic =
                  endpoint.handlerLogic ||
                  '// Endpoint handler logic here\nreturn ctx.json({ success: true });';
                const formattedHandlerLogic = preserveIndentation(handlerLogic, '          ');

                return `      ${sanitizedName}: createAuthEndpoint(
        "${endpointPath}",
        {
          method: "${endpoint.method || 'POST'}",
        },
        async (ctx) => {
${formattedHandlerLogic}
        },
      ),`;
              })
              .join('\n')
          : '';

      const rateLimitCode = rateLimit
        ? (() => {
            const rl = rateLimit as any;
            let pathMatcher = '';
            if (rl.pathType === 'exact') {
              pathMatcher = `(path: string) => path === "${rl.path}"`;
            } else if (rl.pathType === 'prefix') {
              pathMatcher = `(path: string) => path.startsWith("${rl.path}")`;
            } else if (rl.pathType === 'regex') {
              pathMatcher = `(path: string) => new RegExp("${rl.path.replace(/"/g, '\\"')}").test(path)`;
            } else {
              pathMatcher = `(path: string) => true`;
            }

            const windowValue = rl.window && rl.window > 0 ? rl.window : 15 * 60 * 1000;
            const maxValue = rl.max && rl.max > 0 ? rl.max : 100;

            return `      window: ${windowValue},
      max: ${maxValue},
      pathMatcher: ${pathMatcher}`;
          })()
        : '';

      const cleanCode = (code: string): string => {
        return code
          .split('\n')
          .map((line) => line.trimEnd())
          .filter((line, index, arr) => {
            if (line === '' && arr[index + 1] === '') return false;
            return true;
          })
          .join('\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      };

      const pluginParts: string[] = [];

      if (schemaCode) {
        pluginParts.push(`    schema: {\n${schemaCode}\n    }`);
      }

      if (beforeHooks.length > 0 || afterHooks.length > 0) {
        const hooksParts: string[] = [];
        if (beforeHooks.length > 0) {
          hooksParts.push(`      before: [\n${beforeHooks.join(',\n')}\n      ]`);
        }
        if (afterHooks.length > 0) {
          hooksParts.push(`      after: [\n${afterHooks.join(',\n')}\n      ]`);
        }
        pluginParts.push(`    hooks: {\n${hooksParts.join(',\n')}\n    }`);
      }

      if (middlewareCode) {
        pluginParts.push(`    middlewares: [\n${middlewareCode}\n    ]`);
      }

      if (endpointsCode) {
        pluginParts.push(`    endpoints: {\n${endpointsCode}\n    }`);
      }

      if (rateLimitCode) {
        pluginParts.push(`    rateLimit: {\n${rateLimitCode}\n    }`);
      }

      const imports: string[] = ['import type { BetterAuthPlugin } from "@better-auth/core"'];
      if (hooks.length > 0 || middleware.length > 0 || endpoints.length > 0) {
        imports.push(
          'import { createAuthEndpoint, createAuthMiddleware } from "@better-auth/core/api"'
        );
      }

      const serverPluginBody =
        pluginParts.length > 0
          ? `    id: "${camelCaseName}",\n${pluginParts.join(',\n')}`
          : `    id: "${camelCaseName}"`;

      const serverPluginCode = cleanCode(`import type { BetterAuthPlugin } from "@better-auth/core";
${imports.join('\n')}

${description ? `/**\n * ${description.replace(/\n/g, '\n * ')}\n */` : ''}
export const ${camelCaseName} = (options?: Record<string, any>) => {
  return {
${serverPluginBody}
  } satisfies BetterAuthPlugin;
};
`);

      const pathMethods =
        endpoints.length > 0
          ? endpoints
              .map((endpoint: any) => {
                const endpointPath = endpoint.path?.trim() || '';
                const method = endpoint.method || 'POST';
                return `      "${endpointPath}": "${method}"`;
              })
              .join(',\n')
          : '';

      const sessionAffectingPaths = endpoints
        .filter((endpoint: any) => {
          const path = endpoint.path?.trim() || '';
          return path.includes('/sign-in') || path.includes('/sign-up');
        })
        .map((endpoint: any) => {
          const endpointPath = endpoint.path?.trim() || '';
          return `      {
        matcher: (path) => path === "${endpointPath}",
        signal: "$sessionSignal",
      }`;
        });

      const atomListenersCode =
        sessionAffectingPaths.length > 0
          ? `\n    atomListeners: [\n${sessionAffectingPaths.join(',\n')}\n    ],`
          : '';

      const clientPluginCode =
        cleanCode(`import type { BetterAuthClientPlugin } from "@better-auth/core";
import type { ${camelCaseName} } from "..";

export const ${camelCaseName}Client = () => {
  return {
    id: "${camelCaseName}",
    $InferServerPlugin: {} as ReturnType<typeof ${camelCaseName}>,${pathMethods ? `\n    pathMethods: {\n${pathMethods}\n    },` : ''}${atomListenersCode}
  } satisfies BetterAuthClientPlugin;
};
`);

      const serverSetupCode = cleanCode(`import { betterAuth } from "@better-auth/core";
import { ${camelCaseName} } from "./plugin/${camelCaseName}";

export const auth = betterAuth({
  // ... your existing config
  plugins: [
    ${camelCaseName}(),
  ],
});
`);

      const frameworkImportMap: Record<string, string> = {
        react: 'better-auth/react',
        svelte: 'better-auth/svelte',
        solid: 'better-auth/solid',
        vue: 'better-auth/vue',
      };
      const frameworkImport = frameworkImportMap[clientFramework] || 'better-auth/react';

      const baseURLMap: Record<string, string> = {
        react: 'process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"',
        svelte: 'import.meta.env.PUBLIC_BETTER_AUTH_URL || "http://localhost:5173"',
        solid: 'import.meta.env.PUBLIC_BETTER_AUTH_URL || "http://localhost:5173"',
        vue: 'import.meta.env.PUBLIC_BETTER_AUTH_URL || "http://localhost:5173"',
      };
      const baseURL =
        baseURLMap[clientFramework] ||
        'process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"';

      const clientSetupCode = cleanCode(`import { createAuthClient } from "${frameworkImport}";
import { ${camelCaseName}Client } from "./plugin/${camelCaseName}/client";

export const authClient = createAuthClient({
  baseURL: ${baseURL},
  plugins: [
    ${camelCaseName}Client(),
  ],
});
`);

      return res.json({
        success: true,
        plugin: {
          name: sanitizedName,
          server: serverPluginCode,
          client: clientPluginCode,
          serverSetup: serverSetupCode,
          clientSetup: clientSetupCode,
          filePaths: {
            server: `plugin/${camelCaseName}/index.ts`,
            client: `plugin/${camelCaseName}/client/index.ts`,
            serverSetup: 'auth.ts',
            clientSetup: 'auth-client.ts',
          },
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate plugin';
      res.status(500).json({ success: false, error: message });
    }
  });

  router.post('/api/tools/export', async (req: Request, res: Response) => {
    try {
      const { tables, format, limit } = req.body;

      if (!tables || !Array.isArray(tables) || tables.length === 0) {
        return res.status(400).json({ success: false, error: 'No tables specified' });
      }

      const exportLimit = Math.min(Math.max(parseInt(limit || '1000', 10), 1), 10000);
      const exportFormat = format === 'csv' ? 'csv' : 'json';

      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.findMany) {
        return res.status(500).json({ success: false, error: 'Auth adapter not available' });
      }

      const exportData: Record<string, any[]> = {};

      for (const tableName of tables) {
        try {
          const data = await adapter.findMany({
            model: tableName,
            limit: exportLimit,
          });
          exportData[tableName] = data || [];
        } catch (error) {
          exportData[tableName] = [];
        }
      }

      let output: string;
      let filename: string;
      let contentType: string;

      if (exportFormat === 'csv') {
        const csvRows: string[] = [];

        for (const [tableName, rows] of Object.entries(exportData)) {
          if (rows.length === 0) continue;

          csvRows.push(`\n=== ${tableName.toUpperCase()} ===\n`);

          const allKeys = new Set<string>();
          rows.forEach((row: any) => {
            Object.keys(row).forEach((key) => allKeys.add(key));
          });
          const headers = Array.from(allKeys);

          csvRows.push(headers.map((h) => `"${h}"`).join(','));

          rows.forEach((row: any) => {
            const values = headers.map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return '';
              if (typeof value === 'object')
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(values.join(','));
          });
        }

        output = csvRows.join('\n');
        filename = `better-auth-export-${new Date().toISOString().split('T')[0]}.csv`;
        contentType = 'text/csv';
      } else {
        output = JSON.stringify(exportData, null, 2);
        filename = `better-auth-export-${new Date().toISOString().split('T')[0]}.json`;
        contentType = 'application/json';
      }

      res.json({
        success: true,
        data: output,
        filename,
        contentType,
        tables: tables,
        rowCounts: Object.fromEntries(
          Object.entries(exportData).map(([table, rows]) => [table, rows.length])
        ),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data',
      });
    }
  });

  router.post('/api/tools/password-strength', async (req: Request, res: Response) => {
    try {
      const { password } = req.body || {};

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ success: false, error: 'Password is required' });
      }

      const emailAndPassword =
        (authConfig.emailAndPassword as {
          minPasswordLength?: number;
          maxPasswordLength?: number;
        }) || {};
      const minLength = emailAndPassword?.minPasswordLength || 8;
      const maxLength = emailAndPassword?.maxPasswordLength || 128;

      const checks: Array<{ name: string; passed: boolean; message: string }> = [];
      let score = 0;

      // Length check
      const lengthCheck = password.length >= minLength && password.length <= maxLength;
      checks.push({
        name: 'Length',
        passed: lengthCheck,
        message: lengthCheck
          ? `Meets length requirement (${minLength}-${maxLength} chars)`
          : `Must be between ${minLength} and ${maxLength} characters`,
      });
      if (lengthCheck) score += 1;

      const minLengthCheck = password.length >= minLength;
      checks.push({
        name: 'Minimum Length',
        passed: minLengthCheck,
        message: minLengthCheck
          ? `At least ${minLength} characters`
          : `Must be at least ${minLength} characters`,
      });
      if (minLengthCheck && password.length >= 12) score += 0.5;

      const maxLengthCheck = password.length <= maxLength;
      checks.push({
        name: 'Maximum Length',
        passed: maxLengthCheck,
        message: maxLengthCheck
          ? `Within ${maxLength} character limit`
          : `Must not exceed ${maxLength} characters`,
      });

      // Uppercase check
      const hasUppercase = /[A-Z]/.test(password);
      checks.push({
        name: 'Uppercase Letter',
        passed: hasUppercase,
        message: hasUppercase ? 'Contains uppercase letter' : 'Missing uppercase letter',
      });
      if (hasUppercase) score += 0.5;

      // Lowercase check
      const hasLowercase = /[a-z]/.test(password);
      checks.push({
        name: 'Lowercase Letter',
        passed: hasLowercase,
        message: hasLowercase ? 'Contains lowercase letter' : 'Missing lowercase letter',
      });
      if (hasLowercase) score += 0.5;

      // Number check
      const hasNumber = /\d/.test(password);
      checks.push({
        name: 'Number',
        passed: hasNumber,
        message: hasNumber ? 'Contains number' : 'Missing number',
      });
      if (hasNumber) score += 0.5;

      // Special character check
      const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
      checks.push({
        name: 'Special Character',
        passed: hasSpecialChar,
        message: hasSpecialChar ? 'Contains special character' : 'Missing special character',
      });
      if (hasSpecialChar) score += 0.5;

      // Common patterns check
      const commonPatterns = [/12345/, /password/i, /qwerty/i, /abc123/i, /admin/i, /letmein/i];
      const hasCommonPattern = commonPatterns.some((pattern) => pattern.test(password));
      checks.push({
        name: 'Common Pattern',
        passed: !hasCommonPattern,
        message: hasCommonPattern
          ? 'Contains common pattern (weak)'
          : 'No common patterns detected',
      });
      if (!hasCommonPattern) score += 0.5;

      // Entropy check (basic)
      const uniqueChars = new Set(password).size;
      const entropyCheck = uniqueChars >= password.length * 0.5;
      checks.push({
        name: 'Character Variety',
        passed: entropyCheck,
        message: entropyCheck ? 'Good character variety' : 'Low character variety (repetitive)',
      });
      if (entropyCheck) score += 0.5;

      // Determine strength
      const finalScore = Math.min(Math.round(score), 5);
      let strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
      if (finalScore <= 1) strength = 'weak';
      else if (finalScore === 2) strength = 'fair';
      else if (finalScore === 3) strength = 'good';
      else if (finalScore === 4) strength = 'strong';
      else strength = 'very-strong';

      const meetsConfig = lengthCheck && minLengthCheck && maxLengthCheck;

      res.json({
        success: true,
        score: finalScore,
        strength,
        checks,
        meetsConfig,
        configRequirements: {
          minLength,
          maxLength,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check password strength',
      });
    }
  });

  router.post('/api/tools/test-oauth-credentials', async (req: Request, res: Response) => {
    try {
      const { provider, clientId, clientSecret, redirectURI } = req.body || {};

      if (!provider || !clientId || !clientSecret) {
        return res.status(400).json({
          success: false,
          message: 'Provider, Client ID, and Client Secret are required',
        });
      }

      if (provider.toLowerCase() === 'google') {
        try {
          const tokenInfoUrl = `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=test`;

          const isValidClientIdFormat = /^[\d\w-]+\.apps\.googleusercontent\.com$|^\d+$/.test(
            clientId
          );

          if (!isValidClientIdFormat) {
            return res.json({
              success: false,
              message: 'Invalid Google Client ID format',
              details: {
                provider: 'google',
                clientIdFormat: 'Should end with .apps.googleusercontent.com or be numeric',
              },
            });
          }

          const discoveryUrl = 'https://accounts.google.com/.well-known/openid-configuration';
          const discoveryResponse = await fetch(discoveryUrl);

          if (!discoveryResponse.ok) {
            return res.json({
              success: false,
              message: 'Unable to reach Google OAuth service',
              details: {
                provider: 'google',
                error: 'Network error',
              },
            });
          }

          if (redirectURI) {
            try {
              new URL(redirectURI);
            } catch {
              return res.json({
                success: false,
                message: 'Invalid Redirect URI format',
                details: {
                  provider: 'google',
                  redirectURI: redirectURI,
                },
              });
            }
          }

          return res.json({
            success: true,
            message: 'Google OAuth credentials format is valid',
            details: {
              provider: 'google',
              clientId: clientId.substring(0, 20) + '...',
              redirectURI: redirectURI || 'Not configured',
              note: 'Credentials format validated. Test with actual OAuth flow to confirm.',
            },
          });
        } catch (error) {
          return res.json({
            success: false,
            message: 'Failed to validate Google OAuth credentials',
            details: {
              provider: 'google',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }

      if (!clientId.trim() || !clientSecret.trim()) {
        return res.json({
          success: false,
          message: 'Client ID and Secret cannot be empty',
        });
      }

      if (redirectURI) {
        try {
          new URL(redirectURI);
        } catch {
          return res.json({
            success: false,
            message: 'Invalid Redirect URI format',
            details: {
              provider: provider,
              redirectURI: redirectURI,
            },
          });
        }
      }

      return res.json({
        success: true,
        message: `${provider} OAuth credentials format is valid`,
        details: {
          provider: provider,
          clientId: clientId.substring(0, 20) + '...',
          redirectURI: redirectURI || 'Not configured',
          note: 'Credentials format validated. Test with actual OAuth flow to confirm.',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to test OAuth credentials',
      });
    }
  });

  router.post('/api/tools/generate-secret', async (_req: Request, res: Response) => {
    try {
      const { length = 32, format = 'hex' } = _req.body || {};

      const secretLength =
        typeof length === 'number' && length >= 16 && length <= 128 ? length : 32;
      const secretFormat = format === 'base64' ? 'base64' : 'hex';

      const secretBytes = randomBytes(secretLength);
      const secret =
        secretFormat === 'hex' ? secretBytes.toString('hex') : secretBytes.toString('base64');

      const entropy = secretLength * 8; // bits of entropy

      res.json({
        success: true,
        secret,
        format: secretFormat,
        length: secretLength,
        entropy,
        envFormat: `BETTER_AUTH_SECRET=${secret}`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate secret',
      });
    }
  });

  router.post('/api/tools/check-env-secret', async (_req: Request, res: Response) => {
    try {
      const envPath = join(process.cwd(), '.env');
      const envLocalPath = join(process.cwd(), '.env.local');
      const targetPath = existsSync(envLocalPath) ? envLocalPath : envPath;
      const envContent = existsSync(targetPath) ? readFileSync(targetPath, 'utf-8') : '';
      const envLines = envContent.split('\n');
      let existingSecret: string | undefined;

      envLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const match = trimmed.match(/^BETTER_AUTH_SECRET\s*=\s*(.*)$/i);
        if (match) {
          let value = match[1].trim();
          if (value.length >= 2) {
            if (
              (value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))
            ) {
              value = value.slice(1, -1).trim();
            }
          }
          if (value && value.trim() !== '') {
            existingSecret = value;
          }
        }
      });

      const hasExisting = !!existingSecret && existingSecret.trim() !== '';

      res.json({
        success: true,
        hasExisting,
        existingSecret: hasExisting ? existingSecret : undefined,
        path: targetPath,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check secret',
      });
    }
  });

  router.post('/api/tools/write-env-secret', async (req: Request, res: Response) => {
    try {
      const { secret, action = 'override' } = req.body || {};

      if (!secret) {
        return res.status(400).json({
          success: false,
          message: 'Secret is required',
        });
      }

      const envPath = join(process.cwd(), '.env');
      const envLocalPath = join(process.cwd(), '.env.local');

      const targetPath = existsSync(envLocalPath) ? envLocalPath : envPath;
      const envContent = existsSync(targetPath) ? readFileSync(targetPath, 'utf-8') : '';

      const envLines = envContent.split('\n');
      const envMap = new Map<string, { line: string; index: number }>();
      const newLines: string[] = [];

      envLines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          newLines.push(line);
          return;
        }

        const match = trimmed.match(/^([^=#]+)\s*=\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          if (key.toUpperCase() === 'BETTER_AUTH_SECRET') {
            envMap.set('BETTER_AUTH_SECRET', { line, index });
            if (action === 'override') {
              newLines.push(`BETTER_AUTH_SECRET=${secret}`);
            } else {
              newLines.push(line);
            }
          } else {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      });

      if (!envMap.has('BETTER_AUTH_SECRET')) {
        if (newLines.length > 0 && newLines[newLines.length - 1].trim() !== '') {
          newLines.push('');
        }
        newLines.push(`BETTER_AUTH_SECRET=${secret}`);
      }

      const newContent = newLines.join('\n');
      writeFileSync(targetPath, newContent, 'utf-8');

      res.json({
        success: true,
        message: 'Secret written successfully',
        path: targetPath,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to write secret to .env',
      });
    }
  });

  router.post('/api/tools/check-env-credentials', async (req: Request, res: Response) => {
    try {
      const { provider } = req.body || {};

      if (!provider) {
        return res.status(400).json({
          success: false,
          message: 'Provider is required',
        });
      }

      const envPath = join(process.cwd(), '.env');
      const envLocalPath = join(process.cwd(), '.env.local');

      const targetPath = existsSync(envLocalPath) ? envLocalPath : envPath;
      const envContent = existsSync(targetPath) ? readFileSync(targetPath, 'utf-8') : '';

      const providerUpper = provider.toUpperCase();
      const clientIdKey = `${providerUpper}_CLIENT_ID`;
      const clientSecretKey = `${providerUpper}_CLIENT_SECRET`;

      const envLines = envContent.split('\n');
      const existingCredentials: Record<string, string> = {};

      envLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const match = trimmed.match(/^([^=#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove surrounding quotes if present (handles both single and double quotes)
          if (value.length >= 2) {
            if (
              (value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))
            ) {
              value = value.slice(1, -1).trim();
            }
          }
          if (key === clientIdKey || key === clientSecretKey) {
            existingCredentials[key] = value;
          }
        }
      });

      // Only consider it as existing if the values are not empty (after stripping quotes)
      const isValueEmpty = (val: string | undefined): boolean => {
        if (!val) return true;
        return val.trim() === '';
      };

      const hasExisting =
        !isValueEmpty(existingCredentials[clientIdKey]) ||
        !isValueEmpty(existingCredentials[clientSecretKey]);

      res.json({
        success: true,
        hasExisting,
        existingCredentials: hasExisting ? existingCredentials : {},
        path: targetPath,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check credentials',
      });
    }
  });

  router.post('/api/tools/write-env-credentials', async (req: Request, res: Response) => {
    try {
      const { provider, clientId, clientSecret, action = 'override' } = req.body || {};

      if (!provider || !clientId || !clientSecret) {
        return res.status(400).json({
          success: false,
          message: 'Provider, Client ID, and Client Secret are required',
        });
      }

      const envPath = join(process.cwd(), '.env');
      const envLocalPath = join(process.cwd(), '.env.local');

      const targetPath = existsSync(envLocalPath) ? envLocalPath : envPath;
      const envContent = existsSync(targetPath) ? readFileSync(targetPath, 'utf-8') : '';

      const envLines = envContent.split('\n');
      const envMap = new Map<string, { line: string; index: number }>();
      const newLines: string[] = [];

      envLines.forEach((line, index) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          newLines.push(line);
          return;
        }

        const match = trimmed.match(/^([^=#]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (value.trim() !== '') {
            envMap.set(key, { line, index });
          }
          newLines.push(line);
        } else {
          newLines.push(line);
        }
      });

      const providerUpper = provider.toUpperCase();
      let clientIdKey = `${providerUpper}_CLIENT_ID`;
      let clientSecretKey = `${providerUpper}_CLIENT_SECRET`;

      if (action === 'append') {
        let suffix = 2;
        while (envMap.has(clientIdKey) || envMap.has(clientSecretKey)) {
          clientIdKey = `${providerUpper}_CLIENT_ID_${suffix}`;
          clientSecretKey = `${providerUpper}_CLIENT_SECRET_${suffix}`;
          suffix++;
        }
      }

      let updated = false;

      const clientIdLineIndex = envLines.findIndex((line) => {
        const trimmed = line.trim();
        return trimmed.startsWith(`${clientIdKey}=`);
      });

      if (action === 'override' && envMap.has(clientIdKey)) {
        const existing = envMap.get(clientIdKey)!;
        newLines[existing.index] = `${clientIdKey}=${clientId}`;
        updated = true;
      } else if (clientIdLineIndex >= 0 && !envMap.has(clientIdKey)) {
        newLines[clientIdLineIndex] = `${clientIdKey}=${clientId}`;
        updated = true;
      } else if (!envMap.has(clientIdKey) && clientIdLineIndex < 0) {
        while (newLines.length > 0 && !newLines[newLines.length - 1].trim()) {
          newLines.pop();
        }
        if (
          newLines.length > 0 &&
          newLines[newLines.length - 1] &&
          !newLines[newLines.length - 1].endsWith('\n')
        ) {
          if (
            !newLines[newLines.length - 1].endsWith('\r\n') &&
            !newLines[newLines.length - 1].endsWith('\n')
          ) {
            newLines.push('');
          }
        }
        newLines.push(`${clientIdKey}=${clientId}`);
        updated = true;
      }

      const clientSecretLineIndex = envLines.findIndex((line) => {
        const trimmed = line.trim();
        return trimmed.startsWith(`${clientSecretKey}=`);
      });

      if (action === 'override' && envMap.has(clientSecretKey)) {
        const existing = envMap.get(clientSecretKey)!;
        newLines[existing.index] = `${clientSecretKey}=${clientSecret}`;
        updated = true;
      } else if (clientSecretLineIndex >= 0 && !envMap.has(clientSecretKey)) {
        newLines[clientSecretLineIndex] = `${clientSecretKey}=${clientSecret}`;
        updated = true;
      } else if (!envMap.has(clientSecretKey) && clientSecretLineIndex < 0) {
        const clientIdIndex = newLines.findIndex((line) => line.startsWith(`${clientIdKey}=`));
        if (clientIdIndex >= 0) {
          newLines.splice(clientIdIndex + 1, 0, `${clientSecretKey}=${clientSecret}`);
        } else {
          newLines.push(`${clientSecretKey}=${clientSecret}`);
        }
        updated = true;
      }

      const newContent = newLines.join('\n');
      writeFileSync(targetPath, newContent, 'utf-8');

      res.json({
        success: true,
        message: 'OAuth credentials written successfully',
        path: targetPath,
        variables: {
          [clientIdKey]: clientId,
          [clientSecretKey]: '***',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to write credentials to .env',
      });
    }
  });

  router.post('/api/tools/apply-email-template', async (req: Request, res: Response) => {
    try {
      const { subject, html, templateId } = req.body || {};
      if (!subject || !html || !templateId) {
        return res
          .status(400)
          .json({ success: false, message: 'templateId, subject and html are required' });
      }

      const authPath = join(process.cwd(), 'examples/nextjs/prisma/lib/auth.ts');
      if (!existsSync(authPath)) {
        return res.status(404).json({ success: false, message: 'auth.ts not found' });
      }

      let fileContent = readFileSync(authPath, 'utf-8');

      const escapedSubject = subject.replace(/`/g, '\\`').replace(/\${/g, '\\${');
      const escapedHtml = html.replace(/`/g, '\\`').replace(/\${/g, '\\${');

      if (!fileContent.includes("from 'resend'")) {
        fileContent = `import { Resend } from 'resend';\n` + fileContent;
      }

      if (!fileContent.includes('const resend = new Resend(')) {
        const importBlockEnd = fileContent.indexOf('\n', fileContent.lastIndexOf('import'));
        if (importBlockEnd > -1) {
          fileContent =
            fileContent.slice(0, importBlockEnd + 1) +
            `const resend = new Resend(process.env.RESEND_API_KEY || '');\n` +
            fileContent.slice(importBlockEnd + 1);
        } else {
          fileContent =
            `const resend = new Resend(process.env.RESEND_API_KEY || '');\n` + fileContent;
        }
      }

      const handlers: Record<
        string,
        { regex: RegExp; fn: string; injectRegex?: RegExp; injectLabel?: string }
      > = {
        'password-reset': {
          regex: /sendResetPassword\s*:\s*async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\},?/,
          fn: `sendResetPassword: async ({ user, url, token }, request) => {
        const subject = \\\`${escapedSubject}\\\`
          .replace(/{{user.name}}/g, user?.name || '')
          .replace(/{{user.email}}/g, user?.email || '');

        const html = \\\`${escapedHtml}\\\`
          .replace(/{{user.name}}/g, user?.name || '')
          .replace(/{{user.email}}/g, user?.email || '')
          .replace(/{{url}}/g, url || '')
          .replace(/{{token}}/g, token || '');

        void sendEmail({
          to: user.email,
          subject,
          html,
        });
      }`,
        },
        'email-verification': {
          regex: /sendVerificationEmail\s*:\s*async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\},?/,
          fn: `sendVerificationEmail: async ({ user, url, token }, request) => {
        const subject = \\\`${escapedSubject}\\\`
          .replace(/{{user.name}}/g, user?.name || '')
          .replace(/{{user.email}}/g, user?.email || '');

        const html = \\\`${escapedHtml}\\\`
          .replace(/{{user.name}}/g, user?.name || '')
          .replace(/{{user.email}}/g, user?.email || '')
          .replace(/{{url}}/g, url || '')
          .replace(/{{token}}/g, token || '');

        void sendEmail({
          to: user.email,
          subject,
          html,
        });
      }`,
        },
        'magic-link': {
          regex: /sendMagicLink\s*:\s*async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\},?/,
          fn: `sendMagicLink: async ({ email, token, url }, ctx) => {
        const subject = \\\`${escapedSubject}\\\`
          .replace(/{{user.email}}/g, email || '');

        const html = \\\`${escapedHtml}\\\`
          .replace(/{{user.email}}/g, email || '')
          .replace(/{{url}}/g, url || '')
          .replace(/{{token}}/g, token || '');

        void sendEmail({
          to: email,
          subject,
          html,
        });
      }`,
        },
        'org-invitation': {
          regex: /sendInvitationEmail\s*:\s*async\s*\([^)]*\)\s*=>\s*\{[\s\S]*?\},?/,
          fn: `sendInvitationEmail: async ({ data, request }: {
        data: {
          invitation: {
            id: string;
            organizationId: string;
            email: string;
            role: string;
            status: "pending" | "accepted" | "rejected" | "canceled";
            inviterId: string;
            expiresAt: Date;
            createdAt: Date;
            teamId?: string | null | undefined;
          };
          organization: { name?: string; slug?: string };
          inviter: { user: { name?: string; email?: string } };
        };
        request?: Request;
      }) => {
        const { invitation, organization, inviter } = data;
        const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';
        const url = \\\`\\\${baseUrl}/accept-invitation?id=\\\${invitation.id}\\\`;

        const subject = \\\`${escapedSubject}\\\`
          .replace(/{{organization.name}}/g, organization?.name || '')
          .replace(/{{invitation.role}}/g, invitation.role || '')
          .replace(/{{inviter.user.name}}/g, inviter?.user?.name || '')
          .replace(/{{inviter.user.email}}/g, inviter?.user?.email || '')
          .replace(/{{invitation.email}}/g, invitation.email || '');

        const html = \\\`${escapedHtml}\\\`
          .replace(/{{invitation.url}}/g, url)
          .replace(/{{invitation.role}}/g, invitation.role || '')
          .replace(/{{organization.name}}/g, organization?.name || '')
          .replace(/{{organization.slug}}/g, organization?.slug || '')
          .replace(/{{inviter.user.name}}/g, inviter?.user?.name || '')
          .replace(/{{inviter.user.email}}/g, inviter?.user?.email || '')
          .replace(/{{invitation.email}}/g, invitation.email || '')
          .replace(/{{invitation.expiresAt}}/g, invitation.expiresAt?.toLocaleString() || '')
          .replace(/{{expiresIn}}/g, invitation.expiresAt ? \\\`\\\${Math.ceil((invitation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days\\\` : '');

        void sendEmail({
          to: invitation.email,
          subject,
          html,
        });
      }`,
        },
      };

      const handler = handlers[templateId];
      if (!handler) {
        return res
          .status(400)
          .json({ success: false, message: 'Unsupported templateId for apply' });
      }

      if (!fileContent.includes('const sendEmail = async')) {
        const insertPoint = fileContent.indexOf('export const auth');
        fileContent =
          fileContent.slice(0, insertPoint) +
          `const sendEmail = async ({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) => {\n  console.log(\`Sending email to \${to} | \${subject}\`);\n  if (text) console.log('Text content:', text);\n  if (html) console.log('HTML content:', html);\n};\n\n` +
          fileContent.slice(insertPoint);
      }

      if (handler.regex.test(fileContent)) {
        fileContent = fileContent.replace(handler.regex, `${handler.fn},`);
      } else {
        if (templateId === 'org-invitation') {
          const orgPluginRegex = /organization\(\s*\{\s*/;
          if (!orgPluginRegex.test(fileContent)) {
            return res.status(400).json({
              success: false,
              message: 'organization plugin config not found in auth.ts',
            });
          }
          fileContent = fileContent.replace(orgPluginRegex, (m) => `${m}${handler.fn},\n      `);
        } else {
          const emailAndPasswordRegex = /emailAndPassword\s*:\s*\{\s*/;
          if (!emailAndPasswordRegex.test(fileContent)) {
            return res.status(400).json({
              success: false,
              message: 'emailAndPassword config not found in auth.ts',
            });
          }
          fileContent = fileContent.replace(
            emailAndPasswordRegex,
            (m) => `${m}${handler.fn},\n    `
          );
        }
      }

      writeFileSync(authPath, fileContent, 'utf-8');
      res.json({ success: true, path: authPath });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error?.message || 'Failed to apply invitation template',
      });
    }
  });

  return router;
}
