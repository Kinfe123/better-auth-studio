import { handleStudioRequest } from '../core/handler.js';
/**
 * Hono adapter for Better Auth Studio
 */
export function betterAuthStudio(config) {
    return async (c) => {
        try {
            const universalReq = await convertHonoToUniversal(c);
            const universalRes = await handleStudioRequest(universalReq, config);
            return sendHonoResponse(c, universalRes);
        }
        catch (error) {
            console.error('Studio handler error:', error);
            return c.json({ error: 'Internal server error' }, 500);
        }
    };
}
async function convertHonoToUniversal(c) {
    let body;
    const method = c.req.method;
    if (method !== 'GET' && method !== 'HEAD') {
        const contentType = c.req.header('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                body = await c.req.json();
            }
            catch {
                // Body might not be JSON or might be empty
            }
        }
        else if (contentType.includes('application/x-www-form-urlencoded')) {
            try {
                body = await c.req.parseBody();
            }
            catch {
                // Body might be empty
            }
        }
    }
    const headers = {};
    c.req.raw.headers.forEach((value, key) => {
        headers[key] = value;
    });
    // Get the full URL with query string
    const url = new URL(c.req.url);
    const pathWithQuery = url.pathname + url.search;
    return {
        url: pathWithQuery,
        method: method,
        headers,
        body,
    };
}
function sendHonoResponse(c, universal) {
    // Set status
    c.status(universal.status);
    // Set headers
    Object.entries(universal.headers).forEach(([key, value]) => {
        c.header(key, value);
    });
    // Handle body
    if (Buffer.isBuffer(universal.body)) {
        return c.body(universal.body);
    }
    else if (typeof universal.body === 'string') {
        // Check if it's HTML or JSON
        const contentType = universal.headers['content-type'] || universal.headers['Content-Type'] || '';
        if (contentType.includes('application/json')) {
            try {
                return c.json(JSON.parse(universal.body));
            }
            catch {
                return c.text(universal.body);
            }
        }
        else if (contentType.includes('text/html')) {
            return c.html(universal.body);
        }
        else {
            return c.text(universal.body);
        }
    }
    else {
        return c.text(String(universal.body));
    }
}
//# sourceMappingURL=hono.js.map