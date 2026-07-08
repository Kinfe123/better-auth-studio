# Better Auth Studio Cloudflare Workers Prisma Example

This example runs Better Auth Studio in a Cloudflare Worker with Prisma Postgres.

It demonstrates:

- `better-auth-studio/cloudflare-workers`
- Prisma Client generated for the Cloudflare runtime
- Workers Assets serving the Studio UI from `better-auth-studio/dist/public`
- Better Auth mounted at `/api/auth/*`
- A small edge-safe Studio API handler for read-only Studio screens

The Studio UI is served at the Worker root in this example, so the frontend stays usable without the Node-only Studio session layer.

## Setup

```bash
pnpm install
cp env.example .env
cp .dev.vars.example .dev.vars
```

Set `DATABASE_URL` in both `.env` and `.dev.vars`.

Use a Prisma Postgres or edge-compatible PostgreSQL URL. Prisma's Cloudflare Workers guide requires `nodejs_compat` and creates a Prisma Client with `runtime = "cloudflare"`.

## Database

```bash
pnpm prisma:migrate
pnpm prisma:generate
```

## Run Locally

```bash
pnpm dev
```

Open `http://localhost:8787`.

Better Auth routes are available under `/api/auth/*`.

## Verify

```bash
pnpm type-check
pnpm build
```

`pnpm build` runs `wrangler deploy --dry-run` so the Worker is bundled without deploying.

## Notes

This example intentionally implements a read-only edge Studio API for core screens such as dashboard counts, users, sessions, settings, plugin status, and database schema. Write-heavy Studio actions and Node-specific tools still need dedicated edge implementations before being enabled in production.

For production, protect the Worker with Cloudflare Access, an IP allowlist, or an authenticated API handler before exposing real admin data.

## References

- [Prisma Cloudflare Workers guide](https://www.prisma.io/docs/guides/deployment/cloudflare-workers)
- [Cloudflare Workers static assets binding](https://developers.cloudflare.com/workers/static-assets/binding/)
