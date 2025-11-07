import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
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
import { getAuthData } from './data.js';
import { initializeGeoService, resolveIPLocation, setGeoDbPath } from './geo-service.js';
import { detectDatabaseWithDialect } from './utils/database-detection.js';
import { scryptAsync } from "@noble/hashes/scrypt.js";
import { hexToBytes } from "@noble/hashes/utils.js";
// @ts-ignore
import { hex } from "@better-auth/utils/hex";
const config = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};
async function generateKey(password: string, salt: string) {
  return await scryptAsync(password.normalize("NFKC"), salt, {
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
  } catch (_error) { }
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

export async function safeImportAuthConfig(authConfigPath: string): Promise<any> {
  try {
    if (authConfigPath.endsWith('.ts')) {
      const aliases: Record<string, string> = {};
      const authConfigDir = dirname(authConfigPath);
      const content = readFileSync(authConfigPath, 'utf-8');
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

      const jiti = createJiti(import.meta.url, {
        debug: true,
        fsCache: true,
        moduleCache: true,
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

  const possiblePaths = [
    'auth.js',
    'auth.ts',
    'src/auth.js',
    'src/auth.ts',
    'lib/auth.js',
    'lib/auth.ts',
  ];

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
      } catch (error) {
        try {
          const packageJsonPath = join(projectRoot, 'package.json');
          if (existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            let versionString = packageJson.dependencies?.['better-auth'] ||
              packageJson.devDependencies?.['better-auth'] ||
              '1.0.0';
            currentVersion = versionString.replace(/[\^~>=<]/g, '');
          }
        } catch { }
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
      } catch (fetchError) {
        console.error('Failed to fetch latest version from npm:', fetchError);
        latestVersion = currentVersion;
        isOutdated = false;
      }

      res.json({
        current: currentVersion,
        latest: latestVersion,
        isOutdated,
        updateCommand: 'npm install better-auth@latest',
      });
    } catch (error) {
      console.error('Version check error:', error);
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

    try {
      const adapterResult = await getAuthAdapterWithConfig();
      if (adapterResult && (adapterResult as any).options?.adapterConfig) {
        adapterConfig = (adapterResult as any).options.adapterConfig;
      }
    } catch (_error) {
    }

    try {
      const detectedDb = await detectDatabaseWithDialect();
      if (detectedDb) {
        databaseType = detectedDb.name.charAt(0).toUpperCase() + detectedDb.name.slice(1);
        databaseDialect = detectedDb.dialect || detectedDb.name;
        databaseAdapter = detectedDb.adapter || detectedDb.name;
        databaseVersion = detectedDb.version;
      }
    } catch (_error) { }

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
        dialect: authConfig.database?.dialect || authConfig.database?.provider || databaseDialect,
        adapter: authConfig.database?.adapter || databaseAdapter,
        version: databaseVersion,
        casing: authConfig.database?.casing || 'camel',
        debugLogs: authConfig.database?.debugLogs || false,
        url: authConfig.database?.url,
        adapterConfig: adapterConfig,
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
      const analytics = await getAuthData(authConfig, 'analytics', {
        period: period as string,
        type: type as string,
        from: from as string | undefined,
        to: to as string | undefined,
      }, configPath);
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
        } catch (_error) { }

        try {
          if (typeof adapter.findMany === 'function') {
            const sessions = await adapter.findMany({ model: 'session', limit: 100000 });
            sessionCount = sessions?.length || 0;
          }
        } catch (_error) { }

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
        // Use findMany with high limit to get all users
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
      const { name, email } = req.body;
      const adapter = await getAuthAdapterWithConfig();
      if (!adapter || !adapter.update) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const user = await adapter.update({
        model: 'user',
        where: [{ field: 'id', value: userId }],
        update: { name, email },
      });

      res.json({ success: true, user });
    } catch (_error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });
  router.put("/api/users/:userId/password", async (req: Request, res: Response) => {
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
        hashedPassword = `${salt}:${hex.encode(key)}`
      } catch {
        res.status(500).json({ error: 'Failed to hash password' });
      }
      const account = await adapter.update({
        model: "account",
        where: [{ field: 'userId', value: userId }, { field: "providerId", value: "credential" }],
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
              organizationSlug: organization
                ? organization.slug || 'unknown'
                : 'unknown',
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

      await adapter.delete({ model: 'member', id: membershipId });
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

      await adapter.delete({ model: 'teamMember', id: membershipId });
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
      } catch (_error) { }

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
            limit: fetchLimit,
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
            // Return all users if limit is high
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
      } catch (_adapterError) { }

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
          authModule = await safeImportAuthConfig(authConfigPath);
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
        try {
          const { readFileSync } = await import('node:fs');
          const content = readFileSync(authConfigPath, 'utf-8');
          const { extractBetterAuthConfig } = await import('./config');

          const config = extractBetterAuthConfig(content);
          if (config?.plugins) {
            const pluginInfo = config.plugins.map((plugin: any) => ({
              id: plugin.id || 'unknown',
              name: plugin.name || plugin.id || 'unknown',
              version: plugin.version || 'unknown',
              description: plugin.description || `${plugin.id || 'unknown'} plugin for Better Auth`,
              enabled: true,
            }));

            return res.json({
              plugins: pluginInfo,
              configPath: authConfigPath,
              totalPlugins: pluginInfo.length,
              fallback: true,
            });
          }
        } catch (_fallbackError) { }

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
        try {
          const { readFileSync } = await import('node:fs');
          const content = readFileSync(authConfigPath, 'utf-8');
          const { extractBetterAuthConfig } = await import('./config');

          const config = extractBetterAuthConfig(content);
          if (config?.database) {
            return res.json({
              database: config.database,
              configPath: authConfigPath,
              fallback: true,
            });
          }
        } catch (_fallbackError) { }

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

  router.get("/api/database/test", async (_req: Request, res: Response) => {
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

      console.log('');
      console.log('='.repeat(80));
      console.log(`🛠  Migration Tool → Provider: ${provider}`);
      if (script) {
        console.log('📄 Migration script received:');
        console.log(script);
      } else {
        console.log('ℹ️ No script payload provided.');
      }
      console.log('='.repeat(80));
      console.log('');

      // This endpoint does not execute arbitrary scripts for safety. It simply
      // acknowledges receipt so the frontend can present instructions.
      return res.json({
        success: true,
        message: 'Migration script received. Review the server logs for details.',
      });
    } catch (error) {
      console.error('Migration tool error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process migration request',
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
        message: adminPlugin
          ? 'Admin plugin is enabled. Use Better Auth admin endpoints directly for ban/unban functionality.'
          : 'Admin plugin is not enabled. Please enable the admin plugin in your Better Auth configuration.',
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

  function generateSchema(selectedPlugins: string[]) {
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

      const schema = generateSchema(selectedPlugins);

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
        try {
          const { readFileSync } = await import('node:fs');
          const content = readFileSync(authConfigPath, 'utf-8');
          const { extractBetterAuthConfig } = await import('./config.js');

          const config = extractBetterAuthConfig(content);
          if (config?.plugins) {
            const organizationPlugin = config.plugins.find(
              (plugin: any) => plugin.id === 'organization'
            );

            const teamsEnabled = organizationPlugin?.teams?.enabled === true;

            return res.json({
              enabled: teamsEnabled,
              configPath: authConfigPath,
              organizationPlugin: organizationPlugin || null,
              fallback: true,
            });
          }
        } catch (_fallbackError) { }

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
        } catch (_error) { }
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
        } catch (_error) { }
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
        'Legal'
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
        } catch (_error) { }
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
        } catch (_error) { }
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

        try {
          const { readFileSync } = await import('node:fs');
          const content = readFileSync(authConfigPath, 'utf-8');
          const { extractBetterAuthConfig } = await import('./config.js');

          const config = extractBetterAuthConfig(content);
          if (config?.plugins) {
            const hasOrganizationPlugin = config.plugins.find(
              (plugin: any) => plugin.id === 'organization'
            );

            return res.json({
              enabled: !!hasOrganizationPlugin,
              configPath: authConfigPath,
              availablePlugins: config.plugins.map((p: any) => p.id) || [],
              organizationPlugin: hasOrganizationPlugin || null,
              fallback: true,
            });
          }
        } catch (_fallbackError) { }

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
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const search = req.query.search as string;

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
      const { count = 1 } = req.body;
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

          const user = await createMockUser(adapter, i + 1);
          results.push({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              emailVerified: user.emailVerified,
              image: user.image,
              createdAt: user.createdAt,
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

  // OAuth Test Endpoints
  router.get('/api/tools/oauth/providers', async (_req: Request, res: Response) => {
    const result = await getAuthAdapterWithConfig()
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
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch OAuth providers' });
    }
  });

  router.post('/api/tools/oauth/test', async (req: Request, res: Response) => {
    try {
      const { provider } = req.body;

      if (!provider) {
        return res.status(400).json({ success: false, error: 'Provider is required' });
      }

      // Check if provider exists
      const providers = authConfig.socialProviders || [];
      const selectedProvider = providers.find(
        (p: any) => (p.id || p.type) === provider
      );

      if (!selectedProvider) {
        return res.status(404).json({ success: false, error: 'Provider not found' });
      }

      // Generate test session ID
      const testSessionId = `oauth-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Store the test session
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
      console.error('OAuth test error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to initiate OAuth test',
        details: error instanceof Error ? error.message : String(error)
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
        return res.status(400).send('<html><body style="background:#000;color:#fff;font-family:monospace;padding:20px;">Missing test session or provider</body></html>');
      }

      const session = oauthTestSessions.get(testSessionId as string);
      if (!session || session.provider !== provider) {
        return res.status(404).send('<html><body style="background:#000;color:#fff;font-family:monospace;padding:20px;">OAuth test session not found</body></html>');
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
    } catch (error) {
      console.error('OAuth start error:', error);
      res.status(500).send('<html><body style="background:#000;color:#fff;font-family:monospace;padding:20px;">Failed to start OAuth test</body></html>');
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
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.send('<html><body style="background:#000;color:#fff;text-align:center;"><h1>OAuth Test Error</h1><p>Callback processing failed</p></body></html>');
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
            created: parseDate(account.createdAt || account.created_at || account.updatedAt || account.updated_at),
          }))
          .filter((entry) => entry.created >= threshold)
          .sort((a, b) => b.created - a.created)[0];

        recentAccount = accountCandidate?.account ?? null;
      } catch (accountError) {
        console.error('Failed to fetch accounts:', accountError);
      }

      try {
        const sessions = await adapter.findMany({
          model: 'session',
          limit: 50,
        });

        const sessionCandidate = sessions
          .map((sessionItem: any) => ({
            session: sessionItem,
            created: parseDate(sessionItem.createdAt || sessionItem.created_at || sessionItem.updatedAt || sessionItem.updated_at),
          }))
          .filter((entry) => entry.created >= threshold)
          .sort((a, b) => b.created - a.created)[0];

        recentSession = sessionCandidate?.session ?? null;
      } catch (sessionError) {
        console.error('Failed to fetch sessions:', sessionError);
      }

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
        } catch (userError) {
          console.error('Failed to fetch user info:', userError);
        }
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
    } catch (error) {
      console.error('OAuth status error:', error);
      res.status(500).json({ hasResult: false, error: 'Failed to check status' });
    }
  });

  return router;
}
