import * as schema from "./schema";
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: any;
};
export type User = typeof schema.user.$inferSelect;
export type Session = typeof schema.session.$inferSelect;
export type UserInsert = typeof schema.user.$inferInsert;
//# sourceMappingURL=db.d.ts.map