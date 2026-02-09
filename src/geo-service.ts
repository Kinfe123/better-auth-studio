/**
 * IP geolocation: when studio config ipAddress is set, uses that provider (ipinfo.io or ipapi.co);
 * otherwise falls back to maxmind (GeoLite2-City.mmdb), data/default-geo.json, then hardcoded ranges.
 * Run `pnpm geo:update` to download the latest GeoLite2-City.mmdb for fallback.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import maxmind, { type CityResponse, type Reader } from "maxmind";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

/** ipapi.co JSON response (subset we use) */
interface IpApiCoResponse {
  ip?: string;
  city?: string | null;
  region?: string | null;
  region_code?: string | null;
  country?: string | null;
  country_name?: string | null;
  country_code?: string | null;
  error?: boolean;
  reason?: string;
}

/** ipinfo.io lite: flat country/continent only */
interface IpInfoLiteResponse {
  ip?: string;
  country_code?: string;
  country?: string;
  continent_code?: string;
  continent?: string;
  asn?: string;
  as_name?: string;
  as_domain?: string;
}

/** ipinfo.io lookup (core/plus): nested geo */
interface IpInfoLookupResponse {
  ip?: string;
  geo?: {
    city?: string;
    region?: string;
    region_code?: string;
    country?: string;
    country_code?: string;
    continent?: string;
    continent_code?: string;
  };
  as?: { asn?: string; name?: string; domain?: string };
}

/** ipinfo.io business-style: flat with city, region, country */
interface IpInfoFlatResponse {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  timezone?: string;
}

interface DefaultGeoDatabase {
  version: string;
  generated: string;
  description: string;
  coverage: string;
  ranges: Array<{
    country: string;
    countryCode: string;
    city: string;
    region: string;
    ranges: Array<{ min: string; max: string }>;
  }>;
  totalRanges: number;
  countries: number;
}

let lookup: Reader<CityResponse> | null = null;
let geoDbPath: string | null = null;
let defaultDatabase: DefaultGeoDatabase | null = null;

export function setGeoDbPath(path: string | null): void {
  geoDbPath = path;
}

function loadDefaultDatabase(): void {
  try {
    const defaultDbPath = join(__dirname, "../data/default-geo.json");
    if (existsSync(defaultDbPath)) {
      const defaultDbContent = readFileSync(defaultDbPath, "utf-8");
      defaultDatabase = JSON.parse(defaultDbContent);
    }
  } catch (_error) {}
}

export async function initializeGeoService(): Promise<void> {
  try {
    const dbPath = geoDbPath || "./data/GeoLite2-City.mmdb";
    lookup = await maxmind.open<CityResponse>(dbPath);
  } catch (_error) {
    lookup = null;
    loadDefaultDatabase();
  }
  if (!lookup) {
    loadDefaultDatabase();
  }
}

const DEFAULT_IPINFO_BASE = "https://api.ipinfo.io";
const DEFAULT_IPAPI_BASE = "https://ipapi.co";

function parseIpInfoResponse(
  data: IpInfoLiteResponse | IpInfoLookupResponse | IpInfoFlatResponse,
): LocationData | null {
  const lookup = data as IpInfoLookupResponse;
  if (lookup.geo && (lookup.geo.country_code ?? lookup.geo.country)) {
    return {
      country: lookup.geo.country || "Unknown",
      countryCode: lookup.geo.country_code || "",
      city: lookup.geo.city ?? "Unknown",
      region: lookup.geo.region ?? lookup.geo.region_code ?? "Unknown",
    };
  }
  const flat = data as IpInfoFlatResponse;
  const lite = data as IpInfoLiteResponse;
  if (flat.country != null || lite.country_code != null) {
    const countryCode =
      lite.country_code ??
      (typeof flat.country === "string" && flat.country.length === 2 ? flat.country : "");
    const countryName =
      lite.country ??
      (typeof flat.country === "string" && flat.country.length > 2 ? flat.country : "Unknown");
    return {
      country: countryName || "Unknown",
      countryCode: countryCode || "",
      city: flat.city ?? "Unknown",
      region: flat.region ?? "Unknown",
    };
  }
  return null;
}

/**
 * Resolve IP location: if ipConfig is set, use that provider (ipinfo or ipapi); else fallback to local DB/ranges.
 * Use this for API handlers (async).
 */
export async function resolveIPLocationAsync(
  ipAddress: string,
  ipConfig?: IpAddressProviderConfig | null,
): Promise<LocationData | null> {
  const trimmed = ipAddress.trim();
  if (!trimmed || trimmed === "Unknown") return null;
  if (ipConfig?.provider === "ipinfo" && ipConfig.apiToken) {
    try {
      const base = (ipConfig.baseUrl || DEFAULT_IPINFO_BASE).replace(/\/$/, "");
      const path = (ipConfig.endpoint || "lookup") === "lite" ? "lite" : "lookup";
      const url = `${base}/${path}/${encodeURIComponent(trimmed)}?token=${encodeURIComponent(ipConfig.apiToken)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`ipinfo ${res.status}`);
      const data = (await res.json()) as
        | IpInfoLookupResponse
        | IpInfoLiteResponse
        | IpInfoFlatResponse;
      const location = parseIpInfoResponse(data);
      if (location) return location;
      throw new Error("Invalid ipinfo response");
    } catch (_error) {
      return resolveIPLocation(trimmed);
    }
  }

  if (ipConfig?.provider === "ipapi") {
    try {
      const base = (ipConfig.baseUrl || DEFAULT_IPAPI_BASE).replace(/\/$/, "");
      const url = `${base}/${encodeURIComponent(trimmed)}/json/`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`ipapi ${res.status}`);
      const data = (await res.json()) as IpApiCoResponse;
      if (data.error || !data.country_code) throw new Error(data.reason || "Invalid response");
      return {
        country: data.country_name || data.country || "Unknown",
        countryCode: data.country_code || "",
        city: data.city ?? "Unknown",
        region: data.region ?? data.region_code ?? "Unknown",
      };
    } catch (_error) {
      return resolveIPLocation(trimmed);
    }
  }

  return resolveIPLocation(trimmed);
}

export function resolveIPLocation(ipAddress: string): LocationData | null {
  if (lookup) {
    try {
      const result = lookup.get(ipAddress);
      if (result) {
        return {
          country: result.country?.names?.en || "Unknown",
          countryCode: result.country?.iso_code || "",
          city: result.city?.names?.en || "Unknown",
          region: result.subdivisions?.[0]?.names?.en || "Unknown",
        };
      }
    } catch (_error) {}
  }

  if (defaultDatabase) {
    const location = findLocationInDefaultDatabase(ipAddress);
    if (location) {
      return location;
    }
  }

  return resolveIPFromRanges(ipAddress);
}

function findLocationInDefaultDatabase(ipAddress: string): LocationData | null {
  if (!defaultDatabase) return null;

  const ipToNumber = (ip: string): number => {
    return ip.split(".").reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0) >>> 0;
  };

  const isIPInRange = (ip: string, minIP: string, maxIP: string): boolean => {
    const ipNum = ipToNumber(ip);
    const minNum = ipToNumber(minIP);
    const maxNum = ipToNumber(maxIP);
    return ipNum >= minNum && ipNum <= maxNum;
  };

  for (const countryData of defaultDatabase.ranges) {
    for (const range of countryData.ranges) {
      if (isIPInRange(ipAddress, range.min, range.max)) {
        return {
          country: countryData.country,
          countryCode: countryData.countryCode,
          city: countryData.city,
          region: countryData.region,
        };
      }
    }
  }

  return null;
}

function resolveIPFromRanges(ipAddress: string): LocationData | null {
  const countryIPRanges = [
    {
      country: "United States",
      countryCode: "US",
      city: "New York",
      region: "New York",
      ranges: [
        { min: "8.0.0.0", max: "8.255.255.255" },
        { min: "24.0.0.0", max: "24.255.255.255" },
      ],
    },
    {
      country: "United Kingdom",
      countryCode: "GB",
      city: "London",
      region: "England",
      ranges: [
        { min: "2.0.0.0", max: "2.255.255.255" },
        { min: "5.0.0.0", max: "5.255.255.255" },
      ],
    },
    {
      country: "Germany",
      countryCode: "DE",
      city: "Berlin",
      region: "Berlin",
      ranges: [
        { min: "46.0.0.0", max: "46.255.255.255" },
        { min: "62.0.0.0", max: "62.255.255.255" },
      ],
    },
    {
      country: "France",
      countryCode: "FR",
      city: "Paris",
      region: "Île-de-France",
      ranges: [
        { min: "37.0.0.0", max: "37.255.255.255" },
        { min: "62.0.0.0", max: "62.255.255.255" },
      ],
    },
    {
      country: "Japan",
      countryCode: "JP",
      city: "Tokyo",
      region: "Tokyo",
      ranges: [
        { min: "126.0.0.0", max: "126.255.255.255" },
        { min: "210.0.0.0", max: "210.255.255.255" },
      ],
    },
    {
      country: "Canada",
      countryCode: "CA",
      city: "Toronto",
      region: "Ontario",
      ranges: [
        { min: "24.0.0.0", max: "24.255.255.255" },
        { min: "70.0.0.0", max: "70.255.255.255" },
      ],
    },
    {
      country: "Australia",
      countryCode: "AU",
      city: "Sydney",
      region: "New South Wales",
      ranges: [
        { min: "1.0.0.0", max: "1.255.255.255" },
        { min: "27.0.0.0", max: "27.255.255.255" },
      ],
    },
    {
      country: "Brazil",
      countryCode: "BR",
      city: "São Paulo",
      region: "São Paulo",
      ranges: [
        { min: "177.0.0.0", max: "177.255.255.255" },
        { min: "201.0.0.0", max: "201.255.255.255" },
      ],
    },
    {
      country: "Ethiopia",
      countryCode: "ET",
      city: "Addis Ababa",
      region: "Addis Ababa",
      ranges: [
        { min: "102.208.97.0", max: "102.208.97.255" },
        { min: "102.208.99.0", max: "102.208.99.255" },
        { min: "102.213.68.0", max: "102.213.68.255" },
      ],
    },
    {
      country: "India",
      countryCode: "IN",
      city: "Mumbai",
      region: "Maharashtra",
      ranges: [
        { min: "103.0.0.0", max: "103.255.255.255" },
        { min: "117.0.0.0", max: "117.255.255.255" },
      ],
    },
    {
      country: "China",
      countryCode: "CN",
      city: "Beijing",
      region: "Beijing",
      ranges: [
        { min: "1.0.0.0", max: "1.255.255.255" },
        { min: "14.0.0.0", max: "14.255.255.255" },
      ],
    },
  ];

  const ipParts = ipAddress.split(".").map(Number);
  if (
    ipParts.length !== 4 ||
    ipParts.some((part) => Number.isNaN(part) || part < 0 || part > 255)
  ) {
    return null;
  }

  for (const countryData of countryIPRanges) {
    for (const range of countryData.ranges) {
      if (isIPInRange(ipAddress, range.min, range.max)) {
        return {
          country: countryData.country,
          countryCode: countryData.countryCode,
          city: countryData.city,
          region: countryData.region,
        };
      }
    }
  }

  return {
    country: "Unknown",
    countryCode: "",
    city: "Unknown",
    region: "Unknown",
  };
}

function isIPInRange(ip: string, minIP: string, maxIP: string): boolean {
  const ipToNumber = (ip: string): number => {
    return ip.split(".").reduce((acc, part) => (acc << 8) + parseInt(part, 10), 0) >>> 0;
  };

  const ipNum = ipToNumber(ip);
  const minNum = ipToNumber(minIP);
  const maxNum = ipToNumber(maxIP);

  return ipNum >= minNum && ipNum <= maxNum;
}
