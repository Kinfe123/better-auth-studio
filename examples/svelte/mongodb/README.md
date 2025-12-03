# Better Auth SvelteKit MongoDB Example

This is an example SvelteKit application using Better Auth with MongoDB as the database.

## Prerequisites

- Node.js 18+ installed
- MongoDB installed and running locally (or MongoDB Atlas connection string)
- pnpm (or npm/yarn)

## Setup Instructions

### 1. Install MongoDB Locally (if not already installed)

#### macOS (using Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Windows:
Download and install from [MongoDB Download Center](https://www.mongodb.com/try/download/community)

### 2. Verify MongoDB is Running

```bash
# Check if MongoDB is running
mongosh

# Or using the legacy mongo shell
mongo
```

You should see the MongoDB shell prompt. Type `exit` to quit.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```env
# MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=better-auth

# Better Auth Configuration
BETTER_AUTH_URL=http://localhost:5173
AUTH_SECRET=better-auth-secret-123456789-change-this-in-production

# Social Providers (Optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Public URL for client-side (used in auth-client.ts)
PUBLIC_BETTER_AUTH_URL=http://localhost:5173
```

### 5. Run the Application

```bash
# Development mode
pnpm dev
```

The application will start on `http://localhost:5173`

### 6. Run Better Auth Studio

In a separate terminal:

```bash
# Start the studio
pnpm studio

# Or with custom port
pnpm studio:dev
```

The studio will be available at `http://localhost:3002` (or the port you specified)

## MongoDB Connection Options

### Local MongoDB (Default)

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB_NAME=better-auth
```

### MongoDB with Authentication

```env
MONGODB_URI=mongodb://username:password@127.0.0.1:27017/better-auth?authSource=admin
MONGODB_DB_NAME=better-auth
```

### MongoDB Atlas (Cloud)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string from the Atlas dashboard
3. Update `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/better-auth?retryWrites=true&w=majority
MONGODB_DB_NAME=better-auth
```

### MongoDB Replica Set

```env
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/better-auth?replicaSet=myReplicaSet
MONGODB_DB_NAME=better-auth
```

## Database Collections

Better Auth will automatically create the following collections in MongoDB:

- `user` - User accounts
- `session` - User sessions
- `account` - OAuth account links
- `verification` - Email verification tokens
- `organization` - Organizations (if organization plugin enabled)
- `member` - Organization members
- `invitation` - Organization invitations
- `team` - Teams (if teams plugin enabled)
- `teamMember` - Team members

## Project Structure

```
src/
├── lib/
│   ├── auth.ts          # Better Auth configuration
│   ├── auth-client.ts    # Client-side auth client
│   └── db/
│       └── index.ts      # MongoDB connection
├── routes/
│   ├── +layout.svelte   # Root layout
│   ├── +page.svelte     # Home page
│   └── auth/
│       └── +page.svelte # Auth demo page
└── hooks.server.ts       # SvelteKit hooks for auth
```

## Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mongod
   ```

2. **Check MongoDB logs:**
   ```bash
   # macOS
   tail -f /usr/local/var/log/mongodb/mongo.log
   
   # Linux
   sudo tail -f /var/log/mongodb/mongod.log
   ```

3. **Verify connection:**
   ```bash
   mongosh "mongodb://127.0.0.1:27017"
   ```

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port. Update `PUBLIC_BETTER_AUTH_URL` in `.env` to match.

### Authentication Errors

If you're using MongoDB with authentication, make sure your connection string includes credentials:

```env
MONGODB_URI=mongodb://username:password@127.0.0.1:27017/better-auth?authSource=admin
```

### SvelteKit Build Issues

If you encounter build issues, try:

```bash
# Clean build
rm -rf .svelte-kit node_modules
pnpm install
pnpm dev
```

## Features

This example includes:

- ✅ Email/Password authentication
- ✅ Social providers (GitHub, Google)
- ✅ Organization management
- ✅ Teams support
- ✅ Admin plugin
- ✅ Two-factor authentication
- ✅ API keys
- ✅ Session management
- ✅ Rate limiting

## Learn More

- [Better Auth Documentation](https://www.better-auth.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [SvelteKit Documentation](https://kit.svelte.dev/)

