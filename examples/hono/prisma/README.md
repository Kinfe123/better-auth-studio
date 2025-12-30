# Better Auth Studio - Hono + Prisma Example

This is an example project demonstrating how to integrate Better Auth Studio with Hono and Prisma.

## Features

- ✅ Hono web framework
- ✅ Prisma ORM with PostgreSQL
- ✅ Better Auth authentication
- ✅ Better Auth Studio admin dashboard
- ✅ Organization and Teams support
- ✅ Social providers (GitHub, Google, Discord)
- ✅ Email/Password authentication

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- pnpm (or npm/yarn)

## Setup

1. **Install dependencies:**

```bash
pnpm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp env.example .env
```

Update the following in `.env`:
- `DATABASE_URL` - Your PostgreSQL connection string
- `AUTH_SECRET` - A secure random string for session encryption
- `BETTER_AUTH_URL` - Your application URL (default: http://localhost:3000)
- Social provider credentials (optional)

3. **Set up the database:**

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate
```

4. **Start the development server:**

```bash
pnpm dev
```

The server will start on `http://localhost:3000`

5. **Start Better Auth Studio:**

In a separate terminal:

```bash
pnpm studio:dev
```

Studio will be available at `http://localhost:3002`

## Project Structure

```
.
├── prisma/
│   └── schema.prisma          # Prisma schema
├── src/
│   ├── auth.ts                # Better Auth configuration
│   ├── index.ts               # Hono server setup
│   ├── prisma.ts              # Prisma client
│   └── generated/
│       └── prisma/            # Generated Prisma client
├── studio.config.ts           # Better Auth Studio configuration
├── package.json
└── tsconfig.json
```

## API Endpoints

- `GET /` - Root endpoint with project info
- `GET /health` - Health check
- `POST,GET /api/auth/*` - Better Auth endpoints
- `POST,GET,PUT,DELETE /api/studio/*` - Better Auth Studio endpoints

## Usage

### Authentication

Better Auth handles all authentication routes under `/api/auth/*`. You can:

- Sign up: `POST /api/auth/sign-up`
- Sign in: `POST /api/auth/sign-in`
- Sign out: `POST /api/auth/sign-out`
- Get session: `GET /api/auth/session`

### Studio Dashboard

Access the Better Auth Studio dashboard at `http://localhost:3002` to:

- View and manage users
- View sessions
- Manage organizations and teams
- View analytics
- Configure settings

## Development

```bash
# Run in development mode with hot reload
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run Prisma Studio (database GUI)
pnpm prisma:studio
```

## Learn More

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Better Auth Studio Documentation](https://github.com/Kinfe123/better-auth-studio)
- [Hono Documentation](https://hono.dev/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

