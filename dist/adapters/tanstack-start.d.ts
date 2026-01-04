import type { StudioConfig } from '../types/handler.js';
type TanStackStartHandlerContext = {
    request: Request;
};
/**
 * TanStack Start adapter for Better Auth Studio
 *
 * Usage in a server route:
 * ```ts
 * // src/routes/api/studio/$.ts
 * import { createFileRoute } from '@tanstack/react-router';
 * import { betterAuthStudio } from 'better-auth-studio/tanstack-start';
 * import studioConfig from '../../../../studio.config';
 *
 * const handler = betterAuthStudio(studioConfig);
 *
 * export const Route = createFileRoute('/api/studio/$')({
 *   server: {
 *     handlers: {
 *       GET: handler,
 *       POST: handler,
 *       PUT: handler,
 *       DELETE: handler,
 *       PATCH: handler,
 *     },
 *   },
 * });
 * ```
 */
export declare function betterAuthStudio(config: StudioConfig): ({ request }: TanStackStartHandlerContext) => Promise<Response>;
export {};
//# sourceMappingURL=tanstack-start.d.ts.map