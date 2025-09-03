import { Router, Request, Response } from 'express';
import { getAuthData } from './data';
import { AuthConfig } from './config';
import { getAuthAdapter, createMockUser, createMockSession, createMockAccount, createMockVerification } from './auth-adapter';

export function createRoutes(authConfig: AuthConfig) {
  const router = Router();

  // Health check with comprehensive system info
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

  // Get comprehensive Better Auth configuration
  router.get('/api/config', (req: Request, res: Response) => {
    console.log('Raw authConfig:', JSON.stringify(authConfig, null, 2));
    
    // Extract comprehensive configuration from Better Auth config
    const config = {
      // Basic application settings
      appName: authConfig.appName || 'Better Auth',
      baseURL: authConfig.baseURL || process.env.BETTER_AUTH_URL,
      basePath: authConfig.basePath || '/api/auth',
      secret: authConfig.secret ? 'Configured' : 'Not set',

      // Database configuration
      database: {
        type: authConfig.database?.type || 'unknown',
        dialect: authConfig.database?.dialect,
        casing: authConfig.database?.casing || 'camel',
        debugLogs: authConfig.database?.debugLogs || false,
        url: authConfig.database?.url
      },

      // Email verification settings
      emailVerification: {
        sendOnSignUp: authConfig.emailVerification?.sendOnSignUp || false,
        sendOnSignIn: authConfig.emailVerification?.sendOnSignIn || false,
        autoSignInAfterVerification: authConfig.emailVerification?.autoSignInAfterVerification || false,
        expiresIn: authConfig.emailVerification?.expiresIn || 3600
      },

      // Email and password authentication - IMPORTANT: Use the actual config values
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

      // Social providers - Convert from object to array format
      socialProviders: authConfig.socialProviders ? 
        Object.entries(authConfig.socialProviders).map(([provider, config]: [string, any]) => ({
          type: provider,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          redirectUri: config.redirectUri,
          ...config
        })) : 
        (authConfig.providers || []),

      // User configuration
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

      // Session configuration - Use actual config values
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

      // Account configuration
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

      // Verification configuration
      verification: {
        modelName: authConfig.verification?.modelName || 'verification',
        disableCleanup: authConfig.verification?.disableCleanup || false
      },

      // Trusted origins
      trustedOrigins: Array.isArray(authConfig.trustedOrigins) ? authConfig.trustedOrigins : [],

      // Rate limiting - Use actual config values
      rateLimit: {
        enabled: authConfig.rateLimit?.enabled ?? false,
        window: authConfig.rateLimit?.window || 10,
        max: authConfig.rateLimit?.max || 100,
        storage: authConfig.rateLimit?.storage || 'memory',
        modelName: authConfig.rateLimit?.modelName || 'rateLimit'
      },

      // Advanced options
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

      // Disabled paths
      disabledPaths: authConfig.disabledPaths || [],

      // Telemetry - Use actual config values
      telemetry: {
        enabled: authConfig.telemetry?.enabled ?? false,
        debug: authConfig.telemetry?.debug || false
      },

      // Studio information
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

  // Get dashboard statistics
  router.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const stats = await getAuthData(authConfig, 'stats');
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
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
          const allUsers = await adapter.findMany({ model: 'user' , limit: limit });
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

  // Get sessions with pagination
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

  // Get provider statistics
  router.get('/api/providers', async (req: Request, res: Response) => {
    try {
      const providers = await getAuthData(authConfig, 'providers');
      res.json(providers);
    } catch (error) {
      console.error('Error fetching providers:', error);
      res.status(500).json({ error: 'Failed to fetch providers' });
    }
  });

  // Delete user
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

  // Create user
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

  // Update user
  router.put('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      // For now, we'll use the existing getAuthData function
      // In a real implementation, you'd use the adapter to update the user
      const updatedUser = await getAuthData(authConfig, 'updateUser', { id, userData });
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Seed data endpoints
  router.post('/api/seed/users', async (req: Request, res: Response) => {
    try {
      const { count = 1 } = req.body;
      const adapter = await getAuthAdapter();
      console.log({adapter}) 
      if (!adapter) {
        return res.status(500).json({ error: 'Auth adapter not available' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          // Check if the adapter has the createUser method
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

      // First create a user if needed
      let user;
      try {
        user = await createMockUser(adapter, 1);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to create user for session' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          // Check if the adapter has the createSession method
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

      // First create a user if needed
      let user;
      try {
        user = await createMockUser(adapter, 1);
      } catch (error) {
        return res.status(500).json({ error: 'Failed to create user for account' });
      }

      const results = [];
      for (let i = 0; i < count; i++) {
        try {
          // Check if the adapter has the createAccount method
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
          // Check if the adapter has the createVerification method
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
