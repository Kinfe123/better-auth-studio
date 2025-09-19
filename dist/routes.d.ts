import { Router } from 'express';
import type { AuthConfig } from './config.js';
export declare function safeImportAuthConfig(authConfigPath: string): Promise<any>;
export declare function createRoutes(authConfig: AuthConfig, configPath?: string, geoDbPath?: string): Router;
//# sourceMappingURL=routes.d.ts.map