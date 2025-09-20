export function addSvelteKitEnvModules(alias) {
    // Add SvelteKit environment modules to the alias
    alias['$env/static/public'] = 'sveltekit-env-static-public';
    alias['$env/static/private'] = 'sveltekit-env-static-private';
    alias['$env/dynamic/public'] = 'sveltekit-env-dynamic-public';
    alias['$env/dynamic/private'] = 'sveltekit-env-dynamic-private';
}
//# sourceMappingURL=add-svelte-kit-env-modules.js.map