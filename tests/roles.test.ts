import { describe, expect, it } from "vitest";
import {
  DEFAULT_STUDIO_ROLES,
  isAllowedStudioRole,
  normalizeStudioRoles,
} from "../src/utils/roles";

describe("normalizeStudioRoles", () => {
  it("falls back to admin/user when roles are not configured", () => {
    expect(normalizeStudioRoles(undefined)).toEqual(DEFAULT_STUDIO_ROLES);
    expect(normalizeStudioRoles([])).toEqual(DEFAULT_STUDIO_ROLES);
  });

  it("accepts plain strings and uses the value as the label", () => {
    expect(normalizeStudioRoles(["ADMIN", "EDITOR"])).toEqual([
      { value: "ADMIN", label: "ADMIN" },
      { value: "EDITOR", label: "EDITOR" },
    ]);
  });

  it("accepts objects with an explicit label", () => {
    expect(normalizeStudioRoles([{ value: "SYSTEM_ADMIN", label: "System Admin" }])).toEqual([
      { value: "SYSTEM_ADMIN", label: "System Admin" },
    ]);
  });

  it("mixes strings and objects", () => {
    expect(
      normalizeStudioRoles([{ value: "SYSTEM_ADMIN", label: "System Admin" }, "SUPPORT"]),
    ).toEqual([
      { value: "SYSTEM_ADMIN", label: "System Admin" },
      { value: "SUPPORT", label: "SUPPORT" },
    ]);
  });

  it("preserves configured order", () => {
    const roles = normalizeStudioRoles(["c", "a", "b"]);
    expect(roles.map((role) => role.value)).toEqual(["c", "a", "b"]);
  });

  it("drops duplicates, keeping the first occurrence", () => {
    expect(normalizeStudioRoles(["ADMIN", { value: "ADMIN", label: "Ignored" }])).toEqual([
      { value: "ADMIN", label: "ADMIN" },
    ]);
  });

  it("drops unusable entries rather than throwing, so a config typo cannot break the Studio", () => {
    const roles = normalizeStudioRoles([
      "ADMIN",
      "",
      null as any,
      42 as any,
      { label: "no value" } as any,
    ]);
    expect(roles).toEqual([{ value: "ADMIN", label: "ADMIN" }]);
  });

  it("falls back to the defaults when every entry is unusable", () => {
    expect(normalizeStudioRoles(["", null as any])).toEqual(DEFAULT_STUDIO_ROLES);
  });

  it("uses the value when a label is present but empty", () => {
    expect(normalizeStudioRoles([{ value: "ADMIN", label: "" }])).toEqual([
      { value: "ADMIN", label: "ADMIN" },
    ]);
  });
});

describe("isAllowedStudioRole", () => {
  const roles = normalizeStudioRoles(["SYSTEM_ADMIN", "SUPPORT"]);

  it("accepts a configured role", () => {
    expect(isAllowedStudioRole("SYSTEM_ADMIN", roles)).toBe(true);
    expect(isAllowedStudioRole("SUPPORT", roles)).toBe(true);
  });

  it("rejects roles outside the configured list", () => {
    expect(isAllowedStudioRole("admin", roles)).toBe(false);
    expect(isAllowedStudioRole("user", roles)).toBe(false);
    expect(isAllowedStudioRole("", roles)).toBe(false);
  });

  it("is case sensitive", () => {
    expect(isAllowedStudioRole("system_admin", roles)).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isAllowedStudioRole(42, roles)).toBe(false);
    expect(isAllowedStudioRole(["SUPPORT"], roles)).toBe(false);
  });

  it("allows null and undefined, which mean 'no role'", () => {
    expect(isAllowedStudioRole(null, roles)).toBe(true);
    expect(isAllowedStudioRole(undefined, roles)).toBe(true);
  });

  it("accepts the built-in roles when nothing is configured", () => {
    const defaults = normalizeStudioRoles(undefined);
    expect(isAllowedStudioRole("admin", defaults)).toBe(true);
    expect(isAllowedStudioRole("user", defaults)).toBe(true);
    expect(isAllowedStudioRole("SYSTEM_ADMIN", defaults)).toBe(false);
  });
});
