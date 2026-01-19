import { handleStudioRequest } from '../core/handler.js';
import type { StudioConfig, UniversalRequest, UniversalResponse } from '../types/handler.js';
import { injectEventHooks } from '../utils/hook-injector.js';

/**
 * Nuxt adapter for Better Auth Studio
 *
 * Usage in a server API route:
 * ```ts
 * // server/api/studio/[...all].ts
 * import { betterAuthStudio } from 'better-auth-studio/nuxt';
 * import studioConfig from '~/studio.config';
 *
 * export default defineEventHandler(betterAuthStudio(studioConfig));
 * ```
 *
 * Note: The adapter will automatically read the request body using h3's readBody
 * if available. If readBody is not accessible, make sure your Nuxt setup has
 * auto-imports enabled for h3 utilities.
 */
export function betterAuthStudio(config: StudioConfig): (event: any) => Promise<Response | any> {
  if (config.events?.enabled && config.auth) {
    injectEventHooks(config.auth, config.events);
  }

  return async (event: any) => {
    try {
      const universalReq = await convertNuxtToUniversal(event, config);
      const universalRes = await handleStudioRequest(universalReq, config);
      return universalToResponse(universalRes);
    } catch (error: any) {
      // Handle client disconnection gracefully
      if (
        error?.code === 'EPIPE' ||
        error?.code === 'ECONNRESET' ||
        error?.message?.includes('aborted') ||
        error?.message?.includes('destroyed')
      ) {
        // Client disconnected, return empty response
        return new Response(null, { status: 499 });
      }

      console.error('Studio handler error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

async function convertNuxtToUniversal(event: any, config: StudioConfig): Promise<UniversalRequest> {
  let body: any;
  const method = event.method;

  if (method !== 'GET' && method !== 'HEAD') {
    // First check if body was already read by h3/Nuxt and stored on event
    if (event.body !== undefined) {
      body = event.body;
    } else {
      // Try to use readBody if it's available (auto-imported in Nuxt)
      // Access it safely without throwing errors
      try {
        // Check if readBody is available globally (Nuxt auto-imports it)
        const readBodyFn = (globalThis as any).readBody;
        if (typeof readBodyFn === 'function') {
          body = await readBodyFn(event);
        }
      } catch (error: any) {
        // Only rethrow connection errors
        if (
          error?.code === 'EPIPE' ||
          error?.code === 'ECONNRESET' ||
          error?.message?.includes('aborted')
        ) {
          throw error;
        }
        // For other errors (like readBody not found), silently continue
        // body will remain undefined
      }
    }
  }

  // Get headers from event
  const headers: Record<string, string> = {};
  if (event.headers) {
    Object.entries(event.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      } else if (Array.isArray(value)) {
        headers[key] = value.join(', ');
      }
    });
  }

  // Extract path and query
  const basePath = config.basePath || '/api/studio';
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

  const url = getRequestURL(event);
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

function getRequestURL(event: any): URL {
  const protocol = event.node.req.socket?.encrypted ? 'https' : 'http';
  const host = event.headers.host || event.headers[':authority'] || 'localhost';
  const path = (event.node.req.url || '/').replace(/[/\\]{2,}/g, '/');
  return new URL(path, `${protocol}://${host}`);
}

function universalToResponse(res: UniversalResponse): Response {
  // Simply return a Response object - Nuxt/h3 will handle it properly
  // Nuxt will handle client disconnections automatically
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}
