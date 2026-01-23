import type { StudioConfig } from "../types/handler.js";
/**
 * Nuxt adapter for Better Auth Studio
 *
 * Usage in a server API route:
 * ```ts
 * // server/api/studio/[...all].ts
 * import { betterAuthStudio } from 'better-auth-studio/nuxt';
 * import studioConfig from '~/studio.config';
 *
 * export default defineEventHandler(betterAuthStudio(studioConfig));
 * ```
 *
 * Note: The adapter will automatically read the request body using h3's readBody
 * if available. If readBody is not accessible, make sure your Nuxt setup has
 * auto-imports enabled for h3 utilities.
 */
export declare function betterAuthStudio(config: StudioConfig): (event: any) => Promise<Response | any>;
//# sourceMappingURL=nuxt.d.ts.map