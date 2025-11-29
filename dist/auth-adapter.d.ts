import type { InternalAdapter } from 'better-auth';
type OptionalFields<T> = {
    [K in keyof T]?: T[K];
};
type UserInternalAdapter = OptionalFields<InternalAdapter>;
export interface AuthAdapter extends UserInternalAdapter {
    createSession: (data: any) => Promise<any>;
    createAccount: (data: any) => Promise<any>;
    createVerification: (data: any) => Promise<any>;
    createOrganization: (data: any) => Promise<any>;
    create?: (...args: any[]) => Promise<any>;
    update?: (...args: any[]) => Promise<any>;
    delete?: (...args: any[]) => Promise<any>;
    getUsers?: () => Promise<any[]>;
    getSessions?: () => Promise<any[]>;
    findMany<T = any>(options: {
        model: string;
        where?: any;
        limit?: number;
        offset?: number;
    }): Promise<T[]>;
}
export declare function getAuthAdapter(configPath?: string): Promise<AuthAdapter | null>;
export declare function createMockUser(adapter: AuthAdapter, index: number, role?: string): Promise<(Record<string, any> & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null | undefined;
}) | null>;
export declare function createMockSession(adapter: AuthAdapter, userId: string, index: number): Promise<any>;
export declare function createMockAccount(adapter: AuthAdapter, userId: string, index: number, providerId?: string): Promise<any>;
export declare function createMockVerification(adapter: AuthAdapter, _userId: string, index: number): Promise<any>;
export {};
//# sourceMappingURL=auth-adapter.d.ts.map