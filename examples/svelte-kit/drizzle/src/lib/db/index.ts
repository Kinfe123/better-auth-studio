import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../../auth-schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

export type User = typeof schema.user.$inferSelect;
export type Session = typeof schema.session.$inferSelect;
export type UserInsert = typeof schema.user.$inferInsert;

