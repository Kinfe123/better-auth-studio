export { betterAuthStudio as betterAuthStudioExpress } from './adapters/express.js';
export { betterAuthStudio } from './adapters/hono.js';
export { createStudioHandler } from './adapters/nextjs.js';
export { betterAuthStudio as betterAuthStudioSolidStart } from './adapters/solid-start.js';
export { handleStudioRequest } from './core/handler.js';
export type { StudioConfig, StudioMetadata, WindowStudioConfig } from './types/handler.js';
export { defineStudioConfig } from './types/handler.js';
