import type { AuthConfig } from "./config.js";
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
    token?: string;
    expiresAt?: Date | string;
    expires?: Date | string;
    createdAt: Date | string;
    updatedAt?: Date | string;
    userAgent?: string | null;
    ipAddress?: string | null;
    ip?: string;
    activeOrganizationId?: string;
    activeTeamId?: string;
    [key: string]: unknown;
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
export declare function getAuthData(_authConfig: AuthConfig, type?: "stats" | "users" | "sessions" | "providers" | "deleteUser" | "updateUser" | "analytics", options?: any, configPath?: string, preloadedAdapter?: any): Promise<any>;
