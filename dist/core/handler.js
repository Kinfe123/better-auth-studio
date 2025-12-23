import { existsSync, readFileSync, statSync } from 'fs';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { serveIndexHtml as getIndexHtml } from '../utils/html-injector.js';
import { decryptSession, isSessionValid, STUDIO_COOKIE_NAME } from '../utils/session.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
/**
 * Main handler - processes all studio requests (framework-agnostic)
 *
 * Route mapping:
 * - CLI studio: basePath = ''
 *   - /api/users → API route /api/users
 *   - /users → SPA route (serves index.html)
 * - Self-hosted: basePath = '/api/studio'
 *   - /api/studio/users (JSON request) → API route /api/users
 *   - /api/studio/users (HTML request) → SPA route (serves index.html)
 */
export async function handleStudioRequest(request, config) {
    try {
        const basePath = config.basePath || '/api/studio';
        const isSelfHosted = !!config.basePath;
        let path = request.url.replace(basePath, '') || '/';
        if (path === '' || path === '/') {
            path = '/';
        }
        if (path.startsWith('/assets/') || path === '/vite.svg') {
            return handleStaticFile(path, config);
        }
        if (path === '/') {
            return handleStaticFile(path, config);
        }
        const spaRoutes = ['/login', '/access-denied'];
        if (spaRoutes.some((r) => path === r || path.startsWith(r + '?'))) {
            return handleStaticFile(path, config);
        }
        if (path.startsWith('/api/')) {
            if (isSelfHosted && isProtectedApiPath(path)) {
                const sessionResult = verifyStudioSession(request, config);
                if (!sessionResult.valid) {
                    return jsonResponse(401, { error: 'Unauthorized', message: sessionResult.error });
                }
            }
            return await handleApiRoute(request, path, config);
        }
        // Self-hosted mode: determine if this is an API route or SPA navigation
        if (isSelfHosted) {
            // Check Accept header to distinguish API calls from browser navigation
            const acceptHeader = request.headers['accept'] || request.headers['Accept'] || '';
            const wantsJson = acceptHeader.includes('application/json') ||
                acceptHeader === '*/*' ||
                !acceptHeader.includes('text/html');
            // If client wants JSON or this looks like an API call, route to API
            // /users → /api/users, /config → /api/config
            if (wantsJson) {
                const apiPath = '/api' + path;
                if (isProtectedApiPath(apiPath)) {
                    const sessionResult = verifyStudioSession(request, config);
                    if (!sessionResult.valid) {
                        return jsonResponse(401, { error: 'Unauthorized', message: sessionResult.error });
                    }
                }
                return await handleApiRoute(request, apiPath, config);
            }
            // Otherwise, it's a browser navigation - serve SPA
            return handleStaticFile(path, config);
        }
        // Fallback: serve index.html for SPA routing
        return handleStaticFile(path, config);
    }
    catch (error) {
        console.error('Studio handler error:', error);
        return jsonResponse(500, {
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
function getSessionSecret(config) {
    return config.access?.secret || config.auth?.options?.secret || process.env.BETTER_AUTH_SECRET || 'studio-default-secret';
}
function parseCookies(cookieHeader) {
    if (!cookieHeader)
        return {};
    const cookies = {};
    cookieHeader.split(';').forEach(part => {
        const [name, ...rest] = part.trim().split('=');
        if (name) {
            cookies[name] = rest.join('=');
        }
    });
    return cookies;
}
function verifyStudioSession(request, config) {
    const cookieHeader = request.headers['cookie'] || request.headers['Cookie'];
    const cookies = parseCookies(cookieHeader);
    const sessionCookie = cookies[STUDIO_COOKIE_NAME];
    if (!sessionCookie) {
        return { valid: false, error: 'No session cookie' };
    }
    const session = decryptSession(sessionCookie, getSessionSecret(config));
    if (!isSessionValid(session)) {
        return { valid: false, error: 'Session expired' };
    }
    return { valid: true, session };
}
function isProtectedApiPath(path) {
    const publicPaths = [
        '/api/auth/sign-in',
        '/api/auth/session',
        '/api/auth/logout',
        '/api/auth/verify',
        '/api/auth/oauth',
        '/api/health',
    ];
    return !publicPaths.some(p => path.startsWith(p));
}
async function handleApiRoute(request, path, config) {
    const { routeApiRequest } = await import('../routes/api-router.js');
    try {
        const result = await routeApiRequest({
            path: path,
            method: request.method,
            headers: request.headers,
            body: request.body,
            auth: config.auth,
            basePath: config.basePath || '/api/studio',
            accessConfig: config.access,
        });
        const headers = { 'Content-Type': 'application/json' };
        if (result.cookies && result.cookies.length > 0) {
            const cookieStrings = result.cookies.map((c) => {
                let cookie = `${c.name}=${c.value}`;
                if (c.options.httpOnly)
                    cookie += '; HttpOnly';
                if (c.options.secure)
                    cookie += '; Secure';
                if (c.options.sameSite)
                    cookie += `; SameSite=${c.options.sameSite}`;
                if (c.options.maxAge !== undefined)
                    cookie += `; Max-Age=${Math.floor(c.options.maxAge / 1000)}`;
                if (c.options.path)
                    cookie += `; Path=${c.options.path}`;
                return cookie;
            });
            headers['Set-Cookie'] = cookieStrings.join(', ');
        }
        return {
            status: result.status,
            headers,
            body: JSON.stringify(result.data),
        };
    }
    catch (error) {
        console.error('API route error:', error);
        return jsonResponse(500, { error: 'Internal server error' });
    }
}
function handleStaticFile(path, config) {
    let publicDir;
    const distPublic = resolve(__dirname, '../public');
    if (existsSync(distPublic)) {
        publicDir = distPublic;
    }
    else {
        // Fallback to source location
        const sourcePublic = resolve(__dirname, '../../public');
        if (existsSync(sourcePublic)) {
            publicDir = sourcePublic;
        }
        else {
            return jsonResponse(500, {
                error: 'Public directory not found',
                paths: {
                    tried: [distPublic, sourcePublic],
                    dirname: __dirname,
                },
            });
        }
    }
    return handleStaticFileFromDir(path, publicDir, config);
}
function handleStaticFileFromDir(path, publicDir, config) {
    if (path === '/' || path === '') {
        return serveIndexHtml(publicDir, config);
    }
    const filePath = join(publicDir, path);
    if (existsSync(filePath) && statSync(filePath).isFile()) {
        const content = readFileSync(filePath);
        const contentType = getContentType(extname(filePath));
        return {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': getCacheControl(path),
            },
            body: content,
        };
    }
    return serveIndexHtml(publicDir, config);
}
function serveIndexHtml(publicDir, config) {
    const html = getIndexHtml(publicDir, {
        basePath: config.basePath || '/api/studio', // Default basePath for self-hosted
        metadata: config.metadata,
    });
    return {
        status: 200,
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache',
        },
        body: html,
    };
}
function jsonResponse(status, data) {
    return {
        status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    };
}
function getContentType(ext) {
    const types = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
    };
    return types[ext] || 'application/octet-stream';
}
function getCacheControl(path) {
    // Cache static assets aggressively
    if (path.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2|ttf)$/)) {
        return 'public, max-age=31536000, immutable';
    }
    return 'no-cache';
}
//# sourceMappingURL=handler.js.map