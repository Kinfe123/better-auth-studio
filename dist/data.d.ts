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
export declare function getAuthData(_authConfig: AuthConfig, type?: 'stats' | 'users' | 'sessions' | 'providers' | 'deleteUser' | 'updateUser' | 'analytics', options?: any, configPath?: string): Promise<any>;
//# sourceMappingURL=data.d.ts.map