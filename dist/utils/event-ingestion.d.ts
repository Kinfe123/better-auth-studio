import type { AuthEventType, EventIngestionProvider } from '../types/events.js';
import type { StudioConfig } from '../types/handler.js';
/**
 * Initialize event ingestion
 */
export declare function initializeEventIngestion(eventsConfig: StudioConfig['events']): void;
/**
 * Emit an event
 */
export declare function emitEvent(type: AuthEventType, data: {
    status: 'success' | 'failed';
    userId?: string;
    sessionId?: string;
    organizationId?: string;
    metadata?: Record<string, any>;
    request?: {
        headers: Record<string, string>;
        ip?: string;
    };
}, eventsConfig?: StudioConfig['events']): Promise<void>;
export declare function shutdownEventIngestion(): Promise<void>;
/**
 * Health check
 */
export declare function checkEventIngestionHealth(): Promise<boolean>;
/**
 * Get initialization status
 */
export declare function isEventIngestionInitialized(): boolean;
/**
 * Get current queue size (for monitoring)
 */
export declare function getEventQueueSize(): number;
/**
 * Get the current event ingestion provider
 */
export declare function getEventIngestionProvider(): EventIngestionProvider | null;
//# sourceMappingURL=event-ingestion.d.ts.map