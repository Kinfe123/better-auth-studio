export { handleStudioRequest } from './core/handler.js';
export type { StudioConfig, StudioMetadata, WindowStudioConfig } from './types/handler.js';
export { defineStudioConfig } from './types/handler.js';
export { betterAuthStudio } from './adapters/hono.js';
export { betterAuthStudio as betterAuthStudioExpress } from './adapters/express.js';
export { createStudioHandler } from './adapters/nextjs.js';
