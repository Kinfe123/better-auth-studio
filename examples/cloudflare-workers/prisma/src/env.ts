export interface Env {
  ASSETS: Fetcher;
  DATABASE_URL: string;
  AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  ADMIN_EMAILS?: string;
  ADMIN_USER_IDS?: string;
}

export function csv(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
