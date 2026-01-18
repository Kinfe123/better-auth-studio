import { EVENT_TEMPLATES, getEventSeverity } from '../types/events.js';
import { createPostgresProvider, createClickHouseProvider, createHttpProvider, } from '../providers/events/helpers.js';
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
    config = eventsConfig;
    if (eventsConfig.provider) {
        provider = eventsConfig.provider;
    }
    else if (eventsConfig.client && eventsConfig.clientType) {
        switch (eventsConfig.clientType) {
            case 'postgres':
                provider = createPostgresProvider({
                    client: eventsConfig.client,
                    tableName: eventsConfig.tableName,
                });
                break;
            case 'clickhouse':
                provider = createClickHouseProvider({
                    client: eventsConfig.client,
                    table: eventsConfig.tableName,
                });
                break;
            case 'http':
                provider = createHttpProvider({
                    url: eventsConfig.client,
                    headers: eventsConfig.headers || {},
                });
                break;
        }
    }
    if (!provider) {
        console.warn('Event ingestion is enabled but no provider provided');
        console.warn('Config details:', {
            hasProvider: !!eventsConfig.provider,
            hasClient: !!eventsConfig.client,
            clientType: eventsConfig.clientType,
        });
        return;
    }
    console.log('[Event Ingestion] Provider initialized successfully:', {
        hasIngest: typeof provider.ingest === 'function',
        hasQuery: typeof provider.query === 'function',
        hasIngestBatch: typeof provider.ingestBatch === 'function',
        clientType: eventsConfig.clientType,
    });
    isInitialized = true;
    if (config.batchSize && config.batchSize > 1) {
        const flushInterval = config.flushInterval || 5000;
        flushTimer = setInterval(() => {
            flushEvents().catch(console.error);
        }, flushInterval);
    }
}
/**
 * Emit an event
 */
export async function emitEvent(type, data, eventsConfig) {
    // Initialize if not already initialized and config is provided
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
    // Ensure provider is available
    if (!provider) {
        console.warn(`[Event Ingestion] Provider not initialized. Skipping event: ${type}`);
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
        id: '',
        type,
        timestamp: new Date(),
        status: data.status,
        userId: data.userId,
        sessionId: data.sessionId,
        organizationId: data.organizationId,
        metadata: data.metadata || {},
        source: 'app',
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
        userAgent: data.request?.headers['user-agent'] || data.request?.headers['User-Agent'],
        source: 'app',
        display: {
            message: displayMessage,
            severity: getEventSeverity(tempEvent, data.status),
        },
    };
    const batchSize = useConfig.batchSize || 1;
    if (batchSize > 1 && provider?.ingestBatch) {
        eventQueue.push(event);
        if (eventQueue.length >= batchSize) {
            await flushEvents();
        }
    }
    else {
        if (!provider) {
            console.warn(`[Event Ingestion] Provider not available. Skipping event: ${type}`);
            return;
        }
        try {
            console.log(`[Event Ingestion] Emitting event: ${type}`, {
                userId: event.userId,
                message: event.display?.message,
            });
            await provider.ingest(event);
            console.log(`[Event Ingestion] ✅ Successfully ingested event: ${type}`);
        }
        catch (error) {
            console.error(`[Event Ingestion] ❌ Failed to ingest event ${type}:`, error);
            if (useConfig.retryOnError) {
                eventQueue.push(event);
                console.log(`[Event Ingestion] Queued event for retry: ${type}`);
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
    try {
        if (provider.ingestBatch) {
            await provider.ingestBatch(eventsToSend);
        }
        else {
            await Promise.all(eventsToSend.map((event) => provider.ingest(event)));
        }
    }
    catch (error) {
        console.error('Batch event ingestion error:', error);
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