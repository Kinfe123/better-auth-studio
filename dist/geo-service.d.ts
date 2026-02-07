export interface LocationData {
    country: string;
    countryCode: string;
    city: string;
    region: string;
}
export declare function setGeoDbPath(path: string | null): void;
export declare function initializeGeoService(): Promise<void>;
export declare function resolveIPLocation(ipAddress: string): LocationData | null;
//# sourceMappingURL=geo-service.d.ts.map