import { handleStudioRequest } from '../core/handler.js';
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
export function createStudioHandler(config) {
    return async (event) => {
        try {
            const universalReq = await convertNuxtToUniversal(event, config);
            const universalRes = await handleStudioRequest(universalReq, config);
            return sendNuxtResponse(event, universalRes);
        }
        catch (error) {
            console.error('Studio handler error:', error);
            setResponseStatus(event, 500);
            setResponseHeader(event, 'Content-Type', 'application/json');
            return { error: 'Internal server error' };
        }
    };
}
async function convertNuxtToUniversal(event, config) {
    let body;
    const method = event.method || event.node?.req?.method || 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
        const contentType = event.headers?.get?.('content-type') || event.headers?.['content-type'] || '';
        if (contentType.includes('application/json')) {
            try {
                body = await readBody(event);
            }
            catch { }
        }
        else if (contentType.includes('application/x-www-form-urlencoded') ||
            contentType.includes('multipart/form-data')) {
            try {
                const formData = await readFormData(event);
                body = Object.fromEntries(formData.entries());
            }
            catch { }
        }
        else {
            try {
                const text = await readBody(event);
                if (text && typeof text === 'string' && text.trim()) {
                    try {
                        body = JSON.parse(text);
                    }
                    catch {
                        body = text;
                    }
                }
                else {
                    body = text;
                }
            }
            catch { }
        }
    }
    const headers = {};
    if (event.headers) {
        if (event.headers.forEach) {
            event.headers.forEach((value, key) => {
                headers[key] = value;
            });
        }
        else if (typeof event.headers.entries === 'function') {
            for (const [key, value] of event.headers.entries()) {
                headers[key] = String(value);
            }
        }
        else {
            Object.entries(event.headers).forEach(([key, value]) => {
                headers[key] = String(value);
            });
        }
    }
    const basePath = config.basePath || '/api/studio';
    const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
    // Get path from Nuxt event
    // In Nuxt 3, event.path contains the full request path
    let fullPath = event.path || event.node?.req?.url?.split('?')[0] || '/';
    // Extract the path relative to basePath
    let path = '/';
    if (fullPath.startsWith(normalizedBasePath)) {
        path = fullPath.slice(normalizedBasePath.length) || '/';
    }
    // Handle catch-all route parameters
    // For routes like server/api/studio/[...].ts, Nuxt provides params in event.context.params
    const catchAllParam = event.context?.params?._ || event.context?.params?.['...'];
    if (catchAllParam) {
        const segments = Array.isArray(catchAllParam) ? catchAllParam : [catchAllParam];
        if (segments.length > 0) {
            path = '/' + segments.join('/');
        }
    }
    // Get query string
    const query = event.query || {};
    const queryString = Object.keys(query).length > 0
        ? '?' + new URLSearchParams(query).toString()
        : '';
    return {
        url: path + queryString,
        method: method,
        headers,
        body,
    };
}
function sendNuxtResponse(event, res) {
    // Set status code
    setResponseStatus(event, res.status);
    // Set headers
    Object.entries(res.headers).forEach(([key, value]) => {
        setResponseHeader(event, key, value);
    });
    // Handle different body types
    if (Buffer.isBuffer(res.body)) {
        return res.body;
    }
    else if (typeof res.body === 'string') {
        const contentType = res.headers['content-type'] || res.headers['Content-Type'] || '';
        if (contentType.includes('application/json')) {
            try {
                return JSON.parse(res.body);
            }
            catch {
                return res.body;
            }
        }
        else if (contentType.includes('text/html')) {
            return res.body;
        }
        else {
            return res.body;
        }
    }
    else {
        return res.body;
    }
}
// Helper functions for Nuxt response handling
function setResponseStatus(event, status) {
    if (typeof event.node?.res?.statusCode !== 'undefined') {
        event.node.res.statusCode = status;
    }
    else if (typeof event.node?.res?.status !== 'undefined') {
        event.node.res.status(status);
    }
}
function setResponseHeader(event, name, value) {
    if (event.node?.res?.setHeader) {
        event.node.res.setHeader(name, value);
    }
    else if (event.node?.res?.header) {
        event.node.res.header(name, value);
    }
}
// Helper functions that work with Nuxt's event object
async function readBody(event) {
    if (typeof event.readBody === 'function') {
        return await event.readBody();
    }
    if (event.body) {
        return event.body;
    }
    // Fallback for standard Request
    if (event.request && typeof event.request.json === 'function') {
        return await event.request.json();
    }
    return null;
}
async function readFormData(event) {
    if (typeof event.readFormData === 'function') {
        return await event.readFormData();
    }
    if (event.request && typeof event.request.formData === 'function') {
        return await event.request.formData();
    }
    return new FormData();
}
//# sourceMappingURL=nuxt.js.map