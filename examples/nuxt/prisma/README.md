# Better Auth Studio - Nuxt + Prisma Example

This example demonstrates how to integrate Better Auth Studio with a Nuxt 3 application using Prisma as the database adapter.

## Setup

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and configure your database URL and other settings.

3. **Set up the database:**
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

4. **Start the development server:**
   ```bash
   pnpm dev
   ```

5. **Access the studio:**
   - Studio UI: http://localhost:3000/api/studio
   - Better Auth API: http://localhost:3000/api/auth

## Project Structure

```
.
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...].ts          # Better Auth routes
│   │   └── studio/
│   │       └── [...].ts          # Better Auth Studio routes
│   └── lib/
│       ├── auth.ts               # Better Auth configuration
│       └── db.ts                 # Prisma client
├── prisma/
│   └── schema.prisma             # Prisma schema
├── studio.config.ts              # Studio configuration
└── nuxt.config.ts                # Nuxt configuration
```

## Key Files

### `server/api/studio/[...].ts`
This is the catch-all route handler for Better Auth Studio. It uses the Nuxt adapter to handle all studio requests.

### `server/lib/auth.ts`
Better Auth configuration with Prisma adapter, organization plugin, and admin plugin.

### `studio.config.ts`
Studio configuration specifying the auth instance, base path, and access control settings.

## Features

- ✅ User authentication with email/password
- ✅ Social providers (GitHub, Google)
- ✅ Organization and team management
- ✅ Admin dashboard via Better Auth Studio
- ✅ Role-based access control

## Development

- Run Prisma Studio: `pnpm db:studio`
- Generate Prisma client: `pnpm db:generate`
- Run migrations: `pnpm db:migrate`

