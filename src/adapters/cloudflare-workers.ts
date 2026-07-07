type MaybePromise<T> = T | Promise<T>;

export type CloudflareStudioAsset = string | Uint8Array | ArrayBuffer | Response;
export type CloudflareStudioAssetMap = Record<string, CloudflareStudioAsset>;

export type CloudflareStudioAssetBinding = {
  fetch(request: Request): MaybePromise<Response>;
};

export type CloudflareStudioAssetSource<Env = unknown> =
  | CloudflareStudioAssetBinding
  | CloudflareStudioAssetMap
  | ((
      env: Env,
    ) => MaybePromise<CloudflareStudioAssetBinding | CloudflareStudioAssetMap | null | undefined>);

export type CloudflareStudioMetadata = {
  title?: string;
  logo?: string;
  favicon?: string;
  company?: {
    name?: string;
    website?: string;
    supportEmail?: string;
  };
  theme?: "dark" | "light" | "auto";
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  features?: {
    users?: boolean;
    sessions?: boolean;
    organizations?: boolean;
    analytics?: boolean;
    tools?: boolean;
    security?: boolean;
  };
  links?: Array<{ label: string; url: string }>;
  custom?: Record<string, unknown>;
};

export type CloudflareStudioAccessConfig = {
  roles?: string[];
  allowEmails?: string[];
  allowIpAddresses?: string[];
  blockIpAddresses?: string[];
  sessionDuration?: number;
  secret?: string;
};

export type CloudflareStudioApiContext<Env = unknown, Ctx = unknown> = {
  env: Env;
  ctx: Ctx;
  path: string;
  originalPath: string;
  basePath: string;
  config: CloudflareStudioConfig<Env, Ctx>;
};

export type CloudflareStudioApiHandler<Env = unknown, Ctx = unknown> = (
  request: Request,
  context: CloudflareStudioApiContext<Env, Ctx>,
) => MaybePromise<Response | null | undefined>;

export type CloudflareStudioIndexContext<Env = unknown, Ctx = unknown> = {
  env: Env;
  ctx: Ctx;
  path: string;
  config: CloudflareStudioConfig<Env, Ctx>;
};

export type CloudflareStudioConfig<Env = unknown, Ctx = unknown> = {
  auth?: {
    handler?: (request: Request) => MaybePromise<Response>;
    [key: string]: unknown;
  };
  basePath?: string;
  access?: CloudflareStudioAccessConfig;
  metadata?: CloudflareStudioMetadata;
  lastSeenAt?: {
    enabled?: boolean;
    columnName?: string;
  };
  tools?: {
    exclude?: string[];
  };
  events?: {
    enabled?: boolean;
    liveMarquee?: {
      enabled?: boolean;
      pollInterval?: number;
      speed?: number;
      pauseOnHover?: boolean;
      limit?: number;
      sort?: "asc" | "desc";
      colors?: Record<string, string>;
      timeWindow?: Record<string, unknown>;
    };
  };
  assets?: CloudflareStudioAssetSource<Env>;
  indexHtml?:
    | string
    | ((
        context: CloudflareStudioIndexContext<Env, Ctx>,
      ) => MaybePromise<string | Response | null | undefined>);
  apiHandler?: CloudflareStudioApiHandler<Env, Ctx>;
};

export type CloudflareStudioFetchHandler<Env = unknown, Ctx = unknown> = (
  request: Request,
  env?: Env,
  ctx?: Ctx,
) => Promise<Response>;

type NormalizedRoute = {
  path: string;
  originalPath: string;
  basePath: string;
  search: string;
};

const DEFAULT_METADATA: Required<
  Omit<CloudflareStudioMetadata, "colors" | "features" | "links" | "custom">
> = {
  title: "Better Auth Studio",
  logo: "",
  favicon: "",
  company: {
    name: "",
    website: "",
    supportEmail: "",
  },
  theme: "dark",
};

const STATIC_FILE_NAMES = new Set(["/vite.svg", "/favicon.svg", "/logo.png", "/shaders.png"]);

const IP_HEADER_CANDIDATES = [
  "x-forwarded-for",
  "cf-connecting-ip",
  "x-real-ip",
  "x-client-ip",
  "true-client-ip",
] as const;

/**
 * Cloudflare Workers adapter for Better Auth Studio.
 *
 * This entrypoint avoids Node-only imports at module load time. It can serve Studio
 * UI assets from a Workers Assets binding or an in-memory asset map and delegates
 * API routes to an edge-compatible handler supplied by the host app.
 */
export function betterAuthStudio<Env = unknown, Ctx = unknown>(
  config: CloudflareStudioConfig<Env, Ctx>,
): CloudflareStudioFetchHandler<Env, Ctx> {
  return async (request, env, ctx) => {
    try {
      const route = normalizeRoute(request, config.basePath);
      const accessDecision = evaluateEdgeAccess(config.access, request);

      if (!accessDecision.allowed) {
        return jsonResponse(
          {
            success: false,
            message: accessDecision.message,
            reason: accessDecision.reason,
            ...(accessDecision.ipAddress ? { ipAddress: accessDecision.ipAddress } : {}),
          },
          403,
          request,
        );
      }

      if (isStaticAssetPath(route.path)) {
        return handleAssetRequest(request, route, config, env as Env, ctx as Ctx);
      }

      const apiPath = getApiPath(request, route, config);
      if (apiPath) {
        return handleApiRequest(request, route, apiPath, config, env as Env, ctx as Ctx);
      }

      return handleIndexRequest(request, route, config, env as Env, ctx as Ctx);
    } catch (error) {
      console.error("Cloudflare Studio handler error:", error);
      return jsonResponse({ error: "Internal server error" }, 500, request);
    }
  };
}

function normalizeBasePath(basePath: string | undefined): string {
  if (!basePath || basePath === "/") return "";
  const withLeadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash.slice(0, -1) : withLeadingSlash;
}

function normalizeRoute(request: Request, basePath: string | undefined): NormalizedRoute {
  const url = new URL(request.url);
  const normalizedBasePath = normalizeBasePath(basePath);
  let path = url.pathname || "/";

  if (normalizedBasePath) {
    if (path === normalizedBasePath || path === `${normalizedBasePath}/`) {
      path = "/";
    } else if (path.startsWith(`${normalizedBasePath}/`)) {
      path = path.slice(normalizedBasePath.length) || "/";
    }
  }

  return {
    path: path || "/",
    originalPath: url.pathname || "/",
    basePath: normalizedBasePath,
    search: url.search,
  };
}

function isStaticAssetPath(path: string): boolean {
  return path.startsWith("/assets/") || STATIC_FILE_NAMES.has(path);
}

function wantsJsonResponse(request: Request): boolean {
  const accept = request.headers.get("accept") || "";
  return accept.includes("application/json") || accept === "*/*" || !accept.includes("text/html");
}

function getApiPath<Env, Ctx>(
  request: Request,
  route: NormalizedRoute,
  config: CloudflareStudioConfig<Env, Ctx>,
): string | null {
  if (route.path === "/api" || route.path.startsWith("/api/")) {
    return route.path;
  }

  if (route.path === "/auth" || route.path.startsWith("/auth/")) {
    return `/api${route.path}`;
  }

  if (config.basePath && route.path !== "/" && wantsJsonResponse(request)) {
    return `/api${route.path}`;
  }

  return null;
}

async function handleApiRequest<Env, Ctx>(
  request: Request,
  route: NormalizedRoute,
  apiPath: string,
  config: CloudflareStudioConfig<Env, Ctx>,
  env: Env,
  ctx: Ctx,
): Promise<Response> {
  if (apiPath === "/api/health") {
    return jsonResponse(
      {
        status: "ok",
        environment: "cloudflare-workers",
        timestamp: new Date().toISOString(),
      },
      200,
      request,
    );
  }

  const delegatedRequest = rewriteRequestPath(request, apiPath, route.search);
  const context: CloudflareStudioApiContext<Env, Ctx> = {
    env,
    ctx,
    path: apiPath,
    originalPath: route.originalPath,
    basePath: route.basePath,
    config,
  };

  const apiResponse = await config.apiHandler?.(delegatedRequest, context);
  if (apiResponse) {
    return finalizeResponse(request, apiResponse);
  }

  if (apiPath.startsWith("/api/auth/") && typeof config.auth?.handler === "function") {
    const authResponse = await config.auth.handler(delegatedRequest);
    return finalizeResponse(request, authResponse);
  }

  return jsonResponse(
    {
      error: "Cloudflare Workers API handler not configured",
      message:
        "The Cloudflare Workers adapter is edge-safe and can serve the Studio shell, but the built-in Studio API still depends on Node-only modules. Provide apiHandler to handle /api/* routes in your Worker.",
      path: apiPath,
    },
    501,
    request,
  );
}

async function handleAssetRequest<Env, Ctx>(
  request: Request,
  route: NormalizedRoute,
  config: CloudflareStudioConfig<Env, Ctx>,
  env: Env,
  _ctx: Ctx,
): Promise<Response> {
  const source = await resolveAssetSource(config, env);
  const response = source ? await readAsset(source, request, route.path, route.search) : null;

  if (response && response.status !== 404) {
    return finalizeResponse(request, response);
  }

  return new Response(null, {
    status: 404,
    headers: {
      "Cache-Control": "no-cache",
    },
  });
}

async function handleIndexRequest<Env, Ctx>(
  request: Request,
  route: NormalizedRoute,
  config: CloudflareStudioConfig<Env, Ctx>,
  env: Env,
  ctx: Ctx,
): Promise<Response> {
  const configuredIndex = await readConfiguredIndex(config, env, ctx, route.path);
  if (configuredIndex) {
    return htmlResponse(request, await responseToHtml(configuredIndex), config);
  }

  const source = await resolveAssetSource(config, env);
  const assetIndex = source ? await readAsset(source, request, "/index.html", route.search) : null;
  if (assetIndex && assetIndex.status >= 200 && assetIndex.status < 300) {
    return htmlResponse(request, await assetIndex.text(), config);
  }

  return htmlResponse(request, getMissingAssetsHtml(config), config, 503);
}

async function readConfiguredIndex<Env, Ctx>(
  config: CloudflareStudioConfig<Env, Ctx>,
  env: Env,
  ctx: Ctx,
  path: string,
): Promise<string | Response | null> {
  if (!config.indexHtml) return null;

  if (typeof config.indexHtml === "string") {
    return config.indexHtml;
  }

  const value = await config.indexHtml({
    env,
    ctx,
    path,
    config,
  });
  return value || null;
}

async function responseToHtml(value: string | Response): Promise<string> {
  if (typeof value === "string") return value;
  return value.text();
}

async function resolveAssetSource<Env, Ctx>(
  config: CloudflareStudioConfig<Env, Ctx>,
  env: Env,
): Promise<CloudflareStudioAssetBinding | CloudflareStudioAssetMap | null> {
  if (typeof config.assets === "function") {
    return (await config.assets(env)) || null;
  }

  if (config.assets) {
    return config.assets;
  }

  const defaultBinding = getDefaultAssetsBinding(env);
  return defaultBinding || null;
}

function getDefaultAssetsBinding(env: unknown): CloudflareStudioAssetBinding | null {
  const maybeAssets = (env as { ASSETS?: unknown } | undefined)?.ASSETS;
  if (isAssetBinding(maybeAssets)) {
    return maybeAssets;
  }
  return null;
}

async function readAsset(
  source: CloudflareStudioAssetBinding | CloudflareStudioAssetMap,
  request: Request,
  path: string,
  search: string,
): Promise<Response | null> {
  if (isAssetBinding(source)) {
    return source.fetch(rewriteRequestPath(request, path, search));
  }

  const asset = findAssetInMap(source, path);
  if (!asset) return null;
  if (asset instanceof Response) return asset.clone();

  return new Response(asset as any, {
    status: 200,
    headers: {
      "Content-Type": getContentType(path, typeof asset === "string"),
      "Cache-Control": getCacheControl(path),
    },
  });
}

function isAssetBinding(value: unknown): value is CloudflareStudioAssetBinding {
  return !!value && typeof value === "object" && typeof (value as any).fetch === "function";
}

function findAssetInMap(
  source: CloudflareStudioAssetMap,
  path: string,
): CloudflareStudioAsset | null {
  const normalizedPath = path === "/" ? "/index.html" : path;
  const candidates = [
    normalizedPath,
    normalizedPath.startsWith("/") ? normalizedPath.slice(1) : `/${normalizedPath}`,
  ];

  for (const candidate of candidates) {
    const asset = source[candidate];
    if (asset) return asset;
  }

  return null;
}

function rewriteRequestPath(request: Request, path: string, search: string): Request {
  const url = new URL(request.url);
  url.pathname = path;
  url.search = search;
  return new Request(url.toString(), request);
}

function prepareFrontendConfig<Env, Ctx>(config: CloudflareStudioConfig<Env, Ctx>) {
  const metadata = {
    ...DEFAULT_METADATA,
    ...config.metadata,
    company: {
      ...DEFAULT_METADATA.company,
      ...config.metadata?.company,
    },
  };
  const liveMarqueeConfig = config.events?.liveMarquee;
  const shouldIncludeLiveMarquee = !!liveMarqueeConfig || !!config.events?.enabled;

  return {
    basePath: normalizeBasePath(config.basePath),
    metadata,
    liveMarquee: shouldIncludeLiveMarquee
      ? {
          enabled: liveMarqueeConfig?.enabled !== false,
          pollInterval: liveMarqueeConfig?.pollInterval || 2000,
          speed: liveMarqueeConfig?.speed ?? 0.5,
          pauseOnHover: liveMarqueeConfig?.pauseOnHover ?? true,
          limit: liveMarqueeConfig?.limit ?? 50,
          sort: liveMarqueeConfig?.sort ?? "desc",
          colors: liveMarqueeConfig?.colors || undefined,
          timeWindow: liveMarqueeConfig?.timeWindow || undefined,
        }
      : undefined,
    lastSeenAt:
      config.lastSeenAt && typeof config.lastSeenAt === "object"
        ? {
            enabled: !!config.lastSeenAt.enabled,
            columnName: config.lastSeenAt.columnName,
          }
        : undefined,
    tools:
      config.tools && Array.isArray(config.tools.exclude) && config.tools.exclude.length > 0
        ? { exclude: config.tools.exclude }
        : undefined,
  };
}

function injectConfig<Env, Ctx>(html: string, config: CloudflareStudioConfig<Env, Ctx>): string {
  const frontendConfig = prepareFrontendConfig(config);
  const safeJson = JSON.stringify(frontendConfig)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  const escapedTitle = escapeHtml(frontendConfig.metadata.title);

  let modifiedHtml = html.replace(/<title>.*?<\/title>/i, `<title>${escapedTitle}</title>`);

  if (frontendConfig.metadata.favicon) {
    const favicon = escapeHtml(frontendConfig.metadata.favicon);
    const faviconTag = `<link rel="icon" type="${getContentType(favicon)}" href="${favicon}" />`;
    modifiedHtml = modifiedHtml.replace(
      /<link[^>]*rel=["'](icon|shortcut icon)["'][^>]*>/gi,
      faviconTag,
    );
    if (!modifiedHtml.includes('rel="icon"') && !modifiedHtml.includes("rel='icon'")) {
      modifiedHtml = modifiedHtml.replace("</head>", `  ${faviconTag}\n</head>`);
    }
  }

  if (frontendConfig.basePath) {
    modifiedHtml = modifiedHtml
      .replace(/href="\/assets\//g, `href="${frontendConfig.basePath}/assets/`)
      .replace(/src="\/assets\//g, `src="${frontendConfig.basePath}/assets/`)
      .replace(/href="\/vite\.svg"/g, `href="${frontendConfig.basePath}/vite.svg"`)
      .replace(/href="\/favicon\.svg"/g, `href="${frontendConfig.basePath}/favicon.svg"`)
      .replace(/href="\/logo\.png"/g, `href="${frontendConfig.basePath}/logo.png"`)
      .replace(/src="\/logo\.png"/g, `src="${frontendConfig.basePath}/logo.png"`);
  }

  const script = `
    <script>
      const __BAS_THEME_KEY__ = "better-auth-studio-theme";
      window.__STUDIO_CONFIG__ = ${safeJson};
      Object.freeze(window.__STUDIO_CONFIG__);
      try {
        const configuredTheme = window.__STUDIO_CONFIG__?.metadata?.theme === "light" ? "light" : "dark";
        const storedTheme = window.localStorage.getItem(__BAS_THEME_KEY__);
        const activeTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : configuredTheme;
        document.documentElement.dataset.theme = activeTheme;
        document.documentElement.style.colorScheme = activeTheme;
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(activeTheme);
      } catch {
        document.documentElement.dataset.theme = window.__STUDIO_CONFIG__?.metadata?.theme === "light" ? "light" : "dark";
        document.documentElement.style.colorScheme = document.documentElement.dataset.theme;
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(document.documentElement.dataset.theme);
      }
      if (window.__STUDIO_CONFIG__?.metadata?.title) {
        document.title = window.__STUDIO_CONFIG__.metadata.title;
      }
    </script>
  `;

  if (modifiedHtml.includes("</head>")) {
    return modifiedHtml.replace("</head>", `${script}</head>`);
  }

  return `${script}${modifiedHtml}`;
}

function htmlResponse<Env, Ctx>(
  request: Request,
  html: string,
  config: CloudflareStudioConfig<Env, Ctx>,
  status = 200,
): Response {
  const body = request.method === "HEAD" ? null : injectConfig(html, config);
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

function jsonResponse(data: unknown, status: number, request: Request): Response {
  return new Response(request.method === "HEAD" ? null : JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
}

function finalizeResponse(request: Request, response: Response): Response {
  if (request.method !== "HEAD") return response;
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

function getMissingAssetsHtml<Env, Ctx>(config: CloudflareStudioConfig<Env, Ctx>): string {
  const basePath = normalizeBasePath(config.basePath) || "/";
  return `<!DOCTYPE html>
<html>
<head>
  <title>Better Auth Studio</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, sans-serif; background: #050505; color: #f5f5f5; max-width: 720px; margin: 56px auto; padding: 0 24px; line-height: 1.6; }
    code { background: #181818; border: 1px solid #2a2a2a; padding: 2px 6px; }
    pre { background: #101010; border: 1px solid #2a2a2a; padding: 16px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Studio assets are not configured</h1>
  <p>The Cloudflare Workers adapter is running at <code>${escapeHtml(basePath)}</code>, but it could not find Studio UI assets.</p>
  <p>Bind Workers Assets as <code>ASSETS</code>, pass an <code>assets</code> binding, or provide <code>indexHtml</code> when creating the handler.</p>
  <pre>import { betterAuthStudio } from "better-auth-studio/cloudflare-workers";

const studio = betterAuthStudio({
  basePath: "${escapeHtml(basePath === "/" ? "" : basePath)}",
});

export default {
  fetch: (request, env, ctx) => studio(request, env, ctx),
};</pre>
</body>
</html>`;
}

function evaluateEdgeAccess(
  accessConfig: CloudflareStudioAccessConfig | undefined,
  request: Request,
):
  | { allowed: true; ipAddress: string | null }
  | {
      allowed: false;
      ipAddress: string | null;
      reason: "ip_not_allowed" | "ip_blocked";
      message: string;
    } {
  const ipAddress = extractClientIp(request.headers);
  const allowIpAddresses = accessConfig?.allowIpAddresses?.filter((value) => value.trim().length);
  if (allowIpAddresses?.length) {
    if (!ipAddress || !allowIpAddresses.some((rule) => ipMatchesRule(ipAddress, rule))) {
      return {
        allowed: false,
        ipAddress,
        reason: "ip_not_allowed",
        message: "Access denied. This IP address is not in the allowed list.",
      };
    }
  }

  const blockIpAddresses = accessConfig?.blockIpAddresses?.filter((value) => value.trim().length);
  if (blockIpAddresses?.length && ipAddress) {
    const blocked = blockIpAddresses.some((rule) => ipMatchesRule(ipAddress, rule));
    if (blocked) {
      return {
        allowed: false,
        ipAddress,
        reason: "ip_blocked",
        message: "Access denied. This IP address is blocked.",
      };
    }
  }

  return { allowed: true, ipAddress };
}

function extractClientIp(headers: Headers): string | null {
  for (const header of IP_HEADER_CANDIDATES) {
    const value = headers.get(header);
    if (!value) continue;

    const ip = normalizeIpToken(value.split(",")[0]);
    if (ip) return ip;
  }

  const forwarded = headers.get("forwarded");
  if (forwarded) {
    const entries = forwarded.split(",");
    for (const entry of entries) {
      const match = entry.match(/for=("?\[?[a-fA-F0-9:.]+\]?"?)/i);
      if (!match) continue;
      const ip = normalizeIpToken(match[1]);
      if (ip) return ip;
    }
  }

  return null;
}

function normalizeIpToken(raw: string | undefined | null): string | null {
  if (!raw) return null;

  let value = raw.trim();
  if (!value || value.toLowerCase() === "unknown") return null;
  if (value.toLowerCase().startsWith("for=")) value = value.slice(4).trim();

  value = value.replace(/^"+|"+$/g, "");
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    if (end > 0) value = value.slice(1, end);
  }
  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(value)) value = value.split(":")[0] || value;
  if (value.startsWith("::ffff:")) value = value.slice(7);

  return value || null;
}

function ipMatchesRule(ipAddress: string, rule: string): boolean {
  const trimmedRule = rule.trim();
  if (!trimmedRule) return false;

  if (!trimmedRule.includes("*")) {
    return ipAddress === normalizeIpToken(trimmedRule);
  }

  const pattern = `^${escapeRegExp(trimmedRule).replace(/\\\*/g, ".*")}$`;
  return new RegExp(pattern).test(ipAddress);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getContentType(path: string, preferHtml = false): string {
  const cleanPath = path.split("?")[0] || "";
  const ext = cleanPath.slice(cleanPath.lastIndexOf(".")).toLowerCase();
  const types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
  };

  return types[ext] || (preferHtml ? "text/html; charset=utf-8" : "application/octet-stream");
}

function getCacheControl(path: string): string {
  if (path.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2|ttf)$/)) {
    return "public, max-age=31536000, immutable";
  }
  return "no-cache";
}
