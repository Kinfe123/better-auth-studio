import type { StudioConfig } from "better-auth-studio";
import { auth } from "./src/auth";
import { Pool } from "pg";

// Example using standard pg Pool
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Or use individual connection parameters:
  // host: process.env.DB_HOST,
  // port: parseInt(process.env.DB_PORT || '5432', 10),
  // database: process.env.DB_NAME,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
});

const config: StudioConfig = {
  auth,
  basePath: "/api/studio",
  metadata: {
    title: "Better Auth Studio",
    theme: "dark",
  },
  access: {
    roles: ["admin"],
    allowEmails: ["kinfetare83@gmail.com"],
  },
  events: {
    enabled: true,
    client: pgPool, // Use pg Pool instead of Prisma
    clientType: "postgres",
    tableName: "auth_events",
    batchSize: 10,
    flushInterval: 5000,
  },
};

export default config;
