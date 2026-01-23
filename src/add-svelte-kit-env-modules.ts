export function addSvelteKitEnvModules(alias: Record<string, string>) {
  // Add SvelteKit environment modules to the alias
  alias["$env/static/public"] = "sveltekit-env-static-public";
  alias["$env/static/private"] = "sveltekit-env-static-private";
  alias["$env/dynamic/public"] = "sveltekit-env-dynamic-public";
  alias["$env/dynamic/private"] = "sveltekit-env-dynamic-private";
  alias["$app/environment"] = "@sveltejs/kit";
  alias["$app/forms"] = "@sveltejs/kit";
  alias["$app/navigation"] = "@sveltejs/kit";
  alias["$app/paths"] = "@sveltejs/kit";
  alias["$app/stores"] = "@sveltejs/kit";
  alias["$app/types"] = "@sveltejs/kit";
  alias["$app/*"] = "@sveltejs/kit";
}
