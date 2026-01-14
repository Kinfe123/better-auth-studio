import type { StudioConfig } from '../types/handler.js';
/**
 * Inject middleware hooks into Better Auth using plugins
 *
 * Better Auth processes plugins during initialization, so we add the plugin
 * to auth.options.plugins array
 */
export declare function injectEventHooks(auth: any, eventsConfig: StudioConfig['events']): void;
//# sourceMappingURL=hook-injector.d.ts.map