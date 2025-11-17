import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createJiti } from 'jiti';

export interface AuthAdapter {
  createUser: (data: any) => Promise<any>;
  createSession: (data: any) => Promise<any>;
  deletUser?: (id: string) => Promise<any>;
  createAccount: (data: any) => Promise<any>;
  createVerification: (data: any) => Promise<any>;
  createOrganization: (data: any) => Promise<any>;
  create?: (...args: any[]) => Promise<any>;
  update?: (...args: any[]) => Promise<any>;
  delete?: (...args: any[]) => Promise<any>;
  getUsers?: () => Promise<any[]>;
  getSessions?: () => Promise<any[]>;
  findMany?: (options: {
    model: string;
    where?: any;
    limit?: number;
    offset?: number;
  }) => Promise<any[]>;
}

const _authInstance: any = null;
let authAdapter: AuthAdapter | null = null;

export async function getAuthAdapter(configPath?: string): Promise<AuthAdapter | null> {
  try {
    const authConfigPath = await findAuthConfigPath();
    if (!authConfigPath) {
      return null;
    }
    let authModule: any;
    try {
      let importPath = authConfigPath;
      if (!authConfigPath.startsWith('/')) {
        importPath = join(process.cwd(), authConfigPath);
      }

      const jitiInstance = createJiti(importPath, {
        debug: false,
        fsCache: true,
        moduleCache: true,
        interopDefault: true,
      });
      authModule = await jitiInstance.import(importPath);
    } catch (_error: any) {
      return null;
    }

    const auth = authModule.auth || authModule.default;

    if (!auth) {
      return null;
    }

    if (auth.options?._content) {
      return null;
    }

    let adapter;
    try {
      const context = await auth.$context;
      adapter = context?.adapter;
    } catch (_error: any) {
      adapter = auth.adapter;
    }

    if (!adapter) {
      return null;
    }

    authAdapter = {
      createUser: async (data: any) => {
        const user = await adapter.create({
          model: 'user',
          data: {
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: false,
            name: data.name,
            email: data.email?.toLowerCase(),
            image: data.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
          },
        });
        if (data.password) {
          try {
            await adapter.create({
              model: 'account',
              data: {
                userId: user.id,
                providerId: 'credential',
                accountId: user.id,
                password: data.password,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          } catch (_accountError) {}
        }

        return user;
      },
      createSession: async (data: any) => {
        return await adapter.create({
          model: 'session',
          data: {
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          },
        });
      },
      createAccount: async (data: any) => {
        return await adapter.create({
          model: 'account',
          data: {
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          },
        });
      },
      createVerification: async (data: any) => {
        return await adapter.create({
          model: 'verification',
          data: {
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          },
        });
      },
      createOrganization: async (data: any) => {
        return await adapter.create({
          model: 'organization',
          data: {
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
          },
        });
      },
      getUsers: async () => {
        try {
          if (typeof adapter.findMany === 'function') {
            const users = await adapter.findMany({ model: 'user' });
            return users || [];
          }
          if (typeof adapter.getUsers === 'function') {
            const users = await adapter.getUsers();
            return users || [];
          }
          return [];
        } catch (_error) {
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
        } catch (_error) {
          return [];
        }
      },
      findMany: async (options: {
        model: string;
        where?: any;
        limit?: number;
        offset?: number;
      }) => {
        try {
          if (typeof adapter.findMany === 'function') {
            return await adapter.findMany(options);
          }
          return [];
        } catch (_error) {
          return [];
        }
      },
    };

    return { ...adapter, ...authAdapter };
  } catch (_error) {
    return null;
  }
}

async function findAuthConfigPath(): Promise<string | null> {
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

export async function createMockUser(adapter: AuthAdapter, index: number) {
  const randomString = Math.random().toString(36).substring(2, 8);

  const userData = {
    email: `user${randomString}@example.com`,
    name: `User ${index}`,
    emailVerified: true,
    image: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return await adapter.createUser(userData);
}

// Random IP address generators for different countries
const _countryIPRanges = [
  // United States
  {
    country: 'United States',
    city: 'New York',
    region: 'NY',
    ranges: [
      { min: 8, max: 8 },
      { min: 24, max: 24 },
      { min: 32, max: 32 },
      { min: 64, max: 64 },
    ],
  },
  // United Kingdom
  {
    country: 'United Kingdom',
    city: 'London',
    region: 'England',
    ranges: [
      { min: 51, max: 51 },
      { min: 77, max: 77 },
      { min: 81, max: 81 },
      { min: 86, max: 86 },
    ],
  },
  // Germany
  {
    country: 'Germany',
    city: 'Berlin',
    region: 'Berlin',
    ranges: [
      { min: 46, max: 46 },
      { min: 78, max: 78 },
      { min: 85, max: 85 },
      { min: 134, max: 134 },
    ],
  },
  // Japan
  {
    country: 'Japan',
    city: 'Tokyo',
    region: 'Tokyo',
    ranges: [
      { min: 126, max: 126 },
      { min: 157, max: 157 },
      { min: 202, max: 202 },
      { min: 210, max: 210 },
    ],
  },
  // Australia
  {
    country: 'Australia',
    city: 'Sydney',
    region: 'NSW',
    ranges: [
      { min: 101, max: 101 },
      { min: 118, max: 118 },
      { min: 125, max: 125 },
      { min: 139, max: 139 },
    ],
  },
  // Canada
  {
    country: 'Canada',
    city: 'Toronto',
    region: 'ON',
    ranges: [
      { min: 24, max: 24 },
      { min: 70, max: 70 },
      { min: 142, max: 142 },
      { min: 174, max: 174 },
    ],
  },
  // France
  {
    country: 'France',
    city: 'Paris',
    region: 'Île-de-France',
    ranges: [
      { min: 37, max: 37 },
      { min: 51, max: 51 },
      { min: 78, max: 78 },
      { min: 90, max: 90 },
    ],
  },
  // Brazil
  {
    country: 'Brazil',
    city: 'São Paulo',
    region: 'SP',
    ranges: [
      { min: 177, max: 177 },
      { min: 179, max: 179 },
      { min: 186, max: 186 },
      { min: 200, max: 200 },
    ],
  },
  // India
  {
    country: 'India',
    city: 'Mumbai',
    region: 'Maharashtra',
    ranges: [
      { min: 103, max: 103 },
      { min: 117, max: 117 },
      { min: 125, max: 125 },
      { min: 180, max: 180 },
    ],
  },
  // South Korea
  {
    country: 'South Korea',
    city: 'Seoul',
    region: 'Seoul',
    ranges: [
      { min: 112, max: 112 },
      { min: 114, max: 114 },
      { min: 175, max: 175 },
      { min: 203, max: 203 },
    ],
  },
];

function generateRandomIP(): string {
  // Generate a random IP address from common ranges
  const commonRanges = [
    { min: '8.0.0.0', max: '8.255.255.255' }, // US
    { min: '24.0.0.0', max: '24.255.255.255' }, // US
    { min: '2.0.0.0', max: '2.255.255.255' }, // UK
    { min: '5.0.0.0', max: '5.255.255.255' }, // UK
    { min: '46.0.0.0', max: '46.255.255.255' }, // Germany
    { min: '62.0.0.0', max: '62.255.255.255' }, // Germany
    { min: '37.0.0.0', max: '37.255.255.255' }, // France
    { min: '126.0.0.0', max: '126.255.255.255' }, // Japan
    { min: '210.0.0.0', max: '210.255.255.255' }, // Japan
    { min: '1.0.0.0', max: '1.255.255.255' }, // Australia
    { min: '27.0.0.0', max: '27.255.255.255' }, // Australia
    { min: '177.0.0.0', max: '177.255.255.255' }, // Brazil
    { min: '201.0.0.0', max: '201.255.255.255' }, // Brazil
    { min: '103.0.0.0', max: '103.255.255.255' }, // India
    { min: '117.0.0.0', max: '117.255.255.255' }, // India
  ];

  const range = commonRanges[Math.floor(Math.random() * commonRanges.length)];
  const secondOctet = Math.floor(Math.random() * 256);
  const thirdOctet = Math.floor(Math.random() * 256);
  const fourthOctet = Math.floor(Math.random() * 255) + 1;

  return `${range.min.split('.')[0]}.${secondOctet}.${thirdOctet}.${fourthOctet}`;
}

export async function createMockSession(adapter: AuthAdapter, userId: string, index: number) {
  // Generate a random IP address
  const ipAddress = generateRandomIP();

  const sessionData = {
    userId: userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    token: `session_token_${index}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    ipAddress: ipAddress,
    userAgent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    updatedAt: new Date(),
  };

  return await adapter.createAccount(accountData);
}

export async function createMockVerification(adapter: AuthAdapter, _userId: string, index: number) {
  const verificationData = {
    identifier: `user${index}@example.com`,
    token: `verification_token_${index}_${Date.now()}`,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return await adapter.createVerification(verificationData);
}
