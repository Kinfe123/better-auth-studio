# Better Auth - SvelteKit Example (Drizzle)

This is a SvelteKit example project demonstrating Better Auth integration with Drizzle ORM and PostgreSQL.

## Features

- **SvelteKit** - Modern web framework
- **Better Auth** - Authentication library
- **Drizzle ORM** - TypeScript ORM
- **PostgreSQL** - Database

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

The `.env` file is already configured with the PostgreSQL database URL. Make sure to add your OAuth credentials if needed.

3. Run database migrations:

```bash
pnpm db:push
```

4. Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

5. Open Better Auth Studio:

```bash
pnpm studio
```

Better Auth Studio will be available at `http://localhost:3000`

## Project Structure

```
src/
├── lib/
│   ├── auth.ts          # Better Auth configuration
│   ├── auth-client.ts   # Client-side auth utilities
│   └── db/
│       └── index.ts     # Database connection
auth-schema.ts           # Drizzle schema definitions
drizzle/                 # Drizzle migrations
└── routes/
    ├── auth/
    │   └── +page.svelte        # Auth page
    └── +page.svelte            # Home page
```

## Database

This example uses PostgreSQL. The `DATABASE_URL` is configured in `.env`.

## Better Auth Studio

Run `pnpm studio` to open Better Auth Studio and manage your authentication setup.

