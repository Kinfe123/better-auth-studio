/**
 * Server initialization utility
 * Automatically pings /api/studio on server startup to initialize event ingestion
 */
let initializationAttempted = false;
/**
 * Initialize event ingestion by pinging /api/studio
 * This should be called at server startup, before any auth requests
 */
export function initializeOnServerStart(baseUrl, basePath) {
    console.log("PINGGEDD");
    if (initializationAttempted) {
        return;
    }
    initializationAttempted = true;
    // Use setImmediate to ensure this runs after the event loop starts
    // but before any requests are processed
    setImmediate(async () => {
        try {
            const url = baseUrl || process.env.BETTER_AUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
            const path = basePath || process.env.BETTER_AUTH_STUDIO_PATH || '/api/studio';
            const fullUrl = `${url}${path}`;
            await fetch(fullUrl, {
                method: 'GET',
                headers: { 'user-agent': 'better-auth-studio-server-init' },
            }).catch(() => {
                // Silently fail - initialization will happen on first real request
            });
        }
        catch (error) {
            // Silently fail - initialization will happen on first real request
        }
    });
}
// @ts-ignore
// Auto-initialize when module is imported (if in server environment)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
    initializeOnServerStart();
}
//# sourceMappingURL=server-init.js.map