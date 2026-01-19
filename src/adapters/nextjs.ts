import { handleStudioRequest } from '../core/handler.js';
import type { StudioConfig, UniversalRequest, UniversalResponse } from '../types/handler.js';
import { injectEventHooks } from '../utils/hook-injector.js';

function getUrlFromRequest(req: Request): string {
  const nextUrl = (req as any).nextUrl;
  if (nextUrl && typeof nextUrl.pathname === 'string') {
    return nextUrl.pathname + (nextUrl.search || '');
  }
  const url = new URL(req.url);
  return url.pathname + url.search;
}

export function betterAuthStudio(config: StudioConfig) {
  if (config.events?.enabled && config.auth) {
    injectEventHooks(config.auth, config.events);
  }

  return async (request: Request): Promise<Response> => {
    try {
      const universalRequest = await requestToUniversal(request);
      const universalResponse = await handleStudioRequest(universalRequest, config);
      return universalToResponse(universalResponse);
    } catch (error) {
      console.error('Studio handler error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

async function requestToUniversal(req: Request): Promise<UniversalRequest> {
  let body: any;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await req.json();
      } catch {}
    }
  }

  const headers: Record<string, string> = {};
  req.headers.forEach((value: string, key: string) => {
    headers[key] = value;
  });

  return {
    url: getUrlFromRequest(req),
    method: req.method,
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
