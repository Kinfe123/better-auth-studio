export function getStudioAuthPath(): string {
  const basePath = (window as any).__STUDIO_CONFIG__?.basePath || "";
  return basePath ? `${basePath}/auth` : "/api/auth";
}

function getStudioAuthFallbackPath(): string | null {
  const basePath = (window as any).__STUDIO_CONFIG__?.basePath || "";
  if (!basePath) return null;
  return `${basePath}/api/auth`;
}

async function tryFetchJson(
  authBasePath: string,
  path: string,
  init: RequestInit,
): Promise<{ response: Response; data: any; isJson: boolean; rawBody?: string }> {
  const response = await fetch(`${authBasePath}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {
      response,
      data: null,
      isJson: false,
      rawBody: await response.text().catch(() => ""),
    };
  }

  return {
    response,
    data: await response.json(),
    isJson: true,
  };
}

export async function fetchStudioAuthJson(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: any }> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const requestInit: RequestInit = {
    ...init,
    headers,
  };

  const primaryResult = await tryFetchJson(getStudioAuthPath(), path, requestInit);
  if (primaryResult.isJson) {
    return { response: primaryResult.response, data: primaryResult.data };
  }

  const fallbackPath = getStudioAuthFallbackPath();
  if (fallbackPath && fallbackPath !== getStudioAuthPath()) {
    const fallbackResult = await tryFetchJson(fallbackPath, path, requestInit);
    if (fallbackResult.isJson) {
      return { response: fallbackResult.response, data: fallbackResult.data };
    }

    const fallbackKind = (fallbackResult.rawBody || "").trim().startsWith("<")
      ? "HTML"
      : "non-JSON";
    throw new Error(
      fallbackResult.response.ok
        ? `Server returned ${fallbackKind} instead of JSON for ${path}.`
        : `Request failed with ${fallbackResult.response.status}. Server returned ${fallbackKind} instead of JSON for ${path}.`,
    );
  }

  const primaryKind = (primaryResult.rawBody || "").trim().startsWith("<") ? "HTML" : "non-JSON";
  throw new Error(
    primaryResult.response.ok
      ? `Server returned ${primaryKind} instead of JSON for ${path}.`
      : `Request failed with ${primaryResult.response.status}. Server returned ${primaryKind} instead of JSON for ${path}.`,
  );
}
