export { handleStudioRequest } from './core/handler.js';
export type { StudioConfig, StudioMetadata, WindowStudioConfig } from './types/handler.js';
export { defineStudioConfig } from './types/handler.js';

// Event ingestion exports
export type { EventIngestionProvider, AuthEvent, AuthEventType } from './types/events.js';
export { EVENT_TEMPLATES, getEventSeverity } from './types/events.js';
export { 
  initializeEventIngestion,
  emitEvent,
  shutdownEventIngestion,
  checkEventIngestionHealth,
  isEventIngestionInitialized,
  getEventQueueSize,
  getEventIngestionProvider
} from './utils/event-ingestion.js';
export { 
  createPostgresProvider,
  createClickHouseProvider,
  createHttpProvider,
  createStorageProvider
} from './providers/events/helpers.js';
