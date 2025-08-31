"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthData = getAuthData;
const auth_adapter_1 = require("./auth-adapter");
// Fetch real data from Better Auth database using the adapter
async function getAuthData(authConfig, type = 'stats', options) {
    try {
        const adapter = await (0, auth_adapter_1.getAuthAdapter)();
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
    }
    catch (error) {
        console.error(`Error fetching ${type} data:`, error);
        // Fallback to mock data
        return getMockData(type, options);
    }
}
async function getRealStats(adapter) {
    try {
        // Get users and sessions from adapter
        const users = adapter.getUsers ? await adapter.getUsers() : [];
        const sessions = adapter.getSessions ? await adapter.getSessions() : [];
        const now = new Date();
        const activeSessions = sessions.filter((s) => new Date(s.expiresAt || s.expires) > now);
        const activeUsers = new Set(activeSessions.map((s) => s.userId)).size;
        // Group users by provider (simplified for now)
        const usersByProvider = {
            email: users.length, // Assume all users have email/password
            github: 0 // Will be updated if we have social providers
        };
        // Get recent signups (last 5 users)
        const recentSignups = users
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((user) => ({
            ...user,
            provider: 'email' // Default provider
        }));
        // Get recent logins (last 5 sessions)
        const recentLogins = activeSessions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
        return {
            totalUsers: users.length,
            activeUsers,
            totalSessions: sessions.length,
            activeSessions: activeSessions.length,
            usersByProvider,
            recentSignups,
            recentLogins
        };
    }
    catch (error) {
        console.error('Error fetching stats from adapter:', error);
        return getMockData('stats');
    }
}
async function getRealUsers(adapter, options) {
    const { page, limit, search } = options;
    try {
        // Use the adapter's getUsers method if available
        if (adapter.getUsers) {
            const allUsers = await adapter.getUsers();
            // Apply search filter if provided
            let filteredUsers = allUsers;
            if (search) {
                filteredUsers = allUsers.filter((user) => user.email?.toLowerCase().includes(search.toLowerCase()) ||
                    user.name?.toLowerCase().includes(search.toLowerCase()));
            }
            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
            return {
                data: paginatedUsers,
                total: filteredUsers.length,
                page,
                limit,
                totalPages: Math.ceil(filteredUsers.length / limit)
            };
        }
        // Fallback to mock data if getUsers is not available
        return getMockData('users', options);
    }
    catch (error) {
        console.error('Error fetching users from adapter:', error);
        return getMockData('users', options);
    }
}
async function getRealSessions(adapter, options) {
    const { page, limit } = options;
    try {
        // Use the adapter's getSessions method if available
        if (adapter.getSessions) {
            const allSessions = await adapter.getSessions();
            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedSessions = allSessions.slice(startIndex, endIndex);
            return {
                data: paginatedSessions,
                total: allSessions.length,
                page,
                limit,
                totalPages: Math.ceil(allSessions.length / limit)
            };
        }
        // Fallback to mock data if getSessions is not available
        return getMockData('sessions', options);
    }
    catch (error) {
        console.error('Error fetching sessions from adapter:', error);
        return getMockData('sessions', options);
    }
}
async function getRealProviderStats(adapter) {
    try {
        // For now, return a simplified provider stats
        // In a real implementation, you'd query accounts from the adapter
        return [
            { type: 'email', users: 0, active: 0 },
            { type: 'github', users: 0, active: 0 }
        ];
    }
    catch (error) {
        console.error('Error fetching provider stats from adapter:', error);
        return getMockData('providers');
    }
}
async function deleteRealUser(adapter, userId) {
    try {
        // Use adapter's delete method if available
        if (adapter.delete) {
            await adapter.delete({ model: 'user', where: { id: userId } });
        }
        else {
            console.warn('Delete method not available on adapter');
        }
    }
    catch (error) {
        console.error('Error deleting user from adapter:', error);
        throw error;
    }
}
async function updateRealUser(adapter, userId, userData) {
    try {
        // Use adapter's update method if available
        if (adapter.update) {
            const updatedUser = await adapter.update({ model: 'user', where: { id: userId }, data: userData });
            return updatedUser;
        }
        else {
            console.warn('Update method not available on adapter');
            throw new Error('Update method not available');
        }
    }
    catch (error) {
        console.error('Error updating user from adapter:', error);
        throw error;
    }
}
// Mock data fallback
function getMockData(type, options) {
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
function getMockStats() {
    return {
        totalUsers: 1247,
        activeUsers: 892,
        totalSessions: 3456,
        activeSessions: 1234,
        usersByProvider: {
            'google': 456,
            'github': 234,
            'email': 557
        },
        recentSignups: generateMockUsers(5),
        recentLogins: generateMockSessions(5)
    };
}
function getMockUsers(options) {
    const { page, limit, search } = options;
    const allUsers = generateMockUsers(100);
    let filteredUsers = allUsers;
    if (search) {
        filteredUsers = allUsers.filter(user => user.email?.toLowerCase().includes(search.toLowerCase()) ||
            user.name?.toLowerCase().includes(search.toLowerCase()));
    }
    const start = (page - 1) * limit;
    const end = start + limit;
    const data = filteredUsers.slice(start, end);
    return {
        data,
        total: filteredUsers.length,
        page,
        limit,
        totalPages: Math.ceil(filteredUsers.length / limit)
    };
}
function getMockSessions(options) {
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
        totalPages: Math.ceil(allSessions.length / limit)
    };
}
function getMockProviderStats() {
    return [
        { type: 'google', users: 456, active: 234 },
        { type: 'github', users: 234, active: 123 },
        { type: 'email', users: 557, active: 345 }
    ];
}
function generateMockUsers(count) {
    const users = [];
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
            lastSignIn: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
    }
    return users;
}
function generateMockSessions(count) {
    const sessions = [];
    for (let i = 0; i < count; i++) {
        sessions.push({
            id: `session_${i + 1}`,
            userId: `user_${Math.floor(Math.random() * 100) + 1}`,
            expires: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`
        });
    }
    return sessions;
}
//# sourceMappingURL=data.js.map