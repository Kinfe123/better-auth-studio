import type { StudioConfig } from '../types/handler.js';
/**
 * Nuxt adapter for Better Auth Studio
 *
 * Usage in a server API route:
 * ```ts
 * // server/api/studio/[...all].ts
 * import { betterAuthStudio } from 'better-auth-studio/nuxt';
 * import studioConfig from '~/studio.config';
 * import { toWebRequest } from 'better-auth/nuxt';
 *
 * export default defineEventHandler(async (event) => {
 *   // Read body first to avoid stream conflicts
 *   if (event.method !== 'GET' && event.method !== 'HEAD' && !(event as any).body) {
 *     try {
 *       (event as any).body = await readBody(event);
 *     } catch {}
 *   }
 *   const request = toWebRequest(event);
 *   return betterAuthStudio(studioConfig)(request);
 * });
 * ```
 */
export declare function betterAuthStudio(config: StudioConfig): (request: Request) => Promise<Response>;
//# sourceMappingURL=nuxt.d.ts.map