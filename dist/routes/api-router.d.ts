import type { StudioConfig } from "../types/handler.js";
import type { StudioAccessConfig } from "../utils/html-injector.js";
export type ApiContext = {
    path: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    auth: any;
    basePath?: string;
    accessConfig?: StudioAccessConfig;
    studioConfig?: StudioConfig;
};
export type ApiResponse = {
    status: number;
    data: any;
    cookies?: Array<{
        name: string;
        value: string;
        options: any;
    }>;
};
export declare function routeApiRequest(ctx: ApiContext): Promise<ApiResponse>;
//# sourceMappingURL=api-router.d.ts.map