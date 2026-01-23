/**
 * Get the base path from the studio config
 */
export function getBasePath(): string {
  return (window as any).__STUDIO_CONFIG__?.basePath || "/api/studio";
}

/**
 * Build an API URL with the correct base path
 * @param path - The API path (e.g., '/api/users')
 * @returns The full URL with base path
 */
export function buildApiUrl(path: string): string {
  const basePath = getBasePath();

  if (path.startsWith(basePath)) {
    return path;
  }

  if (path.startsWith("/api/")) {
    return `${basePath}${path}`;
  }

  return `${basePath}/api${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Fetch wrapper that automatically adds the base path
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = buildApiUrl(path);
  return fetch(url, init);
}
