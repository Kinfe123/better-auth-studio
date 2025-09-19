import { WebSocketServer } from 'ws';
import type { AuthConfig } from './config.js';
interface StudioOptions {
    port: number;
    host: string;
    openBrowser: boolean;
    authConfig: AuthConfig;
    configPath?: string;
    watchMode?: boolean;
    geoDbPath?: string;
}
export declare function startStudio(options: StudioOptions): Promise<{
    server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    wss: WebSocketServer | null;
}>;
export {};
//# sourceMappingURL=studio.d.ts.map