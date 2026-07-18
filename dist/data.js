import { getAuthAdapter } from "./auth-adapter.js";
export async function getAuthData(_authConfig, type = "stats", options, configPath, preloadedAdapter) {
    try {
        // Use preloaded adapter if available (self-hosted mode), otherwise load from config
        const adapter = preloadedAdapter || (await getAuthAdapter(configPath));
        setTimeout(() => {
            if (adapter === null) {
                const githubUrl = "https://github.com/Kinfe123/better-auth-studio/issues";
                console.log(`No adapter found. if you think this is an issue from our side. please file a github issue at \x1b]8;;${githubUrl}\x1b\\${githubUrl}\x1b]8;;\x1b\\`);
            }
        }, 2000);
        switch (type) {
            case "stats":
                return await getRealStats(adapter);
            case "users":
                return await getRealUsers(adapter, options);
            case "sessions":
                return await getRealSessions(adapter, options);
            case "providers":
                return await getRealProviderStats(adapter);
            case "deleteUser":
                return await deleteRealUser(adapter, options.id);
            case "updateUser":
                return await updateRealUser(adapter, options.id, options.userData);
            case "analytics":
                return await getRealAnalytics(adapter, options);
            default:
                throw new Error(`Unknown data type: ${type}`);
        }
    }
    catch (_error) {
        throw new Error(`Failed to get auth data: ${_error}`);
    }
}
async function getRealStats(adapter) {
    try {
        let users = [];
        let sessions = [];
        if (adapter.findMany) {
            users = await adapter.findMany({ model: "user", limit: 100000 }).catch(() => []);
            sessions = await adapter.findMany({ model: "session", limit: 100000 }).catch(() => []);
        }
        else {
            users = adapter.getUsers ? await adapter.getUsers() : [];
            sessions = adapter.getSessions ? await adapter.getSessions() : [];
        }
        const now = new Date();
        const activeSessions = sessions.filter((s) => new Date(s.expiresAt || s.expires) > now);
        const activeUsers = new Set(activeSessions.map((s) => s.userId)).size;
        const usersByProvider = {
            email: users.length,
            github: 0,
            google: 0,
            apple: 0,
            microsoft: 0,
            twitter: 0,
            facebook: 0,
            instagram: 0,
            linkedin: 0,
            tiktok: 0,
            twitch: 0,
            discord: 0,
            reddit: 0,
            pinterest: 0,
            snapchat: 0,
            whatsapp: 0,
            telegram: 0,
        };
        const recentSignups = users
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map((user) => ({
            ...user,
            provider: "email",
        }));
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
            recentLogins,
        };
    }
    catch (_error) {
        throw new Error(`Failed to get auth data: ${_error}`);
    }
}
async function getRealUsers(adapter, options) {
    const { page, limit, search } = options;
    try {
        if (adapter.getUsers) {
            const allUsers = await adapter.getUsers();
            let filteredUsers = allUsers;
            if (search) {
                filteredUsers = allUsers.filter((user) => user.email?.toLowerCase().includes(search.toLowerCase()) ||
                    user.name?.toLowerCase().includes(search.toLowerCase()));
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
        return {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
        };
    }
    catch (_error) {
        throw new Error(`Failed to get auth data: ${_error}`);
    }
}
async function getRealSessions(adapter, options) {
    const { page, limit } = options;
    try {
        let allSessions = null;
        let getSessionsError;
        if (typeof adapter?.getSessions === "function") {
            try {
                const result = await adapter.getSessions();
                if (Array.isArray(result)) {
                    allSessions = result;
                }
            }
            catch (error) {
                getSessionsError = error;
            }
        }
        if (allSessions === null && typeof adapter?.findMany === "function") {
            allSessions = await adapter.findMany({ model: "session", limit: 100000 });
        }
        if (allSessions === null && getSessionsError) {
            throw getSessionsError;
        }
        if (Array.isArray(allSessions)) {
            const normalizedSessions = allSessions.map(normalizeSession);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedSessions = normalizedSessions.slice(startIndex, endIndex);
            return {
                data: paginatedSessions,
                total: normalizedSessions.length,
                page,
                limit,
                totalPages: Math.ceil(normalizedSessions.length / limit),
            };
        }
        return {
            data: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
        };
    }
    catch (_error) {
        throw new Error(`Failed to get auth data: ${_error}`);
    }
}
function normalizeSession(rawSession) {
    const session = rawSession && typeof rawSession === "object" ? rawSession : {};
    return {
        ...session,
        id: session.id ?? session.session_id,
        userId: session.userId ?? session.user_id,
        token: session.token ?? session.session_token,
        expiresAt: session.expiresAt ?? session.expires_at ?? session.expires,
        createdAt: session.createdAt ?? session.created_at,
        updatedAt: session.updatedAt ?? session.updated_at,
        userAgent: session.userAgent ?? session.user_agent,
        ipAddress: session.ipAddress ?? session.ip_address ?? session.ip,
        activeOrganizationId: session.activeOrganizationId ?? session.active_organization_id ?? session.active_organization,
        activeTeamId: session.activeTeamId ?? session.active_team_id ?? session.active_team,
    };
}
async function getRealProviderStats(_adapter) {
    try {
        return [
            { type: "email", users: 0, active: 0 },
            { type: "github", users: 0, active: 0 },
        ];
    }
    catch (_error) {
        throw new Error(`Failed to get auth data: ${_error}`);
    }
}
async function deleteRealUser(adapter, userId) {
    if (adapter.delete) {
        await adapter.delete({ model: "user", where: [{ field: "id", value: userId }] });
    }
    else {
    }
}
async function updateRealUser(adapter, userId, userData) {
    const updatedUser = await adapter.update({
        model: "user",
        where: [
            {
                field: "id",
                value: userId,
            },
        ],
        update: { ...userData },
    });
    return updatedUser;
}
function getMockData(type, options) {
    switch (type) {
        case "stats":
            return getMockStats();
        case "users":
            return getMockUsers(options);
        case "sessions":
            return getMockSessions(options);
        case "providers":
            return getMockProviderStats();
        case "deleteUser":
            return Promise.resolve();
        case "updateUser":
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
            google: 456,
            github: 234,
            email: 557,
        },
        recentSignups: generateMockUsers(5),
        recentLogins: generateMockSessions(5),
    };
}
function getMockUsers(options) {
    const { page, limit, search } = options;
    const allUsers = generateMockUsers(100);
    let filteredUsers = allUsers;
    if (search) {
        filteredUsers = allUsers.filter((user) => user.email?.toLowerCase().includes(search.toLowerCase()) ||
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
        totalPages: Math.ceil(filteredUsers.length / limit),
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
        totalPages: Math.ceil(allSessions.length / limit),
    };
}
function getMockProviderStats() {
    return [
        { type: "google", users: 456, active: 234 },
        { type: "github", users: 234, active: 123 },
        { type: "email", users: 557, active: 345 },
    ];
}
function generateMockUsers(count) {
    const users = [];
    const providers = ["google", "github", "email"];
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
function generateMockSessions(count) {
    const sessions = [];
    for (let i = 0; i < count; i++) {
        sessions.push({
            id: `session_${i + 1}`,
            userId: `user_${Math.floor(Math.random() * 100) + 1}`,
            expires: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        });
    }
    return sessions;
}
async function getRealAnalytics(adapter, options) {
    try {
        const { period, type, from, to } = options;
        let users = [];
        let sessions = [];
        if (adapter.findMany) {
            users = await adapter.findMany({ model: "user", limit: 100000 }).catch(() => []);
            sessions = await adapter.findMany({ model: "session", limit: 100000 }).catch(() => []);
        }
        else {
            users = adapter.getUsers ? await adapter.getUsers() : [];
            sessions = adapter.getSessions ? await adapter.getSessions() : [];
        }
        const organizations = adapter.findMany
            ? await adapter.findMany({ model: "organization", limit: 100000 }).catch(() => [])
            : [];
        const teams = adapter.findMany
            ? await adapter.findMany({ model: "team", limit: 100000 }).catch(() => [])
            : [];
        const now = new Date();
        let startDate;
        const endDate = to ? new Date(to) : now;
        if (from) {
            startDate = new Date(from);
        }
        else {
            switch (period) {
                case "1D":
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case "1W":
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "1M":
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case "3M":
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                case "6M":
                    startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
                    break;
                case "1Y":
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                case "Custom":
                    // For Custom, use from date if provided, otherwise default to 30 days
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default: {
                    // Get the earliest creation date from users
                    const earliestUser = users.reduce((earliest, user) => {
                        const userDate = new Date(user.createdAt);
                        return !earliest || userDate < new Date(earliest.createdAt) ? user : earliest;
                    }, null);
                    startDate = earliestUser
                        ? new Date(earliestUser.createdAt)
                        : new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                }
            }
        }
        // Generate time buckets based on period
        const buckets = [];
        if (period === "1D") {
            // 24 hours - last 24 hours from now
            for (let i = 0; i < 24; i++) {
                const bucketDate = new Date(endDate.getTime() - (23 - i) * 60 * 60 * 1000);
                const bucketStart = new Date(bucketDate);
                bucketStart.setMinutes(0, 0, 0);
                const bucketEnd = new Date(bucketStart);
                bucketEnd.setMinutes(59, 59, 999);
                const hour = bucketDate.getHours();
                buckets.push({ start: bucketStart, end: bucketEnd, label: `${hour}h` });
            }
        }
        else if (period === "1W") {
            // 7 days - last 7 days from today
            for (let i = 0; i < 7; i++) {
                const bucketDate = new Date(endDate.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
                const bucketStart = new Date(bucketDate);
                bucketStart.setHours(0, 0, 0, 0);
                const bucketEnd = new Date(bucketStart);
                bucketEnd.setHours(23, 59, 59, 999);
                const dayName = bucketDate.toLocaleDateString("en-US", { weekday: "short" });
                buckets.push({ start: bucketStart, end: bucketEnd, label: dayName });
            }
        }
        else if (period === "1M") {
            // 30 days - last 30 days from today
            for (let i = 0; i < 30; i++) {
                const bucketDate = new Date(endDate.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
                const bucketStart = new Date(bucketDate);
                bucketStart.setHours(0, 0, 0, 0);
                const bucketEnd = new Date(bucketStart);
                bucketEnd.setHours(23, 59, 59, 999);
                // Format as "Nov 5" or just the day number
                const monthName = bucketDate.toLocaleDateString("en-US", { month: "short" });
                const dayNum = bucketDate.getDate();
                const dayLabel = `${monthName} ${dayNum}`;
                buckets.push({ start: bucketStart, end: bucketEnd, label: dayLabel });
            }
        }
        else if (period === "3M") {
            // 3 months - last 3 months starting from current month
            const currentMonth = endDate.getMonth();
            const currentYear = endDate.getFullYear();
            for (let i = 0; i < 3; i++) {
                const monthDate = new Date(currentYear, currentMonth - (2 - i), 1);
                const bucketStart = new Date(monthDate);
                bucketStart.setHours(0, 0, 0, 0);
                const bucketEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                bucketEnd.setHours(23, 59, 59, 999);
                const monthName = monthDate.toLocaleDateString("en-US", { month: "short" });
                buckets.push({ start: bucketStart, end: bucketEnd, label: monthName });
            }
        }
        else if (period === "6M") {
            // 6 months - last 6 months starting from current month
            const currentMonth = endDate.getMonth();
            const currentYear = endDate.getFullYear();
            for (let i = 0; i < 6; i++) {
                const monthDate = new Date(currentYear, currentMonth - (5 - i), 1);
                const bucketStart = new Date(monthDate);
                bucketStart.setHours(0, 0, 0, 0);
                const bucketEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                bucketEnd.setHours(23, 59, 59, 999);
                const monthName = monthDate.toLocaleDateString("en-US", { month: "short" });
                buckets.push({ start: bucketStart, end: bucketEnd, label: monthName });
            }
        }
        else if (period === "1Y") {
            // 12 months - last 12 months starting from current month
            const currentMonth = endDate.getMonth();
            const currentYear = endDate.getFullYear();
            for (let i = 0; i < 12; i++) {
                const monthDate = new Date(currentYear, currentMonth - (11 - i), 1);
                const bucketStart = new Date(monthDate);
                bucketStart.setHours(0, 0, 0, 0);
                const bucketEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                bucketEnd.setHours(23, 59, 59, 999);
                const monthName = monthDate.toLocaleDateString("en-US", { month: "short" });
                buckets.push({ start: bucketStart, end: bucketEnd, label: monthName });
            }
        }
        else if (period === "Custom" || period === "ALL") {
            // Custom or ALL - divide into equal buckets
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
            const bucketCount = Math.min(Math.max(totalDays, 1), 30); // Max 30 buckets, min 1
            const bucketSize = totalDays / bucketCount;
            for (let i = 0; i < bucketCount; i++) {
                const bucketStart = new Date(startDate.getTime() + i * bucketSize * 24 * 60 * 60 * 1000);
                const bucketEnd = i === bucketCount - 1
                    ? endDate
                    : new Date(bucketStart.getTime() + bucketSize * 24 * 60 * 60 * 1000);
                // Generate better labels based on date range
                let label;
                if (totalDays <= 7) {
                    // For short ranges, show day names
                    label = bucketStart.toLocaleDateString("en-US", { weekday: "short" });
                }
                else if (totalDays <= 30) {
                    // For medium ranges, show month and day
                    label = bucketStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }
                else {
                    // For long ranges, show month only
                    label = bucketStart.toLocaleDateString("en-US", { month: "short" });
                }
                buckets.push({ start: bucketStart, end: bucketEnd, label });
            }
        }
        let data = [];
        if (type === "users") {
            // For users, count users created within each bucket (non-cumulative)
            data = buckets.map((bucket) => {
                return users.filter((user) => {
                    const createdAt = new Date(user.createdAt);
                    return createdAt >= bucket.start && createdAt <= bucket.end;
                }).length;
            });
        }
        else if (type === "newUsers") {
            // For new users, count users created within each bucket
            data = buckets.map((bucket) => {
                return users.filter((user) => {
                    const createdAt = new Date(user.createdAt);
                    return createdAt >= bucket.start && createdAt <= bucket.end;
                }).length;
            });
        }
        else if (type === "activeUsers") {
            // Logins = count of sessions (login events) created in each bucket
            data = buckets.map((bucket) => {
                return sessions.filter((session) => {
                    const sessionCreated = new Date(session.createdAt);
                    return sessionCreated >= bucket.start && sessionCreated <= bucket.end;
                }).length;
            });
        }
        else if (type === "sessions") {
            // Sessions = count of sessions created in each bucket
            data = buckets.map((bucket) => {
                return sessions.filter((session) => {
                    const sessionCreated = new Date(session.createdAt);
                    return sessionCreated >= bucket.start && sessionCreated <= bucket.end;
                }).length;
            });
        }
        else if (type === "organizations") {
            // For organizations, count orgs created within each bucket (non-cumulative)
            data = buckets.map((bucket) => {
                return organizations.filter((org) => {
                    const createdAt = new Date(org.createdAt);
                    return createdAt >= bucket.start && createdAt <= bucket.end;
                }).length;
            });
        }
        else if (type === "teams") {
            // For teams, count teams created within each bucket (non-cumulative)
            data = buckets.map((bucket) => {
                return teams.filter((team) => {
                    const createdAt = new Date(team.createdAt);
                    return createdAt >= bucket.start && createdAt <= bucket.end;
                }).length;
            });
        }
        // Calculate total
        const total = data.reduce((sum, val) => sum + val, 0);
        const average = total / data.length;
        // For activeUsers (logins), also compute unique users per bucket for tooltips
        let uniqueUsers;
        if (type === "activeUsers") {
            uniqueUsers = buckets.map((bucket) => {
                const bucketSessions = sessions.filter((session) => {
                    const sessionCreated = new Date(session.createdAt);
                    return sessionCreated >= bucket.start && sessionCreated <= bucket.end;
                });
                return new Set(bucketSessions.map((s) => s.userId)).size;
            });
        }
        const lastValue = data[data.length - 1] || 0;
        const previousValue = data[data.length - 2] || average;
        const percentageChange = previousValue > 0 ? ((lastValue - previousValue) / previousValue) * 100 : 0;
        // Calculate previous period total for comparison
        let previousTotal = 0;
        const getPreviousPeriodTotal = (prevStart, prevEnd) => {
            if (type === "users" || type === "newUsers") {
                return users.filter((user) => {
                    const createdAt = new Date(user.createdAt);
                    return createdAt >= prevStart && createdAt <= prevEnd;
                }).length;
            }
            else if (type === "activeUsers" || type === "sessions") {
                return sessions.filter((session) => {
                    const sessionCreated = new Date(session.createdAt);
                    return sessionCreated >= prevStart && sessionCreated <= prevEnd;
                }).length;
            }
            else if (type === "organizations") {
                return organizations.filter((org) => {
                    const createdAt = new Date(org.createdAt);
                    return createdAt >= prevStart && createdAt <= prevEnd;
                }).length;
            }
            else if (type === "teams") {
                return teams.filter((team) => {
                    const createdAt = new Date(team.createdAt);
                    return createdAt >= prevStart && createdAt <= prevEnd;
                }).length;
            }
            return 0;
        };
        if (period === "1D") {
            const prevStart = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
            previousTotal = getPreviousPeriodTotal(prevStart, startDate);
        }
        else if (period === "1W") {
            const prevStart = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            previousTotal = getPreviousPeriodTotal(prevStart, startDate);
        }
        return {
            data,
            labels: buckets.map((b) => b.label),
            total,
            previousTotal,
            average: Math.round(average),
            percentageChange: Math.round(percentageChange * 10) / 10,
            period,
            type,
            ...(uniqueUsers ? { uniqueUsers } : {}),
        };
    }
    catch (_error) {
        return {
            data: [],
            labels: [],
            total: 0,
            previousTotal: 0,
            average: 0,
            percentageChange: 0,
            period: options.period,
            type: options.type,
        };
    }
}
