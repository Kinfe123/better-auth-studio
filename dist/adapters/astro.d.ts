import type { StudioConfig } from '../types/handler.js';
/**
 * Astro adapter for Better Auth Studio
 *
 * Usage in a catch-all API route:
 * ```ts
 * // pages/api/studio/[...all].ts
 * import { betterAuthStudio } from 'better-auth-studio/astro';
 * import studioConfig from '../../../../studio.config';
 * import type { APIRoute } from 'astro';
 *
 * const handler = betterAuthStudio(studioConfig);
 *
 * export const ALL: APIRoute = async (ctx) => {
 *   return handler(ctx);
 * };
 * ```
 */
export declare function betterAuthStudio(config: StudioConfig): (ctx: {
    request: Request;
}) => Promise<Response>;
//# sourceMappingURL=astro.d.ts.map