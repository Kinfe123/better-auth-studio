export interface LocationData {
    country: string;
    countryCode: string;
    city: string;
    region: string;
}
/** Config passed from studio config ipAddress (avoids importing handler types). */
export interface IpAddressProviderConfig {
    provider: "ipinfo" | "ipapi";
    apiToken?: string;
    baseUrl?: string;
    /** ipinfo only: "lite" | "lookup". Default "lookup". */
    endpoint?: "lite" | "lookup";
}
export declare function setGeoDbPath(path: string | null): void;
export declare function initializeGeoService(): Promise<void>;
/**
 * Resolve IP location: if ipConfig is set, use that provider (ipinfo or ipapi); else fallback to local DB/ranges.
 * Use this for API handlers (async).
 */
export declare function resolveIPLocationAsync(ipAddress: string, ipConfig?: IpAddressProviderConfig | null): Promise<LocationData | null>;
export declare function resolveIPLocation(ipAddress: string): LocationData | null;
//# sourceMappingURL=geo-service.d.ts.map