import { handleStudioRequest } from '../core/handler.js';
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
export function betterAuthStudio(config) {
    return async (event) => {
        try {
            const universalReq = await convertSvelteKitToUniversal(event, config);
            const universalRes = await handleStudioRequest(universalReq, config);
            return universalToResponse(universalRes);
        }
        catch (error) {
            console.error('Studio handler error:', error);
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    };
}
async function convertSvelteKitToUniversal(event, config) {
    let body;
    const method = event.request.method;
    if (method !== 'GET' && method !== 'HEAD') {
        const contentType = event.request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                body = await event.request.json();
            }
            catch { }
        }
        else if (contentType.includes('application/x-www-form-urlencoded') ||
            contentType.includes('multipart/form-data')) {
            try {
                const formData = await event.request.formData();
                body = Object.fromEntries(formData.entries());
            }
            catch { }
        }
        else {
            try {
                const text = await event.request.text();
                if (text && text.trim()) {
                    try {
                        body = JSON.parse(text);
                    }
                    catch {
                        body = text;
                    }
                }
            }
            catch { }
        }
    }
    const headers = {};
    event.request.headers.forEach((value, key) => {
        headers[key] = value;
    });
    const basePath = config.basePath || '/api/studio';
    const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    let path = event.url.pathname;
    if (path.startsWith(normalizedBasePath)) {
        path = path.slice(normalizedBasePath.length) || '/';
    }
    const pathWithQuery = path + event.url.search;
    return {
        url: pathWithQuery,
        method: method,
        headers,
        body,
    };
}
function universalToResponse(res) {
    return new Response(res.body, {
        status: res.status,
        headers: res.headers,
    });
}
//# sourceMappingURL=svelte-kit.js.map