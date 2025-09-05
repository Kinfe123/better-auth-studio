"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
const express_1 = require("express");
const data_1 = require("./data");
const auth_adapter_1 = require("./auth-adapter");
async function findAuthConfigPath() {
    const { join, dirname } = await Promise.resolve().then(() => __importStar(require('path')));
    const { existsSync } = await Promise.resolve().then(() => __importStar(require('fs')));
    const possiblePaths = [
        'test-project/src/auth.ts',
        'test-project/src/auth.js',
        'src/auth.ts',
        'src/auth.js',
        'auth.ts',
        'auth.js'
    ];
    for (const path of possiblePaths) {
        if (existsSync(path)) {
            return join(process.cwd(), path);
        }
    }
    return null;
}
function createRoutes(authConfig) {
    const router = (0, express_1.Router)();
    // Health check with comprehensive system info
    router.get('/api/health', (req, res) => {
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
    router.get('/api/config', (req, res) => {
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
                Object.entries(authConfig.socialProviders).map(([provider, config]) => ({
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
    router.get('/api/stats', async (req, res) => {
        try {
            const stats = await (0, data_1.getAuthData)(authConfig, 'stats');
            res.json(stats);
        }
        catch (error) {
            console.error('Error fetching stats:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    });
    router.get('/api/counts', async (req, res) => {
        try {
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            let userCount = 0;
            let sessionCount = 0;
            let organizationCount = 0;
            if (adapter) {
                // Get user count
                try {
                    if (typeof adapter.findMany === 'function') {
                        const users = await adapter.findMany({ model: 'user', limit: 10000 });
                        userCount = users?.length || 0;
                    }
                }
                catch (error) {
                    console.error('Error fetching user count:', error);
                }
                // Get session count
                try {
                    if (typeof adapter.findMany === 'function') {
                        const sessions = await adapter.findMany({ model: 'session', limit: 10000 });
                        sessionCount = sessions?.length || 0;
                    }
                }
                catch (error) {
                    console.error('Error fetching session count:', error);
                }
                // Get organization count
                try {
                    if (typeof adapter.findMany === 'function') {
                        const organizations = await adapter.findMany({ model: 'organization', limit: 10000 });
                        organizationCount = organizations?.length || 0;
                    }
                }
                catch (error) {
                    console.error('Error fetching organization count:', error);
                    organizationCount = 0;
                }
            }
            res.json({
                users: userCount,
                sessions: sessionCount,
                organizations: organizationCount
            });
        }
        catch (error) {
            console.error('Error fetching counts:', error);
            res.status(500).json({ error: 'Failed to fetch counts' });
        }
    });
    router.get('/api/users', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search;
            try {
                const adapter = await (0, auth_adapter_1.getAuthAdapter)();
                if (adapter && typeof adapter.findMany === 'function') {
                    const allUsers = await adapter.findMany({ model: 'user', limit: limit });
                    console.log('Found users via findMany:', allUsers?.length || 0);
                    let filteredUsers = allUsers || [];
                    if (search) {
                        filteredUsers = filteredUsers.filter((user) => user.email?.toLowerCase().includes(search.toLowerCase()) ||
                            user.name?.toLowerCase().includes(search.toLowerCase()));
                    }
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
                    const transformedUsers = paginatedUsers.map((user) => ({
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
            }
            catch (adapterError) {
                console.error('Error fetching users from adapter:', adapterError);
            }
            const result = await (0, data_1.getAuthData)(authConfig, 'users', { page, limit, search });
            const transformedUsers = (result.data || []).map((user) => ({
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
                emailVerified: user.emailVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }));
            res.json({ users: transformedUsers });
        }
        catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ error: 'Failed to fetch users' });
        }
    });
    // Get sessions with pagination
    router.get('/api/sessions', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const sessions = await (0, data_1.getAuthData)(authConfig, 'sessions', { page, limit });
            res.json(sessions);
        }
        catch (error) {
            console.error('Error fetching sessions:', error);
            res.status(500).json({ error: 'Failed to fetch sessions' });
        }
    });
    // Get provider statistics
    router.get('/api/providers', async (req, res) => {
        try {
            const providers = await (0, data_1.getAuthData)(authConfig, 'providers');
            res.json(providers);
        }
        catch (error) {
            console.error('Error fetching providers:', error);
            res.status(500).json({ error: 'Failed to fetch providers' });
        }
    });
    // Delete user
    router.delete('/api/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await (0, data_1.getAuthData)(authConfig, 'deleteUser', { id });
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    });
    // Get all enabled plugins
    router.get('/api/plugins', async (req, res) => {
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
                const authModule = await Promise.resolve(`${authConfigPath}`).then(s => __importStar(require(s)));
                const auth = authModule.auth || authModule.default;
                if (!auth) {
                    return res.json({
                        plugins: [],
                        error: 'No auth export found',
                        configPath: authConfigPath
                    });
                }
                // Get all enabled plugins
                const plugins = auth.options?.plugins || [];
                const pluginInfo = plugins.map((plugin) => ({
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
            }
            catch (error) {
                console.error('Error getting plugins:', error);
                res.json({
                    plugins: [],
                    error: 'Failed to load auth config',
                    configPath: authConfigPath
                });
            }
        }
        catch (error) {
            console.error('Error fetching plugins:', error);
            res.status(500).json({ error: 'Failed to fetch plugins' });
        }
    });
    // Check if teams plugin is enabled
    router.get('/api/plugins/teams/status', async (req, res) => {
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
                const authModule = await Promise.resolve(`${authConfigPath}`).then(s => __importStar(require(s)));
                const auth = authModule.auth || authModule.default;
                if (!auth) {
                    return res.json({
                        enabled: false,
                        error: 'No auth export found',
                        configPath: authConfigPath
                    });
                }
                // Check if organization plugin has teams enabled
                const organizationPlugin = auth.options?.plugins?.find((plugin) => plugin.id === "organization");
                const teamsEnabled = organizationPlugin?.teams?.enabled === true;
                res.json({
                    enabled: teamsEnabled,
                    configPath: authConfigPath,
                    organizationPlugin: organizationPlugin || null
                });
            }
            catch (error) {
                console.error('Error checking teams plugin:', error);
                res.json({
                    enabled: false,
                    error: 'Failed to load auth config',
                    configPath: authConfigPath
                });
            }
        }
        catch (error) {
            console.error('Error checking teams status:', error);
            res.status(500).json({ error: 'Failed to check teams status' });
        }
    });
    // Get invitations for an organization
    router.get('/api/organizations/:orgId/invitations', async (req, res) => {
        try {
            const { orgId } = req.params;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (adapter && typeof adapter.findMany === 'function') {
                try {
                    const invitations = await adapter.findMany({
                        model: 'invitation',
                        where: { organizationId: orgId },
                        limit: 10000
                    });
                    const transformedInvitations = (invitations || []).map((invitation) => ({
                        id: invitation.id,
                        email: invitation.email,
                        role: invitation.role || 'member',
                        status: invitation.status || 'pending',
                        organizationId: invitation.organizationId,
                        teamId: invitation.teamId,
                        invitedBy: invitation.invitedBy,
                        expiresAt: invitation.expiresAt,
                        createdAt: invitation.createdAt
                    }));
                    res.json({ success: true, invitations: transformedInvitations });
                    return;
                }
                catch (error) {
                    console.error('Error fetching invitations from adapter:', error);
                }
            }
            // Fallback to mock data or empty array
            res.json({ success: true, invitations: [] });
        }
        catch (error) {
            console.error('Error fetching invitations:', error);
            res.status(500).json({ error: 'Failed to fetch invitations' });
        }
    });
    // Get members for an organization
    router.get('/api/organizations/:orgId/members', async (req, res) => {
        try {
            const { orgId } = req.params;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (adapter && typeof adapter.findMany === 'function') {
                try {
                    const members = await adapter.findMany({
                        model: 'member',
                        where: { organizationId: orgId },
                        limit: 10000
                    });
                    // Get user details for each member
                    const membersWithUsers = await Promise.all((members || []).map(async (member) => {
                        try {
                            if (adapter.findMany) {
                                const users = await adapter.findMany({
                                    model: 'user',
                                    where: { id: member.userId },
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
                        }
                        catch (error) {
                            console.error('Error fetching user for member:', error);
                            return null;
                        }
                    }));
                    const validMembers = membersWithUsers.filter(member => member && member.user);
                    res.json({ success: true, members: validMembers });
                    return;
                }
                catch (error) {
                    console.error('Error fetching members from adapter:', error);
                }
            }
            // Fallback to empty array
            res.json({ success: true, members: [] });
        }
        catch (error) {
            console.error('Error fetching members:', error);
            res.status(500).json({ error: 'Failed to fetch members' });
        }
    });
    // Seed members from existing users
    router.post('/api/organizations/:orgId/seed-members', async (req, res) => {
        try {
            const { orgId } = req.params;
            const { count = 5 } = req.body;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (!adapter) {
                return res.status(500).json({ error: 'Auth adapter not available' });
            }
            // Get existing users to add as members
            if (!adapter.findMany) {
                return res.status(500).json({ error: 'Adapter findMany method not available' });
            }
            const users = await adapter.findMany({ model: 'user', limit: 10000 });
            if (!users || users.length === 0) {
                return res.json({ success: false, error: 'No users available to add as members' });
            }
            // Get existing members to avoid duplicates
            let existingMembers = [];
            try {
                if (adapter.findMany) {
                    existingMembers = await adapter.findMany({
                        model: 'member',
                        where: { organizationId: orgId },
                        limit: 10000
                    }) || [];
                }
            }
            catch (error) {
                console.log('No existing members or member model not available');
            }
            const existingUserIds = existingMembers.map((m) => m.userId);
            const availableUsers = users.filter((user) => !existingUserIds.includes(user.id));
            if (availableUsers.length === 0) {
                return res.json({ success: false, error: 'All users are already members of this organization' });
            }
            const results = [];
            const usersToAdd = availableUsers.slice(0, count);
            for (const user of usersToAdd) {
                try {
                    // For now, simulate member creation since we don't have the exact adapter method
                    const member = {
                        id: `member_${Date.now()}_${Math.random()}`,
                        userId: user.id,
                        organizationId: orgId,
                        role: 'member',
                        joinedAt: new Date().toISOString(),
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            emailVerified: user.emailVerified
                        }
                    };
                    results.push({
                        success: true,
                        member
                    });
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Error seeding members:', error);
            res.status(500).json({ error: 'Failed to seed members' });
        }
    });
    // Create invitation
    router.post('/api/organizations/:orgId/invitations', async (req, res) => {
        try {
            const { orgId } = req.params;
            const { email, role = 'member' } = req.body;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
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
                invitedBy: 'admin' // In real app, get from session
            };
            // For now, simulate invitation creation
            const invitation = {
                id: `inv_${Date.now()}`,
                ...invitationData
            };
            res.json({ success: true, invitation });
        }
        catch (error) {
            console.error('Error creating invitation:', error);
            res.status(500).json({ error: 'Failed to create invitation' });
        }
    });
    // Get teams for an organization
    router.get('/api/organizations/:orgId/teams', async (req, res) => {
        try {
            const { orgId } = req.params;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (adapter && typeof adapter.findMany === 'function') {
                try {
                    const teams = await adapter.findMany({
                        model: 'team',
                        where: { organizationId: orgId },
                        limit: 10000
                    });
                    const transformedTeams = (teams || []).map((team) => ({
                        id: team.id,
                        name: team.name,
                        slug: team.slug,
                        organizationId: team.organizationId,
                        metadata: team.metadata,
                        createdAt: team.createdAt,
                        updatedAt: team.updatedAt,
                        memberCount: team.memberCount || 0
                    }));
                    res.json({ success: true, teams: transformedTeams });
                    return;
                }
                catch (error) {
                    console.error('Error fetching teams from adapter:', error);
                }
            }
            // Fallback to mock data or empty array
            res.json({ success: true, teams: [] });
        }
        catch (error) {
            console.error('Error fetching teams:', error);
            res.status(500).json({ error: 'Failed to fetch teams' });
        }
    });
    // Create team
    router.post('/api/organizations/:orgId/teams', async (req, res) => {
        try {
            const { orgId } = req.params;
            const { name, slug } = req.body;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (!adapter) {
                return res.status(500).json({ error: 'Auth adapter not available' });
            }
            const teamData = {
                name,
                slug,
                organizationId: orgId,
                createdAt: new Date(),
                updatedAt: new Date(),
                memberCount: 0
            };
            // For now, simulate team creation
            const team = {
                id: `team_${Date.now()}`,
                ...teamData
            };
            res.json({ success: true, team });
        }
        catch (error) {
            console.error('Error creating team:', error);
            res.status(500).json({ error: 'Failed to create team' });
        }
    });
    // Update team
    router.put('/api/teams/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, slug } = req.body;
            const updatedTeam = {
                id,
                name,
                slug,
                updatedAt: new Date().toISOString()
            };
            res.json({ success: true, team: updatedTeam });
        }
        catch (error) {
            console.error('Error updating team:', error);
            res.status(500).json({ error: 'Failed to update team' });
        }
    });
    // Delete team
    router.delete('/api/teams/:id', async (req, res) => {
        try {
            const { id } = req.params;
            // For now, simulate the deletion
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error deleting team:', error);
            res.status(500).json({ error: 'Failed to delete team' });
        }
    });
    // Check if organization plugin is enabled
    router.get('/api/plugins/organization/status', async (req, res) => {
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
                const authModule = await Promise.resolve(`${authConfigPath}`).then(s => __importStar(require(s)));
                const auth = authModule.auth || authModule.default;
                console.log({ auth });
                if (!auth) {
                    return res.json({
                        enabled: false,
                        error: 'No auth export found',
                        configPath: authConfigPath
                    });
                }
                const hasOrganizationPlugin = auth.options?.plugins?.find((plugin) => plugin.id === "organization");
                console.log({ hasOrganizationPlugin });
                res.json({
                    enabled: !!hasOrganizationPlugin,
                    configPath: authConfigPath,
                    availablePlugins: auth.options?.plugins?.map((p) => p.id) || [],
                    organizationPlugin: hasOrganizationPlugin || null
                });
            }
            catch (error) {
                console.error('Error checking organization plugin:', error);
                res.json({
                    enabled: false,
                    error: 'Failed to load auth config',
                    configPath: authConfigPath
                });
            }
        }
        catch (error) {
            console.error('Error checking plugin status:', error);
            res.status(500).json({ error: 'Failed to check plugin status' });
        }
    });
    router.get('/api/organizations', async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const search = req.query.search;
            try {
                const adapter = await (0, auth_adapter_1.getAuthAdapter)();
                if (adapter && typeof adapter.findMany === 'function') {
                    const allOrganizations = await adapter.findMany({ model: 'organization' });
                    console.log('Found organizations via findMany:', allOrganizations?.length || 0);
                    let filteredOrganizations = allOrganizations || [];
                    if (search) {
                        filteredOrganizations = filteredOrganizations.filter((org) => org.name?.toLowerCase().includes(search.toLowerCase()) ||
                            org.slug?.toLowerCase().includes(search.toLowerCase()));
                    }
                    // Apply pagination
                    const startIndex = (page - 1) * limit;
                    const endIndex = startIndex + limit;
                    const paginatedOrganizations = filteredOrganizations.slice(startIndex, endIndex);
                    const transformedOrganizations = paginatedOrganizations.map((org) => ({
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
            }
            catch (adapterError) {
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
        }
        catch (error) {
            console.error('Error fetching organizations:', error);
            res.status(500).json({ error: 'Failed to fetch organizations' });
        }
    });
    router.post('/api/organizations', async (req, res) => {
        try {
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (!adapter) {
                return res.status(500).json({ error: 'Auth adapter not available' });
            }
            const orgData = req.body;
            if (!orgData.slug && orgData.name) {
                orgData.slug = orgData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            }
            const organization = await adapter.createOrganization(orgData);
            res.json({ success: true, organization });
        }
        catch (error) {
            console.error('Error creating organization:', error);
            res.status(500).json({ error: 'Failed to create organization' });
        }
    });
    router.put('/api/organizations/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const orgData = req.body;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
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
        }
        catch (error) {
            console.error('Error updating organization:', error);
            res.status(500).json({ error: 'Failed to update organization' });
        }
    });
    // Get single organization
    router.get('/api/organizations/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (adapter && typeof adapter.findMany === 'function') {
                const organizations = await adapter.findMany({ model: 'organization', limit: 10000 });
                const organization = organizations?.find((org) => org.id === id);
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
        }
        catch (error) {
            console.error('Error fetching organization:', error);
            res.status(500).json({ error: 'Failed to fetch organization' });
        }
    });
    router.delete('/api/organizations/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
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
        }
        catch (error) {
            console.error('Error deleting organization:', error);
            res.status(500).json({ error: 'Failed to delete organization' });
        }
    });
    // Create user
    router.post('/api/users', async (req, res) => {
        try {
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (!adapter) {
                return res.status(500).json({ error: 'Auth adapter not available' });
            }
            const userData = req.body;
            const user = await adapter.createUser(userData);
            res.json({ success: true, user });
        }
        catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    });
    // Update user
    router.put('/api/users/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const userData = req.body;
            const updatedUser = await (0, data_1.getAuthData)(authConfig, 'updateUser', { id, userData });
            res.json({ success: true, user: updatedUser });
        }
        catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    });
    // Seed data endpoints
    router.post('/api/seed/users', async (req, res) => {
        try {
            const { count = 1 } = req.body;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            console.log({ adapter });
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
                    const user = await (0, auth_adapter_1.createMockUser)(adapter, i + 1);
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
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Error seeding users:', error);
            res.status(500).json({ error: 'Failed to seed users' });
        }
    });
    router.post('/api/seed/sessions', async (req, res) => {
        try {
            const { count = 1 } = req.body;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (!adapter) {
                return res.status(500).json({ error: 'Auth adapter not available' });
            }
            // First create a user if needed
            let user;
            try {
                user = await (0, auth_adapter_1.createMockUser)(adapter, 1);
            }
            catch (error) {
                return res.status(500).json({ error: 'Failed to create user for session' });
            }
            const results = [];
            for (let i = 0; i < count; i++) {
                try {
                    // Check if the adapter has the createSession method
                    if (typeof adapter.createSession !== 'function') {
                        throw new Error('createSession method not available on adapter');
                    }
                    const session = await (0, auth_adapter_1.createMockSession)(adapter, user.id, i + 1);
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
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Error seeding sessions:', error);
            res.status(500).json({ error: 'Failed to seed sessions' });
        }
    });
    router.post('/api/seed/accounts', async (req, res) => {
        try {
            const { count = 1 } = req.body;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
            if (!adapter) {
                return res.status(500).json({ error: 'Auth adapter not available' });
            }
            // First create a user if needed
            let user;
            try {
                user = await (0, auth_adapter_1.createMockUser)(adapter, 1);
            }
            catch (error) {
                return res.status(500).json({ error: 'Failed to create user for account' });
            }
            const results = [];
            for (let i = 0; i < count; i++) {
                try {
                    // Check if the adapter has the createAccount method
                    if (typeof adapter.createAccount !== 'function') {
                        throw new Error('createAccount method not available on adapter');
                    }
                    const account = await (0, auth_adapter_1.createMockAccount)(adapter, user.id, i + 1);
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
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Error seeding accounts:', error);
            res.status(500).json({ error: 'Failed to seed accounts' });
        }
    });
    router.post('/api/seed/verifications', async (req, res) => {
        try {
            const { count = 1 } = req.body;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
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
                    const verification = await (0, auth_adapter_1.createMockVerification)(adapter, `user${i + 1}@example.com`, i + 1);
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
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Error seeding verifications:', error);
            res.status(500).json({ error: 'Failed to seed verifications' });
        }
    });
    router.post('/api/seed/organizations', async (req, res) => {
        try {
            const { count = 1 } = req.body;
            const adapter = await (0, auth_adapter_1.getAuthAdapter)();
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
                }
                catch (error) {
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
        }
        catch (error) {
            console.error('Error seeding organizations:', error);
            res.status(500).json({ error: 'Failed to seed organizations' });
        }
    });
    return router;
}
//# sourceMappingURL=routes.js.map