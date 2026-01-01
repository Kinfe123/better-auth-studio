import type { StudioConfig } from '../types/handler.js';
/**
 * Nuxt adapter for Better Auth Studio
 *
 * Usage in a server route:
 * ```ts
 * // server/api/studio/[...].ts
 * import { createStudioHandler } from 'better-auth-studio/nuxt';
 * import studioConfig from '~/studio.config';
 *
 * const handler = createStudioHandler(studioConfig);
 *
 * export default defineEventHandler(async (event) => {
 *   return handler(event);
 * });
 * ```
 */
export declare function createStudioHandler(config: StudioConfig): (event: any) => Promise<any>;
//# sourceMappingURL=nuxt.d.ts.map