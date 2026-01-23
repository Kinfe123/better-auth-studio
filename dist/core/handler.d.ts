import type { StudioConfig, UniversalRequest, UniversalResponse } from "../types/handler.js";
/**
 * Initialize event ingestion and inject hooks
 */
export declare function initializeEventIngestionAndHooks(config: StudioConfig): Promise<void>;
/**
 * Main handler - processes all studio requests (framework-agnostic)
 *
 */
export declare function handleStudioRequest(
  request: UniversalRequest,
  config: StudioConfig,
): Promise<UniversalResponse>;
export declare function getAuthAdapter(auth: any): Promise<any>;
//# sourceMappingURL=handler.d.ts.map
