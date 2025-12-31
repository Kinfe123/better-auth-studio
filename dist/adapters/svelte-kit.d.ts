import type { RequestEvent } from '@sveltejs/kit';
import type { StudioConfig } from '../types/handler.js';
/**
 * SvelteKit adapter for Better Auth Studio
 *
 * Usage in a catch-all route handler:
 * ```ts
 * // src/routes/api/studio/[...path]/+server.ts
 * import { betterAuthStudio } from 'better-auth-studio/svelte-kit';
 * import studioConfig from '../../../../studio.config';
 *
 * const handler = betterAuthStudio(studioConfig);
 *
 * export async function GET(event) {
 *   return handler(event);
 * }
 *
 * export async function POST(event) {
 *   return handler(event);
 * }
 *
 * export async function PUT(event) {
 *   return handler(event);
 * }
 *
 * export async function DELETE(event) {
 *   return handler(event);
 * }
 *
 * export async function PATCH(event) {
 *   return handler(event);
 * }
 * ```
 */
export declare function betterAuthStudio(config: StudioConfig): (event: RequestEvent) => Promise<Response>;
//# sourceMappingURL=svelte-kit.d.ts.map