import postgres from "postgres";
import * as schema from "../auth-schema";
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
  $client: postgres.Sql<{}>;
};
export type User = typeof schema.user.$inferSelect;
export type Session = typeof schema.session.$inferSelect;
export type UserInsert = typeof schema.user.$inferInsert;
//# sourceMappingURL=db.d.ts.map
