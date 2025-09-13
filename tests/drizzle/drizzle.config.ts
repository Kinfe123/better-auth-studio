import { type Config } from "drizzle-kit";
type ConfigWithoutDriver = Omit<Config, "driver">;
export default {
  schema: "./auth-schema.ts",
  dialect: "postgresql",
  out: "./drizzle",
  // @ts-ignore
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies ConfigWithoutDriver;