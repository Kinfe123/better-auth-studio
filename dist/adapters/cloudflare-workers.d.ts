type MaybePromise<T> = T | Promise<T>;
export type CloudflareStudioAsset = string | Uint8Array | ArrayBuffer | Response;
export type CloudflareStudioAssetMap = Record<string, CloudflareStudioAsset>;
export type CloudflareStudioAssetBinding = {
    fetch(request: Request): MaybePromise<Response>;
};
export type CloudflareStudioAssetSource<Env = unknown> = CloudflareStudioAssetBinding | CloudflareStudioAssetMap | ((env: Env) => MaybePromise<CloudflareStudioAssetBinding | CloudflareStudioAssetMap | null | undefined>);
export type CloudflareStudioMetadata = {
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
    custom?: Record<string, unknown>;
};
export type CloudflareStudioAccessConfig = {
    roles?: string[];
    allowEmails?: string[];
    allowIpAddresses?: string[];
    blockIpAddresses?: string[];
    sessionDuration?: number;
    secret?: string;
};
export type CloudflareStudioApiContext<Env = unknown, Ctx = unknown> = {
    env: Env;
    ctx: Ctx;
    path: string;
    originalPath: string;
    basePath: string;
    config: CloudflareStudioConfig<Env, Ctx>;
};
export type CloudflareStudioApiHandler<Env = unknown, Ctx = unknown> = (request: Request, context: CloudflareStudioApiContext<Env, Ctx>) => MaybePromise<Response | null | undefined>;
export type CloudflareStudioIndexContext<Env = unknown, Ctx = unknown> = {
    env: Env;
    ctx: Ctx;
    path: string;
    config: CloudflareStudioConfig<Env, Ctx>;
};
export type CloudflareStudioConfig<Env = unknown, Ctx = unknown> = {
    auth?: {
        handler?: (request: Request) => MaybePromise<Response>;
        [key: string]: unknown;
    };
    basePath?: string;
    access?: CloudflareStudioAccessConfig;
    metadata?: CloudflareStudioMetadata;
    lastSeenAt?: {
        enabled?: boolean;
        columnName?: string;
    };
    tools?: {
        exclude?: string[];
    };
    events?: {
        enabled?: boolean;
        liveMarquee?: {
            enabled?: boolean;
            pollInterval?: number;
            speed?: number;
            pauseOnHover?: boolean;
            limit?: number;
            sort?: "asc" | "desc";
            colors?: Record<string, string>;
            timeWindow?: Record<string, unknown>;
        };
    };
    assets?: CloudflareStudioAssetSource<Env>;
    indexHtml?: string | ((context: CloudflareStudioIndexContext<Env, Ctx>) => MaybePromise<string | Response | null | undefined>);
    apiHandler?: CloudflareStudioApiHandler<Env, Ctx>;
};
export type CloudflareStudioFetchHandler<Env = unknown, Ctx = unknown> = (request: Request, env?: Env, ctx?: Ctx) => Promise<Response>;
/**
 * Cloudflare Workers adapter for Better Auth Studio.
 *
 * This entrypoint avoids Node-only imports at module load time. It can serve Studio
 * UI assets from a Workers Assets binding or an in-memory asset map and delegates
 * API routes to an edge-compatible handler supplied by the host app.
 */
export declare function betterAuthStudio<Env = unknown, Ctx = unknown>(config: CloudflareStudioConfig<Env, Ctx>): CloudflareStudioFetchHandler<Env, Ctx>;
export {};
