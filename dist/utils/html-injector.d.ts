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
export interface WindowStudioConfig {
    basePath: string;
    metadata: Required<StudioMetadata>;
}
export declare function serveIndexHtml(publicDir: string, config?: Partial<StudioConfig>): string;
//# sourceMappingURL=html-injector.d.ts.map