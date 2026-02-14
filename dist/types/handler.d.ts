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
/** IP geolocation config. When set, Studio uses this for Events and Sessions IP resolution. */
export type StudioIpAddressConfig = {
    provider: "ipinfo";
    apiToken?: string;
    baseUrl?: string;
    /** "lite" (free, country/continent only) or "lookup" (core/plus, city/region). Default "lookup". */
    endpoint?: "lite" | "lookup";
} | {
    provider: "ipapi";
    apiToken?: string;
    baseUrl?: string;
} | {
    /** Use a local MaxMind GeoLite2 (.mmdb) file; path is resolved from your project. */
    provider: "static";
    /** Absolute or relative path to the .mmdb file (e.g. "./data/GeoLite2-City.mmdb"). */
    path: string;
};
/** All studio tool ids. Use this union for type-safe `tools.exclude` in self-host. */
export declare const STUDIO_TOOL_IDS: readonly ["test-oauth", "hash-password", "run-migration", "test-db", "validate-config", "health-check", "export-data", "jwt-decoder", "token-generator", "plugin-generator", "uuid-generator", "password-strength", "oauth-credentials", "secret-generator"];
export type StudioToolId = (typeof STUDIO_TOOL_IDS)[number];
export type StudioConfig = {
    auth: any;
    basePath?: string;
    access?: StudioAccessConfig;
    metadata?: StudioMetadata;
    lastSeenAt?: StudioLastSeenAtConfig;
    /** Optional IP geolocation config (ipinfo.io or ipapi.co). When set, used for Events/Sessions location. */
    ipAddress?: StudioIpAddressConfig;
    /**
     * Tools list config. When self-hosting, use `exclude` to hide tools from the UI (e.g. in production).
     * By default all tools are included.
     * @example tools: { exclude: ['test-oauth', 'health-check'] }
     */
    tools?: {
        exclude?: StudioToolId[];
    };
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
    /** Tool ids to exclude from the Tools page (from self-host config). */
    tools?: {
        exclude?: StudioToolId[];
    };
};
export declare function defineStudioConfig(config: StudioConfig): StudioConfig;
//# sourceMappingURL=handler.d.ts.map