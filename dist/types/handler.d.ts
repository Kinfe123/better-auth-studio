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
export type StudioConfig = {
    auth: any;
    basePath?: string;
    access?: StudioAccessConfig;
    metadata?: StudioMetadata;
};
export type WindowStudioConfig = {
    basePath: string;
    metadata: Required<StudioMetadata>;
};
export declare function defineStudioConfig(config: StudioConfig): StudioConfig;
//# sourceMappingURL=handler.d.ts.map