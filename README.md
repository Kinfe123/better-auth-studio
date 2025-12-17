# Better Auth Studio 

> ⚠️ **Beta Version Notice**
> 
> Better Auth Studio is currently in **beta** and in early development. You may encounter bugs or incomplete features. Please report any issues you find on our GitHub repository to help us improve the project. Your feedback is greatly appreciated!


A web-based studio interface for managing Better Auth applications. Better Auth Studio provides a comprehensive dashboard for managing users, organizations, teams, and more.

## Preview
A sneak peek of the studio dashboard and management interface.

<div align="center">
  <table>
    <tr>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJoDfkJ9wMTlHmhCfKGn1VSWOkq0g8sLJirp6A" alt="Better Auth Studio Preview 0" width="100%" />
      </td>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJ4L7IilBo7ItO3420CBLpvnPJlA6j5zaFYZbG" alt="Better Auth Studio Preview 4" width="100%" />
      </td>
    </tr>
    <tr>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJdiXpY6GJ15hUVAwrQyozdc6PpIXfSi7GWkeR" alt="Better Auth Studio Preview 2" width="100%" />
      </td>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJNAk2JU1Cviwfb1ltHVgPJF9BWxzE2m60rQaK" alt="Better Auth Studio Preview 6" width="100%" />
      </td>
    </tr>
    <tr>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJgSyVwl0dZe8UGVJLkR74CQXb9m1wzKIqhTME" alt="Better Auth Studio Preview 11" width="100%" />
      </td>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJODyqbs8p2EKCNef8H9XqPm4cIwjaQVRUAFg7" alt="Better Auth Studio Preview 8" width="100%" />
      </td>
    </tr>
    <tr>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJ2syhnQSdgJ9w13MfvHiGYPs07AkpWQSXm6Nj" alt="Better Auth Studio Preview 12" width="100%" />
      </td>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJcW7cwWXSlBtbRHTF15ujAQLPx3VpcKgMOz08" alt="Better Auth Studio Preview 3" width="100%" />
      </td>
    </tr>
    <tr>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJnAGpd3rzcKd2Hu4wkD0jJbApf78rC1VgZORT" alt="Better Auth Studio Preview 10" width="100%" />
      </td>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJK6lXYfaxUOknshdjxpSgwV6mq7DtH3aMZXWK" alt="Better Auth Studio Preview 13" width="100%" />
      </td>
    </tr>
    <tr>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJhZFdrWmjbSvOe01IQl7r68LUfVKuFcNqAydt" alt="Better Auth Studio Preview 14" width="100%" />
      </td>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJwnJFq9htT259fPAQY0eIdDmn7O4xVlGaCjZR" alt="Better Auth Studio Preview 5" width="100%" />
      </td>
    </tr>
    <tr>
      <td width="50%">
        <img src="https://gk6bju9ndq.ufs.sh/f/M5pOhOFFvHQJkz1easgu2KZih3mCdzIoB1GSvQxAOH8E7fVp" alt="Better Auth Studio Preview 16" width="100%" />
      </td>
      <td width="50%">
      </td>
    </tr>
  </table>
</div>

## 🚀 Quick Start

### Hosted Version

For the hosted version, please join the waitlist: **[better-auth.build](https://better-auth.build)**

### Installation

📖 **[Documentation](https://better-auth-studio.vercel.app)**

**Recommended: Install as a dev dependency** (for project-specific versions):

```bash
pnpm add -D better-auth-studio
```

Or install globally using pnpm:

```bash
pnpm add -g better-auth-studio
```

Or use pnpx to run it without installation:

```bash
pnpx better-auth-studio [cmd] 
```

### Basic Usage

1. **Navigate to your Better Auth project directory**
   ```bash
   cd your-better-auth-project
   ```

2. **Start the studio**
   
   If installed as dev dependency:
   ```bash
   pnpm better-auth-studio start
   ```
   
   Or with pnpx:
   ```bash
   pnpx better-auth-studio start
   ```

3. **Open your browser**
   - The studio will automatically open at `http://localhost:3000`
   - Or manually navigate to the URL shown in the terminal

## 📋 Prerequisites

Before using Better Auth Studio, ensure you have:

- **Node.js** (v18 or higher)
- **A Better Auth project** with a valid `auth.ts` configuration file
- **Database setup** (Prisma, Drizzle, or SQLite)

## 🔧 Configuration

### Supported Database Adapters

Better Auth Studio automatically detects and works with:

- **Prisma** (`prismaAdapter`)
- **Drizzle** (`drizzleAdapter`) 
- **SQLite** (`new Database()` from better-sqlite3)
- **PostgreSQL** (via Prisma or Drizzle)
- **MySQL** (via Prisma or Drizzle)

### Example Configuration Files

#### Prisma Setup
```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "sqlite"
  }),
  // ... other config
});
```

#### Drizzle Setup
```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./database";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  // ... other config
});
```

#### SQLite Setup
```typescript
// auth.ts
import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  database: new Database("./better-auth.db"),
  // ... other config
});
```

## 🎯 Features

### 📊 Dashboard
- **Overview statistics** - User, teams and organization counts data

### 👥 User Management
- **View all users** - Paginated list with search and filtering
- **Create users** - Add new users with email/password
- **Edit users** - Update user information, email verification status
- **Delete users** - Remove users from the system
- **Bulk operations** - Seed multiple test users
- **User details** - View user profiles, and accounts

### 🏢 Organization Management
- **View organizations** - List all organizations with pagination
- **Create organizations** - Add new organizations with custom slugs
- **Edit organizations** - Update organization details
- **Delete organizations** - Remove organizations
- **Team management** - Create and manage teams within organizations
- **Member management** - Add/remove members from teams
- **Bulk seeding** - Generate test organizations and teams

### ⚙️ Settings & Configuration
- **Plugin status** - Check which Better Auth plugins are enabled
- **Database configuration** - View current database adapter and settings
- **Social providers** - Configure OAuth providers (GitHub, Google, etc.)
- **Email settings** - Configure email verification and password reset

## 🛠️ Command Line Options

### Start Studio
```bash
pnpx better-auth-studio start [options]
```

**Options:**
- `--port <number>` - Specify port (default: 3000)
- `--host <string>` - Specify host (default: localhost)
- `--no-open` - Don't automatically open browser
- `--config <path>` - Path to auth config file (default: auto-detect)
- `--watch` - Watch for changes in auth config file and reload server automatically

**Examples:**
```bash
# Start on custom port (if installed as dev dependency)
pnpm better-auth-studio start --port 3001

# Or with pnpx
pnpx better-auth-studio start --port 3001

# Start without opening browser
pnpm better-auth-studio start --no-open

# Use custom config file
pnpm better-auth-studio start --config ./custom-auth.ts

# Enable watch mode for auto-reload on config changes
pnpm better-auth-studio start --watch

# Combine multiple options
pnpx better-auth-studio start --port 3001 --watch --config ./src/auth.ts
```

### Using `--config` Option

The `--config` option allows you to specify a custom path to your Better Auth configuration file. This is useful when:

- Your auth config file is in a non-standard location
- You have multiple auth config files in your project
- You're working with monorepos or nested project structures
- Auto-detection fails to find your config file

**How it works:**
- Better Auth Studio automatically searches for config files in common locations:
  - `auth.ts`, `auth.js`, `auth.server.ts`, `auth.server.js`
  - `src/auth.ts`, `lib/auth.ts`, `server/auth.ts`, etc.
- When `--config` is provided, it uses the specified path instead

**Path resolution:**
- **Relative paths** are resolved from the current working directory:
  ```bash
  pnpm better-auth-studio start --config ./src/lib/auth.ts
  pnpm better-auth-studio start --config ../shared/auth.ts
  ```
- **Absolute paths** are used as-is:
  ```bash
  pnpm better-auth-studio start --config /path/to/project/auth.ts
  ```

### Using `--watch` Option

Automatically reload the server when your `auth.ts` file changes. Perfect for development when iterating on your auth configuration.

**Example:**
```bash
# Start with watch mode enabled
pnpx better-auth-studio start --watch
```

**How it works:** Monitors your auth config file for changes, automatically restarts the server, and updates the browser UI via WebSocket - no manual refresh needed.

### Other Commands
```bash
# Check version
pnpx better-auth-studio --version

# Show help
pnpx better-auth-studio --help
```
## 📝 Development

### Running from Source
```bash
# Clone the repository
git clone https://github.com/Kinfe123/better-auth-studio.git
cd better-auth-studio

# Install dependencies
pnpm install

# Build the project
pnpm build

# Start development server
pnpm dev
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

If you encounter any issues or have questions:

**Search existing issues** on GitHub
**Create a new issue** with detailed information

---
