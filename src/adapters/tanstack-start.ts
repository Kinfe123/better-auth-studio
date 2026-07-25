import { handleStudioRequest } from "../core/handler.js";
import type { StudioConfig, UniversalRequest, UniversalResponse } from "../types/handler.js";
import { injectEventHooks, injectLastSeenAtHooks } from "../utils/hook-injector.js";

// TanStack Start server route handler context
type TanStackStartHandlerContext = {
  request: Request;
};

const STATIC_ASSET_QUERY_PARAM = "__better_auth_studio_asset";
const STATIC_ASSET_PATH_PATTERN = /^\/(?:assets\/[^/?#]+|vite\.svg|favicon\.svg|logo\.png)$/;

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
  if (config.auth) {
    injectLastSeenAtHooks(config.auth, config);
    if (config.events?.enabled) injectEventHooks(config.auth, config.events);
  }

  return async ({ request }: TanStackStartHandlerContext): Promise<Response> => {
    try {
      const universalReq = await convertTanStackStartToUniversal(request, config);
      const universalRes = await handleStudioRequest(universalReq, config);
      return universalToResponse(universalRes, config);
    } catch (error) {
      console.error("Studio handler error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}

async function convertTanStackStartToUniversal(
  request: Request,
  config: StudioConfig,
): Promise<UniversalRequest> {
  let body: any;
  const method = request.method;

  if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch {}
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
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

  const basePath = config.basePath || "/api/studio";
  const normalizedBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

  const url = new URL(request.url);
  const queryAssetPath = url.searchParams.get(STATIC_ASSET_QUERY_PARAM);
  const acceptedQueryAssetPath =
    queryAssetPath && STATIC_ASSET_PATH_PATTERN.test(queryAssetPath) ? queryAssetPath : null;
  let path = acceptedQueryAssetPath || url.pathname;

  if (!acceptedQueryAssetPath && path.startsWith(normalizedBasePath)) {
    path = path.slice(normalizedBasePath.length) || "/";
  }

  url.searchParams.delete(STATIC_ASSET_QUERY_PARAM);
  const query = url.searchParams.toString();
  const pathWithQuery = path + (query ? `?${query}` : "");

  return {
    url: pathWithQuery,
    method: method,
    headers,
    body,
  };
}

function universalToResponse(res: UniversalResponse, config: StudioConfig): Response {
  const headers = new Headers(res.headers);
  res.setCookies?.forEach((cookie) => {
    headers.append("Set-Cookie", cookie);
  });

  let body = res.body;
  if (
    typeof body === "string" &&
    headers.get("Content-Type")?.toLowerCase().includes("text/html")
  ) {
    body = rewriteStaticAssetUrls(body, config.basePath || "/api/studio");
  }

  return new Response(body, {
    status: res.status,
    headers,
  });
}

/**
 * Nitro can treat nested URLs ending in .js/.css as public files before a
 * TanStack Start splat route gets a chance to handle them. Keep Studio assets
 * on the exact server-route URL and carry the requested file in the query.
 */
function rewriteStaticAssetUrls(html: string, basePath: string): string {
  const normalizedBasePath = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const escapedBasePath = normalizedBasePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const assetUrlPattern = new RegExp(
    `((?:href|src)=["'])${escapedBasePath}(/(?:assets/[^"'?#]+|vite\\.svg|favicon\\.svg|logo\\.png))(["'])`,
    "g",
  );

  return html.replace(assetUrlPattern, (_match, prefix, assetPath, suffix) => {
    const query = new URLSearchParams({ [STATIC_ASSET_QUERY_PARAM]: assetPath });
    return `${prefix}${normalizedBasePath}?${query.toString()}${suffix}`;
  });
}
