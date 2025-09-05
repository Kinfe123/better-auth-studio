import { join, dirname } from 'path';
import { existsSync } from 'fs';

export interface AuthAdapter {
  createUser: (data: any) => Promise<any>;
  createSession: (data: any) => Promise<any>;
  createAccount: (data: any) => Promise<any>;
  createVerification: (data: any) => Promise<any>;
  createOrganization: (data: any) => Promise<any>;
  create?: (...args: any[]) => Promise<any>;
  update?: (...args: any[]) => Promise<any>;
  delete?: (...args: any[]) => Promise<any>;
  getUsers?: () => Promise<any[]>;
  getSessions?: () => Promise<any[]>;
  findMany?: (options: { model: string; where?: any; limit?: number; offset?: number }) => Promise<any[]>;
}

let authInstance: any = null;
let authAdapter: AuthAdapter | null = null;

export async function getAuthAdapter(): Promise<AuthAdapter | null> {
  try {
    const authConfigPath = await findAuthConfigPath();
    if (!authConfigPath) {
      console.warn('No auth config found');
      return await createMockAdapter();
    }

    console.log('Loading auth instance from:', authConfigPath);
    
    let authModule;
    try {
      authModule = await import(authConfigPath);
    } catch (error) {
      console.warn('Error importing auth module:', error);
      return await createMockAdapter();
    }
    
    const auth = authModule.auth || authModule.default;
    console.log({auth})
    if (!auth) {
      console.warn('No auth export found in config');
      return await createMockAdapter();
    }

    // For better-auth, we need to get the adapter from the auth instance
    let adapter;
    try {
      // Try to get the context first
      const context = await auth.$context;
      adapter = context?.adapter;
    } catch (error) {
      console.warn('Error getting auth context:', error);
      // Try to access adapter directly from auth object
      adapter = auth.adapter;
    }
    
    if (!adapter) {
      console.warn('No adapter found in auth instance');
      console.log('Auth object keys:', Object.keys(auth));
      console.log('Falling back to mock adapter...');
      return await createMockAdapter();
    }

    console.log('Adapter found, checking available methods...');
    console.log('Adapter keys:', Object.keys(adapter));
    console.log('Adapter methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(adapter)));
    
    // Check if adapter has options or schema information
    if (adapter.options) {
      console.log('Adapter options:', adapter.options);
    }
    if (adapter.createSchema) {
      console.log('Adapter schema:', adapter.createSchema);
    }
    
    // Try to get available models by checking the adapter's internal structure
    try {
      // Check if adapter has a schema or models property
      if (adapter.schema) {
        console.log('Adapter schema models:', Object.keys(adapter.schema));
      }
      if (adapter.models) {
        console.log('Adapter models:', Object.keys(adapter.models));
      }
      if (adapter.tables) {
        console.log('Adapter tables:', Object.keys(adapter.tables));
      }
    } catch (error) {
      console.log('Could not inspect adapter schema:', error);
    }

    
    console.log('Using real adapter with model names');
    authAdapter = {
      createUser: async (data: any) => {
        try {
          // Create the user first
          const user = await adapter.create({
            model: "user",
            data: {
              createdAt: new Date(),
              updatedAt: new Date(),
              emailVerified: false,
              name: data.name,
              email: data.email?.toLowerCase(),
              image: data.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
            }
          });
          
          if (data.password) {
            try {
              await adapter.create({
                model: "account",
                data: {
                  userId: user.id,
                  providerId: "credential",
                  accountId: user.id,
                  password: data.password,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }
              });
              console.log('Credential account created for user:', user.id);
            } catch (accountError) {
              console.error('Error creating credential account:', accountError);
              // Continue even if account creation fails
            }
          }
          
          console.log('User created via real adapter:', user);
          return user;
        } catch (error) {
          console.error('Error creating user via real adapter:', error);
          const mockAdapter = await createMockAdapter();
          return await mockAdapter.createUser(data);
        }
      },
      createSession: async (data: any) => {
        try {
          // Use the adapter.create method with proper model and data structure
          const session = await adapter.create({
            model: "session",
            data: {
              createdAt: new Date(),
              updatedAt: new Date(),
              ...data,
            }
          });
          console.log('Session created via real adapter:', session);
          return session;
        } catch (error) {
          console.error('Error creating session via real adapter:', error);
          const mockAdapter = await createMockAdapter();
          return await mockAdapter.createSession(data);
        }
      },
      createAccount: async (data: any) => {
        try {
          // Use the adapter.create method with proper model and data structure
          const account = await adapter.create({
            model: "account",
            data: {
              createdAt: new Date(),
              updatedAt: new Date(),
              ...data,
            }
          });
          console.log('Account created via real adapter:', account);
          return account;
        } catch (error) {
          console.error('Error creating account via real adapter:', error);
          const mockAdapter = await createMockAdapter();
          return await mockAdapter.createAccount(data);
        }
      },
      createVerification: async (data: any) => {
        try {
          // Use the adapter.create method with proper model and data structure
          const verification = await adapter.create({
            model: "verification",
            data: {
              createdAt: new Date(),
              updatedAt: new Date(),
              ...data,
            }
          });
          console.log('Verification created via real adapter:', verification);
          return verification;
        } catch (error) {
          console.error('Error creating verification via real adapter:', error);
          const mockAdapter = await createMockAdapter();
          return await mockAdapter.createVerification(data);
        }
      },
      createOrganization: async (data: any) => {
        try {
          // Use the adapter.create method with proper model and data structure
          const organization = await adapter.create({
            model: "organization",
            data: {
              createdAt: new Date(),
              updatedAt: new Date(),
              ...data,
            }
          });
          console.log('Organization created via real adapter:', organization);
          return organization;
        } catch (error) {
          console.error('Error creating organization via real adapter:', error);
          const mockAdapter = await createMockAdapter();
          return await mockAdapter.createOrganization(data);
        }
      },
      getUsers: async () => {
        try {
          if (typeof adapter.findMany === 'function') {
            const users = await adapter.findMany({ model: 'user' });
            console.log('Found users via findMany:', users?.length || 0);
            return users || [];
          }
          if (typeof adapter.getUsers === 'function') {
            const users = await adapter.getUsers();
            console.log('Found users via getUsers:', users?.length || 0);
            return users || [];
          }
          console.log('No read method available on adapter, returning mock data');
          return [];
        } catch (error) {
          console.error('Error getting users from adapter:', error);
          return [];
        }
      },
      getSessions: async () => {
        try {
          if (typeof adapter.findMany === 'function') {
            const sessions = await adapter.findMany({ model: 'session' });
            return sessions || [];
          }
          if (typeof adapter.getSessions === 'function') {
            const sessions = await adapter.getSessions();
            return sessions || [];
          }
          return [];
        } catch (error) {
          console.error('Error getting sessions from adapter:', error);
          return [];
        }
      },
      findMany: async (options: { model: string; where?: any; limit?: number; offset?: number }) => {
        try {
          if (typeof adapter.findMany === 'function') {
            return await adapter.findMany(options);
          }
          return [];
        } catch (error) {
          console.error('Error using findMany on adapter:', error);
          return [];
        }
      }
    };
    const adapters = {...adapter, ...authAdapter};
    return adapters;
  } catch (error) {
    console.error('Error loading auth adapter:', error);
    console.log('Falling back to mock adapter due to error...');
    return await createMockAdapter();
  }
}

async function findAuthConfigPath(): Promise<string | null> {
  const possibleConfigFiles = [
    'auth.ts',
    'auth.js',
    'src/auth.ts',
    'src/auth.js',
    'better-auth.config.ts',
    'better-auth.config.js',
    'better-auth.config.json',
    'auth.config.ts',
    'auth.config.js',
    'auth.config.json',
    'studio-config.json' // Move this to the end as fallback
  ];

  // Start from current directory and walk up
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

export async function createMockUser(adapter: AuthAdapter, index: number) {
  const userData = {
    email: `user${index}@example.com`,
    name: `User ${index}`,
    emailVerified: true,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${index}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return await adapter.createUser(userData);
}

export async function createMockSession(adapter: AuthAdapter, userId: string, index: number) {
  const sessionData = {
    userId: userId,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    sessionToken: `session_token_${index}_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return await adapter.createSession(sessionData);
}

export async function createMockAccount(adapter: AuthAdapter, userId: string, index: number) {
  const accountData = {
    userId: userId,
    type: 'oauth',
    provider: 'github',
    providerAccountId: `github_${index}`,
    refresh_token: `refresh_token_${index}`,
    access_token: `access_token_${index}`,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    scope: 'read:user',
    id_token: `id_token_${index}`,
    session_state: `session_state_${index}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return await adapter.createAccount(accountData);
}

export async function createMockVerification(adapter: AuthAdapter, userId: string, index: number) {
  const verificationData = {
    identifier: `user${index}@example.com`,
    token: `verification_token_${index}_${Date.now()}`,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return await adapter.createVerification(verificationData);
}

async function createMockAdapter(): Promise<AuthAdapter> {
  console.log('Creating mock adapter for development/testing');
  
  return {
    createUser: async (data: any) => {
      const mockUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('Mock user created:', mockUser);
      return mockUser;
    },
    createSession: async (data: any) => {
      const mockSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('Mock session created:', mockSession);
      return mockSession;
    },
    createAccount: async (data: any) => {
      const mockAccount = {
        id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('Mock account created:', mockAccount);
      return mockAccount;
    },
    createVerification: async (data: any) => {
      const mockVerification = {
        id: `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('Mock verification created:', mockVerification);
      return mockVerification;
    },
    createOrganization: async (data: any) => {
      const mockOrganization = {
        id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      console.log('Mock organization created:', mockOrganization);
      return mockOrganization;
    },
    getUsers: async () => {
      // Return mock users that have been created
      const mockUsers = [
        {
          id: 'user_1',
          email: 'user1@example.com',
          name: 'User 1',
          emailVerified: true,
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          provider: 'email',
          lastSignIn: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'user_2',
          email: 'user2@example.com',
          name: 'User 2',
          emailVerified: true,
          image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          provider: 'github',
          lastSignIn: new Date().toISOString(),
          status: 'active'
        }
      ];
      return mockUsers;
    },
    getSessions: async () => {
      const mockSessions = [
        {
          id: 'session_1',
          userId: 'user_1',
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sessionToken: 'session_token_1'
        }
      ];
      return mockSessions;
    },
    findMany: async (options: { model: string; where?: any; limit?: number; offset?: number }) => {
      if (options.model === 'user') {
        return [
          {
            id: 'user_1',
            email: 'user1@example.com',
            name: 'User 1',
            emailVerified: true,
            image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            provider: 'email',
            lastSignIn: new Date().toISOString(),
            status: 'active'
          }
        ];
      }
      return [];
    }
  };
}
