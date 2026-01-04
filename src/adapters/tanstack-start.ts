import { handleStudioRequest } from '../core/handler.js';
import type { StudioConfig, UniversalRequest, UniversalResponse } from '../types/handler.js';

// TanStack Start server route handler context
type TanStackStartHandlerContext = {
  request: Request;
};

/**
 * TanStack Start adapter for Better Auth Studio
 *
 * Usage in a server route:
 * ```ts
 * // src/routes/api/studio/$.ts
 * import { createFileRoute } from '@tanstack/react-router';
 * import { betterAuthStudio } from 'better-auth-studio/tanstack-start';
 * import studioConfig from '../../../../studio.config';
 *
 * const handler = betterAuthStudio(studioConfig);
 *
 * export const Route = createFileRoute('/api/studio/$')({
 *   server: {
 *     handlers: {
 *       GET: handler,
 *       POST: handler,
 *       PUT: handler,
 *       DELETE: handler,
 *       PATCH: handler,
 *     },
 *   },
 * });
 * ```
 */
export function betterAuthStudio(config: StudioConfig) {
  return async ({ request }: TanStackStartHandlerContext): Promise<Response> => {
    try {
      const universalReq = await convertTanStackStartToUniversal(request, config);
      const universalRes = await handleStudioRequest(universalReq, config);
      return universalToResponse(universalRes);
    } catch (error) {
      console.error('Studio handler error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

async function convertTanStackStartToUniversal(
  request: Request,
  config: StudioConfig
): Promise<UniversalRequest> {
  let body: any;
  const method = request.method;

  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch {}
    } else if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      try {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      } catch {}
    } else {
      try {
        const text = await request.text();
        if (text && text.trim()) {
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }
        }
      } catch {}
    }
  }

  const headers: Record<string, string> = {};
  request.headers.forEach((value: string, key: string) => {
    headers[key] = value;
  });

  const basePath = config.basePath || '/api/studio';
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  
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

function universalToResponse(res: UniversalResponse): Response {
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

