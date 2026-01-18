export interface StudioMetadata {
    title?: string;
    logo?: string;
    favicon?: string;
    company?: {
        name?: string;
        website?: string;
    };
    theme?: 'light' | 'dark';
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
export interface LiveMarqueeConfig {
    enabled?: boolean;
    pollInterval?: number;
    speed?: number;
    pauseOnHover?: boolean;
    limit?: number;
    sort?: 'asc' | 'desc';
    colors?: EventColors;
}
export interface WindowStudioConfig {
    basePath: string;
    metadata: Required<StudioMetadata>;
    liveMarquee?: LiveMarqueeConfig;
}
export declare function serveIndexHtml(publicDir: string, config?: Partial<StudioConfig>): string;
//# sourceMappingURL=html-injector.d.ts.map