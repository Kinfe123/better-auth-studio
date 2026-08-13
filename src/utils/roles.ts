import type { StudioRoleOption, StudioRolesConfig } from "../types/handler.js";

/**
 * Roles offered when `userRoles` is not configured.
 *
 * These match Better Auth's built-in admin plugin vocabulary, so existing
 * deployments that never set `userRoles` keep the same UI options.
 */
export const DEFAULT_STUDIO_ROLES: StudioRoleOption[] = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

/**
 * Normalizes the `userRoles` config into `{ value, label }` pairs.
 *
 * Accepts plain strings for the common case (`userRoles: ["ADMIN", "EDITOR"]`) and
 * `{ value, label }` objects when the display text should differ from the stored
 * value (`userRoles: [{ value: "SYSTEM_ADMIN", label: "System Admin" }]`).
 *
 * Entries without a usable `value` are dropped rather than throwing, so a typo in
 * config cannot take the whole Studio down. If nothing usable remains, the
 * defaults are returned.
 */
export function normalizeStudioRoles(roles?: StudioRolesConfig): StudioRoleOption[] {
  if (!Array.isArray(roles) || roles.length === 0) {
    return DEFAULT_STUDIO_ROLES;
  }

  const normalized: StudioRoleOption[] = [];
  const seen = new Set<string>();

  for (const entry of roles) {
    const value = typeof entry === "string" ? entry : entry?.value;
    if (typeof value !== "string" || value.length === 0 || seen.has(value)) {
      continue;
    }
    seen.add(value);

    const label = typeof entry === "string" ? undefined : entry?.label;
    normalized.push({
      value,
      label: typeof label === "string" && label.length > 0 ? label : value,
    });
  }

  return normalized.length > 0 ? normalized : DEFAULT_STUDIO_ROLES;
}

/**
 * True when `role` may be written to the user table under the given config.
 *
 * `null` and `undefined` are allowed: the Studio uses them to mean "no role", and
 * the update routes only write the column when the field is present.
 */
export function isAllowedStudioRole(role: unknown, roles: StudioRoleOption[]): boolean {
  if (role === null || role === undefined) {
    return true;
  }
  return typeof role === "string" && roles.some((option) => option.value === role);
}
