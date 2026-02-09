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
export type TimeWindowPreset = "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d" | "2d" | "3d" | "7d" | "14d" | "30d";
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
    sort?: "asc" | "desc";
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
    theme?: "dark" | "light" | "auto";
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
import type { AuthEvent, AuthEventType, EventIngestionProvider } from "./events.js";
/**
 * Last-seen tracking: no plugin or additionalFields needed in your Better Auth config.
 * When enabled, Studio injects the field into the user schema and updates it on sign-in/sign-up; add the column to your user table and run migrations.
 */
export type StudioLastSeenAtConfig = {
    enabled?: boolean;
    /** Column/field name (e.g. "lastSeenAt", "last_seen_at"). Default "lastSeenAt". Must exist on your user table. */
    columnName?: string;
};
/** IP geolocation provider. When set, Studio uses this for Events and Sessions IP resolution instead of local DB. */
export type StudioIpAddressConfig = {
    /** Provider: "ipinfo" (ipinfo.io) or "ipapi" (ipapi.co). */
    provider: "ipinfo" | "ipapi";
    /** API token (required for ipinfo; optional for ipapi free tier). */
    apiToken?: string;
    /** Optional base URL (e.g. "https://api.ipinfo.io"). Defaults per provider. */
    baseUrl?: string;
    /** For ipinfo only: "lite" (free, country/continent only) or "lookup" (core/plus, includes city/region). Default "lookup". */
    endpoint?: "lite" | "lookup";
};
export type StudioConfig = {
    auth: any;
    basePath?: string;
    access?: StudioAccessConfig;
    metadata?: StudioMetadata;
    lastSeenAt?: StudioLastSeenAtConfig;
    /** Optional IP geolocation config (ipinfo.io or ipapi.co). When set, used for Events/Sessions location. */
    ipAddress?: StudioIpAddressConfig;
    events?: {
        enabled?: boolean;
        tableName?: string;
        provider?: EventIngestionProvider;
        client?: any;
        clientType?: "postgres" | "prisma" | "drizzle" | "clickhouse" | "https" | "custom" | "sqlite" | "node-sqlite";
        include?: AuthEventType[];
        exclude?: AuthEventType[];
        batchSize?: number;
        flushInterval?: number;
        retryOnError?: boolean;
        liveMarquee?: LiveMarqueeConfig;
        onEventIngest?: (event: AuthEvent) => void | Promise<void>;
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