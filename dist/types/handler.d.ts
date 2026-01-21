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
export type TimeWindowPreset = '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '12h' | '1d' | '2d' | '3d' | '7d' | '14d' | '30d';
export type TimeWindowConfig = {
    since: TimeWindowPreset;
    custom?: never;
} | {
    custom: number;
    since?: never;
};
export type LiveMarqueeConfig = {
    enabled?: boolean;
    pollInterval?: number;
    speed?: number;
    pauseOnHover?: boolean;
    limit?: number;
    sort?: 'asc' | 'desc';
    colors?: EventColors;
    timeWindow?: TimeWindowConfig;
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
        clientType?: 'postgres' | 'prisma' | 'drizzle' | 'clickhouse' | 'http' | 'custom' | 'sqlite';
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