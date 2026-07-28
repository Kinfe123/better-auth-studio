export type StudioRoleOption = {
  value: string;
  label?: string;
};

/**
 * Roles offered when the host application has not configured any.
 *
 * Mirrors `DEFAULT_STUDIO_ROLES` on the server so the dialogs still render if the
 * injected config is missing (older server build, or the page opened directly).
 */
const DEFAULT_ROLES: StudioRoleOption[] = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

/**
 * Role options for the user Create/Edit dialogs.
 *
 * Read from the config the server injects into `window.__STUDIO_CONFIG__`, so the
 * Studio offers the host application's own role vocabulary rather than a
 * hardcoded list it cannot know is wrong.
 */
export function getStudioRoles(): StudioRoleOption[] {
  const configured = (window as any).__STUDIO_CONFIG__?.userRoles;

  if (!Array.isArray(configured) || configured.length === 0) {
    return DEFAULT_ROLES;
  }

  const roles = configured
    .map((entry: unknown): StudioRoleOption | null => {
      if (typeof entry === "string") {
        return entry ? { value: entry, label: entry } : null;
      }
      const value = (entry as StudioRoleOption)?.value;
      if (typeof value !== "string" || !value) {
        return null;
      }
      const label = (entry as StudioRoleOption)?.label;
      return { value, label: typeof label === "string" && label ? label : value };
    })
    .filter((role): role is StudioRoleOption => role !== null);

  return roles.length > 0 ? roles : DEFAULT_ROLES;
}
