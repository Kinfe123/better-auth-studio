import { handleStudioRequest } from '../core/handler.js';
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
export function betterAuthStudio(config) {
    return async (request) => {
        try {
            const universalReq = await convertNuxtToUniversal(request, config);
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
async function convertNuxtToUniversal(request, config) {
    let body;
    const method = request.method;
    if (method !== 'GET' && method !== 'HEAD' && !request.bodyUsed) {
        const contentType = request.headers.get('content-type') || '';
        try {
            if (contentType.includes('application/json')) {
                try {
                    body = await request.json();
                }
                catch (error) {
                }
            }
            else if (contentType.includes('application/x-www-form-urlencoded') ||
                contentType.includes('multipart/form-data')) {
                try {
                    const formData = await request.formData();
                    body = Object.fromEntries(formData.entries());
                }
                catch (error) {
                }
            }
            else {
                try {
                    const text = await request.text();
                    if (text && text.trim()) {
                        try {
                            body = JSON.parse(text);
                        }
                        catch {
                            body = text;
                        }
                    }
                }
                catch (error) {
                }
            }
        }
        catch (error) {
        }
    }
    const headers = {};
    request.headers.forEach((value, key) => {
        headers[key] = value;
    });
    const basePath = config.basePath || '/api/studio';
    const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    if (!request.url) {
        throw new Error('Request URL is required');
    }
    const url = new URL(request.url);
    let path = url.pathname;
    if (path.startsWith(normalizedBasePath)) {
        path = path.slice(normalizedBasePath.length) || '/';
    }
    const pathWithQuery = path + url.search;
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
//# sourceMappingURL=nuxt.js.map