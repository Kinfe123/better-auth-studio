import { AuthConfig } from './config.js';
interface StudioOptions {
    port: number;
    host: string;
    openBrowser: boolean;
    authConfig: AuthConfig;
}
export declare function startStudio(options: StudioOptions): Promise<import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>>;
export {};
//# sourceMappingURL=studio.d.ts.map