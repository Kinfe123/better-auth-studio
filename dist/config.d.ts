export interface AuthProvider {
    type: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    [key: string]: any;
}
export interface AuthDatabase {
    url?: string;
    type?: string;
    dialect?: string;
    [key: string]: any;
}
export interface AuthConfig {
    database?: AuthDatabase;
    providers?: AuthProvider[];
    socialProviders?: Record<string, any>;
    emailAndPassword?: any;
    session?: any;
    secret?: string;
    rateLimit?: any;
    [key: string]: any;
}
export declare function findAuthConfig(): Promise<AuthConfig | null>;
export declare function extractBetterAuthConfig(content: string): AuthConfig | null;
//# sourceMappingURL=config.d.ts.map