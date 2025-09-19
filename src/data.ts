import { getAuthAdapter } from './auth-adapter.js';
import type { AuthConfig } from './config.js';

export interface User {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
  provider?: string;
  lastSignIn?: Date;
}

export interface Session {
  id: string;
  userId: string;
  expires: Date;
  createdAt: Date;
  userAgent?: string;
  ip?: string;
}

export interface AuthStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  activeSessions: number;
  usersByProvider: Record<string, number>;
  recentSignups: User[];
  recentLogins: Session[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAuthData(
  authConfig: AuthConfig,
  type: 'stats' | 'users' | 'sessions' | 'providers' | 'deleteUser' | 'updateUser' = 'stats',
  options?: any,
  configPath?: string
): Promise<any> {
  try {
    const adapter = await getAuthAdapter(configPath);

    if (!adapter) {
      console.log('No adapter available, falling back to mock data');
      return getMockData(type, options);
    }

    switch (type) {
      case 'stats':
        return await getRealStats(adapter);
      case 'users':
        return await getRealUsers(adapter, options);
      case 'sessions':
        return await getRealSessions(adapter, options);
      case 'providers':
        return await getRealProviderStats(adapter);
      case 'deleteUser':
        return await deleteRealUser(adapter, options.id);
      case 'updateUser':
        return await updateRealUser(adapter, options.id, options.userData);
      default:
        throw new Error(`Unknown data type: ${type}`);
    }
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return getMockData(type, options);
  }
}

async function getRealStats(adapter: any): Promise<AuthStats> {
  try {
    const users = adapter.getUsers ? await adapter.getUsers() : [];
    const sessions = adapter.getSessions ? await adapter.getSessions() : [];

    const now = new Date();
    const activeSessions = sessions.filter((s: any) => new Date(s.expiresAt || s.expires) > now);
    const activeUsers = new Set(activeSessions.map((s: any) => s.userId)).size;

    const usersByProvider: Record<string, number> = {
      email: users.length,
      github: 0,
    };

    const recentSignups = users
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((user: any) => ({
        ...user,
        provider: 'email',
      }));

    const recentLogins = activeSessions
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalUsers: users.length,
      activeUsers,
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      usersByProvider,
      recentSignups,
      recentLogins,
    };
  } catch (error) {
    console.error('Error fetching stats from adapter:', error);
    return getMockData('stats');
  }
}

async function getRealUsers(
  adapter: any,
  options: { page: number; limit: number; search?: string }
): Promise<PaginatedResult<User>> {
  const { page, limit, search } = options;

  try {
    if (adapter.getUsers) {
      const allUsers = await adapter.getUsers();

      let filteredUsers = allUsers;
      if (search) {
        filteredUsers = allUsers.filter(
          (user: any) =>
            user.email?.toLowerCase().includes(search.toLowerCase()) ||
            user.name?.toLowerCase().includes(search.toLowerCase())
        );
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      return {
        data: paginatedUsers,
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit),
      };
    }

    return getMockData('users', options);
  } catch (error) {
    console.error('Error fetching users from adapter:', error);
    return getMockData('users', options);
  }
}

async function getRealSessions(
  adapter: any,
  options: { page: number; limit: number }
): Promise<PaginatedResult<Session>> {
  const { page, limit } = options;

  try {
    if (adapter.getSessions) {
      const allSessions = await adapter.getSessions();

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSessions = allSessions.slice(startIndex, endIndex);

      return {
        data: paginatedSessions,
        total: allSessions.length,
        page,
        limit,
        totalPages: Math.ceil(allSessions.length / limit),
      };
    }

    return getMockData('sessions', options);
  } catch (error) {
    console.error('Error fetching sessions from adapter:', error);
    return getMockData('sessions', options);
  }
}

async function getRealProviderStats(adapter: any) {
  try {
    return [
      { type: 'email', users: 0, active: 0 },
      { type: 'github', users: 0, active: 0 },
    ];
  } catch (error) {
    console.error('Error fetching provider stats from adapter:', error);
    return getMockData('providers');
  }
}

async function deleteRealUser(adapter: any, userId: string): Promise<void> {
  try {
    if (adapter.delete) {
      await adapter.delete({ model: 'user', where: [{ field: 'id', value: userId }] });
    } else {
      console.warn('Delete method not available on adapter');
    }
  } catch (error) {
    console.error('Error deleting user from adapter:', error);
    throw error;
  }
}

async function updateRealUser(
  adapter: any,
  userId: string,
  userData: Partial<User>
): Promise<User> {
  console.log({ userId, userData });
  try {
    const updatedUser = await adapter.update({
      model: 'user',
      where: [
        {
          field: 'id',
          value: userId,
        },
      ],
      update: { ...userData },
    });
    return updatedUser;
  } catch (error) {
    console.error('Error updating user from adapter:', error);
    throw error;
  }
}

function getMockData(type: string, options?: any): any {
  switch (type) {
    case 'stats':
      return getMockStats();
    case 'users':
      return getMockUsers(options);
    case 'sessions':
      return getMockSessions(options);
    case 'providers':
      return getMockProviderStats();
    case 'deleteUser':
      return Promise.resolve();
    case 'updateUser':
      return Promise.resolve(generateMockUsers(1)[0]);
    default:
      throw new Error(`Unknown data type: ${type}`);
  }
}

function getMockStats(): AuthStats {
  return {
    totalUsers: 1247,
    activeUsers: 892,
    totalSessions: 3456,
    activeSessions: 1234,
    usersByProvider: {
      google: 456,
      github: 234,
      email: 557,
    },
    recentSignups: generateMockUsers(5),
    recentLogins: generateMockSessions(5),
  };
}

function getMockUsers(options: {
  page: number;
  limit: number;
  search?: string;
}): PaginatedResult<User> {
  const { page, limit, search } = options;
  const allUsers = generateMockUsers(100);

  let filteredUsers = allUsers;
  if (search) {
    filteredUsers = allUsers.filter(
      (user) =>
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  const data = filteredUsers.slice(start, end);

  return {
    data,
    total: filteredUsers.length,
    page,
    limit,
    totalPages: Math.ceil(filteredUsers.length / limit),
  };
}

function getMockSessions(options: { page: number; limit: number }): PaginatedResult<Session> {
  const { page, limit } = options;
  const allSessions = generateMockSessions(200);

  const start = (page - 1) * limit;
  const end = start + limit;
  const data = allSessions.slice(start, end);

  return {
    data,
    total: allSessions.length,
    page,
    limit,
    totalPages: Math.ceil(allSessions.length / limit),
  };
}

function getMockProviderStats() {
  return [
    { type: 'google', users: 456, active: 234 },
    { type: 'github', users: 234, active: 123 },
    { type: 'email', users: 557, active: 345 },
  ];
}

function generateMockUsers(count: number): User[] {
  const users: User[] = [];
  const providers = ['google', 'github', 'email'];

  for (let i = 0; i < count; i++) {
    const provider = providers[Math.floor(Math.random() * providers.length)];
    users.push({
      id: `user_${i + 1}`,
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`,
      image: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i + 1}`,
      emailVerified: Math.random() > 0.3 ? new Date() : undefined,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
      provider,
      lastSignIn: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }

  return users;
}

function generateMockSessions(count: number): Session[] {
  const sessions: Session[] = [];

  for (let i = 0; i < count; i++) {
    sessions.push({
      id: `session_${i + 1}`,
      userId: `user_${Math.floor(Math.random() * 100) + 1}`,
      expires: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
    });
  }

  return sessions;
}
