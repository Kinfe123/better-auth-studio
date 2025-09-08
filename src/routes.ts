import { Router, Request, Response } from 'express';
import { getAuthData } from './data.js';
import { AuthConfig } from './config.js';
import { getAuthAdapter, createMockUser, createMockSession, createMockAccount, createMockVerification } from './auth-adapter.js';
import { createJiti } from 'jiti';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { pathToFileURL } from 'url';

// Custom module resolver that tries both .js and .ts extensions
function resolveModuleWithExtensions(id: string, parent: string): string {
  // If it's not a relative import, return as is
  if (!id.startsWith('./') && !id.startsWith('../')) {
    return id;
  }

  const parentDir = dirname(parent);
  const basePath = join(parentDir, id);
  
  console.log(`Resolving ${id} from ${parent}`);
  console.log(`Base path: ${basePath}`);
  
  // Try different extensions in order of preference
  const extensions = ['.ts', '.js', '.mjs', '.cjs'];
  
  for (const ext of extensions) {
    const fullPath = basePath + ext;
    console.log(`Trying: ${fullPath}`);
    if (existsSync(fullPath)) {
      console.log(`✅ Found: ${fullPath}`);
      return pathToFileURL(fullPath).href;
    }
  }
  
  // Special case: if it's a directory, try index files
  if (existsSync(basePath)) {
    console.log(`Found directory: ${basePath}, trying index files`);
    for (const ext of extensions) {
      const indexPath = join(basePath, 'index' + ext);
      console.log(`Trying index: ${indexPath}`);
      if (existsSync(indexPath)) {
        console.log(`✅ Found index: ${indexPath}`);
        return pathToFileURL(indexPath).href;
      }
    }
  }
  
  // If no file found, return the original id
  console.log(`❌ Could not resolve ${id} with any extension, using original`);
  return id;
}

// Helper function to properly resolve imports from the project's context
export async function safeImportAuthConfig(authConfigPath: string): Promise<any> {
  try {
    // For TypeScript files, use Jiti for safe resolution
    if (authConfigPath.endsWith('.ts')) {
      console.log(`Using Jiti to safely import TypeScript config from ${authConfigPath}...`);
      // Create aliases for all relative imports dynamically
      const aliases: Record<string, string> = {};
      
      // Get the directory of the auth config file
      const authConfigDir = dirname(authConfigPath);
      
      // Read the file content to find all relative imports
      const content = readFileSync(authConfigPath, 'utf-8');
      
      // Find all relative imports (./something or ../something)
      const relativeImportRegex = /import\s+.*?\s+from\s+['"](\.\/[^'"]+)['"]/g;
      const dynamicImportRegex = /import\s*\(\s*['"](\.\/[^'"]+)['"]\s*\)/g;
      
      const foundImports = new Set<string>();
      
      // Extract relative imports from static imports
      let match;
      while ((match = relativeImportRegex.exec(content)) !== null) {
        foundImports.add(match[1]);
      }
      
      // Extract relative imports from dynamic imports
      while ((match = dynamicImportRegex.exec(content)) !== null) {
        foundImports.add(match[1]);
      }
      
      console.log(`Found relative imports: ${Array.from(foundImports).join(', ')}`);
      
      // Create aliases for each found import
      for (const importPath of foundImports) {
        const importName = importPath.replace('./', '');
        const possiblePaths = [
          join(authConfigDir, importName + '.ts'),
          join(authConfigDir, importName + '.js'),
          join(authConfigDir, importName + '.mjs'),
          join(authConfigDir, importName + '.cjs'),
          join(authConfigDir, importName, 'index.ts'),
          join(authConfigDir, importName, 'index.js'),
          join(authConfigDir, importName, 'index.mjs'),
          join(authConfigDir, importName, 'index.cjs')
        ];
        
        for (const path of possiblePaths) {
          if (existsSync(path)) {
            aliases[importPath] = pathToFileURL(path).href;
            console.log(`Created alias: ${importPath} -> ${path}`);
            break;
          }
        }
      }
      
      const jiti = createJiti(import.meta.url, {
        debug: true, // Enable debug to see what's happening
        fsCache: true,
        moduleCache: true,
        interopDefault: true,
        alias: aliases
      });
      try {
        return await jiti.import(authConfigPath);
      } catch (importError: any) {
        console.log(`Jiti import failed: ${importError.message}`);
        console.log('Falling back to regex extraction...');
        
        // If Jiti import fails, fall back to regex extraction
        const content = readFileSync(authConfigPath, 'utf-8');
        console.log('Using regex extraction as fallback');
        
        // Return a mock module that can be processed by regex extraction
        return {
          auth: {
            options: {
              // This will be processed by regex extraction
              _content: content
            }
          }
        };
      }
    }
    
    // For JavaScript files, try normal import first
    return await import(authConfigPath);
  } catch (importError) {
    console.log('Import failed, trying to resolve imports from project context...');
    
    try {
      // Get the project directory from the auth config path
      const { dirname, join } = await import('path');
      const { existsSync, readFileSync, writeFileSync, mkdtempSync, unlinkSync, rmdirSync } = await import('fs');
      const { tmpdir } = await import('os');
      
      const projectDir = dirname(authConfigPath);
      const content = readFileSync(authConfigPath, 'utf-8');
      
      // Create a safe version of the auth config by ignoring problematic imports
      let resolvedContent = content;
      
      // Look for node_modules in the project directory and parent directories
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
      
      // Replace problematic imports with safe alternatives
      console.log('Creating safe auth config by replacing problematic imports...');
      
      // Replace prisma import with a mock
      resolvedContent = resolvedContent.replace(
        /import\s+prisma\s+from\s+["']\.\/prisma["'];/g,
        `// Mock prisma client for studio
const prisma = {
  user: { findMany: () => [], create: () => ({}), update: () => ({}), delete: () => ({}) },
  session: { findMany: () => [], create: () => ({}), update: () => ({}), delete: () => ({}) },
  account: { findMany: () => [], create: () => ({}), update: () => ({}), delete: () => ({}) },
  verification: { findMany: () => [], create: () => ({}), update: () => ({}), delete: () => ({}) },
  organization: { findMany: () => [], create: () => ({}), update: () => ({}), delete: () => ({}) },
  member: { findMany: () => [], create: () => ({}), update: () => ({}), delete: () => ({}) },
  invitation: { findMany: () => [], create: () => ({}), update: () => ({}), delete: () => ({}) },
  team: { findMany: () => [], create: () => ({}), update: () => ({}), delete: () => ({}) },
  teamMember: { findMany: () => [], create: () => ({}), update: () => ({}), delete: () => ({}) }
};`
      );
      
      // Replace other problematic local imports with safe alternatives
      resolvedContent = resolvedContent.replace(
        /import\s+([^"']*)\s+from\s+["']\.\/[^"']*["'];/g,
        '// Ignored local import for studio compatibility'
      );
      
      // Replace magic-link import with a mock
      resolvedContent = resolvedContent.replace(
        /import\s+{\s*magicLink\s*}\s+from\s+["']\.\/magic-link["'];/g,
        `// Mock magic link plugin
const magicLink = () => ({ id: 'magic-link', name: 'Magic Link' });`
      );
      
      // Now try to import the resolved content
      
      if (nodeModulesPath) {
        console.log(`Found node_modules at: ${nodeModulesPath}`);
        
        // Create a temporary file with the resolved content
        const tempDir = mkdtempSync(join(tmpdir(), 'better-auth-studio-'));
        const tempFile = join(tempDir, 'resolved-auth-config.js');
        
        // Convert ES modules to CommonJS for easier import
        let commonJsContent = resolvedContent
          .replace(/export\s+const\s+(\w+)\s*=/g, 'const $1 =')
          .replace(/export\s+default\s+/g, 'module.exports = ')
          .replace(/export\s+type\s+.*$/gm, '// $&') // Comment out type exports
          .replace(/import\s+type\s+.*$/gm, '// $&'); // Comment out type imports
        
        // Ensure we have a proper export
        if (!commonJsContent.includes('module.exports')) {
          commonJsContent += '\nmodule.exports = { auth };';
        }
        
        writeFileSync(tempFile, commonJsContent);
        console.log('Created temporary auth config file:', tempFile);
        
        // Try to import with the project's module resolution
        const originalCwd = process.cwd();
        const originalNodePath = process.env.NODE_PATH;
        
        try {
          // Set NODE_PATH to include the project's node_modules
          process.env.NODE_PATH = nodeModulesPath;
          process.chdir(projectDir);
          
          // Try to import the resolved auth config
          const authModule = await import(tempFile);
          
          // Clean up temp file
          unlinkSync(tempFile);
          rmdirSync(tempDir);
          
          return authModule;
        } finally {
          // Restore original environment
          process.chdir(originalCwd);
          if (originalNodePath) {
            process.env.NODE_PATH = originalNodePath;
          } else {
            delete process.env.NODE_PATH;
          }
        }
      } else {
        console.log('No node_modules found in project directory');
        throw new Error('No node_modules found');
      }
    } catch (resolveError) {
      console.error('Import resolution also failed:', resolveError);
      throw importError; // Throw original error
    }
  }
}

async function findAuthConfigPath(): Promise<string | null> {
  const { join, dirname } = await import('path');
  const { existsSync } = await import('fs');

  const possiblePaths = [
    'auth.js',  // Prioritize the working CommonJS file
    'auth.ts',
    'src/auth.js',
    'src/auth.ts',
    'lib/auth.js',
    'lib/auth.ts'
  ];

  for (const path of possiblePaths) {
    const fullPath = join(process.cwd(), path);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}

export function createRoutes(authConfig: AuthConfig) {
  const router = Router();

  router.get('/api/health', (req: Request, res: Response) => {
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
          external: Math.round(process.memoryUsage().external / 1024 / 1024)
        },
        pid: process.pid,
        cwd: process.cwd()
      }
    });
  });

  router.get('/api/config', (req: Request, res: Response) => {
    console.log('Raw authConfig:', JSON.stringify(authConfig, null, 2));
    const config = {
      appName: authConfig.appName || 'Better Auth',
      baseURL: authConfig.baseURL || process.env.BETTER_AUTH_URL,
      basePath: authConfig.basePath || '/api/auth',
      secret: authConfig.secret ? 'Configured' : 'Not set',

      database: {
        type: authConfig.database?.type || authConfig.database?.adapter || 'unknown',
        dialect: authConfig.database?.dialect || authConfig.database?.provider || 'unknown',
        casing: authConfig.database?.casing || 'camel',
        debugLogs: authConfig.database?.debugLogs || false,
        url: authConfig.database?.url
      },

      emailVerification: {
        sendOnSignUp: authConfig.emailVerification?.sendOnSignUp || false,
        sendOnSignIn: authConfig.emailVerification?.sendOnSignIn || false,
        autoSignInAfterVerification: authConfig.emailVerification?.autoSignInAfterVerification || false,
        expiresIn: authConfig.emailVerification?.expiresIn || 3600
      },

      emailAndPassword: {
        enabled: authConfig.emailAndPassword?.enabled ?? false,
        disableSignUp: authConfig.emailAndPassword?.disableSignUp ?? false,
        requireEmailVerification: authConfig.emailAndPassword?.requireEmailVerification ?? false,
        maxPasswordLength: authConfig.emailAndPassword?.maxPasswordLength ?? 128,
        minPasswordLength: authConfig.emailAndPassword?.minPasswordLength ?? 8,
        resetPasswordTokenExpiresIn: authConfig.emailAndPassword?.resetPasswordTokenExpiresIn ?? 3600,
        autoSignIn: authConfig.emailAndPassword?.autoSignIn ?? true, // defaults to true
        revokeSessionsOnPasswordReset: authConfig.emailAndPassword?.revokeSessionsOnPasswordReset ?? false
      },

      socialProviders: authConfig.socialProviders ? 
        Object.entries(authConfig.socialProviders).map(([provider, config]: [string, any]) => ({
          type: provider,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri,
          ...config
        })) : 
        (authConfig.providers || []),

      user: {
        modelName: authConfig.user?.modelName || 'user',
        changeEmail: {
          enabled: authConfig.user?.changeEmail?.enabled || false
        },
        deleteUser: {
          enabled: authConfig.user?.deleteUser?.enabled || false,
          deleteTokenExpiresIn: authConfig.user?.deleteUser?.deleteTokenExpiresIn || 86400
        }
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
          maxAge: authConfig.session?.cookieCache?.maxAge || 300
        },
        freshAge: authConfig.session?.freshAge || 86400
      },

      account: {
        modelName: authConfig.account?.modelName || 'account',
        updateAccountOnSignIn: authConfig.account?.updateAccountOnSignIn !== false, // defaults to true
        accountLinking: {
          enabled: authConfig.account?.accountLinking?.enabled !== false, // defaults to true
          trustedProviders: authConfig.account?.accountLinking?.trustedProviders || [],
          allowDifferentEmails: authConfig.account?.accountLinking?.allowDifferentEmails || false,
          allowUnlinkingAll: authConfig.account?.accountLinking?.allowUnlinkingAll || false,
          updateUserInfoOnLink: authConfig.account?.accountLinking?.updateUserInfoOnLink || false
        },
        encryptOAuthTokens: authConfig.account?.encryptOAuthTokens || false
      },

      verification: {
        modelName: authConfig.verification?.modelName || 'verification',
        disableCleanup: authConfig.verification?.disableCleanup || false
      },

      trustedOrigins: Array.isArray(authConfig.trustedOrigins) ? authConfig.trustedOrigins : [],

      rateLimit: {
        enabled: authConfig.rateLimit?.enabled ?? false,
        window: authConfig.rateLimit?.window || 10,
        max: authConfig.rateLimit?.max || 100,
        storage: authConfig.rateLimit?.storage || 'memory',
        modelName: authConfig.rateLimit?.modelName || 'rateLimit'
      },

      advanced: {
        ipAddress: {
          ipAddressHeaders: authConfig.advanced?.ipAddress?.ipAddressHeaders || [],
          disableIpTracking: authConfig.advanced?.ipAddress?.disableIpTracking || false
        },
        useSecureCookies: authConfig.advanced?.useSecureCookies || false,
        disableCSRFCheck: authConfig.advanced?.disableCSRFCheck || false,
        crossSubDomainCookies: {
          enabled: authConfig.advanced?.crossSubDomainCookies?.enabled || false,
          additionalCookies: authConfig.advanced?.crossSubDomainCookies?.additionalCookies || [],
          domain: authConfig.advanced?.crossSubDomainCookies?.domain
        },
        cookies: authConfig.advanced?.cookies || {},
        defaultCookieAttributes: authConfig.advanced?.defaultCookieAttributes || {},
        cookiePrefix: authConfig.advanced?.cookiePrefix,
        database: {
          defaultFindManyLimit: authConfig.advanced?.database?.defaultFindManyLimit || 100,
          useNumberId: authConfig.advanced?.database?.useNumberId || false
        }
      },

      disabledPaths: authConfig.disabledPaths || [],

      telemetry: {
        enabled: authConfig.telemetry?.enabled ?? false,
        debug: authConfig.telemetry?.debug || false
      },

      studio: {
        version: '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    };

    console.log('Processed config:', JSON.stringify(config, null, 2));
    res.json(config);
  });

  router.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const stats = await getAuthData(authConfig, 'stats');
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  router.get('/api/counts', async (req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapter();
      let userCount = 0;
      let sessionCount = 0;
      let organizationCount = 0;

      if (adapter) {
        try {
          if (typeof adapter.findMany === 'function') {
            const users = await adapter.findMany({ model: 'user', limit: 10000 });
            userCount = users?.length || 0;
          }
        } catch (error) {
          console.error('Error fetching user count:', error);
        }

        try {
          if (typeof adapter.findMany === 'function') {
            const sessions = await adapter.findMany({ model: 'session', limit: 10000 });
            sessionCount = sessions?.length || 0;
          }
        } catch (error) {
          console.error('Error fetching session count:', error);
        }

        try {
          if (typeof adapter.findMany === 'function') {
            const organizations = await adapter.findMany({ model: 'organization', limit: 10000 });
            organizationCount = organizations?.length || 0;
          }
        } catch (error) {
          console.error('Error fetching organization count:', error);
          organizationCount = 0;
        }
      }

      res.json({
        users: userCount,
        sessions: sessionCount,
        organizations: organizationCount
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
      res.status(500).json({ error: 'Failed to fetch counts' });
    }
  });
  // Endpoint to fetch all users for selection (e.g., for inviter selection)
  router.get('/api/users/all', async (req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapter();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      if (adapter.getUsers) {
        const users = await adapter.getUsers();
        res.json({ success: true, users });
      } else {
        res.json({ success: true, users: [] });
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  router.get('/api/users', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      try {
        const adapter = await getAuthAdapter();
        if (adapter && typeof adapter.findMany === 'function') {
          const allUsers = await adapter.findMany({ model: 'user', limit: limit });
          console.log('Found users via findMany:', allUsers?.length || 0);
          
          let filteredUsers = allUsers || [];
          if (search) {
            filteredUsers = filteredUsers.filter((user: any) => 
              user.email?.toLowerCase().includes(search.toLowerCase()) ||
              user.name?.toLowerCase().includes(search.toLowerCase())
            );
          }
          
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
          
          const transformedUsers = paginatedUsers.map((user: any) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }));
          
          res.json({ users: transformedUsers });
          return;
        }
      } catch (adapterError) {
        console.error('Error fetching users from adapter:', adapterError);
      }

      const result = await getAuthData(authConfig, 'users', { page, limit, search });
      
      const transformedUsers = (result.data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      
      res.json({ users: transformedUsers });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  router.get('/api/sessions', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const sessions = await getAuthData(authConfig, 'sessions', { page, limit });
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  router.get('/api/providers', async (req: Request, res: Response) => {
    try {
      const providers = await getAuthData(authConfig, 'providers');
      res.json(providers);
    } catch (error) {
      console.error('Error fetching providers:', error);
      res.status(500).json({ error: 'Failed to fetch providers' });
    }
  });

  router.delete('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await getAuthData(authConfig, 'deleteUser', { id });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  router.get('/api/plugins', async (req: Request, res: Response) => {
    try {
      const authConfigPath = await findAuthConfigPath();
      if (!authConfigPath) {
        return res.json({
          plugins: [],
          error: 'No auth config found',
          configPath: null
        });
      }

      try {
        const authModule = await safeImportAuthConfig(authConfigPath);
        const auth = authModule.auth || authModule.default;

        if (!auth) {
          return res.json({
            plugins: [],
            error: 'No auth export found',
            configPath: authConfigPath
          });
        }

        const plugins = auth.options?.plugins || [];
        const pluginInfo = plugins.map((plugin: any) => ({
          id: plugin.id,
          name: plugin.name || plugin.id,
          version: plugin.version || 'unknown',
          description: plugin.description || `${plugin.id} plugin for Better Auth`,
          enabled: true
        }));

        res.json({
          plugins: pluginInfo,
          configPath: authConfigPath,
          totalPlugins: pluginInfo.length
        });

      } catch (error) {
        console.error('Error importing auth config:', error);
        console.log('Falling back to regex extraction...');
        
        // Fallback to regex extraction when import fails
        try {
          const { readFileSync } = await import('fs');
          const content = readFileSync(authConfigPath, 'utf-8');
          const { extractBetterAuthConfig } = await import('./config');
          
          const config = extractBetterAuthConfig(content);
          if (config && config.plugins) {
            const pluginInfo = config.plugins.map((plugin: any) => ({
              id: plugin.id || 'unknown',
              name: plugin.name || plugin.id || 'unknown',
              version: plugin.version || 'unknown',
              description: plugin.description || `${plugin.id || 'unknown'} plugin for Better Auth`,
              enabled: true
            }));

            return res.json({
              plugins: pluginInfo,
              configPath: authConfigPath,
              totalPlugins: pluginInfo.length,
              fallback: true
            });
          }
        } catch (fallbackError) {
          console.error('Fallback extraction also failed:', fallbackError);
        }
        
        res.json({
          plugins: [],
          error: 'Failed to load auth config - import failed and regex extraction unavailable',
          configPath: authConfigPath
        });
      }
    } catch (error) {
      console.error('Error fetching plugins:', error);
      res.status(500).json({ error: 'Failed to fetch plugins' });
    }
  });

  router.get('/api/database/info', async (req: Request, res: Response) => {
    try {
      const authConfigPath = await findAuthConfigPath();
      if (!authConfigPath) {
        return res.json({
          database: null,
          error: 'No auth config found',
          configPath: null
        });
      }

      try {
        const authModule = await safeImportAuthConfig(authConfigPath);
        const auth = authModule.auth || authModule.default;

        if (!auth) {
          return res.json({
            database: null,
            error: 'No auth export found',
            configPath: authConfigPath
          });
        }

        const database = auth.options?.database;
        res.json({
          database: database,
          configPath: authConfigPath
        });

      } catch (error) {
        console.error('Error getting database info:', error);
        console.log('Falling back to regex extraction...');
        
        // Fallback to regex extraction when import fails
        try {
          const { readFileSync } = await import('fs');
          const content = readFileSync(authConfigPath, 'utf-8');
          const { extractBetterAuthConfig } = await import('./config');
          
          const config = extractBetterAuthConfig(content);
          if (config && config.database) {
            return res.json({
              database: config.database,
              configPath: authConfigPath,
              fallback: true
            });
          }
        } catch (fallbackError) {
          console.error('Fallback extraction also failed:', fallbackError);
        }
        
        res.json({
          database: null,
          error: 'Failed to load auth config - import failed and regex extraction unavailable',
          configPath: authConfigPath
        });
      }
    } catch (error) {
      console.error('Error fetching database info:', error);
      res.status(500).json({ error: 'Failed to fetch database info' });
    }
  });

  router.get('/api/plugins/teams/status', async (req: Request, res: Response) => {
    try {
      const authConfigPath = await findAuthConfigPath();
      if (!authConfigPath) {
        return res.json({
          enabled: false,
          error: 'No auth config found',
          configPath: null
        });
      }

      try {
        const authModule = await safeImportAuthConfig(authConfigPath);
        const auth = authModule.auth || authModule.default;

        if (!auth) {
          return res.json({
            enabled: false,
            error: 'No auth export found',
            configPath: authConfigPath
          });
        }

        const organizationPlugin = auth.options?.plugins?.find((plugin: any) =>
          plugin.id === "organization"
        );

        const teamsEnabled = organizationPlugin?.teams?.enabled === true;

        res.json({
          enabled: teamsEnabled,
          configPath: authConfigPath,
          organizationPlugin: organizationPlugin || null
        });

      } catch (error) {
        console.error('Error checking teams plugin:', error);
        console.log('Falling back to regex extraction...');
        
        // Fallback to regex extraction when import fails
        try {
          const { readFileSync } = await import('fs');
          const content = readFileSync(authConfigPath, 'utf-8');
          const { extractBetterAuthConfig } = await import('./config');
          
          const config = extractBetterAuthConfig(content);
          if (config && config.plugins) {
            const organizationPlugin = config.plugins.find((plugin: any) =>
              plugin.id === "organization"
            );
            
            const teamsEnabled = organizationPlugin?.teams?.enabled === true;

            return res.json({
              enabled: teamsEnabled,
              configPath: authConfigPath,
              organizationPlugin: organizationPlugin || null,
              fallback: true
            });
          }
        } catch (fallbackError) {
          console.error('Fallback extraction also failed:', fallbackError);
        }
        
        res.json({
          enabled: false,
          error: 'Failed to load auth config - import failed and regex extraction unavailable',
          configPath: authConfigPath
        });
      }
    } catch (error) {
      console.error('Error checking teams status:', error);
      res.status(500).json({ error: 'Failed to check teams status' });
    }
  });

  router.get('/api/organizations/:orgId/invitations', async (req: Request, res: Response) => {
    try {
      console.log('fetching invitations' , req.params)
      const { orgId } = req.params;
      const adapter = await getAuthAdapter();
      if (adapter && typeof adapter.findMany === 'function') {
        try {
          const invitations = await adapter.findMany({
            model: 'invitation',
            where: [
              { field: 'organizationId', value: orgId },
              { field: 'status', value: 'pending' }
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
            createdAt: invitation.createdAt
          }));
          res.json({ success: true, invitations: transformedInvitations });
          return;
        } catch (error) {
          console.error('Error fetching invitations from adapter:', error);
        }
      }

      res.json({ success: true, invitations: [] });
    } catch (error) {
      console.error('Error fetching invitations:', error);
      res.status(500).json({ error: 'Failed to fetch invitations' });
    }
  });

  router.get('/api/organizations/:orgId/members', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const adapter = await getAuthAdapter();

      if (adapter && typeof adapter.findMany === 'function') {
        try {
          const members = await adapter.findMany({
            model: 'member',
            where: [{ field: 'organizationId', value: orgId }],
            limit: 10000
          });
          const membersWithUsers = await Promise.all((members || []).map(async (member: any) => {
            try {
              if (adapter.findMany) {
                const users = await adapter.findMany({
                  model: 'user',
                  where: [{ field: 'id', value: member.userId }],
                  limit: 1
                });
                const user = users?.[0];
                return {
                  id: member.id,
                  userId: member.userId,
                  organizationId: member.organizationId,
                  role: member.role || 'member',
                  joinedAt: member.joinedAt || member.createdAt,
                  user: user ? {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    emailVerified: user.emailVerified
                  } : null
                };
              }
              return null;
            } catch (error) {
              console.error('Error fetching user for member:', error);
              return null;
            }
          }));

          const validMembers = membersWithUsers.filter(member => member && member.user);

          res.json({ success: true, members: validMembers });
          return;
        } catch (error) {
          console.error('Error fetching members from adapter:', error);
        }
      }

      res.json({ success: true, members: [] });
    } catch (error) {
      console.error('Error fetching members:', error);
      res.status(500).json({ error: 'Failed to fetch members' });
    }
  });

  router.post('/api/organizations/:orgId/seed-members', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const { count = 5 } = req.body;
      const adapter = await getAuthAdapter();

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
            updatedAt: new Date()
          };

          const user = await adapter.create({
            model: 'user',
            data: userData
          });

          const memberData = {
            organizationId: orgId,
            userId: user.id,
            role: 'member',
            createdAt: new Date()
          };

          await adapter.create({
            model: 'member',
            data: memberData
          });

          results.push({
            success: true,
            member: {
              userId: user.id,
              user: {
                name,
                email
              }
            }
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        message: `Added ${results.filter(r => r.success).length} members`,
        results
      });
    } catch (error) {
      console.error('Error seeding members:', error);
      res.status(500).json({ error: 'Failed to seed members' });
    }
  });

  router.post('/api/organizations/:orgId/seed-teams', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const { count = 3 } = req.body;
      const adapter = await getAuthAdapter();

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
        'Engineering', 'Design', 'Marketing', 'Sales', 'Support', 'Product', 'Operations', 'Finance', 'HR', 'Legal'
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
            updatedAt: new Date()
          };

          const team = await adapter.create({
            model: 'team',
            data: teamData
          });

          results.push({
            success: true,
            team: {
              id: team.id,
              name: teamName
            }
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        message: `Created ${results.filter(r => r.success).length} teams`,
        results
      });
    } catch (error) {
      console.error('Error seeding teams:', error);
      res.status(500).json({ error: 'Failed to seed teams' });
    }
  });

  router.delete('/api/members/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapter();
      
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      if (!adapter.delete) {
        return res.status(500).json({ error: 'Adapter delete method not available' });
      }

      await adapter.delete({
        model: 'member',
        where: [{ field: 'id', value: id }]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  });

  router.post('/api/invitations/:id/resend', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapter();
      
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
          updatedAt: new Date().toISOString()
        }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error resending invitation:', error);
      res.status(500).json({ error: 'Failed to resend invitation' });
    }
  });

  router.delete('/api/invitations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapter();
      
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
          updatedAt: new Date().toISOString()
        }
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error cancelling invitation:', error);
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

      const adapter = await getAuthAdapter();
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
        inviterId: inviterId
      };

      const invitation = {
        id: `inv_${Date.now()}`,
        ...invitationData
      };
      
      if(!adapter.create) {
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
        }
      });

      res.json({ success: true, invitation });
    } catch (error) {
      console.error('Error creating invitation:', error);
      res.status(500).json({ error: 'Failed to create invitation' });
    }
  });

  router.get('/api/organizations/:orgId/teams', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const adapter = await getAuthAdapter();

      if (adapter && typeof adapter.findMany === 'function') {
        try {
          const teams = await adapter.findMany({
            model: 'team',
            where: [{ field: 'organizationId', value: orgId }],
            limit: 10000
          });

          const transformedTeams = await Promise.all((teams || []).map(async (team: any) => {
            if(!adapter.findMany) {
              return null
            }
            const teamMembers = await adapter.findMany({ 
              model: 'teamMember', 
              where: [{ field: 'teamId', value: team.id }],
              limit: 10000 
            });

            return {
              id: team.id,
              name: team.name,
              organizationId: team.organizationId,
              metadata: team.metadata,
              createdAt: team.createdAt,
              updatedAt: team.updatedAt,
              memberCount: teamMembers ? teamMembers.length : 0
            };
          }));

          res.json({ success: true, teams: transformedTeams });
          return;
        } catch (error) {
          console.error('Error fetching teams from adapter:', error);
        }
      }

      res.json({ success: true, teams: [] });
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ error: 'Failed to fetch teams' });
    }
  });

  router.post('/api/organizations/:orgId/teams', async (req: Request, res: Response) => {
    try {
      const { orgId } = req.params;
      const { name } = req.body;

      const adapter = await getAuthAdapter();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const teamData = {
        name,
        organizationId: orgId,
        createdAt: new Date(),
        updatedAt: new Date(),
        memberCount: 0
      };

      const team = {
        id: `team_${Date.now()}`,
        ...teamData
      };
      if(!adapter.create) {
        return res.status(500).json({ error: 'Adapter create method not available' });
      }
      await adapter.create({
        model: 'team',
        data: {
          name: teamData.name,
          organizationId: teamData.organizationId,
          createdAt: teamData.createdAt,
          updatedAt: teamData.updatedAt,
        }
      });
      res.json({ success: true, team });
    } catch (error) {
      console.error('Error creating team:', error);
      res.status(500).json({ error: 'Failed to create team' });
    }
  });

  router.get('/api/teams/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapter();
      
      if (adapter && typeof adapter.findMany === 'function') {
        try {
          const teams = await adapter.findMany({ 
            model: 'team', 
            where: [{ field: 'id', value: id }],
            limit: 1 
          });
          
          const team = teams?.[0];
          if (team) {
            let organization = null;
            try {
              const orgs = await adapter.findMany({ 
                model: 'organization', 
                where: [{ field: 'id', value: team.organizationId }],
                limit: 1 
              });
              organization = orgs?.[0];
            } catch (error) {
              console.error('Error fetching organization for team:', error);
            }

            const transformedTeam = {
              id: team.id,
              name: team.name,
              organizationId: team.organizationId,
              metadata: team.metadata,
              createdAt: team.createdAt,
              updatedAt: team.updatedAt,
              memberCount: team.memberCount || 0,
              organization: organization ? {
                id: organization.id,
                name: organization.name
              } : null
            };
            
            res.json({ success: true, team: transformedTeam });
            return;
          }
        } catch (error) {
          console.error('Error fetching team from adapter:', error);
        }
      }
      
      res.status(404).json({ success: false, error: 'Team not found' });
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({ error: 'Failed to fetch team' });
    }
  });

  router.get('/api/teams/:teamId/members', async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const adapter = await getAuthAdapter();
      
      if (adapter && typeof adapter.findMany === 'function') {
        try {
          const teamMembers = await adapter.findMany({ 
            model: 'teamMember', 
            where: [{ field: 'teamId', value: teamId }],
            limit: 10000 
          });
          
          const membersWithUsers = await Promise.all((teamMembers || []).map(async (member: any) => {
            try {
              if (adapter.findMany) {
                const users = await adapter.findMany({
                  model: 'user',
                  where: [{ field: 'id', value: member.userId }],
                  limit: 1
                });
                const user = users?.[0];
              
                return {
                  id: member.id,
                  userId: member.userId,
                  teamId: member.teamId,
                  role: member.role || 'member',
                  joinedAt: member.joinedAt || member.createdAt,
                  user: user ? {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    emailVerified: user.emailVerified
                  } : null
                };
              }
              return null;
            } catch (error) {
              console.error('Error fetching user for team member:', error);
              return null;
            }
          }));
          
          const validMembers = membersWithUsers.filter(member => member && member.user);
          
          res.json({ success: true, members: validMembers });
          return;
        } catch (error) {
          console.error('Error fetching team members from adapter:', error);
        }
      }
      
      res.json({ success: true, members: [] });
    } catch (error) {
      console.error('Error fetching team members:', error);
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

      const adapter = await getAuthAdapter();
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
              createdAt: new Date()
            }
          });

          results.push({ success: true, userId });
        } catch (error) {
          results.push({ 
            success: false, 
            userId,
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      res.json({
        success: true,
        message: `Added ${results.filter(r => r.success).length} members`,
        results
      });
    } catch (error) {
      console.error('Error adding team members:', error);
      res.status(500).json({ error: 'Failed to add team members' });
    }
  });

  router.delete('/api/team-members/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapter();
      
      if (!adapter || !adapter.delete) {
        return res.status(500).json({ error: 'Adapter not available' });
      }

      await adapter.delete({
        model: 'teamMember',
        where: [{ field: 'id', value: id }]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error removing team member:', error);
      res.status(500).json({ error: 'Failed to remove team member' });
    }
  });

  router.put('/api/teams/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const adapter = await getAuthAdapter();
      if(!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      const updatedTeam = {
        id,
        name,
        updatedAt: new Date().toISOString()
      };
      if(!adapter.update) {
        return res.status(500).json({ error: 'Adapter update method not available' });
      }
      await adapter.update({
        model: 'team',
        where: [{ field: 'id', value: id }],
        update: {
          name: updatedTeam.name,
          updatedAt: updatedTeam.updatedAt
        } 
      });
      res.json({ success: true, team: updatedTeam });
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({ error: 'Failed to update team' });
    }
  });

  router.delete('/api/teams/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapter();
      if(!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      if(!adapter.delete) {
        return res.status(500).json({ error: 'Adapter delete method not available' });
      }
      await adapter.delete({
        model: 'team',
        where: [{ field: 'id', value: id }],
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({ error: 'Failed to delete team' });
    }
  });

  router.get('/api/plugins/organization/status', async (req: Request, res: Response) => {
    try {
      const authConfigPath = await findAuthConfigPath();
      if (!authConfigPath) {
        return res.json({
          enabled: false,
          error: 'No auth config found',
          configPath: null
        });
      }

      try {
        const authModule = await safeImportAuthConfig(authConfigPath);
        const auth = authModule.auth || authModule.default;
        console.log({ auth })
        if (!auth) {
          return res.json({
            enabled: false,
            error: 'No auth export found',
            configPath: authConfigPath
          });
        }

        const hasOrganizationPlugin = auth.options?.plugins?.find((plugin: any) =>
          plugin.id === "organization"
        );
        console.log({ hasOrganizationPlugin })

        res.json({
          enabled: !!hasOrganizationPlugin,
          configPath: authConfigPath,
          availablePlugins: auth.options?.plugins?.map((p: any) => p.id) || [],
          organizationPlugin: hasOrganizationPlugin || null
        });

      } catch (error) {
        console.error('Error checking organization plugin:', error);
        console.log('Falling back to regex extraction...');
        
        // Fallback to regex extraction when import fails
        try {
          const { readFileSync } = await import('fs');
          const content = readFileSync(authConfigPath, 'utf-8');
          const { extractBetterAuthConfig } = await import('./config');
          
          const config = extractBetterAuthConfig(content);
          if (config && config.plugins) {
            const hasOrganizationPlugin = config.plugins.find((plugin: any) =>
              plugin.id === "organization"
            );

            return res.json({
              enabled: !!hasOrganizationPlugin,
              configPath: authConfigPath,
              availablePlugins: config.plugins.map((p: any) => p.id) || [],
              organizationPlugin: hasOrganizationPlugin || null,
              fallback: true
            });
          }
        } catch (fallbackError) {
          console.error('Fallback extraction also failed:', fallbackError);
        }
        
        res.json({
          enabled: false,
          error: 'Failed to load auth config - import failed and regex extraction unavailable',
          configPath: authConfigPath
        });
      }
    } catch (error) {
      console.error('Error checking plugin status:', error);
      res.status(500).json({ error: 'Failed to check plugin status' });
    }
  });

  router.get('/api/organizations', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      try {
        const adapter = await getAuthAdapter();
        if (adapter && typeof adapter.findMany === 'function') {
          const allOrganizations = await adapter.findMany({ model: 'organization' });
          console.log('Found organizations via findMany:', allOrganizations?.length || 0);

          let filteredOrganizations = allOrganizations || [];
          if (search) {
            filteredOrganizations = filteredOrganizations.filter((org: any) =>
              org.name?.toLowerCase().includes(search.toLowerCase()) ||
              org.slug?.toLowerCase().includes(search.toLowerCase())
            );
          }

          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedOrganizations = filteredOrganizations.slice(startIndex, endIndex);

          const transformedOrganizations = paginatedOrganizations.map((org: any) => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            metadata: org.metadata,
            createdAt: org.createdAt,
            updatedAt: org.updatedAt,
          }));

          res.json({ organizations: transformedOrganizations });
          return;
        }
      } catch (adapterError) {
        console.error('Error fetching organizations from adapter:', adapterError);
      }

      const mockOrganizations = [
        {
          id: 'org_1',
          name: 'Acme Corp',
          slug: 'acme-corp',
          metadata: { status: 'active' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'org_2',
          name: 'Tech Solutions',
          slug: 'tech-solutions',
          metadata: { status: 'active' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      res.json({ organizations: mockOrganizations });
    } catch (error) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  });

  router.post('/api/organizations', async (req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapter();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const orgData = req.body;

      if (!orgData.slug && orgData.name) {
        orgData.slug = orgData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }

      const organization = await adapter.createOrganization(orgData);
      res.json({ success: true, organization });
    } catch (error) {
      console.error('Error creating organization:', error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  });

  router.put('/api/organizations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const orgData = req.body;
      const adapter: any = await getAuthAdapter();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      if (orgData.name && !orgData.slug) {
        orgData.slug = orgData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }

      const updatedOrganization = {
        id,
        ...orgData,
        updatedAt: new Date().toISOString()
      };
      const updatedOrg = await adapter.update({
        model: 'organization',
        where: [
          { field: 'id', value: id }
        ],
        update: updatedOrganization
      });
      res.json({ success: true, organization: updatedOrg });
    } catch (error) {
      console.error('Error updating organization:', error);
      res.status(500).json({ error: 'Failed to update organization' });
    }
  });

  router.get('/api/organizations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter = await getAuthAdapter();

      if (adapter && typeof adapter.findMany === 'function') {
        const organizations = await adapter.findMany({ model: 'organization', limit: 10000 });
        const organization = organizations?.find((org: any) => org.id === id);

        if (organization) {
          const transformedOrganization = {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            metadata: organization.metadata,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt,
          };

          res.json({ success: true, organization: transformedOrganization });
          return;
        }
      }

      res.status(404).json({ success: false, error: 'Organization not found' });
    } catch (error) {
      console.error('Error fetching organization:', error);
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  });

  router.delete('/api/organizations/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const adapter: any = await getAuthAdapter();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }
      const deletedOrg = await adapter.delete({
        model: 'organization',
        where: [
          { field: 'id', value: id }
        ]
      });
      res.json({ success: true, organization: deletedOrg });
    } catch (error) {
      console.error('Error deleting organization:', error);
      res.status(500).json({ error: 'Failed to delete organization' });
    }
  });

  router.post('/api/users', async (req: Request, res: Response) => {
    try {
      const adapter = await getAuthAdapter();
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const userData = req.body;
      const user = await adapter.createUser(userData);
      res.json({ success: true, user });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  router.put('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      const updatedUser = await getAuthData(authConfig, 'updateUser', { id, userData });
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  router.post('/api/seed/users', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapter();
      console.log({ adapter })
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
              createdAt: user.createdAt
            }
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter(r => r.success).length} users`,
        results
      });
    } catch (error) {
      console.error('Error seeding users:', error);
      res.status(500).json({ error: 'Failed to seed users' });
    }
  });

  router.post('/api/seed/sessions', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapter();
      
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      let user;
      try {
        user = await createMockUser(adapter, 1);
      } catch (error) {
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
              createdAt: session.createdAt
            }
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter(r => r.success).length} sessions`,
        results
      });
    } catch (error) {
      console.error('Error seeding sessions:', error);
      res.status(500).json({ error: 'Failed to seed sessions' });
    }
  });

  router.post('/api/seed/accounts', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapter();
      
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      let user;
      try {
        user = await createMockUser(adapter, 1);
      } catch (error) {
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
              createdAt: account.createdAt
            }
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter(r => r.success).length} accounts`,
        results
      });
    } catch (error) {
      console.error('Error seeding accounts:', error);
      res.status(500).json({ error: 'Failed to seed accounts' });
    }
  });

  router.post('/api/seed/verifications', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapter();
      
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          if (typeof adapter.createVerification !== 'function') {
            throw new Error('createVerification method not available on adapter');
          }
          
          const verification = await createMockVerification(adapter, `user${i + 1}@example.com`, i + 1);
          results.push({
            success: true,
            verification: {
              id: verification.id,
              identifier: verification.identifier,
              token: verification.token,
              expires: verification.expires,
              createdAt: verification.createdAt
            }
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter(r => r.success).length} verifications`,
        results
      });
    } catch (error) {
      console.error('Error seeding verifications:', error);
      res.status(500).json({ error: 'Failed to seed verifications' });
    }
  });

  router.post('/api/seed/organizations', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapter();
      
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          const organizationData = {
            name: `Organization ${i + 1}`,
            slug: `org-${i + 1}`,
            image: `https://api.dicebear.com/7.x/identicon/svg?seed=org${i + 1}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const organization = await adapter.createOrganization(organizationData);
          results.push({
            success: true,
            organization: {
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              image: organization.image,
              createdAt: organization.createdAt
            }
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        success: true,
        message: `Seeded ${results.filter(r => r.success).length} organizations`,
        results
      });
    } catch (error) {
      console.error('Error seeding organizations:', error);
      res.status(500).json({ error: 'Failed to seed organizations' });
    }
  });

  return router;
}
