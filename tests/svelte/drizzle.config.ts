import { defineConfig } from "drizzle-kit";

const DATABASE = "postgresql://neondb_owner:npg_87iPmKpxjtbd@ep-shiny-scene-ah5bwfbl-pooler.c-3.us-east-1.aws.neon.tech/mac?sslmode=require&channel_binding=require"
export default defineConfig({
  schema: "./auth-schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE,
  },
});

