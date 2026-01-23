import type { AuthEvent, EventIngestionProvider } from "../../types/events.js";
export declare function createPostgresProvider(options: {
    client: any;
    tableName?: string;
    schema?: string;
    clientType?: "postgres" | "prisma" | "drizzle";
}): EventIngestionProvider;
export declare function createSqliteProvider(options: {
    client: any;
    tableName?: string;
}): EventIngestionProvider;
export declare function createClickHouseProvider(options: {
    client: any;
    table?: string;
    database?: string;
}): EventIngestionProvider;
export declare function createHttpProvider(options: {
    url: string;
    client?: typeof fetch;
    headers?: Record<string, string>;
    transform?: (event: AuthEvent) => any;
}): EventIngestionProvider;
export declare function createStorageProvider(options: {
    adapter: any;
    tableName?: string;
}): EventIngestionProvider;
//# sourceMappingURL=helpers.d.ts.map