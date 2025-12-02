# Better Auth - Next.js + Prisma Example

This is a Next.js example project demonstrating Better Auth integration with Prisma ORM and PostgreSQL.

## Features

- **Next.js** - React framework
- **Better Auth** - Authentication library
- **Prisma** - TypeScript ORM
- **PostgreSQL** - Database

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

The `.env` file is already configured with the PostgreSQL database URL. Make sure to add your OAuth credentials if needed.

3. Generate Prisma client:

```bash
pnpm prisma generate
```

4. Run database migrations:

```bash
pnpm prisma db push
```

5. Start the development server:

```bash
pnpm dev
```

6. Open Better Auth Studio:

```bash
pnpm studio
```

## Database

This example uses PostgreSQL. The `DATABASE_URL` is configured in `.env`.

## Better Auth Studio

Run `pnpm studio` to open Better Auth Studio and manage your authentication setup.

