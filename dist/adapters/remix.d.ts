import type { StudioConfig } from '../types/handler.js';
/**
 * Remix adapter for Better Auth Studio
 *
 * Usage in a resource route:
 * ```ts
 * // app/routes/api.studio.$.ts
 * import { betterAuthStudio } from 'better-auth-studio/remix';
 * import studioConfig from '~/studio.config';
 * import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
 *
 * const handler = betterAuthStudio(studioConfig);
 *
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   return handler({ request });
 * }
 *
 * export async function action({ request }: ActionFunctionArgs) {
 *   return handler({ request });
 * }
 * ```
 */
export declare function betterAuthStudio(config: StudioConfig): ({ request }: {
    request: Request;
}) => Promise<Response>;
//# sourceMappingURL=remix.d.ts.map