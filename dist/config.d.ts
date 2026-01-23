import type { BetterAuthOptions } from "better-auth";
export interface AuthProvider {
  type: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  [key: string]: any;
}
export interface AuthDatabase {
  url?: string;
  type?: string;
  dialect?: string;
  adapter?: string;
  provider?: string;
  [key: string]: any;
}
export interface AuthConfig {
  database?: {
    type?: string;
    adapter?: string;
    provider?: string;
    dialect?: string;
    casing?: string;
    debugLogs?: boolean;
    url?: string;
    connectionString?: string;
    [key: string]: any;
  };
  emailAndPassword?: BetterAuthOptions["emailAndPassword"];
  socialProviders?: Array<{
    id?: string;
    name: string;
    clientId?: string;
    clientSecret?: string;
    redirectURI?: string;
    enabled: boolean;
  }>;
  trustedOrigins?: BetterAuthOptions["trustedOrigins"];
  plugins?: BetterAuthOptions["plugins"];
  advanced?: BetterAuthOptions["advanced"] & Record<string, any>;
  [key: string]: any;
}
declare let possiblePaths: string[];
export declare function getPathAliases(cwd: string): Record<string, string> | null;
export declare function getConfig({
  cwd,
  configPath,
  shouldThrowOnError,
  noCache,
}: {
  cwd: string;
  configPath?: string;
  shouldThrowOnError?: boolean;
  noCache?: boolean;
}): Promise<any>;
export { possiblePaths };
export declare function findAuthConfig(configPath?: string): Promise<AuthConfig | null>;
//# sourceMappingURL=config.d.ts.map
