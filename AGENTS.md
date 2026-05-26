# Docs Maintenance Guide
Use this file as the handoff checklist for future edits to this documentation PR.
## Source Layout
- The docs source lives in `apps/docs`.
- `docs.json` is the Docs Cloud configuration for publishing, previews, and content roots.
- Keep every page grounded in README content, package metadata, source exports, CLI help, environment examples, or existing docs.
## Docs Routes
- /docs - Introduction
- /docs/installation - Installation
- /docs/quickstart - Quickstart
- /docs/configuration - Configuration
- /docs/configuration/database-adapters - Database Adapters
- /docs/configuration/deployment - Deployment
- /docs/guides - Guides
- /docs/guides/watch-mode - Watch Mode
- /docs/self-hosting - Self-Hosting
- /docs/self-hosting/overview - Self-Hosting Overview
- /docs/features - Features
- /docs/features/organization-management - Organization Management
## Editing Guidelines
- Prefer reader-facing setup, usage, and troubleshooting notes over source inventories.
- Do not add commands, flags, environment variables, routes, imports, or framework names unless they are present in the repository.
- If you add or rename a page, keep its frontmatter title and description accurate and make sure the navigation ordering still includes it.
- Avoid analyzer language such as generated from, source evidence, implementation map, source surface, or detected in files.
## Verification
- Build the docs site with `cd apps/docs && pnpm install && pnpm build` before handing off a docs PR.
- Open `/docs` and at least one generated leaf page to confirm the sidebar and page content match the PR.
