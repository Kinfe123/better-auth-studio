/**
 * All studio tool ids. Must match backend STUDIO_TOOL_IDS.
 * Used to filter excluded tools and compute visible count for the Layout badge.
 */
export const ALL_STUDIO_TOOL_IDS: readonly string[] = [
  "test-oauth",
  "hash-password",
  "run-migration",
  "test-db",
  "validate-config",
  "health-check",
  "export-data",
  "jwt-decoder",
  "token-generator",
  "plugin-generator",
  "uuid-generator",
  "password-strength",
  "oauth-credentials",
  "secret-generator",
];

export interface StudioToolsConfig {
  tools?: { exclude?: string[] };
}

/**
 * Returns the set of tool ids that are excluded by config (only includes valid ids).
 */
export function getExcludedToolIds(config: StudioToolsConfig | null | undefined): Set<string> {
  const exclude = config?.tools?.exclude;
  if (!exclude || !Array.isArray(exclude)) return new Set();
  return new Set(exclude.filter((id) => ALL_STUDIO_TOOL_IDS.includes(id)));
}

/**
 * Returns the number of tools that are visible (not excluded) for the Layout badge.
 */
export function getVisibleToolsCount(config: StudioToolsConfig | null | undefined): number {
  const excluded = getExcludedToolIds(config);
  return ALL_STUDIO_TOOL_IDS.length - excluded.size;
}
