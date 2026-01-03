import type { StudioConfig } from '../types/handler.js';
type ApiEvent = {
    request: Request;
    params: Record<string, string>;
    locals: Record<string, unknown>;
    env: Record<string, unknown>;
    fetch: typeof fetch;
    url: URL;
};
/**
 * SolidStart adapter for Better Auth Studio
 *
 * Usage in a catch-all route handler:
 * ```ts
 * // src/routes/api/studio/[...path].ts
 * import { betterAuthStudio } from 'better-auth-studio/solid-start';
 * import studioConfig from '../../../../studio.config';
 *
 * const handler = betterAuthStudio(studioConfig);
 *
 * export const GET = handler;
 * export const POST = handler;
 * export const PUT = handler;
 * export const DELETE = handler;
 * export const PATCH = handler;
 * ```
 */
export declare function betterAuthStudio(config: StudioConfig): (event: ApiEvent) => Promise<Response>;
export {};
//# sourceMappingURL=solid-start.d.ts.map