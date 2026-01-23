/**
 * Server initialization utility
 * Automatically pings /api/studio on server startup to initialize event ingestion
 */
/**
 * Initialize event ingestion by pinging /api/studio
 * This should be called at server startup, before any auth requests
 */
export declare function initializeOnServerStart(baseUrl?: string, basePath?: string): void;
//# sourceMappingURL=server-init.d.ts.map
