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
    const [pathname, queryString] = path.split('?');

    if (isSelfHosted && basePath) {
      const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
      let normalizedPath = pathname;

      if (normalizedPath === normalizedBasePath || normalizedPath === normalizedBasePath + '/') {
        normalizedPath = '/';
      } else if (normalizedPath.startsWith(normalizedBasePath + '/')) {
        normalizedPath = normalizedPath.slice(normalizedBasePath.length);
      } else if (normalizedPath.startsWith(normalizedBasePath)) {
        normalizedPath = normalizedPath.slice(normalizedBasePath.length) || '/';
      }

      path = normalizedPath + (queryString ? '?' + queryString : '');
    } else {
      path = pathname + (queryString ? '?' + queryString : '');
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

    if (isSelfHosted) {
      const acceptHeader = request.headers['accept'] || request.headers['Accept'] || '';
      const wantsJson =
        acceptHeader.includes('application/json') ||
        acceptHeader === '*/*' ||
        !acceptHeader.includes('text/html');

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

      // it's a browser navigation - serve SPA
      return handleStaticFile(path, config);
    }

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
  const candidates: string[] = [];

  try {
    const cwd = process.cwd();
    const nodeModulesPath = join(cwd, 'node_modules');
    const pnpmStorePath = join(nodeModulesPath, '.pnpm');

    candidates.push(
      join(nodeModulesPath, 'better-auth-studio', 'dist', 'public'),
      join(nodeModulesPath, 'better-auth-studio', 'public')
    );

    // Check pnpm store if it exists
    if (existsSync(pnpmStorePath)) {
      try {
        const pnpmDirs = readdirSync(pnpmStorePath);
        for (const dir of pnpmDirs) {
          if (dir.startsWith('better-auth-studio@')) {
            const pnpmPackagePath = join(pnpmStorePath, dir, 'node_modules', 'better-auth-studio');
            candidates.unshift(
              join(pnpmPackagePath, 'dist', 'public'),
              join(pnpmPackagePath, 'public')
            );
          }
        }
      } catch (err) {}
    }
  } catch (err) {}

  // Try to resolve from import.meta.url for better ESM support (SvelteKit)
  try {
    const moduleUrl = import.meta.url;
    if (moduleUrl) {
      const modulePath = fileURLToPath(moduleUrl);
      const moduleDir = dirname(modulePath);
      const realModuleDir = (() => {
        try {
          return realpathSync(moduleDir);
        } catch {
          return moduleDir;
        }
      })();

      candidates.unshift(
        resolve(realModuleDir, '../public'),
        resolve(realModuleDir, '../../public'),
        resolve(realModuleDir, '../../../public'),
        resolve(realModuleDir, '../../dist/public'),
        resolve(realModuleDir, '../../../dist/public'),
        resolve(realModuleDir, '../dist/public')
      );
    }
  } catch (err) {}

  const baseDirs = [__dirname, __realdir];
  for (const baseDir of baseDirs) {
    candidates.push(
      resolve(baseDir, '../public'),
      resolve(baseDir, '../../public'),
      resolve(baseDir, '../../../public'),
      resolve(baseDir, '../../dist/public'),
      resolve(baseDir, '../../../dist/public'),
      resolve(baseDir, '../dist/public')
    );
  }

  const pnpmMatch = __dirname.match(/(.+\/.pnpm\/[^/]+\/node_modules\/better-auth-studio)\//);
  if (pnpmMatch) {
    const pnpmPackageRoot = pnpmMatch[1];
    candidates.unshift(
      join(pnpmPackageRoot, 'dist', 'public'),
      join(pnpmPackageRoot, 'public'),
      join(pnpmPackageRoot, '..', 'dist', 'public')
    );
  }

  try {
    const svelteKitOutput = join(process.cwd(), '.svelte-kit', 'output', 'server');
    if (existsSync(svelteKitOutput)) {
      candidates.unshift(
        join(svelteKitOutput, 'node_modules', 'better-auth-studio', 'dist', 'public'),
        join(svelteKitOutput, 'node_modules', 'better-auth-studio', 'public')
      );
    }

    const buildOutput = join(process.cwd(), 'build');
    if (existsSync(buildOutput)) {
      candidates.unshift(
        join(buildOutput, 'node_modules', 'better-auth-studio', 'dist', 'public'),
        join(buildOutput, 'node_modules', 'better-auth-studio', 'public')
      );
    }

    const staticDir = join(process.cwd(), 'static', 'studio');
    if (existsSync(staticDir)) {
      candidates.unshift(staticDir);
    }
  } catch (err) {}

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
  } catch (err) {}

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

  for (const candidate of candidates) {
    try {
      if (existsSync(candidate) && statSync(candidate).isDirectory()) {
        return candidate;
      }
    } catch (error) {}
  }

  console.error('[Studio] Could not find public directory');
  console.error('[Studio] Current working directory:', process.cwd());
  console.error('[Studio] __dirname:', __dirname);
  console.error('[Studio] __realdir:', __realdir);

  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      console.error('[Studio] import.meta.url:', import.meta.url);
      const modulePath = fileURLToPath(import.meta.url);
      console.error('[Studio] Resolved module path:', modulePath);
    }
  } catch (err) {
    console.error('[Studio] Could not resolve import.meta.url');
  }

  return null;
}

let cachedPublicDir: string | null = null;

function handleStaticFile(path: string, config: StudioConfig): UniversalResponse {
  if (!cachedPublicDir) {
    cachedPublicDir = findPublicDir();
  }

  if (!cachedPublicDir) {
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
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Geist Mono', monospace; 
      background: #000000; 
      color: #e5e5e5; 
      max-width: 700px; 
      margin: 50px auto; 
      padding: 30px; 
      line-height: 1.7; 
    }
    h1 { 
      font-size: 24px; 
      font-weight: 600; 
      margin-bottom: 16px; 
    }
    p { 
      color: #b3b3b3; 
      margin-bottom: 24px; 
    }
    code { 
      background: #1a1a1a; 
      color: #4ade80; 
      padding: 3px 8px; 
      border-radius: 0px; 
      font-size: 14px; 
      border: 1px solid #2a2a2a;
    }
    .steps { 
      background: #0a0a0a; 
      border: 1px solid #1a1a1a;
      padding: 24px; 
      border-radius: 0px; 
      margin: 24px 0; 
    }
    .steps h3 {
      color: #e5e5e5;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .steps ol {
      margin-left: 20px;
      color: #b3b3b3;
    }
    .steps li {
      margin-bottom: 16px;
    }
    .steps li strong {
      color: #e5e5e5;
    }
    pre { 
      background: #0a0a0a; 
      color: #4ade80; 
      padding: 16px; 
      border-radius: 6px; 
      overflow-x: auto; 
      margin: 12px 0; 
      border: 1px solid #1a1a1a;
      font-size: 13px;
      line-height: 1.6;
    }
    a { 
      color: #60a5fa; 
      text-decoration: none; 
      border-bottom: 1px solid #60a5fa;
      transition: color 0.2s;
    }
    a:hover { 
      color: #93c5fd; 
      border-bottom-color: #93c5fd;
    }
  </style>
</head>
<body>
  <h1>Studio UI Not Available</h1>
  <p>The Better Auth Studio UI assets could not be located. This typically happens on serverless deployments with pnpm.</p>
  
      <div class="steps">
        <h3>To fix this:</h3>
        <ol>
          <li><strong>For Next.js:</strong> Add to <code>next.config.js</code>:
            <pre>outputFileTracingIncludes: {
    '/api/studio': ['./node_modules/better-auth-studio/dist/public/**/*', './node_modules/better-auth-studio/public/**/*'],
}</pre>
          </li>
          <li><strong>For SvelteKit:</strong> Ensure <code>better-auth-studio</code> is in <code>dependencies</code> (not devDependencies). For serverless deployments, you may need to configure your adapter to include the public directory. Check your <code>vite.config.ts</code> or adapter configuration.</li>
          <li>Ensure <code>better-auth-studio</code> is in <code>dependencies</code> (not devDependencies)</li>
          <li>Clear your build cache and redeploy</li>
        </ol>
      </div>
  
  <p><strong>Need help?</strong> Visit <a href="https://github.com/Kinfe123/better-auth-studio/issues">GitHub Issues</a></p>
</body>
</html>`,
      };
    }

    return jsonResponse(503, {
      error: 'Public directory not found',
      message: 'Studio UI assets could not be located. This is likely a Vercel bundling issue.',
      suggestion:
        'For Next.js, add outputFileTracingIncludes to next.config.js to include the public directory. See the HTML error page for details.',
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
    basePath: config.basePath || '/api/studio',
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
  if (path.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2|ttf)$/)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'no-cache';
}
