import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'fs';
import { dirname, extname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import type {
  StudioConfig,
  StudioMetadata,
  UniversalRequest,
  UniversalResponse,
  WindowStudioConfig,
} from '../types/handler.js';
import { serveIndexHtml as getIndexHtml } from '../utils/html-injector.js';
import { decryptSession, isSessionValid, STUDIO_COOKIE_NAME } from '../utils/session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Resolve real path in case of symlinks (important for pnpm on Vercel)
const __realdir = (() => {
  try {
    return realpathSync(__dirname);
  } catch {
    return __dirname;
  }
})();

/**
 * Main handler - processes all studio requests (framework-agnostic)
 *
 */
export async function handleStudioRequest(
  request: UniversalRequest,
  config: StudioConfig
): Promise<UniversalResponse> {
  try {
    const isSelfHosted = !!config.basePath;
    const basePath = config.basePath || '';

    let path = request.url;
    if (isSelfHosted && basePath) {
      path = path.replace(basePath, '') || '/';
    }
    if (path === '' || path === '/') {
      path = '/';
    }

    if (
      path.startsWith('/assets/') ||
      path === '/vite.svg' ||
      path === '/favicon.svg' ||
      path === '/logo.png'
    ) {
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
      const wantsJson =
        acceptHeader.includes('application/json') ||
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
  } catch (error) {
    console.error('Studio handler error:', error);
    return jsonResponse(500, {
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

function getSessionSecret(config: StudioConfig): string {
  return (
    config.access?.secret ||
    config.auth?.options?.secret ||
    process.env.BETTER_AUTH_SECRET ||
    'studio-default-secret'
  );
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((part) => {
    const [name, ...rest] = part.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });
  return cookies;
}

function verifyStudioSession(
  request: UniversalRequest,
  config: StudioConfig
): { valid: boolean; session?: any; error?: string } {
  const cookieHeader = request.headers['cookie'] || request.headers['Cookie'];
  const cookies = parseCookies(cookieHeader as string);
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

function isProtectedApiPath(path: string): boolean {
  const publicPaths = [
    '/api/auth/sign-in',
    '/api/auth/session',
    '/api/auth/logout',
    '/api/auth/verify',
    '/api/auth/oauth',
    '/api/health',
  ];
  return !publicPaths.some((p) => path.startsWith(p));
}

async function handleApiRoute(
  request: UniversalRequest,
  path: string,
  config: StudioConfig
): Promise<UniversalResponse> {
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

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (result.cookies && result.cookies.length > 0) {
      const cookieStrings = result.cookies.map((c) => {
        let cookie = `${c.name}=${c.value}`;
        if (c.options.httpOnly) cookie += '; HttpOnly';
        if (c.options.secure) cookie += '; Secure';
        if (c.options.sameSite) cookie += `; SameSite=${c.options.sameSite}`;
        if (c.options.maxAge !== undefined)
          cookie += `; Max-Age=${Math.floor(c.options.maxAge / 1000)}`;
        if (c.options.path) cookie += `; Path=${c.options.path}`;
        return cookie;
      });
      headers['Set-Cookie'] = cookieStrings.join(', ');
    }

    return {
      status: result.status,
      headers,
      body: JSON.stringify(result.data),
    };
  } catch (error) {
    console.error('API route error:', error);
    return jsonResponse(500, { error: 'Internal server error' });
  }
}

function findPublicDir(): string | null {
  // When built and deployed (e.g., on Vercel), the structure is:
  // node_modules/better-auth-studio/dist/core/handler.js
  // node_modules/better-auth-studio/dist/public/
  // So from __dirname (dist/core), we need to go up one level (../public)

  // Use both __dirname and __realdir to handle symlinks (pnpm on Vercel)
  const baseDirs = [__dirname, __realdir];
  const candidates: string[] = [];

  for (const baseDir of baseDirs) {
    candidates.push(
      resolve(baseDir, '../public'), // dist/core -> dist/public (production)
      resolve(baseDir, '../../public'), // dist/core -> root/public (development)
      resolve(baseDir, '../../../public'), // nested node_modules
      resolve(baseDir, '../../dist/public'), // alternative build structure
      resolve(baseDir, '../../../dist/public') // deeply nested
    );
  }

  // For pnpm on Vercel, also check the actual package location in the store
  const pnpmMatch = __dirname.match(/(.+\/.pnpm\/[^/]+\/node_modules\/better-auth-studio)\//);
  if (pnpmMatch) {
    const pnpmPackageRoot = pnpmMatch[1];
    candidates.unshift(
      join(pnpmPackageRoot, 'dist', 'public'),
      join(pnpmPackageRoot, 'public'),
      join(pnpmPackageRoot, '..', 'dist', 'public')
    );
  }

  // Also try to find package.json and work from there
  try {
    let searchDir = __dirname;
    for (let i = 0; i < 5; i++) {
      const pkgPath = join(searchDir, 'package.json');
      if (existsSync(pkgPath)) {
        const pkgContent = readFileSync(pkgPath, 'utf-8');
        if (pkgContent.includes('"name": "better-auth-studio"')) {
          candidates.unshift(join(searchDir, 'dist', 'public'), join(searchDir, 'public'));
          break;
        }
      }
      searchDir = resolve(searchDir, '..');
    }
  } catch (err) {
    // Silent failure
  }

  // First, try to find a directory with index.html
  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) {
        const stats = statSync(candidate);
        if (stats.isDirectory()) {
          const indexPath = join(candidate, 'index.html');
          if (existsSync(indexPath)) {
            return candidate;
          }
        }
      }
    } catch (error) {}
  }

  // Fallback: return the first existing directory
  for (const candidate of candidates) {
    try {
      if (existsSync(candidate) && statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch (error) {}
  }

  // Log error details for debugging
  console.error('[Studio] Could not find public directory');
  console.error('[Studio] Tried paths:', candidates.slice(0, 5).join(', '), '...');

  return null;
}

let cachedPublicDir: string | null = null;

function handleStaticFile(path: string, config: StudioConfig): UniversalResponse {
  if (!cachedPublicDir) {
    cachedPublicDir = findPublicDir();
  }

  if (!cachedPublicDir) {
    // Fallback: serve a basic error page with instructions
    if (path === '/' || path === '') {
      return {
        status: 503,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
        },
        body: `<!DOCTYPE html>
<html>
<head>
  <title>Better Auth Studio - Setup Required</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #e53e3e; }
    code { background: #f7fafc; padding: 2px 6px; border-radius: 3px; }
    .steps { background: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>⚠️ Studio UI Not Available</h1>
  <p>The Better Auth Studio UI assets could not be located. This typically happens on serverless deployments with pnpm.</p>
  
  <div class="steps">
    <h3>To fix this:</h3>
    <ol>
      <li>Check your deployment logs for postinstall output</li>
      <li>Ensure <code>better-auth-studio</code> is in <code>dependencies</code> (not devDependencies)</li>
      <li>If using pnpm, try setting <code>public-hoist-pattern[]=better-auth-studio</code> in <code>.npmrc</code></li>
      <li>Try clearing your build cache and redeploying</li>
    </ol>
  </div>
  
  <p><strong>Need help?</strong> Visit <a href="https://github.com/better-auth/better-auth-studio/issues">GitHub Issues</a></p>
</body>
</html>`,
      };
    }

    return jsonResponse(503, {
      error: 'Public directory not found',
      message: 'Studio UI assets could not be located. This may be a deployment issue.',
      suggestion: 'Check deployment logs for postinstall errors or try clearing build cache.',
    });
  }

  return handleStaticFileFromDir(path, cachedPublicDir, config);
}

function handleStaticFileFromDir(
  path: string,
  publicDir: string,
  config: StudioConfig
): UniversalResponse {
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

function serveIndexHtml(publicDir: string, config: StudioConfig): UniversalResponse {
  const html = getIndexHtml(publicDir, {
    basePath: config.basePath || '/api/studio', // Default basePath for self-hosted
    metadata: config.metadata as any,
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

function jsonResponse(status: number, data: any): UniversalResponse {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

function getContentType(ext: string): string {
  const types: Record<string, string> = {
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

function getCacheControl(path: string): string {
  // Cache static assets aggressively
  if (path.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2|ttf)$/)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'no-cache';
}
