# Agent Instructions
Use this file when an AI coding agent edits the generated documentation PR.
## Documentation Source
- The docs source lives in `apps/docs`.
- `docs.json` is the Docs Cloud configuration for publishing, previews, and content roots.
- Keep every page grounded in README, package metadata, source exports, CLI help, environment examples, or existing docs.
## Generated Docs Map
- /docs - Better Auth Studio
- /docs/installation - Installation
- /docs/quickstart - Quickstart
- /docs/configuration - Configuration
- /docs/configuration/database-adapters - Database Adapters
- /docs/configuration/deployment - Deployment
- /docs/guides - Guides
- /docs/guides/cli-usage - CLI Usage
- /docs/guides/watch-mode - Watch Mode
- /docs/examples - Examples
- /docs/examples/astro - Astro Example
- /docs/examples/elysia - Elysia Example
- /docs/examples/express - Express Example
- /docs/examples/hono - Hono Example
- /docs/examples/nextjs - Next.js Example
- /docs/examples/nuxt - Nuxt Example
- /docs/examples/remix - Remix Example
- /docs/examples/solid-start - SolidStart Example
- /docs/examples/svelte-kit - SvelteKit Example
- /docs/examples/tanstack-start - TanStack Start Example
- /docs/self-hosting - Self-Hosting
- /docs/self-hosting/overview - Self-Hosting Overview
- /docs/self-hosting/astro - Astro Setup
- /docs/self-hosting/elysia - Elysia Setup
- 23 more generated pages are present in the docs source.
## Editing Rules
- Prefer reader-facing task explanations over source inventories.
- Do not add commands, flags, environment variables, routes, imports, or framework names unless they are present in the repository.
- If you add or rename a page, keep its frontmatter title and description accurate and make sure the navigation ordering still includes it.
- Avoid analyzer language such as generated from, source evidence, implementation map, source surface, or detected in files.
## Verification
- Build the docs site with `cd apps/docs && pnpm install && pnpm build` before handing off a docs PR.
- Open `/docs` and at least one generated leaf page to confirm the sidebar and page content match the PR.
