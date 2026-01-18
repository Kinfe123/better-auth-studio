export type UniversalRequest = {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
};
export type UniversalResponse = {
    status: number;
    headers: Record<string, string>;
    body: string | Buffer;
};
export type LiveMarqueeConfig = {
    enabled?: boolean;
    pollInterval?: number;
    speed?: number;
    pauseOnHover?: boolean;
    limit?: number;
    sort?: 'asc' | 'desc';
    colors?: EventColors;
};
export type StudioMetadata = {
    title?: string;
    logo?: string;
    favicon?: string;
    company?: {
        name?: string;
        website?: string;
        supportEmail?: string;
    };
    theme?: 'dark' | 'light' | 'auto';
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
    };
    features?: {
        users?: boolean;
        sessions?: boolean;
        organizations?: boolean;
        analytics?: boolean;
        tools?: boolean;
        security?: boolean;
    };
    links?: Array<{
        label: string;
        url: string;
    }>;
    custom?: Record<string, any>;
};
export type StudioAccessConfig = {
    roles?: string[];
    allowEmails?: string[];
    sessionDuration?: number;
    secret?: string;
};
import type { AuthEventType, EventIngestionProvider } from './events.js';
export type StudioConfig = {
    auth: any;
    basePath?: string;
    access?: StudioAccessConfig;
    metadata?: StudioMetadata;
    events?: {
        enabled?: boolean;
        tableName?: string;
        provider?: EventIngestionProvider;
        client?: any;
        clientType?: 'postgres' | 'prisma' | 'drizzle' | 'clickhouse' | 'http' | 'custom';
        include?: AuthEventType[];
        exclude?: AuthEventType[];
        batchSize?: number;
        flushInterval?: number;
        retryOnError?: boolean;
        liveMarquee?: LiveMarqueeConfig;
    };
};
export type EventColors = {
    success?: string;
    info?: string;
    warning?: string;
    error?: string;
    failed?: string;
};
export type WindowStudioConfig = {
    basePath: string;
    metadata: Required<StudioMetadata>;
    liveMarquee?: LiveMarqueeConfig;
};
export declare function defineStudioConfig(config: StudioConfig): StudioConfig;
//# sourceMappingURL=handler.d.ts.map