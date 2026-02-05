export interface StudioMetadata {
    title?: string;
    logo?: string;
    favicon?: string;
    company?: {
        name?: string;
        website?: string;
    };
    theme?: "light" | "dark";
    customStyles?: string;
}
export interface StudioAccessConfig {
    roles?: string[];
    allowEmails?: string[];
    sessionDuration?: number;
    secret?: string;
}
export interface StudioConfig {
    basePath?: string;
    metadata?: StudioMetadata;
    auth?: any;
    access?: StudioAccessConfig;
    [key: string]: any;
}
export interface EventColors {
    success?: string;
    info?: string;
    warning?: string;
    error?: string;
    failed?: string;
}
export type TimeWindowPreset = "15m" | "30m" | "1h" | "2h" | "4h" | "6h" | "12h" | "1d" | "2d" | "3d" | "7d" | "14d" | "30d";
export type TimeWindowConfig = {
    since: TimeWindowPreset;
    custom?: never;
} | {
    custom: number;
    since?: never;
};
export interface LiveMarqueeConfig {
    enabled?: boolean;
    pollInterval?: number;
    speed?: number;
    pauseOnHover?: boolean;
    limit?: number;
    sort?: "asc" | "desc";
    colors?: EventColors;
    timeWindow?: TimeWindowConfig;
}
export interface LastSeenAtConfig {
    enabled?: boolean;
    /** Column/field name (e.g. "lastSeenAt", "last_seen_at"). Default "lastSeenAt". */
    columnName?: string;
}
export interface WindowStudioConfig {
    basePath: string;
    metadata: Required<StudioMetadata>;
    liveMarquee?: LiveMarqueeConfig;
    lastSeenAt?: LastSeenAtConfig;
}
export declare function serveIndexHtml(publicDir: string, config?: Partial<StudioConfig>): string;
//# sourceMappingURL=html-injector.d.ts.map