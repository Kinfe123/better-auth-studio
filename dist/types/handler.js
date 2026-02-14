/** All studio tool ids. Use this union for type-safe `tools.exclude` in self-host. */
export const STUDIO_TOOL_IDS = [
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
export function defineStudioConfig(config) {
    return config;
}
//# sourceMappingURL=handler.js.map