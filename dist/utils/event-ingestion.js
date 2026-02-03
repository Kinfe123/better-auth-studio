import { createClickHouseProvider, createHttpProvider, createNodeSqliteProvider, createPostgresProvider, createSqliteProvider, } from "../providers/events/helpers.js";
import { EVENT_TEMPLATES, getEventSeverity } from "../types/events.js";
let provider = null;
let config = null;
let eventQueue = [];
let flushTimer = null;
let isShuttingDown = false;
let isInitialized = false;
/**
 * Initialize event ingestion
 */
export function initializeEventIngestion(eventsConfig) {
    if (!eventsConfig?.enabled) {
        return;
    }
    if (isInitialized) {
        return;
    }
    config = eventsConfig;
    if (eventsConfig.provider) {
        provider = eventsConfig.provider;
    }
    else if (eventsConfig.client && eventsConfig.clientType) {
        switch (eventsConfig.clientType) {
            case "postgres":
            case "prisma":
            case "drizzle":
                try {
                    provider = createPostgresProvider({
                        client: eventsConfig.client,
                        tableName: eventsConfig.tableName,
                        clientType: eventsConfig.clientType,
                    });
                }
                catch (error) {
                    throw error;
                }
                break;
            case "sqlite":
                try {
                    provider = createSqliteProvider({
                        client: eventsConfig.client,
                        tableName: eventsConfig.tableName,
                    });
                }
                catch (error) {
                    throw error;
                }
                break;
            case "node-sqlite":
                try {
                    provider = createNodeSqliteProvider({
                        client: eventsConfig.client,
                        tableName: eventsConfig.tableName,
                    });
                }
                catch (error) {
                    throw error;
                }
                break;
            case "clickhouse":
                provider = createClickHouseProvider({
                    client: eventsConfig.client,
                    table: eventsConfig.tableName,
                });
                break;
            case "https":
                provider = createHttpProvider({
                    url: eventsConfig.client,
                    headers: eventsConfig.headers || {},
                });
                break;
        }
    }
    if (!provider) {
        return;
    }
    isInitialized = true;
    if (config.batchSize && config.batchSize > 1) {
        const flushInterval = config.flushInterval || 5000;
        flushTimer = setInterval(() => {
            flushEvents().catch(() => { });
        }, flushInterval);
    }
}
/**
 * Emit an event
 */
export async function emitEvent(type, data, eventsConfig) {
    if (!isInitialized && eventsConfig?.enabled) {
        initializeEventIngestion(eventsConfig);
    }
    const activeConfig = eventsConfig || config;
    if (!activeConfig?.enabled) {
        return;
    }
    const useConfig = activeConfig || config;
    if (!useConfig) {
        return;
    }
    if (!provider) {
        return;
    }
    if (useConfig.include && !useConfig.include.includes(type)) {
        return;
    }
    if (useConfig.exclude && useConfig.exclude.includes(type)) {
        return;
    }
    const template = EVENT_TEMPLATES[type];
    const tempEvent = {
        id: "",
        type,
        timestamp: new Date(),
        status: data.status,
        userId: data.userId,
        sessionId: data.sessionId,
        organizationId: data.organizationId,
        metadata: data.metadata || {},
        source: "app",
    };
    const displayMessage = template ? template(tempEvent) : type;
    const event = {
        id: crypto.randomUUID(),
        type,
        timestamp: new Date(),
        status: data.status,
        userId: data.userId,
        sessionId: data.sessionId,
        organizationId: data.organizationId,
        metadata: data.metadata || {},
        ipAddress: data.request?.ip,
        userAgent: data.request?.headers["user-agent"] || data.request?.headers["User-Agent"],
        source: "app",
        display: {
            message: displayMessage,
            severity: getEventSeverity(tempEvent, data.status),
        },
    };
    // Call onEventIngest callback if provided
    if (useConfig.onEventIngest) {
        try {
            await useConfig.onEventIngest(event);
        }
        catch (error) {
            // Don't block event ingestion if callback fails
            console.error("onEventIngest callback error:", error);
        }
    }
    const batchSize = useConfig.batchSize || 1;
    if (batchSize > 1 && provider?.ingestBatch) {
        eventQueue.push(event);
        if (eventQueue.length >= batchSize) {
            await flushEvents();
        }
    }
    else {
        if (!provider) {
            return;
        }
        try {
            await provider.ingest(event);
        }
        catch (error) {
            if (useConfig.retryOnError) {
                eventQueue.push(event);
            }
        }
    }
}
async function flushEvents() {
    if (eventQueue.length === 0 || !provider || isShuttingDown) {
        return;
    }
    const eventsToSend = [...eventQueue];
    eventQueue = [];
    if (config?.onEventIngest) {
        for (const event of eventsToSend) {
            try {
                await config.onEventIngest(event);
            }
            catch (error) {
                console.error("onEventIngest callback error:", error);
            }
        }
    }
    try {
        if (provider.ingestBatch) {
            await provider.ingestBatch(eventsToSend);
        }
        else {
            await Promise.all(eventsToSend.map((event) => provider.ingest(event)));
        }
    }
    catch (error) {
        if (config?.retryOnError) {
            eventQueue.unshift(...eventsToSend);
        }
    }
}
export async function shutdownEventIngestion() {
    isShuttingDown = true;
    if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = null;
    }
    await flushEvents();
    if (provider?.shutdown) {
        await provider.shutdown();
    }
    provider = null;
    config = null;
    eventQueue = [];
    isInitialized = false;
    isShuttingDown = false;
}
/**
 * Health check
 */
export async function checkEventIngestionHealth() {
    if (!provider) {
        return false;
    }
    if (provider.healthCheck) {
        return await provider.healthCheck();
    }
    return true;
}
/**
 * Get initialization status
 */
export function isEventIngestionInitialized() {
    return isInitialized;
}
/**
 * Get current queue size (for monitoring)
 */
export function getEventQueueSize() {
    return eventQueue.length;
}
/**
 * Get the current event ingestion provider
 */
export function getEventIngestionProvider() {
    return provider;
}
//# sourceMappingURL=event-ingestion.js.map