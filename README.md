# Better Auth Studio

A powerful web-based studio interface for managing Better Auth applications. Better Auth Studio provides a comprehensive dashboard for managing users, organizations, teams, sessions, and more.

## 🚀 Quick Start

### Installation

Install Better Auth Studio globally using npm:

```bash
npm install -g better-auth-studio
```

Or use npx to run it without installation:

```bash
npx better-auth-studio
```

### Basic Usage

1. **Navigate to your Better Auth project directory**
   ```bash
   cd your-better-auth-project
   ```

2. **Start the studio**
   ```bash
   npx better-auth-studio start
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
- **Overview statistics** - User counts, organization counts, session data

### 👥 User Management
- **View all users** - Paginated list with search and filtering
- **Create users** - Add new users with email/password
- **Edit users** - Update user information, email verification status
- **Delete users** - Remove users from the system
- **Bulk operations** - Seed multiple test users
- **User details** - View user profiles, sessions, and accounts

### 🏢 Organization Management
- **View organizations** - List all organizations with pagination
- **Create organizations** - Add new organizations with custom slugs
- **Edit organizations** - Update organization details
- **Delete organizations** - Remove organizations
- **Team management** - Create and manage teams within organizations
- **Member management** - Add/remove members from teams
- **Bulk seeding** - Generate test organizations and teams

### 🔐 Session Management
- **Active sessions** - View all active user sessions
- **Session details** - IP addresses, user agents, expiration times
- **Session termination** - Revoke specific sessions

### ⚙️ Settings & Configuration
- **Plugin status** - Check which Better Auth plugins are enabled
- **Database configuration** - View current database adapter and settings
- **Social providers** - Configure OAuth providers (GitHub, Google, etc.)
- **Email settings** - Configure email verification and password reset

## 🛠️ Command Line Options

### Start Studio
```bash
npx better-auth-studio start [options]
```

**Options:**
- `--port <number>` - Specify port (default: 3000)
- `--host <string>` - Specify host (default: localhost)
- `--no-open` - Don't automatically open browser
- `--config <path>` - Path to auth config file (default: auto-detect)

**Examples:**
```bash
# Start on custom port
npx better-auth-studio start --port 3001

# Start without opening browser
npx better-auth-studio start --no-open

# Use custom config file
npx better-auth-studio start --config ./custom-auth.ts
```

### Other Commands
```bash
# Check version
npx better-auth-studio --version

# Show help
npx better-auth-studio --help
```

## 📝 Development

### Running from Source
```bash
# Clone the repository
git clone https://github.com/better-auth/better-auth-studio.git
cd better-auth-studio

# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📚 Additional Resources

- **Better Auth Documentation**: https://better-auth.com
- **GitHub Repository**: https://github.com/better-auth/better-auth-studio
- **Issues & Support**: https://github.com/better-auth/better-auth-studio/issues
- **Discord Community**: https://discord.gg/better-auth

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

If you encounter any issues or have questions:

1. **Check the troubleshooting section** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join our Discord** for community support

---

**Happy coding with Better Auth Studio! 🚀**