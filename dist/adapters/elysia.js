import { handleStudioRequest } from '../core/handler.js';
/**
 * Elysia adapter for Better Auth Studio
 */
export function betterAuthStudio(config) {
    return async (context) => {
        try {
            const universalReq = await convertElysiaToUniversal(context);
            const universalRes = await handleStudioRequest(universalReq, config);
            return sendElysiaResponse(context, universalRes);
        }
        catch (error) {
            console.error('Studio handler error:', error);
            context.set.status = 500;
            return { error: 'Internal server error' };
        }
    };
}
async function convertElysiaToUniversal(context) {
    let body = undefined;
    const method = context.request.method;
    if (method !== 'GET' && method !== 'HEAD') {
        const elysiaBody = context.body ?? context.query ?? undefined;
        if (elysiaBody !== undefined) {
            body = elysiaBody;
        }
        else {
            const contentType = context.request.headers.get('content-type') || '';
            try {
                if (contentType.includes('application/json')) {
                    body = await context.request.json();
                }
                else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
                    const formData = await context.request.formData();
                    body = Object.fromEntries(formData.entries());
                }
                else {
                    const text = await context.request.text();
                    if (text && text.trim()) {
                        try {
                            body = JSON.parse(text);
                        }
                        catch {
                            body = text;
                        }
                    }
                }
            }
            catch (error) {
            }
        }
    }
    const headers = {};
    context.request.headers.forEach((value, key) => {
        headers[key] = value;
    });
    const url = new URL(context.request.url);
    const pathWithQuery = url.pathname + url.search;
    return {
        url: pathWithQuery,
        method: method,
        headers,
        body,
    };
}
function sendElysiaResponse(context, universal) {
    context.set.status = universal.status;
    Object.entries(universal.headers).forEach(([key, value]) => {
        context.set.headers[key] = value;
    });
    if (Buffer.isBuffer(universal.body)) {
        return new Response(universal.body, {
            status: universal.status,
            headers: universal.headers,
        });
    }
    else if (typeof universal.body === 'string') {
        const contentType = universal.headers['content-type'] || universal.headers['Content-Type'] || '';
        if (contentType.includes('application/json')) {
            try {
                return JSON.parse(universal.body);
            }
            catch {
                return universal.body;
            }
        }
        else if (contentType.includes('text/html')) {
            return new Response(universal.body, {
                status: universal.status,
                headers: universal.headers,
            });
        }
        else {
            return universal.body;
        }
    }
    else {
        return String(universal.body);
    }
}
//# sourceMappingURL=elysia.js.map