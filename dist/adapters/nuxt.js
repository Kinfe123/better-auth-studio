import { handleStudioRequest } from '../core/handler.js';
export function createStudioHandler(config) {
    return async (event) => {
        try {
            const universalReq = await convertNuxtToUniversal(event, config);
            const universalRes = await handleStudioRequest(universalReq, config);
            return universalToResponse(universalRes);
        }
        catch (error) {
            return new Response(JSON.stringify({ error: 'Internal server error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    };
}
async function convertNuxtToUniversal(event, config) {
    let body = undefined;
    const method = event.method || event.node?.req?.method || 'GET';
    if (method !== 'GET' && method !== 'HEAD') {
        const contentType = getContentType(event);
        body = await readBody(event, contentType);
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
    const fullPath = event.path || event.node?.req?.url?.split('?')[0] || '/';
    let path = '/';
    const catchAllParam = event.context?.params?._ || event.context?.params?.['...'];
    if (catchAllParam !== undefined && catchAllParam !== null) {
        const segments = Array.isArray(catchAllParam) ? catchAllParam : [catchAllParam];
        const validSegments = segments.filter((s) => s !== '' && s !== null && s !== undefined);
        if (validSegments.length > 0) {
            path = '/' + validSegments.join('/');
        }
    }
    else {
        if (fullPath.startsWith(normalizedBasePath)) {
            path = fullPath.slice(normalizedBasePath.length) || '/';
        }
    }
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
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
function universalToResponse(res) {
    let body;
    if (Buffer.isBuffer(res.body)) {
        body = new Uint8Array(res.body);
    }
    else if (res.body !== null && res.body !== undefined) {
        body = res.body;
    }
    else {
        body = null;
    }
    const headers = new Headers();
    Object.entries(res.headers || {}).forEach(([key, value]) => {
        if (value) {
            headers.set(key, String(value));
        }
    });
    return new Response(body, {
        status: res.status || 200,
        headers: headers,
    });
}
function getContentType(event) {
    if (event.headers) {
        if (typeof event.headers.get === 'function') {
            return event.headers.get('content-type') || '';
        }
        return event.headers['content-type'] || event.headers['Content-Type'] || '';
    }
    return '';
}
async function readBody(event, contentType = '') {
    try {
        if (event._requestBody !== undefined && event._requestBody !== null) {
            const body = event._requestBody;
            if (typeof body === 'string' && contentType.includes('application/json')) {
                try {
                    return JSON.parse(body);
                }
                catch {
                    return body;
                }
            }
            return body;
        }
        if (event.body !== undefined && event.body !== null) {
            const body = event.body;
            if (typeof body === 'string' && contentType.includes('application/json')) {
                try {
                    return JSON.parse(body);
                }
                catch {
                    return body;
                }
            }
            return body;
        }
        if (typeof event.readBody === 'function') {
            return await event.readBody();
        }
        if (event.req && typeof event.req.text === 'function') {
            const text = await event.req.text();
            if (text) {
                if (contentType.startsWith('application/x-www-form-urlencoded')) {
                    const params = new URLSearchParams(text);
                    return Object.fromEntries(params.entries());
                }
                else {
                    try {
                        return JSON.parse(text);
                    }
                    catch {
                        return text;
                    }
                }
            }
        }
        return undefined;
    }
    catch {
        return undefined;
    }
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