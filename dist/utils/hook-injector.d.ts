import type { StudioConfig } from "../types/handler.js";
export declare function injectLastSeenAtHooks(auth: any, config?: {
    lastSeenAt?: {
        enabled?: boolean;
        columnName?: string;
    };
} | null): void;
/**
 * Inject middleware hooks into Better Auth using plugins
 */
export declare function injectEventHooks(auth: any, eventsConfig: StudioConfig["events"]): void;
//# sourceMappingURL=hook-injector.d.ts.map