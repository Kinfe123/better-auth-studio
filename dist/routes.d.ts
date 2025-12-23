import { Router } from 'express';
import type { AuthConfig } from './config.js';
import type { StudioAccessConfig } from './utils/html-injector.js';
export declare function safeImportAuthConfig(authConfigPath: string, noCache?: boolean): Promise<any>;
export declare function createRoutes(authConfig: AuthConfig, configPath?: string, geoDbPath?: string, preloadedAdapter?: any, preloadedAuthOptions?: any, accessConfig?: StudioAccessConfig, authInstance?: any): Router;
export declare function handleStudioApiRequest(ctx: {
    path: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    auth: any;
    basePath?: string;
    configPath?: string;
    accessConfig?: StudioAccessConfig;
}): Promise<{
    status: number;
    data: any;
    cookies?: Array<{
        name: string;
        value: string;
        options: any;
    }>;
}>;
//# sourceMappingURL=routes.d.ts.map