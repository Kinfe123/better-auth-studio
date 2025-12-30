// @ts-ignore - Hono types may not be available in the main package
import type { Context } from 'hono';
import { handleStudioRequest } from '../core/handler.js';
import type { StudioConfig, UniversalRequest, UniversalResponse } from '../types/handler.js';
import { StatusCode } from 'hono/utils/http-status.js';

/**
 * Hono adapter for Better Auth Studio
 */
export function betterAuthStudio(config: StudioConfig) {
  return async (c: Context) => {
    try {
      const universalReq = await convertHonoToUniversal(c);

      const universalRes = await handleStudioRequest(universalReq, config);

      return sendHonoResponse(c, universalRes);
    } catch (error) {
      console.error('Studio handler error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  };
}

async function convertHonoToUniversal(c: Context): Promise<UniversalRequest> {
  let body: any;
  const method = c.req.method;
  
  if (method !== 'GET' && method !== 'HEAD') {
    const contentType = c.req.header('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        body = await c.req.json();
      } catch {
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        body = await c.req.parseBody();
      } catch {
      }
    }
  }

  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value: string, key: string) => {
    headers[key] = value;
  });

  const url = new URL(c.req.url);
  const pathWithQuery = url.pathname + url.search;

  return {
    url: pathWithQuery,
    method: method,
    headers,
    body,
  };
}

function sendHonoResponse(c: Context, universal: UniversalResponse): Response {
  c.status(universal.status as StatusCode);

  Object.entries(universal.headers).forEach(([key, value]) => {
    c.header(key, value);
  });

  if (Buffer.isBuffer(universal.body)) {
    return c.body(universal.body as any);
  } else if (typeof universal.body === 'string') {
    const contentType = universal.headers['content-type'] || universal.headers['Content-Type'] || '';
    if (contentType.includes('application/json')) {
      try {
        return c.json(JSON.parse(universal.body));
      } catch {
        return c.text(universal.body);
      }
    } else if (contentType.includes('text/html')) {
      return c.html(universal.body);
    } else {
      return c.text(universal.body);
    }
  } else {
    return c.text(String(universal.body));
  }
}
