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
export declare function getAuthAdapter(configPath?: string): Promise<AuthAdapter | null>;
export declare function createMockUser(adapter: AuthAdapter, index: number): Promise<any>;
export declare function createMockSession(adapter: AuthAdapter, userId: string, index: number): Promise<any>;
export declare function createMockAccount(adapter: AuthAdapter, userId: string, index: number): Promise<any>;
export declare function createMockVerification(adapter: AuthAdapter, _userId: string, index: number): Promise<any>;
//# sourceMappingURL=auth-adapter.d.ts.map