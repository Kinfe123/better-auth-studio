export function getStudioAuthPath(): string {
  const basePath = (window as any).__STUDIO_CONFIG__?.basePath || "";
  return basePath ? `${basePath}/auth` : "/api/auth";
}

export async function fetchStudioAuthJson(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: any }> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(
    `${getStudioAuthPath()}${path.startsWith("/") ? path : `/${path}`}`,
    {
      ...init,
      headers,
      credentials: "include",
    },
  );

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const fallbackBody = await response.text().catch(() => "");
    const fallbackKind = fallbackBody.trim().startsWith("<") ? "HTML" : "non-JSON";
    throw new Error(
      response.ok
        ? `Server returned ${fallbackKind} instead of JSON.`
        : `Request failed with ${response.status}. Server returned ${fallbackKind} instead of JSON.`,
    );
  }

  return {
    response,
    data: await response.json(),
  };
}
